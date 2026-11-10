// Espelho da máquina C++ para a física simulada; constantes vêm de Config.h.
const fs=require('node:fs');const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../firmware/sda/Config.h'),'utf8');
function scalar(name){const match=source.match(new RegExp('\\b'+name+'=(\\d+)'));if(!match)throw new Error('Constante ausente: '+name);return Number(match[1]);}
function array(name){const match=source.match(new RegExp('\\b'+name+'\\[3\\]=\\{([^}]+)'));if(!match)throw new Error('Constante ausente: '+name);return match[1].split(',').map(Number);}
const limits={soilDry:scalar('SOIL_DRY_RAW'),soilWet:scalar('SOIL_WET_RAW'),alertHold:scalar('ALERT_HOLD_MS'),boot:scalar('BOOT_HOLD_MS'),heartbeat:scalar('HEARTBEAT_MS'),gap:scalar('START_GAP_MS'),max:scalar('MAX_SIMULTANEOUS'),dry:scalar('DRY'),wet:scalar('WET'),cycles:array('MAX_CYCLE_MS'),off:array('MIN_OFF_MS'),floatStale:scalar('FLOAT_STALE_MS'),soilStale:scalar('SOIL_STALE_MS'),ultraStale:scalar('ULTRA_STALE_MS'),dhtStale:scalar('DHT_STALE_MS'),boxMin:scalar('BOX_MIN_PERCENT'),boxMax:scalar('BOX_MAX_PERCENT'),tolerance:scalar('LEVEL_TOLERANCE')};
const R={OK:0,BOOT:1,SOURCE_EMPTY:2,DEST_FULL:3,SENSOR:4,COOLDOWN:5,MAX_TIME:6,CAPACITY:7,START_GAP:8,SOIL_WET:9};
const A={RIVER_DRY:1,WELL_LOW:2,BOX_LOW:4,SENSOR_ERROR:8,BLOCKED:16,LINK_LOST:32,TIME_LIMIT:64,QUEUED:128,STARTUP:256};
class PumpControl{
 constructor(now=0){this.bootAt=now;this.pumps=[false,false,false];this.reasons=[1,1,1];this.requested=[false,false,false];this.mode='AUTO';this.alerts=256;this.dry=limits.dry;this.wet=limits.wet;this.stopped=[null,null,null];this.started=[0,0,0];this.duration=[...limits.cycles];this.lastStart=null;this.heartbeatAt=null;this.linkLost=false;this.fillWell=false;this.fillBox=false;this.irrigate=false;this.nextPump=0;this.blockedAt=null;}
 notifyBlocked(now){this.blockedAt=now;this.alerts|=16;}
 heartbeat(now){this.heartbeatAt=now;this.linkLost=false;}
 off(i,now){if(this.pumps[i]){this.pumps[i]=false;this.stopped[i]=now;}}
 setMode(mode,now){for(let i=0;i<3;i++){this.off(i,now);this.requested[i]=false;}this.mode=mode;this.heartbeat(now);}
 request(id,on,now,ms=0){if(!Number.isInteger(id)||id<1||id>3||typeof on!=='boolean'||this.mode!=='MANUAL'||!Number.isInteger(ms)||ms<0||ms>limits.cycles[id-1])return false;this.requested[id-1]=on;this.duration[id-1]=ms||limits.cycles[id-1];if(!on)this.off(id-1,now);this.heartbeat(now);return true;}
 step(s,now){
  this.alerts=this.blockedAt!==null&&now-this.blockedAt<limits.alertHold?16:0;
  if(this.mode==='MANUAL'&&(this.heartbeatAt===null||now-this.heartbeatAt>=limits.heartbeat)){for(let i=0;i<3;i++){this.off(i,now);this.requested[i]=false;}this.mode='AUTO';this.linkLost=true;}
  if(this.linkLost)this.alerts|=A.LINK_LOST;
  const f=s.floats,v=f.map((_,i)=>!!(s.validFloats&(1<<i))&&now-s.floatAt<=limits.floatStale);
  const well=v[1]&&v[2]&&!(f[2]&&!f[1]);let box=v[3]&&v[4]&&!(f[4]&&!f[3]);
  const soil=s.soilValid&&s.soil<=100&&now-s.soilAt<=limits.soilStale;
  const ultra=s.ultraValid&&s.boxPercent<=100&&now-s.ultraAt<=limits.ultraStale;
  const dht=s.dhtValid&&now-s.dhtAt<=limits.dhtStale;
  if(box&&ultra&&((f[4]&&s.boxPercent<limits.boxMax-limits.tolerance)||(!f[3]&&s.boxPercent>limits.boxMin+limits.tolerance)))box=false;
  if(!v[0]||!well||!box||!soil||!ultra||!dht)this.alerts|=A.SENSOR_ERROR;
  if(v[0]&&!f[0])this.alerts|=1;if(well&&!f[1])this.alerts|=2;if(box&&!f[3])this.alerts|=4;
  const boot=now-this.bootAt<limits.boot;if(boot)this.alerts|=256;
  if(!well||!v[0]||!f[0]||f[2])this.fillWell=false;else if(!f[1])this.fillWell=true;
  if(!box||!well||!f[1]||f[4])this.fillBox=false;else if(!f[3])this.fillBox=true;
  if(!soil||!box||!ultra||!f[3]||s.soil>=this.wet)this.irrigate=false;else if(s.soil<this.dry)this.irrigate=true;
  const want=this.mode==='AUTO'?[this.fillWell,this.fillBox,this.irrigate]:[...this.requested];
  for(let i=0;i<3;i++){
   let r=0;if(boot)r=1;else if(!dht||(i===0&&(!v[0]||!well))||(i===1&&(!well||!box||!ultra))||(i===2&&(!box||!ultra||!soil)))r=4;
   else if((i===0&&!f[0])||(i===1&&!f[1])||(i===2&&!f[3]))r=2;
   else if((i===0&&f[2])||(i===1&&(f[4]||s.boxPercent>=limits.boxMax)))r=3;
   else if(i===2&&s.soil>=this.wet)r=9;
   if(this.pumps[i]&&now-this.started[i]>=(this.mode==='MANUAL'?this.duration[i]:limits.cycles[i])){this.off(i,now);this.requested[i]=false;want[i]=false;r=6;this.alerts|=64;this.notifyBlocked(now);}
   if(r!==0||!want[i])this.off(i,now);
   if(r===0&&!this.pumps[i]&&this.stopped[i]!==null&&now-this.stopped[i]<limits.off[i])r=5;
   this.reasons[i]=r;if(want[i]&&r!==0)this.alerts|=16;
  }
  let count=this.pumps.filter(Boolean).length;
  for(let offset=0;offset<3;offset++){
   const i=(this.nextPump+offset)%3;if(!want[i]||this.pumps[i]||this.reasons[i]!==0)continue;
   if(count>=limits.max){this.reasons[i]=7;this.alerts|=128;continue;}
   if(this.lastStart!==null&&now-this.lastStart<limits.gap){this.reasons[i]=8;this.alerts|=128;continue;}
   this.pumps[i]=true;this.started[i]=now;this.lastStart=now;this.nextPump=(i+1)%3;count++;break;
  }
 }
}
module.exports={PumpControl,limits,R,A};
