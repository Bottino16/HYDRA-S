#include "../sda/Control.h"
#include "../sda/Sensors.h"
#include "../sda/Protocol.h"
#include <string.h>
struct Report {uint32_t checks;uint16_t failures;uint8_t done;uint16_t matrix;uint16_t scenarios;uint16_t first;};
extern "C" {volatile Report report={};volatile uint8_t mailbox[9]={};volatile uint8_t sampleReady=0;}
#define CHECK(value) do{report.checks++;if(!(value)){report.failures++;if(!report.first)report.first=__LINE__;}}while(0)
Sda::Input good(uint32_t now){Sda::Input s;s.validFloats=31;s.floats[0]=true;s.floats[1]=true;s.floats[3]=true;s.soil=10;s.boxPercent=50;s.soilValid=s.ultraValid=s.dhtValid=true;s.floatAt=s.soilAt=s.ultraAt=s.dhtAt=now;return s;}
uint8_t bits(const Sda::Control &c){return c.pumps[0]|(c.pumps[1]<<1)|(c.pumps[2]<<2);}
void step(Sda::Control &c,Sda::Input &s,uint32_t now){s.floatAt=s.soilAt=s.ultraAt=s.dhtAt=now;c.step(s,now);}
void matrix(){
 const uint32_t now=Config::BOOT_HOLD_MS;
 for(uint8_t mask=0;mask<32;mask++)for(uint8_t valid=0;valid<32;valid++)for(uint8_t id=1;id<=3;id++){
  Sda::Input s=good(now);s.validFloats=valid;for(uint8_t i=0;i<5;i++)s.floats[i]=mask&(1<<i);
  s.boxPercent=s.floats[4]?100:s.floats[3]?50:0;
  Sda::Control c;c.setMode(Sda::MANUAL,now);CHECK(c.request(id,true,now));c.step(s,now);
  const bool well=(valid&6)==6&&!(s.floats[2]&&!s.floats[1]);
  const bool box=(valid&24)==24&&!(s.floats[4]&&!s.floats[3]);
  const bool expected=id==1?((valid&1)&&well&&s.floats[0]&&!s.floats[2]):id==2?(well&&box&&s.floats[1]&&!s.floats[4]):(box&&s.floats[3]);
  CHECK(c.pumps[id-1]==expected);CHECK((bits(c)&~(1<<(id-1)))==0);
  mailbox[0]=mask;mailbox[1]=valid;mailbox[2]=id;mailbox[3]=bits(c);mailbox[4]=c.alerts&255;mailbox[5]=c.alerts>>8;
  for(uint8_t i=0;i<3;i++)mailbox[6+i]=c.reasons[i];sampleReady=1;while(sampleReady){};
  report.matrix++;
 }
}
void scenarios(){
 uint32_t now=Config::BOOT_HOLD_MS;Sda::Input s=good(now);
 {Sda::Control c;CHECK(bits(c)==0);c.step(s,now-1);CHECK(bits(c)==0);c.step(s,now);CHECK(c.pumps[2]);report.scenarios++;}
 {Sda::Control c;step(c,s,now);s.soil=30;step(c,s,now+1);CHECK(c.pumps[2]);s.soil=Config::WET;step(c,s,now+2);CHECK(!c.pumps[2]);s.soil=10;step(c,s,now+3);CHECK(!c.pumps[2]);step(c,s,now+2+Config::MIN_OFF_MS[2]);CHECK(c.pumps[2]);report.scenarios++;}
 s=good(now);
 {Sda::Control c;step(c,s,now);step(c,s,now+Config::MAX_CYCLE_MS[2]);CHECK(!c.pumps[2]);CHECK(c.alerts&Sda::TIME_LIMIT);step(c,s,now+Config::MAX_CYCLE_MS[2]+1);CHECK(!c.pumps[2]);report.scenarios++;}
 for(uint8_t sensor=0;sensor<4;sensor++){
  s=good(now);Sda::Control c;c.setMode(Sda::MANUAL,now);c.request(3,true,now);step(c,s,now);CHECK(c.pumps[2]);
  if(sensor==0)s.soilValid=false;if(sensor==1)s.ultraValid=false;if(sensor==2)s.dhtValid=false;if(sensor==3)s.validFloats=7;
  step(c,s,now+1);CHECK(!c.pumps[2]);CHECK(c.alerts&Sda::SENSOR_ERROR);report.scenarios++;
 }
 for(uint8_t id=1;id<=3;id++){
  s=good(now);s.soil=10;Sda::Control c;c.setMode(Sda::MANUAL,now);CHECK(c.request(id,true,now));step(c,s,now);CHECK(c.pumps[id-1]);
  if(id==1)s.floats[0]=false;if(id==2)s.floats[1]=false;if(id==3){s.floats[3]=false;s.boxPercent=0;}
  step(c,s,now+1);CHECK(!c.pumps[id-1]);report.scenarios++;
 }
 {s=good(now);s.soil=50;Sda::Control c;c.setMode(Sda::MANUAL,now);c.request(1,true,now);step(c,s,now);CHECK(c.pumps[0]);step(c,s,now+Config::HEARTBEAT_MS);CHECK(c.mode==Sda::AUTO);CHECK(!c.pumps[0]);CHECK(c.alerts&Sda::LINK_LOST);report.scenarios++;}
 {s=good(now);Sda::Control c;c.setMode(Sda::MANUAL,now);for(uint8_t id=1;id<=3;id++)c.request(id,true,now);step(c,s,now);CHECK(bits(c)==1);c.request(1,false,now+1);step(c,s,now+1);CHECK(bits(c)==0);step(c,s,now+Config::START_GAP_MS-1);CHECK(bits(c)==0);step(c,s,now+Config::START_GAP_MS);CHECK(bits(c)==2);CHECK(Config::MAX_SIMULTANEOUS==1);report.scenarios++;}
 {s=good(now);Sda::Control c;c.setMode(Sda::MANUAL,now);c.request(1,true,now);s.dhtAt=now-Config::DHT_STALE_MS-1;c.step(s,now);CHECK(bits(c)==0);CHECK(c.alerts&Sda::SENSOR_ERROR);report.scenarios++;}
 {s=good(now);Sda::Control c;c.setMode(Sda::MANUAL,now);c.request(2,true,now);s.boxPercent=100;s.floats[3]=false;c.step(s,now);CHECK(bits(c)==0);CHECK(c.alerts&Sda::SENSOR_ERROR);report.scenarios++;}
 {s=good(now);Sda::Control c;CHECK(!c.request(3,true,now));CHECK(!c.thresholds(40,25));CHECK(!c.thresholds(10,101));CHECK(c.thresholds(99,100));report.scenarios++;}
 {const uint32_t boot=0xfffff000UL;Sda::Control c(boot);s=good(boot+Config::BOOT_HOLD_MS);c.step(s,boot+Config::BOOT_HOLD_MS);CHECK(c.pumps[2]);step(c,s,boot+Config::BOOT_HOLD_MS+Config::MAX_CYCLE_MS[2]);CHECK(!c.pumps[2]);report.scenarios++;}
 {Sda::Debounced f;f.sample(true,0);CHECK(!f.valid);f.sample(false,20);f.sample(true,40);f.sample(true,40+Config::DEBOUNCE_MS-1);CHECK(!f.valid);f.sample(true,40+Config::DEBOUNCE_MS);CHECK(f.valid&&f.value);report.scenarios++;}
 {Sda::Median m;m.add(600,0);m.add(650,1);CHECK(!m.valid);m.add(700,2);CHECK(m.valid);CHECK(m.distance()==111);m.add(0,3);CHECK(!m.valid&&m.count==0);m.add(600,4);CHECK(!m.valid);m.add(Config::ULTRA_TIMEOUT_US+1,5);CHECK(!m.valid);report.scenarios++;}
 {uint8_t out=0;CHECK(Sda::soilPercent(800,800,300,out)&&out==0);CHECK(Sda::soilPercent(300,800,300,out)&&out==100);CHECK(!Sda::soilPercent(0,800,300,out));CHECK(!Sda::soilPercent(1023,800,300,out));CHECK(!Sda::soilPercent(500,300,800,out));report.scenarios++;}
}
void allTimers(){
 for(uint8_t id=1;id<=3;id++){
  uint32_t now=Config::BOOT_HOLD_MS;Sda::Input s=good(now);Sda::Control c;c.setMode(Sda::MANUAL,now);c.request(id,true,now);step(c,s,now);CHECK(c.pumps[id-1]);
  c.heartbeat(now+Config::MAX_CYCLE_MS[id-1]-1);step(c,s,now+Config::MAX_CYCLE_MS[id-1]-1);CHECK(c.pumps[id-1]);
  step(c,s,now+Config::MAX_CYCLE_MS[id-1]);CHECK(!c.pumps[id-1]);CHECK(c.alerts&Sda::TIME_LIMIT);
  now+=Config::MAX_CYCLE_MS[id-1];c.request(id,true,now+1);step(c,s,now+1);CHECK(!c.pumps[id-1]);
  c.heartbeat(now+Config::MIN_OFF_MS[id-1]);step(c,s,now+Config::MIN_OFF_MS[id-1]);CHECK(c.pumps[id-1]);report.scenarios++;
 }
 // Enchimento mantém demanda depois da mínima e cessa na máxima.
 {uint32_t now=Config::BOOT_HOLD_MS;Sda::Input s=good(now);s.soil=80;s.floats[1]=false;Sda::Control c;step(c,s,now);CHECK(c.pumps[0]);s.floats[1]=true;step(c,s,now+1);CHECK(c.pumps[0]);s.floats[2]=true;step(c,s,now+2);CHECK(!c.pumps[0]);report.scenarios++;}
 {uint32_t now=Config::BOOT_HOLD_MS;Sda::Input s=good(now);s.soil=80;s.floats[3]=false;s.boxPercent=0;Sda::Control c;step(c,s,now);CHECK(c.pumps[1]);s.floats[3]=true;s.boxPercent=50;step(c,s,now+1);CHECK(c.pumps[1]);s.floats[4]=true;s.boxPercent=100;step(c,s,now+2);CHECK(!c.pumps[1]);report.scenarios++;}
}

