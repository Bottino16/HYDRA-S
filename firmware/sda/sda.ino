#include "Config.h" // Pinos, polaridades, geometria e limites ficam neste arquivo.
#include "Control.h"
#include "Sensors.h"
#include "Protocol.h"
#include <avr/interrupt.h>
#include <avr/wdt.h>
#include <util/atomic.h>

// Desarma watchdog herdado de reset antes de inicializar RAM e periféricos.
void disableInheritedWatchdog() __attribute__((naked,section(".init3")));
void disableInheritedWatchdog(){MCUSR=0;wdt_disable();}
static_assert(Config::DHT_PIN==11&&Config::ECHO_PIN==15&&Config::TRIG_PIN==16&&Config::SOIL_PIN==14,"Driver de interrupção/ADC específico do UNO: conferir mapeamento");
Sda::Control control;
Sda::Input sensors;
Sda::Debounced floats[5];
Sda::Median ultrasonic;
uint16_t soilDry=Config::SOIL_DRY_RAW,soilWet=Config::SOIL_WET_RAW;
bool adcPending=false,soilRawAvailable=false;uint16_t soilRaw=0;
uint16_t soilReadings[Config::SOIL_SAMPLES]={0};uint8_t soilIndex=0,soilCount=0;
int16_t temperature10=0;uint16_t air10=0;
uint32_t soilAt=0,dhtAt=0,ultraAt=0,telemetryAt=0,seq=0,lastCommand=0;
bool seenCommand=false;
char rx[Config::RX_SIZE],tx[Config::TX_SIZE];uint16_t rxLength=0,txLength=0,txAt=0;
bool rxReady=false,rxOverflow=false;
// DHT: PCINT3/porto B. ECHO digital A1: PCINT9/porto C, específico do UNO R3.
volatile uint8_t oldPortC=0,oldPortB=0,dhtPhase=0,dhtBits=0,dhtBytes[5]={0};
volatile uint32_t echoRise=0,echoPulse=0,dhtEdge=0;
volatile bool echoReady=false,dhtDone=false;
uint8_t triggerPhase=0;uint32_t triggerAt=0,echoRequestedAt=0,dhtStartedAt=0;
bool waitingEcho=false,dhtStarting=false;

