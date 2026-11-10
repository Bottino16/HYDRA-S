const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {CPU,avrInstruction}=require('avr8js');const {PumpControl}=require('../src/pump-control');
function toolDirectory(){if(process.env.AVR_BIN)return process.env.AVR_BIN;const base=path.join(process.env.LOCALAPPDATA||'', 'Arduino15/packages/arduino/tools/avr-gcc');if(fs.existsSync(base)){const version=fs.readdirSync(base).sort().reverse()[0];if(version)return path.join(base,version,'bin');}throw new Error('Instale Arduino AVR Boards pelo Arduino IDE ou defina AVR_BIN para avr-g++/avr-objcopy/avr-nm.');}
function run(name,args){const exe=path.join(toolDirectory(),name+(process.platform==='win32'?'.exe':''));const result=cp.spawnSync(exe,args,{encoding:'utf8'});if(result.status!==0)throw new Error(result.stderr||result.error?.message||name+' falhou');return result.stdout;}
function execute({source='firmware/tests/control_tests.cpp',include=null,vectorsExpected=3072,tag='control'}={}){
 fs.mkdirSync('.data',{recursive:true});const elf=path.resolve('.data/'+tag+'-tests.elf'),bin=path.resolve('.data/'+tag+'-tests.bin');
 run('avr-g++',['-std=gnu++11','-Os','-mmcu=atmega328p','-fno-exceptions','-fno-rtti',...(include?['-I',include]:[]),source,'-o',elf]);run('avr-objcopy',['-O','binary',elf,bin]);
 const symbols=run('avr-nm',[elf]);function address(name){const match=symbols.match(new RegExp('^([0-9a-f]+) [A-Za-z] '+name+'$','m'));if(!match)throw new Error('Símbolo ausente: '+name);return parseInt(match[1],16)-0x800000;}
 const bytes=fs.readFileSync(bin),program=new Uint16Array(16384);new Uint8Array(program.buffer).set(bytes);const cpu=new CPU(program);
 const report=address('report'),mail=address('mailbox'),ready=address('sampleReady');let vectors=0;
 const read16=at=>cpu.data[at]|cpu.data[at+1]<<8;
 for(let instructions=0;instructions<40000000;instructions++){
  avrInstruction(cpu);cpu.tick();
  if(cpu.data[ready]){
   const mask=cpu.data[mail],valid=cpu.data[mail+1],id=cpu.data[mail+2];const floats=Array.from({length:5},(_,i)=>!!(mask&(1<<i)));
   const c=new PumpControl();c.setMode('MANUAL',5000);c.request(id,true,5000);
   c.step({floats,validFloats:valid,soil:10,boxPercent:floats[4]?100:floats[3]?50:0,soilValid:true,ultraValid:true,dhtValid:true,floatAt:5000,soilAt:5000,ultraAt:5000,dhtAt:5000},5000);
   const bits=c.pumps.reduce((n,v,i)=>n+(v?(1<<i):0),0);
   assert.equal(bits,cpu.data[mail+3],`Divergência C++/JS: boias=${mask} válidas=${valid} bomba=${id}`);
   assert.equal(c.alerts,read16(mail+4));assert.deepEqual(c.reasons,[cpu.data[mail+6],cpu.data[mail+7],cpu.data[mail+8]]);
   cpu.data[ready]=0;vectors++;
  }
  if(cpu.data[report+6]){
   const result={checks:read16(report)+(read16(report+2)*65536),failures:read16(report+4),matrix:read16(report+7),scenarios:read16(report+9),firstFailureLine:read16(report+11),parityVectors:vectors,compiler:'avr-g++',execution:'ATmega328P emulado por avr8js'};
   if(result.failures)throw new Error(JSON.stringify(result));assert.equal(vectors,vectorsExpected);console.log(JSON.stringify(result,null,2));return result;
  }
 }
 throw new Error('O firmware de testes não terminou dentro do limite de instruções.');
}
if(require.main===module){try{execute();const dir=path.resolve('.data/concurrency-two');fs.mkdirSync(dir,{recursive:true});fs.copyFileSync('firmware/sda/Control.h',path.join(dir,'Control.h'));fs.writeFileSync(path.join(dir,'Config.h'),fs.readFileSync('firmware/sda/Config.h','utf8').replace('MAX_SIMULTANEOUS=1','MAX_SIMULTANEOUS=2'));execute({source:'firmware/tests/concurrency_tests.cpp',include:dir,vectorsExpected:0,tag:'two'});}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={execute};
