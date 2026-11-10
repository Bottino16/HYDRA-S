const {EventEmitter}=require('node:events');
const {encode,decode}=require('./protocol');
class DeviceLink extends EventEmitter{
 constructor(send,{clock=Date.now,ackMs=2500,staleMs=3500}={}){super();this.send=send;this.clock=clock;this.ackMs=ackMs;this.staleMs=staleMs;this.seq=0;this.lastSeq=null;this.pending=new Map();this.waiting=[];this.state=null;this.at=0;this.rejected=0;}
 receive(line){
  let frame;try{frame=decode(line);}catch{this.rejected++;this.emit('discard','invalid');return false;}
  const {seq,data}=frame;
  if(data.type==='boot'){
   // Boot só é aceito com seq=0; não produz estado ligado nem confirma comando.
   if(seq!==0){this.rejected++;return false;}this.reset('Arduino reiniciado.');this.lastSeq=seq;this.emit('boot');return true;
  }
  if(this.lastSeq!==null){const delta=(seq-this.lastSeq)>>>0;if(delta===0||delta>=0x80000000){this.rejected++;this.emit('discard','sequence');return false;}}
  this.lastSeq=seq;
  if(data.type==='state'){this.state={...data,v:1,seq};this.at=this.clock();this.emit('state',this.snapshot());this.emit('telemetry',this.snapshot());}
  else if(data.type==='ack'){
   const pending=this.pending.get(data.cmd);if(!pending)return true;
   clearTimeout(pending.timer);this.pending.delete(data.cmd);queueMicrotask(()=>this.flush());
   if(this.state){this.state={...this.state,pumps:[...data.pumps],modo:data.modo};this.emit('state',this.snapshot());}
   if(data.ok)pending.resolve(data);else pending.reject(Object.assign(new Error('Comando bloqueado pelo controlador (código '+data.code+').'),{status:409,code:data.code}));
  }
  return true;
 }
 snapshot(){
  const connected=!!this.state&&this.clock()-this.at<=this.staleMs;
  const visible={...this.state};
  if(!connected){for(const key of ['solo','solo_bruto','temperatura','umidade_ar','caixa','rio','poco','modo','alertas'])visible[key]=null;visible.boias=[null,null,null,null,null];}
  return {...visible,connected,receivedAt:this.at,pumps:connected?this.state.pumps:[null,null,null],rejected:this.rejected};
 }
 command(data){
  if(this.waiting.length>=16)return Promise.reject(Object.assign(new Error('Fila de comandos cheia.'),{status:429}));
  const seq=this.seq=(this.seq+1)>>>0;
  return new Promise((resolve,reject)=>{this.waiting.push({seq,data,resolve,reject});this.flush();});
 }
 flush(){
  if(this.pending.size||!this.waiting.length)return;
  const {seq,data,resolve,reject}=this.waiting.shift();
  const timer=setTimeout(()=>{this.pending.delete(seq);reject(Object.assign(new Error('Arduino não confirmou o comando; estado físico não presumido.'),{status:504}));this.flush();},this.ackMs);timer.unref();
  this.pending.set(seq,{resolve,reject,timer});
  try{this.send(encode(seq,data));}catch(error){clearTimeout(timer);this.pending.delete(seq);reject(error);queueMicrotask(()=>this.flush());}
 }
 reset(message='Conexão serial interrompida.'){
  for(const pending of this.pending.values()){clearTimeout(pending.timer);pending.reject(Object.assign(new Error(message),{status:503}));}
  for(const pending of this.waiting)pending.reject(Object.assign(new Error(message),{status:503}));this.waiting=[];
  this.pending.clear();this.lastSeq=null;this.state=null;this.at=0;this.emit('state',this.snapshot());
 }
 close(){this.reset('Conexão encerrada.');this.removeAllListeners();}
}
module.exports={DeviceLink};
