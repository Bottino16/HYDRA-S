// Executa o binário COMPLETO do sketch em CPU/ADC/UART/GPIO virtuais. Não abre porta física.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const avr=require('avr8js');const {encode,decode}=require('../src/protocol');
const cli=process.env.ARDUINO_CLI||(process.platform==='win32'?'C:/Program Files/Arduino IDE/resources/app/lib/backend/resources/arduino-cli.exe':'arduino-cli');
const build=path.resolve('.data/firmware-build');fs.mkdirSync(build,{recursive:true});
const compile=cp.spawnSync(cli,['compile','--fqbn','arduino:avr:uno','--build-path',build,'firmware/sda'],{encoding:'utf8'});
if(compile.status!==0)throw new Error(compile.stderr||compile.error?.message||'Compilação falhou.');console.log(compile.stdout.trim());
const hex=fs.readFileSync(path.join(build,'sda.ino.hex'),'utf8'),program=new Uint16Array(16384),bytes=new Uint8Array(program.buffer);
for(const line of hex.trim().split(/\r?\n/)){const size=parseInt(line.slice(1,3),16),at=parseInt(line.slice(3,7),16),type=parseInt(line.slice(7,9),16);if(type===0)for(let i=0;i<size;i++)bytes[at+i]=parseInt(line.slice(9+i*2,11+i*2),16);}
const cpu=new avr.CPU(program),clock=new avr.AVRClock(cpu,16000000);
new avr.AVRWatchdog(cpu,avr.watchdogConfig,clock);new avr.AVRTimer(cpu,avr.timer0Config);new avr.AVRTimer(cpu,avr.timer1Config);new avr.AVRTimer(cpu,avr.timer2Config);
const b=new avr.AVRIOPort(cpu,avr.portBConfig),c=new avr.AVRIOPort(cpu,avr.portCConfig),d=new avr.AVRIOPort(cpu,avr.portDConfig);
const adc=new avr.AVRADC(cpu,avr.adcConfig);adc.channelValues[0]=700/1023*5;
const uart=new avr.AVRUSART(cpu,avr.usart0Config,16000000);const frames=[],queue=[];
function send(line){queue.push(...Buffer.from(line));}
let lastReceive=-100000; // Espaça recepção e leitura da UART, como uma linha 9600 baud real.
const later=(us,callback)=>cpu.addClockEvent(callback,Math.round(us*16));
const f=[false,false,false,false,false];d.setPin(2,false);d.setPin(3,false);b.setPin(0,false);b.setPin(1,false);b.setPin(2,false);b.setPin(3,true);b.setPin(5,false);
let previousDdr=0,previousTrig=false,echoWidth=700,irrigationSeen=false,earlyStart=false,dhtRespond=true,echoRespond=true;
b.addListener(value=>{
 const ddr=cpu.data[avr.portBConfig.DDR],dhtOutput=!!(ddr&8),wasOutput=!!(previousDdr&8);previousDdr=ddr;
 if(wasOutput&&!dhtOutput&&dhtRespond){
  const values=[68,0,29,5,102];let at=30;later(at,()=>b.setPin(3,false));at+=80;later(at,()=>b.setPin(3,true));at+=80;later(at,()=>b.setPin(3,false));
  for(const value of values)for(let bit=7;bit>=0;bit--){at+=50;later(at,()=>b.setPin(3,true));at+=(value&(1<<bit))?70:26;later(at,()=>b.setPin(3,false));}
  later(at+50,()=>b.setPin(3,true));
 }
 const trig=!!(value&16);if(previousTrig&&!trig&&(ddr&16)&&echoRespond){const width=echoWidth;later(200,()=>b.setPin(5,true));later(200+width,()=>b.setPin(5,false));}previousTrig=trig;
});
d.addListener(value=>{const ddr=cpu.data[avr.portDConfig.DDR];for(const pin of [7,5,4])if((ddr&(1<<pin))&&!(value&(1<<pin))){if(cpu.cycles<5*16000000)earlyStart=true;if(pin===4)irrigationSeen=true;}});
uart.onLineTransmit=line=>{frames.push(decode(line));};
let stage=0;
while(cpu.cycles<9.4*16000000){
 const ms=cpu.cycles/16000;
 if(stage===0&&ms>700){send(encode(1,{cmd:'heartbeat'}));stage++;}
 if(stage===1&&ms>1100){send(encode(2,{cmd:'setMode',mode:'MANUAL'}));stage++;}
 if(stage===2&&ms>5300){send(encode(3,{cmd:'pump',id:3,on:true,ms:4000}));stage++;}
 if(stage===3&&ms>5750){b.setPin(1,true);echoWidth=1160;stage++;}
 if(stage===4&&ms>6100){send(encode(4,{cmd:'pump',id:1,on:true}).replace('"id":1','"id":2'));stage++;}
 if(stage===5&&ms>6800){dhtRespond=false;echoRespond=false;stage++;}
 if(queue.length&&!uart.rxBusy&&cpu.cycles-lastReceive>18000&&uart.rxEnable){uart.writeByte(queue.shift());lastReceive=cpu.cycles;}
 avr.avrInstruction(cpu);cpu.tick();
}
const states=frames.filter(f=>f.data.type==='state').map(f=>f.data),acks=frames.filter(f=>f.data.type==='ack').map(f=>f.data);
if(process.env.FIRMWARE_DEBUG)console.log(JSON.stringify({frames,ddr:cpu.data[avr.portDConfig.DDR],port:cpu.data[avr.portDConfig.PORT]},null,2));
assert.equal(earlyStart,false);assert.equal(irrigationSeen,true,'A bomba virtual 3 deveria ligar após comando seguro.');
assert.ok(states.length>=6);assert.ok(states.some(s=>s.temperatura===null),'DHT ainda não inicializado deve ser null.');
assert.ok(states.some(s=>s.temperatura===29.5&&s.umidade_ar===68),'DHT virtual deveria produzir leitura com checksum válido.');
assert.ok(states.some(s=>s.caixa!==null),'Ultrassônico virtual deveria completar mediana.');
assert.ok(acks.some(a=>a.cmd===3&&a.ok&&a.pumps[2]),'ACK deve confirmar o estado real da saída.');
assert.ok(acks.some(a=>a.cmd===0&&!a.ok&&a.code===11),'Comando corrompido deve ser recusado.');
assert.equal(states.at(-1).temperatura,null);assert.equal(states.at(-1).umidade_ar,null);assert.equal(states.at(-1).caixa,null);
assert.equal(states.at(-1).pumps[2],false,'Perda da boia mínima deve desligar irrigação.');
assert.equal((cpu.data[avr.portDConfig.PORT]>>4)&1,1); // Relé ativo LOW está desligado.
console.log(JSON.stringify({sketch:'sda.ino',virtualSeconds:9.4,telemetryFrames:states.length,acks:acks.length,checks:13,physicalHardware:false},null,2));
