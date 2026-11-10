const {once}=require('node:events');
function period(query,{pagination=true}={}){
 const parse=(value,fallback)=>{if(value===undefined)return fallback;if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(value)||!Number.isFinite(Date.parse(value)))throw Object.assign(new Error('Use datas ISO com fuso, por exemplo 2026-11-10T00:00:00-03:00.'),{status:400});return new Date(value);};
 const to=parse(query.ate,new Date()),from=parse(query.de,new Date(to-86400000));
 if(from>to||to-from>31*86400000)throw Object.assign(new Error('Período inválido: máximo 31 dias por consulta.'),{status:400});
 const result={from,to};
 if(pagination){for(const [key,fallback,max] of [['limit',100,1000],['offset',0,1000000]]){const raw=query[key]??fallback;if(!/^\d+$/.test(String(raw))||Number(raw)>max||(key==='limit'&&Number(raw)<1))throw Object.assign(new Error('Paginação inválida.'),{status:400});result[key]=Number(raw);}}
 return result;
}
function csvCell(value){if(value===null||value===undefined)return '';return '"'+String(value).replaceAll('"','""')+'"';}
function readingCsv(row){return [new Date(row.data_hora).toISOString(),row.solo,row.temperatura,row.umidade_ar,row.nivel_rio,row.nivel_poco,row.nivel_caixa,...row.bombas.map(p=>p===null?null:p?1:0),row.simulado?'SIMULACAO':'HARDWARE',row.modo].map(csvCell).join(',')+'\r\n';}
function monitoringController({store,device,weather}){return {
 current:(req,res)=>res.json(device.snapshot()),
 history:async(req,res)=>{const filter=period(req.query);const readings=await store.history(filter);res.json({leituras:readings,limit:filter.limit,offset:filter.offset,nextOffset:readings.length===filter.limit?filter.offset+filter.limit:null});},
 csv:async(req,res)=>{
  const filter=period(req.query,{pagination:false});res.set({'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="SDA_historico.csv"'});
  res.write('data_hora,solo,temperatura,umidade_ar,nivel_rio,nivel_poco,nivel_caixa,bomba_1,bomba_2,bomba_3,fonte,modo\r\n');
  for await(const row of store.exportReadings(filter)){if(res.destroyed)return;if(!res.write(readingCsv(row)))await Promise.race([once(res,'drain'),once(res,'close')]);}
  res.end();
 },
 events:async(req,res)=>res.json({eventos:await store.listEvents(period(req.query))}),
 actions:async(req,res)=>res.json({acionamentos:await store.listActions({...period(req.query),userId:req.user.nivel==='master'?null:req.user.id}),estimativa:true,rotulo:'ESTIMATIVA — não é medição de água'}),
 settings:(req,res)=>res.json(device.settings.get()),
 saveSettings:async(req,res)=>{const saved=device.settings.save(req.body.vazoes_l_min);await device.event('calibracao_vazao','info','Vazões por bomba atualizadas; consumo permanece ESTIMATIVA.');res.json(saved);},
 weather:async(req,res)=>res.json(await weather.get()),
 simulation:(req,res)=>res.json(device.simulationControl(req.body)),
 pump:async(req,res)=>res.json({sucesso:true,ack:await device.pumpId(Number(req.params.id),req.body.on,req.body.ms??0,{userId:req.user.id})}),
 irrigate:async(req,res)=>res.json({sucesso:true,ack:await device.pump(req.body.minutos,{userId:req.user.id})}),
 stop:async(req,res)=>res.json({sucesso:true,ack:await device.stop()}),
 mode:async(req,res)=>{if(!['AUTO','MANUAL'].includes(req.body.mode))throw Object.assign(new Error('Modo inválido.'),{status:400});res.json({sucesso:true,ack:await device.command({cmd:'setMode',mode:req.body.mode})});},
 thresholds:async(req,res)=>{const {dry,wet}=req.body;if(!Number.isInteger(dry)||!Number.isInteger(wet)||dry<1||dry>=wet||wet>100)throw Object.assign(new Error('Limiares inválidos.'),{status:400});res.json({sucesso:true,ack:await device.command({cmd:'setThresholds',dry,wet})});},
 calibrate:async(req,res)=>{const {dry,wet}=req.body;if(!Number.isInteger(dry)||!Number.isInteger(wet)||wet<0||dry>1023||dry<=wet+50)throw Object.assign(new Error('Calibração inválida.'),{status:400});res.json({sucesso:true,ack:await device.command({cmd:'calibrate',dry,wet})});}
};}
module.exports={monitoringController,period,readingCsv};
