class WeatherService{
 constructor(cfg,{fetcher=fetch,clock=Date.now}={}){this.cfg=cfg;this.fetcher=fetcher;this.clock=clock;this.cached=null;this.at=0;this.pending=null;this.failedAt=null;}
 result(offline,source,data=this.cached){return {offline,source,data,updatedAt:this.at?new Date(this.at).toISOString():null,cached:source==='cache',message:offline?'Clima offline; irrigação mantém as travas locais.':'Clima atualizado via backend.'};}
 async get(){
  if(this.cfg.weatherOffline)return this.result(true,this.cached?'cache':'indisponivel');
  if(this.cached&&this.clock()-this.at<this.cfg.weatherCacheMs)return this.result(false,'cache');
  if(this.failedAt!==null&&this.clock()-this.failedAt<Math.min(this.cfg.weatherCacheMs,30000))return this.result(true,this.cached?'cache':'indisponivel');
  if(this.pending)return this.pending;
  this.pending=Promise.resolve().then(async()=>{
   try{
    const openWeather=!!this.cfg.weatherKey;
    const url=openWeather?'https://api.openweathermap.org/data/2.5/weather?q=Aracaju,BR&units=metric&lang=pt_br&appid='+encodeURIComponent(this.cfg.weatherKey):'https://api.open-meteo.com/v1/forecast?latitude=-10.9111&longitude=-37.0717&current_weather=true';
    const response=await this.fetcher(url,{signal:AbortSignal.timeout(this.cfg.weatherTimeoutMs)});if(!response.ok)throw new Error('Indisponível');const raw=await response.json();
    const temperature=openWeather?raw.main?.temp:raw.current_weather?.temperature,code=openWeather?raw.weather?.[0]?.id:raw.current_weather?.weathercode;
    if(typeof temperature!=='number'||!Number.isFinite(temperature)||typeof code!=='number')throw new Error('Resposta inválida');
    const rainy=openWeather?code>=200&&code<700:[51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99].includes(code);
    this.cached={temperature,code,rainy,city:'Aracaju',provider:openWeather?'OpenWeather':'Open-Meteo'};this.at=this.clock();this.failedAt=null;return this.result(false,'provedor');
   }catch{this.failedAt=this.clock();return this.result(true,this.cached?'cache':'indisponivel');}

  });try{return await this.pending;}finally{this.pending=null;}
 }
}
module.exports={WeatherService};
