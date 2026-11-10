#pragma once
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#ifdef __AVR__
#include <avr/pgmspace.h>
#define SD_PRINTF(out,size,format,...) snprintf_P(out,size,PSTR(format),__VA_ARGS__)
#define SD_CMP(value,text) strcmp_P(value,PSTR(text))
#define SD_LITERAL(text) PSTR(text)
#define SD_LEN(text) strlen_P(text)
#define SD_NCMP(value,text,n) strncmp_P(value,text,n)
#else
#define SD_PRINTF(out,size,format,...) snprintf(out,size,format,__VA_ARGS__)
#define SD_CMP(value,text) strcmp(value,text)
#define SD_LITERAL(text) text
#define SD_LEN(text) strlen(text)
#define SD_NCMP(value,text,n) strncmp(value,text,n)
#endif
namespace Wire {
// Protocolo fechado, sem heap: envelope e comandos têm ordem/formato documentados.
inline uint16_t checksum(uint32_t seq,const char* data,size_t length){
 char number[11];SD_PRINTF(number,sizeof(number),"%lu",(unsigned long)seq);
 uint16_t sum='1'+'|'+'|';for(const char* p=number;*p;p++)sum+=uint8_t(*p);
 for(size_t i=0;i<length;i++)sum+=uint8_t(data[i]);return sum;
}
inline bool frame(char* out,size_t size,uint32_t seq,const char* data){
 const size_t length=strlen(data);const uint16_t sum=checksum(seq,data,length);
 char prefix[44];const int n=SD_PRINTF(prefix,sizeof(prefix),"{\"v\":1,\"seq\":%lu,\"data\":",(unsigned long)seq);
 if(n<=0||size_t(n)>=sizeof(prefix)||size_t(n)+length+24>=size)return false;
 memmove(out+n,data,length);memcpy(out,prefix,n);
 const int tail=SD_PRINTF(out+n+length,size-n-length,",\"checksum\":%u}\n",sum);
 return tail>0&&size_t(tail)<size-n-length;
}
struct Cursor {
 const char* p;explicit Cursor(const char* value):p(value){}
 bool literal(const char* text){size_t n=SD_LEN(text);if(SD_NCMP(p,text,n))return false;p+=n;return true;}
 bool number(uint32_t &n){n=0;if(*p<'0'||*p>'9')return false;bool zero=*p=='0';const char* start=p;while(*p>='0'&&*p<='9'){uint8_t d=*p++-'0';if(n>429496729UL||(n==429496729UL&&d>5))return false;n=n*10+d;}return !zero||p-start==1;}
 bool text(char* out,uint8_t size){if(*p++!='"')return false;uint8_t n=0;while(*p&&*p!='"'){if(n+1>=size||*p<' '||*p=='\\')return false;out[n++]=*p++;}if(*p++!='"')return false;out[n]=0;return true;}
};
enum CommandType:uint8_t {HEARTBEAT,SET_MODE,PUMP,THRESHOLDS,CALIBRATE};
struct Command {CommandType type=HEARTBEAT;uint32_t seq=0,duration=0;uint16_t dry=0,wet=0;uint8_t id=0;bool on=false,manual=false;};
inline bool parse(const char* line,Command &out){
 Cursor c(line);uint32_t v,seq,sum;
 if(!c.literal(SD_LITERAL("{\"v\":"))||!c.number(v)||v!=1||!c.literal(SD_LITERAL(",\"seq\":"))||!c.number(seq)||!c.literal(SD_LITERAL(",\"data\":")))return false;
 const char* begin=c.p;const char* end=strchr(begin,'}');if(!end||begin[0]!='{')return false;
 c.p=end+1;if(!c.literal(SD_LITERAL(",\"checksum\":"))||!c.number(sum)||sum>65535||!c.literal(SD_LITERAL("}"))||*c.p)return false;
 if(checksum(seq,begin,end+1-begin)!=sum)return false;
 Cursor d(begin);char key[12],command[16],mode[8];uint16_t seen=0;
 if(!d.literal(SD_LITERAL("{")))return false;Command result;result.seq=seq;
 while(d.p<end){
  if(!d.text(key,sizeof(key))||!d.literal(SD_LITERAL(":")))return false;
  uint16_t bit=0;uint32_t number=0;
  if(!SD_CMP(key,"cmd")){bit=1;if(!d.text(command,sizeof(command)))return false;}
  else if(!SD_CMP(key,"mode")){bit=2;if(!d.text(mode,sizeof(mode)))return false;if(SD_CMP(mode,"AUTO")&&SD_CMP(mode,"MANUAL"))return false;result.manual=!SD_CMP(mode,"MANUAL");}
  else if(!SD_CMP(key,"id")){bit=4;if(!d.number(number)||number<1||number>3)return false;result.id=number;}
  else if(!SD_CMP(key,"on")){bit=8;if(d.literal(SD_LITERAL("true")))result.on=true;else if(d.literal(SD_LITERAL("false")))result.on=false;else return false;}
  else if(!SD_CMP(key,"ms")){bit=16;if(!d.number(result.duration))return false;}
  else if(!SD_CMP(key,"dry")){bit=32;if(!d.number(number)||number>1023)return false;result.dry=number;}
  else if(!SD_CMP(key,"wet")){bit=64;if(!d.number(number)||number>1023)return false;result.wet=number;}
  else return false;
  if(seen&bit)return false;seen|=bit;
  if(d.p==end)break;if(!d.literal(SD_LITERAL(","))||d.p==end)return false;
 }
 if(!(seen&1)||d.p!=end)return false;
 if(!SD_CMP(command,"heartbeat")&&seen==1)result.type=HEARTBEAT;
 else if(!SD_CMP(command,"setMode")&&seen==3)result.type=SET_MODE;
 else if(!SD_CMP(command,"pump")&&(seen==13||seen==29))result.type=PUMP;
 else if(!SD_CMP(command,"setThresholds")&&seen==97)result.type=THRESHOLDS;
 else if(!SD_CMP(command,"calibrate")&&seen==97)result.type=CALIBRATE;
 else return false;
 out=result;return true;
}
}
