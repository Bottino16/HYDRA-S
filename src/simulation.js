const {DeviceLink}=require('./device-link');
const {SimulatedBoard}=require('./simulated-board');
const {SerialTransport}=require('./serial-transport');
const {limits}=require('./pump-control');
// A mesma camada valida protocolo/ACK tanto na simulação como na porta serial.
function simulation(io,store,cfg){
 let transport,history=[],lastSaved=0,lastAlert=0,thresholds='',heartbeatBusy=false,housekeepingBusy=false;
 const executed=new Map();
 const link=new DeviceLink(line=>transport.write(line));
 function state(snapshot){
  io.emit('estado_sistema',{...snapshot,limites:limits});
  io.emit('status_bomba',snapshot.connected?snapshot.pumps[2]:null);
  if(!snapshot.connected)return;
  io.emit('dados_sensores',`${snapshot.solo===null?'NaN':Math.round(1023-snapshot.solo/100*1023)},${snapshot.caixa===null?'NaN':((100-snapshot.caixa)*11/100).toFixed(2)},${snapshot.temperatura??'NaN'},${snapshot.umidade_ar??'NaN'}`);
  if(snapshot.type==='state'&&snapshot.solo!==null){history.push({hora:new Date().toLocaleTimeString('pt-BR'),umidade:snapshot.solo});history=history.slice(-15);io.emit('historico_grafico',history);}
  if(snapshot.alertas&&snapshot.alertas!==lastAlert)io.emit('aviso_agendamento','Controlador: alertas de segurança ativos (máscara '+snapshot.alertas+').');
  lastAlert=snapshot.alertas;
 }
 link.on('state',state);
 transport=cfg.simulate?new SimulatedBoard(line=>link.receive(line)):new SerialTransport(line=>link.receive(line),message=>link.reset(message),{path:process.env.SERIAL_PORT||'auto'});
 async function command(data){if(!link.snapshot().connected)throw Object.assign(new Error('Sem estado recente do Arduino. Comando bloqueado.'),{status:503});return link.command(data);}
 async function pumpId(id,on,ms=0){
  if(!Number.isInteger(id)||id<1||id>3||typeof on!=='boolean'||!Number.isInteger(ms)||ms<0||ms>limits.cycles[id-1])throw Object.assign(new Error('Bomba ou duração inválida (respeite o máximo por ciclo).'),{status:400});
  if(link.snapshot().modo!=='MANUAL')await command({cmd:'setMode',mode:'MANUAL'});
  return command({cmd:'pump',id,on,ms});
 }
 async function pump(minutes){if(!Number.isInteger(minutes)||minutes<1||minutes*60000>limits.cycles[2])throw Object.assign(new Error('Duração excede o limite seguro da bomba 3.'),{status:400});return pumpId(3,true,minutes*60000);}
 async function stop(){return pumpId(3,false);}
 function initial(socket,userId){socket.emit('config_atual',store.schedule(userId));socket.emit('historico_grafico',history);socket.emit('estado_sistema',{...link.snapshot(),limites:limits});socket.emit('status_bomba',link.snapshot().pumps[2]);socket.emit('system_status',{simulate:cfg.simulate,...store.status()});}
 const heartbeat=setInterval(async()=>{if(heartbeatBusy)return;heartbeatBusy=true;try{await link.command({cmd:'heartbeat'});}catch{}finally{heartbeatBusy=false;}},Math.min(2000,Math.floor(limits.heartbeat/3)));heartbeat.unref();
 const timer=setInterval(async()=>{
  if(housekeepingBusy)return;housekeepingBusy=true;
  try{
   io.emit('system_status',{simulate:cfg.simulate,...store.status()});
   const s=link.snapshot();if(!s.connected){state(s);return;}
   const owner=store.users.find(u=>u.ativo&&u.nivel==='master');
   const profiles=owner?store.profiles.filter(p=>p.usuario_id===owner.id):[];const active=profiles.find(p=>p.selecionado)||profiles[0];
   if(active){const dry=Number(active.limite_umidade),wet=Math.min(100,dry+15),key=dry+':'+wet;
    if(thresholds!==key){await command({cmd:'setThresholds',dry,wet});thresholds=key;}}
   const now=new Date();
   for(const row of store.schedules){const user=store.byId(row.usuario_id);if(!user?.ativo||user.nivel!=='master')continue;
    const schedule=store.schedule(user.id),hm=now.toTimeString().slice(0,5),key=now.toLocaleDateString('en-CA')+hm;
    if(schedule.ativo&&schedule.hora===hm&&schedule.diasMes.includes(now.getDate())&&executed.get(user.id)!==key){executed.set(user.id,key);try{await pump(schedule.duracao);}catch(error){io.emit('aviso_agendamento','Rega agendada bloqueada: '+error.message);}}
   }
   if(Date.now()-lastSaved>=cfg.saveSeconds*1000){lastSaved=Date.now();await store.reading({solo:s.solo,temperatura:s.temperatura,umidade_ar:s.umidade_ar,nivel_rio:s.rio??null,nivel_poco:s.poco??null,nivel_caixa:s.caixa,bombas:s.pumps});}
  }catch{io.emit('aviso_agendamento','Falha ao sincronizar configuração; controlador mantém travas locais.');}finally{housekeepingBusy=false;}
 },1000);timer.unref();
 link.on('boot',()=>{thresholds='';});
 return {pump,stop,pumpId,command,initial,snapshot:()=>({...link.snapshot(),limites:limits}),link,close(){clearInterval(heartbeat);clearInterval(timer);transport.close();link.close();}};
}
module.exports={simulation};