ISR(PCINT1_vect){
 const uint8_t port=PINC,changed=port^oldPortC;oldPortC=port;
 if(changed&_BV(PC1)){
  const uint32_t now=micros();
  if(port&_BV(PC1))echoRise=now;
  else {echoPulse=now-echoRise;echoReady=true;}
 }
}
ISR(PCINT0_vect){
 const uint8_t port=PINB,changed=port^oldPortB;oldPortB=port;const uint32_t now=micros();
 if((changed&_BV(PB3))&&dhtPhase){
  const bool high=port&_BV(PB3);const uint32_t duration=now-dhtEdge;dhtEdge=now;
  if(dhtPhase==1&&!high)dhtPhase=2;
  else if(dhtPhase==2&&high)dhtPhase=3;
  else if(dhtPhase==3&&!high)dhtPhase=4;
  else if(dhtPhase==4&&high)dhtPhase=5;
  else if(dhtPhase==5&&!high){
   if(duration<15||duration>100){dhtPhase=0;return;}
   const uint8_t index=dhtBits/8;dhtBytes[index]=(dhtBytes[index]<<1)|(duration>48?1:0);dhtBits++;
   if(dhtBits==40){dhtDone=true;dhtPhase=0;}else dhtPhase=4;
  }
 }
}
void applyRelays(){
 // Primeiro desliga saídas; depois liga as autorizadas pela máquina de estados.
 for(uint8_t i=0;i<3;i++)if(!control.pumps[i])digitalWrite(Config::RELAY_PINS[i],Config::RELAY_OFF);
 for(uint8_t i=0;i<3;i++)if(control.pumps[i])digitalWrite(Config::RELAY_PINS[i],Config::RELAY_ON);
}
void queue(const char* data){if(Wire::frame(tx,sizeof(tx),seq++,data)){txLength=strlen(tx);txAt=0;}}
void flushTx(){if(txAt<txLength){int available=Serial.availableForWrite();uint16_t n=txLength-txAt;if(n>16)n=16;if(n>available)n=available;if(n)txAt+=Serial.write((const uint8_t*)tx+txAt,n);}}
void updateFloats(uint32_t now){
 sensors.validFloats=0;
 for(uint8_t i=0;i<5;i++){floats[i].sample(digitalRead(Config::FLOAT_PINS[i])==Config::FLOAT_ACTIVE_LEVEL[i],now);sensors.floats[i]=floats[i].value;if(floats[i].valid)sensors.validFloats|=1<<i;}
 sensors.floatAt=now;
}
void updateSoil(uint32_t now){
 if(!adcPending){if(Sda::elapsed(now,soilAt)<Config::SOIL_SAMPLE_MS)return;soilAt=now;ADCSRA|=_BV(ADSC);adcPending=true;return;}
 if(ADCSRA&_BV(ADSC))return;
 const uint16_t raw=ADC;adcPending=false;soilRaw=raw;soilRawAvailable=true;
 if(raw<Config::SOIL_RAW_MIN||raw>Config::SOIL_RAW_MAX){soilCount=0;soilIndex=0;sensors.soilValid=false;return;}
 soilReadings[soilIndex]=raw;soilIndex=(soilIndex+1)%Config::SOIL_SAMPLES;if(soilCount<Config::SOIL_SAMPLES)soilCount++;
 uint16_t sum=0;for(uint8_t i=0;i<soilCount;i++)sum+=soilReadings[i];
 soilRaw=sum/soilCount;
 sensors.soilValid=soilCount==Config::SOIL_SAMPLES&&Sda::soilPercent(soilRaw,soilDry,soilWet,sensors.soil);sensors.soilAt=now;
}
void updateDht(uint32_t now,uint32_t us){
 if(!dhtStarting&&!dhtPhase&&Sda::elapsed(now,dhtAt)>=Config::DHT_SAMPLE_MS){
  dhtAt=now;dhtStarting=true;dhtStartedAt=us;digitalWrite(Config::DHT_PIN,LOW);pinMode(Config::DHT_PIN,OUTPUT);
 }
 if(dhtStarting&&Sda::elapsed(us,dhtStartedAt)>=18000){
  ATOMIC_BLOCK(ATOMIC_RESTORESTATE){dhtBits=0;for(uint8_t i=0;i<5;i++)dhtBytes[i]=0;dhtDone=false;oldPortB=PINB;dhtEdge=us;dhtPhase=1;}
  pinMode(Config::DHT_PIN,INPUT_PULLUP);dhtStarting=false;
 }
 bool done;uint8_t values[5];uint32_t edge;
 ATOMIC_BLOCK(ATOMIC_RESTORESTATE){done=dhtDone;edge=dhtEdge;if(done){for(uint8_t i=0;i<5;i++)values[i]=dhtBytes[i];dhtDone=false;}}
 if(done){
  const bool valid=uint8_t(values[0]+values[1]+values[2]+values[3])==values[4]&&values[0]<=100&&values[1]<=9&&values[2]<=60&&values[3]<=9;
  sensors.dhtValid=valid;
  if(valid){temperature10=values[2]*10+values[3];air10=values[0]*10+values[1];sensors.dhtAt=now;}
 }
 // A interrupção pode atualizar a borda depois do micros() capturado pelo loop.
 if(dhtPhase&&int32_t(us-edge)>150){ATOMIC_BLOCK(ATOMIC_RESTORESTATE){dhtPhase=0;}sensors.dhtValid=false;}
 if(sensors.dhtValid&&Sda::elapsed(now,sensors.dhtAt)>Config::DHT_STALE_MS)sensors.dhtValid=false;
}
void updateUltrasonic(uint32_t now,uint32_t us){
 if(!triggerPhase&&!waitingEcho&&Sda::elapsed(now,ultraAt)>=Config::ULTRA_SAMPLE_MS){ultraAt=now;digitalWrite(Config::TRIG_PIN,LOW);triggerPhase=1;triggerAt=us;}
 if(triggerPhase==1&&Sda::elapsed(us,triggerAt)>=2){digitalWrite(Config::TRIG_PIN,HIGH);triggerPhase=2;triggerAt=us;}
 else if(triggerPhase==2&&Sda::elapsed(us,triggerAt)>=10){
  ATOMIC_BLOCK(ATOMIC_RESTORESTATE){echoReady=false;}
  digitalWrite(Config::TRIG_PIN,LOW);triggerPhase=0;waitingEcho=true;echoRequestedAt=us;
 }
 bool ready;uint32_t pulse;
 ATOMIC_BLOCK(ATOMIC_RESTORESTATE){ready=echoReady;pulse=echoPulse;if(ready)echoReady=false;}
 if(waitingEcho&&ready){waitingEcho=false;ultrasonic.add(pulse,now);sensors.ultraValid=ultrasonic.valid;if(ultrasonic.valid){sensors.boxPercent=ultrasonic.percent();sensors.ultraAt=now;}}
 if(waitingEcho&&Sda::elapsed(us,echoRequestedAt)>Config::ULTRA_TIMEOUT_US){waitingEcho=false;ultrasonic.invalid();sensors.ultraValid=false;}
 if(sensors.ultraValid&&Sda::elapsed(now,sensors.ultraAt)>Config::ULTRA_STALE_MS)sensors.ultraValid=false;
}
void buzzer(uint32_t now){
 uint8_t pulses=0;
 if(control.alerts&Sda::SENSOR_ERROR)pulses=4;
 else if(control.alerts&(Sda::BLOCKED|Sda::TIME_LIMIT))pulses=5;
 else if(control.alerts&Sda::RIVER_DRY)pulses=1;
 else if(control.alerts&Sda::WELL_LOW)pulses=2;
 else if(control.alerts&Sda::BOX_LOW)pulses=3;
 const uint16_t phase=now%3000;
 const bool sound=pulses&&phase<pulses*240&&phase%240<100;
 if(Config::BUZZER_ACTIVE)digitalWrite(Config::BUZZER_PIN,sound?HIGH:LOW);
 else {static bool previous=false;if(previous!=sound){if(sound)tone(Config::BUZZER_PIN,Config::BUZZER_HZ);else noTone(Config::BUZZER_PIN);previous=sound;}}
}
void acknowledge(uint32_t command,bool ok,uint8_t code){
 char* data=tx+44;SD_PRINTF(data,sizeof(tx)-44,"{\"type\":\"ack\",\"cmd\":%lu,\"ok\":%s,\"code\":%u,\"pumps\":[%s,%s,%s],\"modo\":\"%s\"}",(unsigned long)command,ok?"true":"false",code,control.pumps[0]?"true":"false",control.pumps[1]?"true":"false",control.pumps[2]?"true":"false",control.mode==Sda::AUTO?"AUTO":"MANUAL");queue(data);
}
void commandLine(uint32_t now){
 Wire::Command cmd;
 bool legacy=rxLength==1&&(rx[0]=='L'||rx[0]=='D'||rx[0]=='R');
 if(legacy){control.setMode(Sda::MANUAL,now);cmd.type=Wire::PUMP;cmd.id=3;cmd.on=rx[0]!='D';cmd.duration=rx[0]=='R'?4000:0;}
 else if(rxOverflow||!Wire::parse(rx,cmd)){acknowledge(0,false,11);return;}
 if(!legacy&&seenCommand&&int32_t(cmd.seq-lastCommand)<=0){acknowledge(cmd.seq,false,10);return;}
 if(!legacy){lastCommand=cmd.seq;seenCommand=true;}
 bool ok=true;uint8_t code=0;
 if(cmd.type==Wire::HEARTBEAT)control.heartbeat(now);
 else if(cmd.type==Wire::SET_MODE)control.setMode(cmd.manual?Sda::MANUAL:Sda::AUTO,now);
 else if(cmd.type==Wire::THRESHOLDS)ok=cmd.dry<=99&&cmd.wet<=100&&control.thresholds(cmd.dry,cmd.wet);
 else if(cmd.type==Wire::CALIBRATE){
  ok=control.mode==Sda::MANUAL&&!control.pumps[0]&&!control.pumps[1]&&!control.pumps[2]&&cmd.dry<=1023&&cmd.wet<=1023&&cmd.dry>cmd.wet+50;
  if(ok){soilDry=cmd.dry;soilWet=cmd.wet;soilCount=0;soilIndex=0;sensors.soilValid=false;}
 }else if(cmd.type==Wire::PUMP)ok=control.request(cmd.id,cmd.on,now,cmd.duration);
 if(ok)control.heartbeat(now);
 control.step(sensors,now);
 if(ok&&cmd.type==Wire::PUMP&&cmd.on){
  code=control.reasons[cmd.id-1];
  if(code!=Sda::OK&&code!=Sda::CAPACITY&&code!=Sda::START_GAP){control.request(cmd.id,false,now);ok=false;}
 }
 if(!ok&&cmd.type==Wire::PUMP)control.notifyBlocked(now);
 if(!ok&&!code)code=12;
 applyRelays();acknowledge(cmd.seq,ok,code);
}
void readSerial(){
 if(rxReady)return;
 for(uint8_t budget=0;budget<16&&Serial.available();budget++){
  char c=Serial.read();
  if(c=='\r')continue;
  if(!rxLength&&(c=='L'||c=='D'||c=='R')){rx[0]=c;rx[1]=0;rxLength=1;rxReady=true;break;}
  if(c=='\n'){rx[rxLength]=0;rxReady=true;break;}
  if(rxLength+1<sizeof(rx)&&!rxOverflow)rx[rxLength++]=c;else rxOverflow=true;
 }
}
void telemetry(uint32_t now){
 char* data=tx+44;char soil[5],raw[5],temp[9],air[9],box[5],f[5][6];
 if(soilRawAvailable)snprintf(raw,sizeof(raw),"%u",soilRaw);else strcpy(raw,"null");
 if(sensors.soilValid)snprintf(soil,sizeof(soil),"%u",sensors.soil);else strcpy(soil,"null");
 if(sensors.dhtValid){snprintf(temp,sizeof(temp),"%d.%u",temperature10/10,temperature10%10);snprintf(air,sizeof(air),"%u.%u",air10/10,air10%10);}else {strcpy(temp,"null");strcpy(air,"null");}
 if(sensors.ultraValid)snprintf(box,sizeof(box),"%u",sensors.boxPercent);else strcpy(box,"null");
 for(uint8_t i=0;i<5;i++)strcpy(f[i],!(sensors.validFloats&(1<<i))?"null":sensors.floats[i]?"true":"false");
 SD_PRINTF(data,sizeof(tx)-44,"{\"type\":\"state\",\"solo\":%s,\"solo_bruto\":%s,\"temperatura\":%s,\"umidade_ar\":%s,\"caixa\":%s,\"boias\":[%s,%s,%s,%s,%s],\"pumps\":[%s,%s,%s],\"modo\":\"%s\",\"alertas\":%u}",soil,raw,temp,air,box,f[0],f[1],f[2],f[3],f[4],control.pumps[0]?"true":"false",control.pumps[1]?"true":"false",control.pumps[2]?"true":"false",control.mode==Sda::AUTO?"AUTO":"MANUAL",control.alerts);
 queue(data);telemetryAt=now;
}
void setup(){
 // Define nível inativo ANTES de transformar os pinos em saídas.
 for(uint8_t i=0;i<3;i++){digitalWrite(Config::RELAY_PINS[i],Config::RELAY_OFF);pinMode(Config::RELAY_PINS[i],OUTPUT);}
 for(uint8_t i=0;i<5;i++)pinMode(Config::FLOAT_PINS[i],INPUT_PULLUP);
 digitalWrite(Config::BUZZER_PIN,LOW);pinMode(Config::BUZZER_PIN,OUTPUT);
 digitalWrite(Config::TRIG_PIN,LOW);pinMode(Config::TRIG_PIN,OUTPUT);pinMode(Config::ECHO_PIN,INPUT);pinMode(Config::DHT_PIN,INPUT_PULLUP);
 oldPortB=PINB;oldPortC=PINC;PCMSK0|=_BV(PCINT3);PCMSK1|=_BV(PCINT9);PCICR|=_BV(PCIE0)|_BV(PCIE1);
 ADMUX=_BV(REFS0);ADCSRA=_BV(ADEN)|_BV(ADPS2)|_BV(ADPS1)|_BV(ADPS0);DIDR0|=_BV(ADC0D);
 wdt_enable(Config::WATCHDOG_PRESCALER);
 Serial.begin(Config::BAUD);queue("{\"type\":\"boot\"}");
}
void loop(){
 const uint32_t now=millis(),us=micros();
 updateFloats(now);updateSoil(now);updateDht(now,us);updateUltrasonic(now,us);
 control.step(sensors,now);applyRelays();buzzer(now);
 flushTx();readSerial();
 if(txAt>=txLength&&rxReady){commandLine(now);rxReady=false;rxOverflow=false;rxLength=0;}
 else if(txAt>=txLength&&Sda::elapsed(now,telemetryAt)>=Config::TELEMETRY_MS)telemetry(now);
 wdt_reset();
}
