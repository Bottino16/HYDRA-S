#include "Control.h"
struct Report {uint32_t checks;uint16_t failures;uint8_t done;uint16_t matrix;uint16_t scenarios;uint16_t first;};
extern "C" {volatile Report report={};volatile uint8_t mailbox[9]={};volatile uint8_t sampleReady=0;}
#define CHECK(value) do{report.checks++;if(!(value)){report.failures++;if(!report.first)report.first=__LINE__;}}while(0)
int main(){
 Sda::Control c;Sda::Input s;s.validFloats=31;s.floats[0]=s.floats[1]=s.floats[3]=true;s.soil=10;s.boxPercent=50;s.soilValid=s.ultraValid=s.dhtValid=true;
 uint32_t now=Config::BOOT_HOLD_MS;c.setMode(Sda::MANUAL,now);for(uint8_t id=1;id<=3;id++)c.request(id,true,now);
 s.floatAt=s.soilAt=s.ultraAt=s.dhtAt=now;c.step(s,now);CHECK(c.pumps[0]&&!c.pumps[1]&&!c.pumps[2]);
 now++;s.floatAt=s.soilAt=s.ultraAt=s.dhtAt=now;c.step(s,now);CHECK(c.pumps[0]&&!c.pumps[1]);
 now=Config::BOOT_HOLD_MS+Config::START_GAP_MS;s.floatAt=s.soilAt=s.ultraAt=s.dhtAt=now;c.step(s,now);CHECK(c.pumps[0]&&c.pumps[1]&&!c.pumps[2]);
 now+=Config::START_GAP_MS;s.floatAt=s.soilAt=s.ultraAt=s.dhtAt=now;c.step(s,now);CHECK(c.pumps[0]&&c.pumps[1]&&!c.pumps[2]);
 c.request(1,false,now);s.floatAt=s.soilAt=s.ultraAt=s.dhtAt=now;c.step(s,now);CHECK(!c.pumps[0]&&c.pumps[1]&&c.pumps[2]);
 CHECK(Config::MAX_SIMULTANEOUS==2);report.scenarios=1;report.done=1;for(;;){};
}
