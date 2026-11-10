const {limits}=require('../pump-control');
function localOccurrence(date,timeZone){const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);const p=Object.fromEntries(parts.map(v=>[v.type,v.value]));return {day:Number(p.day),date:`${p.year}-${p.month}-${p.day}`,hour:`${p.hour}:${p.minute}`};}
class Scheduler{
 constructor({store,device,simulate,timeZone='America/Fortaleza',event}){this.store=store;this.device=device;this.simulate=simulate;this.timeZone=timeZone;this.event=event;this.busy=false;}
 async tick(now=new Date()){
  if(this.busy)return;this.busy=true;
  try{
   const local=localOccurrence(now,this.timeZone);
   for(const row of [...this.store.schedules].sort((a,b)=>a.id-b.id)){
    const owner=this.store.users.find(u=>u.ativo&&u.nivel==='master');
    const user=this.store.byId(row.usuario_id);if(user?.id!==owner?.id||!user?.ativo||user.nivel!=='master'||!row.ativo)continue;
    const days=typeof row.dias_do_mes==='string'?JSON.parse(row.dias_do_mes):row.dias_do_mes;
    if(row.hora!==local.hour||!days.includes(local.day))continue;
    const key=`${this.simulate?'sim':'real'}:${row.id}:${row.perfil_planta_id??0}:${local.date}:${row.hora}`;
    let reservation;try{reservation=await this.store.reserveOccurrence(key,{userId:user.id,profileId:row.perfil_planta_id,scheduleId:row.id,simulate:this.simulate});}catch{await this.event('agendamento_reserva','erro','Agendamento não enviado: reserva persistente indisponível.');continue;}
    if(!reservation)continue;
    const profile=this.store.profiles.find(p=>p.id===row.perfil_planta_id&&p.usuario_id===user.id);
    let reason=null;const state=this.device.snapshot();
    if(!profile)reason='Perfil de planta ausente ou removido.';
    else if(!state.connected||state.solo===null)reason='Sem dados recentes do controlador.';
    else if(state.solo>=Number(profile.limite_umidade))reason='Solo acima do limite do perfil: '+profile.limite_umidade+'%.';
    else if(!Number.isInteger(row.duracao)||row.duracao<1||row.duracao*60000>limits.cycles[2])reason='Duração excede o ciclo seguro da bomba 3.';
    else if(state.pumps[2]||this.device.irrigationPending())reason='Irrigação já em andamento ou em fila.';
    if(reason){await this.store.finishAction(reservation,{status:'bloqueada',reason,at:now});await this.event('agendamento_bloqueado','aviso',reason);continue;}
    try{
     await this.device.runScheduled(row,profile,reservation,user.id);
     await this.event('agendamento_aceito','info','Ocorrência reservada e confirmada pelo controlador; observar estado da bomba.');
    }catch(error){await this.store.finishAction(reservation,{status:error.status>=500?'incerta':'bloqueada',reason:error.message,at:now});await this.event('agendamento_bloqueado','aviso',error.message);}
   }
  }finally{this.busy=false;}
 }
}
module.exports={Scheduler,localOccurrence};
