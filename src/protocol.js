const VERSION=1, MAX_LINE=512;
function checksum(seq,raw){let sum=0;for(const byte of Buffer.from(`1|${seq}|${raw}`,'utf8'))sum=(sum+byte)&65535;return sum;}
function encode(seq,data){if(!Number.isInteger(seq)||seq<0||seq>0xffffffff)throw new Error('Sequência inválida.');const raw=JSON.stringify(data);return `{"v":1,"seq":${seq},"data":${raw},"checksum":${checksum(seq,raw)}}\n`;}
function nullable(value,min,max){return value===null||typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;}
function validPumps(pumps){return Array.isArray(pumps)&&pumps.length===3&&pumps.every(v=>typeof v==='boolean');}
function validate(data){
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Dados inválidos.');
 if(data.type==='boot')return;
 if(data.type==='ack'){
  if(!Number.isInteger(data.cmd)||data.cmd<0||data.cmd>0xffffffff||typeof data.ok!=='boolean'||!Number.isInteger(data.code)||data.code<0||data.code>12||!validPumps(data.pumps)||!['AUTO','MANUAL'].includes(data.modo))throw new Error('ACK inválido.');return;
 }
 if(data.type!=='state'||!nullable(data.solo,0,100)||!nullable(data.temperatura,0,60)||!nullable(data.umidade_ar,0,100)||!nullable(data.caixa,0,100)||!Array.isArray(data.boias)||data.boias.length!==5||data.boias.some(v=>v!==null&&typeof v!=='boolean')||!validPumps(data.pumps)||!['AUTO','MANUAL'].includes(data.modo)||!Number.isInteger(data.alertas)||data.alertas<0||data.alertas>511)throw new Error('Estado inválido.');
 if(data.solo_bruto!==undefined&&(!nullable(data.solo_bruto,0,1023)||(data.solo_bruto!==null&&!Number.isInteger(data.solo_bruto))))throw new Error('Leitura bruta inválida.');
 for(const name of ['rio','poco'])if(data[name]!==undefined&&!nullable(data[name],0,100))throw new Error('Nível inválido.');
}
function validateCommand(data){
 const fields={heartbeat:['cmd'],setMode:['cmd','mode'],pump:['cmd','id','on','ms'],setThresholds:['cmd','dry','wet'],calibrate:['cmd','dry','wet']};
 if(!data||!fields[data.cmd]||Object.keys(data).some(k=>!fields[data.cmd].includes(k)))throw new Error('Comando inválido.');
 if(data.cmd==='setMode'&&!['AUTO','MANUAL'].includes(data.mode))throw new Error('Modo inválido.');
 if(data.cmd==='pump'&&(!Number.isInteger(data.id)||data.id<1||data.id>3||typeof data.on!=='boolean'||(data.ms!==undefined&&(!Number.isInteger(data.ms)||data.ms<0))))throw new Error('Bomba inválida.');
 if(['setThresholds','calibrate'].includes(data.cmd)&&(!Number.isInteger(data.dry)||!Number.isInteger(data.wet)||data.dry<0||data.dry>1023||data.wet<0||data.wet>1023))throw new Error('Limiares inválidos.');
}
function decode(line,{command=false}={}){
 if(typeof line!=='string'||line.length>MAX_LINE||/[^\x20-\x7e\r\n]/.test(line))throw new Error('Linha inválida.');
 const match=line.replace(/\r?\n$/,'').match(/^\{"v":1,"seq":(0|[1-9][0-9]*),"data":(\{.*\}),"checksum":(0|[1-9][0-9]*)\}$/);
 if(!match)throw new Error('Envelope/versão inválido.');
 const seq=Number(match[1]),sum=Number(match[3]);if(!Number.isInteger(seq)||seq>0xffffffff||sum>65535||checksum(seq,match[2])!==sum)throw new Error('Checksum/sequência inválido.');
 const data=JSON.parse(match[2]);if(command)validateCommand(data);else validate(data);return {v:VERSION,seq,data};
}
module.exports={VERSION,MAX_LINE,checksum,encode,decode,validate,validateCommand};