void protocol(){
 char buffer[192];Wire::Command command;
 CHECK(Wire::frame(buffer,sizeof(buffer),1,"{\"cmd\":\"pump\",\"id\":3,\"on\":true,\"ms\":4000}"));buffer[strlen(buffer)-1]=0;
 CHECK(Wire::parse(buffer,command));CHECK(command.seq==1&&command.id==3&&command.on&&command.duration==4000);
 buffer[10]='2';CHECK(!Wire::parse(buffer,command));
 const char* invalid[]={"{\"cmd\":\"pump\",\"id\":3,\"on\":true,\"on\":false}","{\"cmd\":\"pump\",\"id\":4,\"on\":true}","{\"cmd\":\"heartbeat\",\"mode\":\"AUTO\"}","{\"cmd\":\"setMode\",\"mode\":\"X\"}","{\"cmd\":\"calibrate\",\"dry\":1024,\"wet\":300}"};
 for(uint8_t i=0;i<5;i++){CHECK(Wire::frame(buffer,sizeof(buffer),2,invalid[i]));buffer[strlen(buffer)-1]=0;CHECK(!Wire::parse(buffer,command));}
 CHECK(!Wire::frame(buffer,10,1,"{\"cmd\":\"heartbeat\"}"));report.scenarios++;
}
int main(){matrix();scenarios();allTimers();protocol();report.done=1;for(;;){};}
