#pragma once
#include <stdint.h>
#include "Config.h"
namespace Sda {
inline uint32_t elapsed(uint32_t now,uint32_t before){return now-before;}
enum Mode:uint8_t {AUTO,MANUAL};
enum Reason:uint8_t {OK,BOOT,SOURCE_EMPTY,DEST_FULL,SENSOR,COOLDOWN,MAX_TIME,CAPACITY,START_GAP,SOIL_WET};
enum Alert:uint16_t {RIVER_DRY=1,WELL_LOW=2,BOX_LOW=4,SENSOR_ERROR=8,BLOCKED=16,LINK_LOST=32,TIME_LIMIT=64,QUEUED=128,STARTUP=256};
struct Input {
 bool floats[5]={false,false,false,false,false};uint8_t validFloats=0;
 uint8_t soil=0,boxPercent=0;bool soilValid=false,ultraValid=false,dhtValid=false;
 uint32_t floatAt=0,soilAt=0,ultraAt=0,dhtAt=0;
};
class Control {
 public:
 bool pumps[3]={false,false,false};Reason reasons[3]={BOOT,BOOT,BOOT};Mode mode=AUTO;
 uint16_t alerts=STARTUP;uint8_t dry=Config::DRY,wet=Config::WET;
 bool requested[3]={false,false,false};
 Control(uint32_t now=0):bootAt(now){}
 void notifyBlocked(uint32_t now){blockedAt=now;hasBlocked=true;alerts|=BLOCKED;}
 void heartbeat(uint32_t now){heartbeatAt=now;seenHeartbeat=true;linkLost=false;}
 void setMode(Mode value,uint32_t now){for(uint8_t i=0;i<3;i++){off(i,now);requested[i]=false;}mode=value;heartbeat(now);}
 bool thresholds(uint8_t d,uint8_t w){if(d<1||d>=w||w>100)return false;dry=d;wet=w;return true;}
 bool request(uint8_t id,bool on,uint32_t now,uint32_t duration=0){
  if(id<1||id>3||mode!=MANUAL||duration>Config::MAX_CYCLE_MS[id-1])return false;
  const uint8_t i=id-1;requested[i]=on;manualDuration[i]=duration?duration:Config::MAX_CYCLE_MS[i];
  if(!on)off(i,now);heartbeat(now);return true;
 }
 void step(const Input &s,uint32_t now){
  alerts=0;if(hasBlocked&&elapsed(now,blockedAt)<Config::ALERT_HOLD_MS)alerts|=BLOCKED;else hasBlocked=false;
  if(mode==MANUAL&&(!seenHeartbeat||elapsed(now,heartbeatAt)>=Config::HEARTBEAT_MS)){
   for(uint8_t i=0;i<3;i++){off(i,now);requested[i]=false;}mode=AUTO;linkLost=true;
  }
  if(linkLost)alerts|=LINK_LOST;
  bool fv[5];for(uint8_t i=0;i<5;i++)fv[i]=(s.validFloats&(1<<i))&&elapsed(now,s.floatAt)<=Config::FLOAT_STALE_MS;
  bool well=fv[1]&&fv[2]&&!(s.floats[2]&&!s.floats[1]);
  bool box=fv[3]&&fv[4]&&!(s.floats[4]&&!s.floats[3]);
  bool soil=s.soilValid&&s.soil<=100&&elapsed(now,s.soilAt)<=Config::SOIL_STALE_MS;
  bool ultra=s.ultraValid&&s.boxPercent<=100&&elapsed(now,s.ultraAt)<=Config::ULTRA_STALE_MS;
  bool dht=s.dhtValid&&elapsed(now,s.dhtAt)<=Config::DHT_STALE_MS;
  if(box&&ultra&&((s.floats[4]&&s.boxPercent<Config::BOX_MAX_PERCENT-Config::LEVEL_TOLERANCE)||(!s.floats[3]&&s.boxPercent>Config::BOX_MIN_PERCENT+Config::LEVEL_TOLERANCE)))box=false;
  if(!fv[0]||!well||!box||!soil||!ultra||!dht)alerts|=SENSOR_ERROR;
  if(fv[0]&&!s.floats[0])alerts|=RIVER_DRY;
  if(well&&!s.floats[1])alerts|=WELL_LOW;
  if(box&&!s.floats[3])alerts|=BOX_LOW;
  const bool boot=elapsed(now,bootAt)<Config::BOOT_HOLD_MS;
  if(boot)alerts|=STARTUP;
  // Memórias de enchimento evitam oscilação entre boias mínima e máxima.
  if(!well||!fv[0]||!s.floats[0]||s.floats[2])fillWell=false;else if(!s.floats[1])fillWell=true;
  if(!box||!well||!s.floats[1]||s.floats[4])fillBox=false;else if(!s.floats[3])fillBox=true;
  if(!soil||!box||!ultra||!s.floats[3]||s.soil>=wet)irrigate=false;else if(s.soil<dry)irrigate=true;
  bool want[3]={mode==AUTO?fillWell:requested[0],mode==AUTO?fillBox:requested[1],mode==AUTO?irrigate:requested[2]};
  for(uint8_t i=0;i<3;i++){
   Reason r=OK;
   if(boot)r=BOOT;
   else if(!dht||(i==0&&(!fv[0]||!well))||(i==1&&(!well||!box||!ultra))||(i==2&&(!box||!ultra||!soil)))r=SENSOR;
   else if((i==0&&!s.floats[0])||(i==1&&!s.floats[1])||(i==2&&!s.floats[3]))r=SOURCE_EMPTY;
   else if((i==0&&s.floats[2])||(i==1&&(s.floats[4]||s.boxPercent>=Config::BOX_MAX_PERCENT)))r=DEST_FULL;
   else if(i==2&&s.soil>=wet)r=SOIL_WET;
   if(pumps[i]&&elapsed(now,startedAt[i])>=(mode==MANUAL?manualDuration[i]:Config::MAX_CYCLE_MS[i])){
    off(i,now);requested[i]=false;want[i]=false;r=MAX_TIME;alerts|=TIME_LIMIT;notifyBlocked(now);
   }
   if(r!=OK||!want[i])off(i,now);
   if(r==OK&&!pumps[i]&&hasStopped[i]&&elapsed(now,stoppedAt[i])<Config::MIN_OFF_MS[i])r=COOLDOWN;
   reasons[i]=r;
   if(want[i]&&r!=OK)alerts|=BLOCKED;
  }
  uint8_t count=0;for(uint8_t i=0;i<3;i++)if(pumps[i])count++;
  // No máximo uma partida por passagem, com intervalo global entre partidas.
  for(uint8_t offset=0;offset<3;offset++){
   uint8_t i=(nextPump+offset)%3;
   if(!want[i]||pumps[i]||reasons[i]!=OK)continue;
   if(count>=Config::MAX_SIMULTANEOUS){reasons[i]=CAPACITY;alerts|=QUEUED;continue;}
   if(hasStarted&&elapsed(now,lastStart)<Config::START_GAP_MS){reasons[i]=START_GAP;alerts|=QUEUED;continue;}
   pumps[i]=true;startedAt[i]=now;lastStart=now;hasStarted=true;nextPump=(i+1)%3;count++;
   break;
  }
 }
 private:
 uint32_t blockedAt=0;bool hasBlocked=false;
 uint32_t bootAt,heartbeatAt=0,lastStart=0,startedAt[3]={0,0,0},stoppedAt[3]={0,0,0};
 uint32_t manualDuration[3]={Config::MAX_CYCLE_MS[0],Config::MAX_CYCLE_MS[1],Config::MAX_CYCLE_MS[2]};
 bool hasStopped[3]={false,false,false},seenHeartbeat=false,linkLost=false,hasStarted=false;
 bool fillWell=false,fillBox=false,irrigate=false;uint8_t nextPump=0;
 void off(uint8_t i,uint32_t now){if(pumps[i]){pumps[i]=false;stoppedAt[i]=now;hasStopped[i]=true;}}
};
}
