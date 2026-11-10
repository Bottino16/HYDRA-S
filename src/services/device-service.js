const {DeviceLink}=require('../device-link');
const {SimulatedBoard}=require('../simulated-board');
const {SerialTransport}=require('../serial-transport');
const {limits}=require('../pump-control');
const {Scheduler}=require('./scheduler');
const {SettingsService}=require('./settings');
const {createLogger}=require('../logger');
function createDeviceService(io,store,cfg,options={}){
 const logger=options.logger||createLogger();
 const settings=options.settings||new SettingsService({file:cfg.settingsFile,flows:cfg.flows});
 let transport,history=[],lastSaved=0,lastAlert=null,lastConnectivity=null,thresholds='',generation=0;
 let heartbeatBusy=false,housekeepingBusy=false,closed=false,paused=false;
 let previous=[null,null,null],active=[null,null,null],contexts=[null,null,null];
 let operations=store.recoverActions(),controls=Promise.resolve();
 const link=new DeviceLink(line=>transport.write(line),{staleMs:cfg.dataStaleMs||5000});
 const ready=operations;
 async function event(tipo,severidade,mensagem){
  const row=await store.event({tipo,severidade,mensagem,simulado:cfg.simulate});
  io.emit('evento',row);if(severidade==='erro')logger.error(tipo);return row;
 }
 const source=()=>cfg.simulate?'SIMULAÇÃO':'HARDWARE';
 function snapshot(){return {...link.snapshot(),simulate:cfg.simulate,source:source(),limites:limits,dataStaleMs:link.staleMs};}
 function queueOperation(fn){operations=operations.then(fn).catch(()=>{logger.error('persistencia_operacional');});return operations;}
 async function transitions(state){
  if(!state.connected){
   for(let i=0;i<3;i++){
    if(active[i])await store.finishAction(active[i],{status:'incerta',reason:'Sem confirmação recente; término físico desconhecido.'});
    else if(contexts[i]?.reservation)await store.finishAction(contexts[i].reservation,{status:'incerta',reason:'Conexão perdida com pedido em fila.'});
   }
   active=[null,null,null];contexts=[null,null,null];previous=[null,null,null];return;
  }
  for(let i=0;i<3;i++){
   if(state.pumps[i]&&previous[i]!==true){const ctx=contexts[i]||{};
    active[i]=await store.startAction({bomba:i+1,origem:ctx.origin||'auto',userId:ctx.userId??null,profileId:ctx.profileId??null,reservation:ctx.reservation??null,simulate:cfg.simulate,flow:settings.get().vazoes_l_min[i]});
    await event('bomba_ligada','info','Saída da bomba '+(i+1)+' confirmada pelo controlador.');
   }else if(!state.pumps[i]&&previous[i]===true){
    if(active[i])await store.finishAction(active[i]);active[i]=null;contexts[i]=null;
    await event('bomba_desligada','info','Saída da bomba '+(i+1)+' desligada; volume permanece ESTIMATIVA.');
   }
  }
  previous=[...state.pumps];
 }
 function broadcast(){
  const state=snapshot();io.emit('estado_sistema',state);io.emit('status_bomba',state.connected?state.pumps[2]:null);
  if(!state.connected)io.emit('dados_sensores','NaN,NaN,NaN,NaN');
  else io.emit('dados_sensores',`${state.solo===null?'NaN':Math.round(1023-state.solo/100*1023)},${state.caixa===null?'NaN':((100-state.caixa)*11/100).toFixed(2)},${state.temperatura??'NaN'},${state.umidade_ar??'NaN'}`);
  if(state.connected!==lastConnectivity){const was=lastConnectivity;lastConnectivity=state.connected;
   if(was!==null||state.connected)queueOperation(()=>event(state.connected?'controlador_conectado':'controlador_desconectado',state.connected?'info':'aviso',state.connected?source()+' conectada com dados recentes.':(cfg.simulate?'Simulação sem dados recentes.':'Arduino desconectado — sem dados.')));
   if(!state.connected){generation++;queueOperation(()=>transitions(state));}
  }
  if(state.connected){
   queueOperation(()=>transitions(state));
   if(state.alertas!==lastAlert){lastAlert=state.alertas;queueOperation(()=>event('alertas_controlador',state.alertas?'aviso':'info',state.alertas?'Alertas de segurança ativos: máscara '+state.alertas+'.':'Alertas de segurança normalizados.'));}
  }
 }
 link.on('state',broadcast);
 link.on('telemetry',state=>{if(state.solo!==null){history.push({hora:new Date().toLocaleTimeString('pt-BR'),umidade:state.solo});history=history.slice(-60);io.emit('historico_grafico',history);}});
 let lastDiscard=0;link.on('discard',()=>{if(Date.now()-lastDiscard>10000){lastDiscard=Date.now();queueOperation(()=>event('serial_corrompida','aviso','Frame inválido ou repetido descartado; dados anteriores não foram renovados.'));}});
 link.on('boot',()=>{thresholds='';generation++;queueOperation(()=>event('controlador_reiniciado','aviso','Controlador reiniciado; comandos pendentes não serão reenviados.'));});
 const receive=line=>{if(!paused)link.receive(line);};
 transport=options.transportFactory?options.transportFactory(receive,message=>link.reset(message)):(cfg.simulate?new SimulatedBoard(receive):new SerialTransport(receive,message=>link.reset(message),{path:cfg.serialPath||'auto',reconnectMs:cfg.serialReconnectMs||3000}));
 function serialize(fn){const expected=generation;const job=controls.then(async()=>{if(closed||expected!==generation)throw Object.assign(new Error('Conexão mudou antes do comando; solicite novamente.'),{status:503});return fn();});controls=job.catch(()=>{});return job;}
 async function rawCommand(data){if(!snapshot().connected)throw Object.assign(new Error('Arduino desconectado ou sem dados recentes. Comando bloqueado.'),{status:503});return link.command(data);}
 async function cancelPending(reason){for(let i=0;i<3;i++)if(contexts[i]&&!active[i]){if(contexts[i].reservation)await store.finishAction(contexts[i].reservation,{status:'bloqueada',reason});contexts[i]=null;}}
 async function command(data){return serialize(async()=>{
  if(data.cmd==='setMode'){await cancelPending('Troca de modo cancelou pedido em fila.');}
  const ack=await rawCommand(data);await operations;
  await event('comando_confirmado','info','Comando '+data.cmd+' confirmado.');return ack;
 });}
 async function prepareManual(){if(snapshot().modo!=='MANUAL'){await rawCommand({cmd:'setMode',mode:'MANUAL'});await operations;}}
 async function startPump(id,on,ms,context){
  await prepareManual();
  if(!on&&contexts[id-1]&&!active[id-1]){if(contexts[id-1].reservation)await store.finishAction(contexts[id-1].reservation,{status:'bloqueada',reason:'Pedido cancelado antes de ligar.'});contexts[id-1]=null;}
  if(on)contexts[id-1]=context;
  try{const ack=await rawCommand({cmd:'pump',id,on,ms});await operations;return ack;}
  catch(error){if(!active[id-1])contexts[id-1]=null;await event('comando_bloqueado','aviso',error.message);throw error;}
 }
 async function pumpId(id,on,ms=0,context={}){
  if(!Number.isInteger(id)||id<1||id>3||typeof on!=='boolean'||!Number.isInteger(ms)||ms<0||ms>limits.cycles[id-1])throw Object.assign(new Error('Bomba ou duração inválida (respeite o máximo por ciclo).'),{status:400});
  return serialize(()=>startPump(id,on,ms,{origin:'manual',...context}));
 }
 async function pump(minutes,context){if(!Number.isInteger(minutes)||minutes<1||minutes*60000>limits.cycles[2])throw Object.assign(new Error('Duração excede o limite seguro da bomba 3.'),{status:400});return pumpId(3,true,minutes*60000,context);}
 const device={snapshot,irrigationPending:()=>!!contexts[2]||snapshot().pumps[2]===true,
  runScheduled:(row,profile,reservation,userId)=>serialize(async()=>{
   if(contexts[2]||snapshot().pumps[2])throw Object.assign(new Error('Outra irrigação já ocupa a bomba.'),{status:409});
   await prepareManual();const dry=Number(profile.limite_umidade),wet=Math.min(100,dry+15);
   await rawCommand({cmd:'setThresholds',dry,wet});thresholds=dry+':'+wet;
   // Uma atualização de sensor entre reserva e comando continua sujeita ao firmware.
   return startPump(3,true,row.duracao*60000,{origin:'agendada',userId,profileId:profile.id,reservation});
  })};
 const scheduler=new Scheduler({store,device,simulate:cfg.simulate,timeZone:cfg.scheduleTimeZone,event});
 function initial(socket,userId){socket.emit('config_atual',store.schedule(userId));socket.emit('historico_grafico',history);socket.emit('estado_sistema',snapshot());socket.emit('status_bomba',snapshot().pumps[2]);socket.emit('system_status',{simulate:cfg.simulate,...store.status()});}
 const heartbeat=setInterval(async()=>{if(heartbeatBusy||!snapshot().connected||closed)return;heartbeatBusy=true;try{await link.command({cmd:'heartbeat'});}catch{}finally{heartbeatBusy=false;}},Math.min(2000,Math.floor(limits.heartbeat/3)));heartbeat.unref();
 async function tick(){
  if(housekeepingBusy||closed)return;housekeepingBusy=true;
  try{
   await ready;broadcast();io.emit('system_status',{simulate:cfg.simulate,...store.status()});
   const state=snapshot();if(!state.connected)return;
   const owner=store.users.find(u=>u.ativo&&u.nivel==='master');const profiles=owner?store.profiles.filter(p=>p.usuario_id===owner.id):[];
   const selected=profiles.find(p=>p.selecionado)||profiles[0];
   if(selected&&!contexts[2]){const dry=Number(selected.limite_umidade),wet=Math.min(100,dry+15),key=dry+':'+wet;if(thresholds!==key){await serialize(()=>rawCommand({cmd:'setThresholds',dry,wet}));thresholds=key;}}
   await scheduler.tick();
   if(Date.now()-lastSaved>=cfg.saveSeconds*1000){lastSaved=Date.now();const current=snapshot();if(current.connected)await store.reading({solo:current.solo,temperatura:current.temperatura,umidade_ar:current.umidade_ar,nivel_rio:current.rio??null,nivel_poco:current.poco??null,nivel_caixa:current.caixa,bombas:current.pumps,boias:current.boias,modo:current.modo,simulado:cfg.simulate});}
  }catch{logger.error('sincronizacao_controlador');}finally{housekeepingBusy=false;}
 }
 const timer=setInterval(tick,Math.min(1000,Math.max(100,Math.floor(link.staleMs/2))));timer.unref();
 function simulationControl(data){
  if(!cfg.simulate)throw Object.assign(new Error('Controle de demonstração disponível apenas em SIMULAÇÃO.'),{status:400});
  if(Object.keys(data).some(k=>!['paused','scenario'].includes(k))||(data.paused!==undefined&&typeof data.paused!=='boolean')||(data.scenario!==undefined&&!['normal','rio_seco','caixa_baixa','solo_seco','erro_dht'].includes(data.scenario)))throw Object.assign(new Error('Cenário inválido.'),{status:400});
  if(data.paused!==undefined)paused=data.paused;
  if(data.scenario){transport.faults={};transport.river=data.scenario==='rio_seco'?0:80;transport.box=data.scenario==='caixa_baixa'?5:60;transport.soil=data.scenario==='solo_seco'?10:42;if(data.scenario==='erro_dht')transport.faults.dht=true;}
  if(!paused&&typeof transport.telemetry==='function')transport.telemetry();
  queueOperation(()=>event('simulacao_cenario','info','Cenário de SIMULAÇÃO atualizado.'));return {simulate:true,paused,scenario:data.scenario};
 }
 return {ready,pump,pumpId,stop:()=>pumpId(3,false),command,initial,snapshot,link,settings,scheduler,event,simulationControl,tick,drain:()=>operations,
  async close(){closed=true;clearInterval(heartbeat);clearInterval(timer);transport.close();link.close();await operations;}
 };
}
module.exports={createDeviceService};
