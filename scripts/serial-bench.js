// Ferramenta LOCAL para o roteiro supervisionado; não é executada pelos testes.
const readline=require('node:readline');const {DeviceLink}=require('../src/device-link');const {SerialTransport}=require('../src/serial-transport');const {limits}=require('../src/pump-control');
function parseCommand(line){const [cmd,a,b,c,...extra]=line.trim().split(/\s+/);if(extra.length)throw new Error('Argumentos extras.');
 if(cmd==='stop'&&!a)return {cmd:'setMode',mode:'MANUAL'};
 if(cmd==='mode'&&['AUTO','MANUAL'].includes(a)&&!b)return {cmd:'setMode',mode:a};
 if(cmd==='calibrate'&&!c&&/^\d+$/.test(a)&&/^\d+$/.test(b)&&Number(a)<=1023&&Number(a)>Number(b)+50)return {cmd:'calibrate',dry:Number(a),wet:Number(b)};
 if(cmd==='thresholds'&&!c&&/^\d+$/.test(a)&&/^\d+$/.test(b)&&Number(a)>=1&&Number(a)<Number(b)&&Number(b)<=100)return {cmd:'setThresholds',dry:Number(a),wet:Number(b)};
 if(cmd==='pump'&&/^[1-3]$/.test(a)&&['on','off'].includes(b)){
  const id=Number(a),ms=c===undefined?4000:Number(c);if(!Number.isInteger(ms)||ms<1000||ms>limits.cycles[id-1])throw new Error('Duração fora do limite.');return {cmd:'pump',id,on:b==='on',ms:b==='on'?ms:0};}
 throw new Error('Use: mode AUTO|MANUAL, pump 1|2|3 on|off [ms], stop, state, heartbeat on|off, exit.');
}
function main(){const at=process.argv.indexOf('--port'),port=at>=0?process.argv[at+1]:null;if(!port||!process.argv.includes('--supervisionado'))throw new Error('Use --port COMx --supervisionado. Leia docs/TESTE-FISICO-FASE-1.md antes; bombas inicialmente SEM 12 V.');
 console.log('FIRMWARE NÃO VALIDADO FISICAMENTE. Abrir serial pode reiniciar o UNO. Inicialização solicita MANUAL, todas desligadas.');
 let transport,armed=false,heartbeat=true,busy=false;
 const link=new DeviceLink(line=>transport.write(line));
 link.on('boot',()=>armed=false);link.on('discard',reason=>console.log('DESCARTADO',reason));
 link.on('state',state=>{if(!state.connected)return;console.log(JSON.stringify(state));if(!armed){armed=true;link.command({cmd:'setMode',mode:'MANUAL'}).then(ack=>console.log('ACK MANUAL',ack)).catch(error=>console.log(error.message));}});
 transport=new SerialTransport(line=>link.receive(line),message=>{armed=false;link.reset(message);},{path:port});
 const timer=setInterval(async()=>{if(!heartbeat||busy||!link.snapshot().connected)return;busy=true;try{await link.command({cmd:'heartbeat'});}catch(error){console.log(error.message);}finally{busy=false;}},Math.min(2000,Math.floor(limits.heartbeat/3)));
 const rl=readline.createInterface({input:process.stdin,output:process.stdout});
 rl.on('line',async line=>{try{
  if(line==='state'){console.log(link.snapshot());return;}
  if(line==='heartbeat off'||line==='heartbeat on'){heartbeat=line.endsWith('on');console.log('Heartbeat',heartbeat?'ativo':'PAUSADO; não envie outros comandos ao testar o timeout.');return;}
  if(line==='exit'){rl.close();return;}
  console.log('ACK',await link.command(parseCommand(line)));
 }catch(error){console.log('RECUSADO',error.message);}});
 rl.on('close',()=>{clearInterval(timer);transport.close();link.close();console.log('Conexão fechada. Confirme que a fonte das bombas está desligada.');});
}
if(require.main===module){try{main();}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={parseCommand};
