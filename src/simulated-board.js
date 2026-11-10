const {PumpControl,limits,R}=require('./pump-control');
const {encode,decode}=require('./protocol');
class SimulatedBoard{
 constructor(receive,{clock=Date.now,automatic=true}={}){
  this.receive=receive;this.clock=clock;this.epoch=clock();this.control=new PumpControl();this.river=80;this.well=35;this.box=60;this.soil=42;this.rain=false;this.seq=0;this.lastCommand=null;this.lastTick=0;this.lastState=0;this.calibratingUntil=0;this.rawDry=limits.soilDry;this.rawWet=limits.soilWet;this.faults={};
  this.send({type:'boot'});this.tick();this.telemetry();
  if(automatic){this.timer=setInterval(()=>this.tick(),100);this.timer.unref();}
 }
 send(data){this.receive(encode(this.seq++>>>0,data));}
 input(now){const f=[this.river>5,this.well>=20,this.well>=90,this.box>=20,this.box>=90];return {floats:this.faults.floats||f,validFloats:this.faults.validFloats??31,soil:Math.max(0,Math.min(100,Math.round((this.rawDry-(limits.soilDry-this.soil*(limits.soilDry-limits.soilWet)/100))*100/(this.rawDry-this.rawWet)))),boxPercent:this.box,soilValid:!this.faults.soil&&now>=this.calibratingUntil,ultraValid:!this.faults.ultra,dhtValid:!this.faults.dht,floatAt:now,soilAt:now,ultraAt:now,dhtAt:now};}
 tick(){const now=this.clock()-this.epoch,dt=Math.min(0.25,Math.max(0,(now-this.lastTick)/1000));this.lastTick=now;
  const p=this.control.pumps;
  if(p[0]){this.river-=dt;this.well+=4*dt;}
  if(p[1]){this.well-=3*dt;this.box+=3*dt;}
  if(p[2]){this.box-=1.6*dt;this.soil+=2*dt;}else this.soil-=0.12*dt;
  if(this.rain){this.river+=dt;this.soil+=dt;}
  for(const k of ['river','well','box','soil'])this[k]=Math.max(0,Math.min(100,this[k]));
  this.control.step(this.input(now),now);if(now-this.lastState>=1000)this.telemetry();
 }
 telemetry(){const now=this.clock()-this.epoch;this.lastState=now;const s=this.input(now);this.send({type:'state',solo:s.soilValid?s.soil:null,solo_bruto:s.soilValid?Math.round(limits.soilDry-this.soil*(limits.soilDry-limits.soilWet)/100):null,temperatura:s.dhtValid?29.5:null,umidade_ar:s.dhtValid?68:null,caixa:s.ultraValid?Math.round(this.box):null,rio:Math.round(this.river),poco:Math.round(this.well),boias:s.floats.map((value,i)=>s.validFloats&(1<<i)?value:null),pumps:[...this.control.pumps],modo:this.control.mode,alertas:this.control.alerts});}
 write(line){
  let frame;try{frame=decode(line,{command:true});}catch{this.send({type:'ack',cmd:0,ok:false,code:11,pumps:[...this.control.pumps],modo:this.control.mode});return;}
  const {seq,data}=frame,now=this.clock()-this.epoch,c=this.control;
  if(this.lastCommand!==null&&((seq-this.lastCommand)>>>0)>=0x80000000||seq===this.lastCommand){this.send({type:'ack',cmd:seq,ok:false,code:10,pumps:[...c.pumps],modo:c.mode});return;}
  this.lastCommand=seq;let ok=true,code=0;
  if(data.cmd==='heartbeat')c.heartbeat(now);
  else if(data.cmd==='setMode')c.setMode(data.mode,now);
  else if(data.cmd==='pump')ok=c.request(data.id,data.on,now,data.ms||0);
  else if(data.cmd==='setThresholds'){ok=data.dry>=1&&data.dry<data.wet&&data.wet<=100;if(ok){c.dry=data.dry;c.wet=data.wet;}}
  else if(data.cmd==='calibrate'){ok=c.mode==='MANUAL'&&!c.pumps.some(Boolean)&&data.dry>data.wet+50;if(ok){this.rawDry=data.dry;this.rawWet=data.wet;this.calibratingUntil=now+800;}}
  if(ok)c.heartbeat(now);c.step(this.input(now),now);
  if(ok&&data.cmd==='pump'&&data.on){code=c.reasons[data.id-1];if(![R.OK,R.CAPACITY,R.START_GAP].includes(code)){c.request(data.id,false,now);ok=false;}}
  if(!ok&&data.cmd==='pump')c.notifyBlocked(now);
  if(!ok&&!code)code=12;
  this.send({type:'ack',cmd:seq,ok,code,pumps:[...c.pumps],modo:c.mode});
 }
 close(){clearInterval(this.timer);}
}
module.exports={SimulatedBoard};
