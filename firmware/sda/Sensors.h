#pragma once
#include "Control.h"
namespace Sda {
struct Debounced {
 bool value=false,valid=false,last=false,initialized=false;uint32_t changed=0,confirmed=0;
 void sample(bool raw,uint32_t now){
  if(!initialized||raw!=last){initialized=true;last=raw;changed=now;}
  if(elapsed(now,changed)>=Config::DEBOUNCE_MS){value=raw;valid=true;confirmed=now;}
  if(valid&&elapsed(now,confirmed)>Config::FLOAT_STALE_MS)valid=false;
 }
};
struct Median {
 uint16_t values[Config::ULTRA_SAMPLES]={0};uint8_t count=0,index=0;uint32_t at=0;bool valid=false;
 void invalid(){count=0;index=0;valid=false;}
 void add(uint32_t pulse,uint32_t now){
  const uint32_t mm=pulse*343UL/2000UL;
  if(pulse<100||pulse>Config::ULTRA_TIMEOUT_US||mm<Config::BOX_FULL_MM||mm>Config::BOX_EMPTY_MM){invalid();return;}
  values[index]=uint16_t(mm);index=(index+1)%Config::ULTRA_SAMPLES;if(count<Config::ULTRA_SAMPLES)count++;at=now;valid=count>=Config::ULTRA_MIN_SAMPLES;
 }
 uint16_t distance()const{
  uint16_t sorted[Config::ULTRA_SAMPLES];for(uint8_t i=0;i<count;i++)sorted[i]=values[i];
  for(uint8_t i=1;i<count;i++){uint16_t v=sorted[i];int8_t j=i-1;while(j>=0&&sorted[j]>v){sorted[j+1]=sorted[j];j--;}sorted[j+1]=v;}
  return count?sorted[count/2]:0;
 }
 uint8_t percent()const{return uint8_t((Config::BOX_EMPTY_MM-distance())*100UL/(Config::BOX_EMPTY_MM-Config::BOX_FULL_MM));}
};
inline bool soilPercent(uint16_t raw,uint16_t dry,uint16_t wet,uint8_t &out){
 if(raw<Config::SOIL_RAW_MIN||raw>Config::SOIL_RAW_MAX||dry>1023||wet>1023||dry<=wet+50)return false;
 int32_t result=(int32_t(dry)-raw)*100L/(dry-wet);out=result<0?0:result>100?100:uint8_t(result);return true;
}
}
