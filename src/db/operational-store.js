const {OccurrenceJournal}=require('../services/occurrence-journal');
const path=require('node:path');
const json=value=>typeof value==='string'?JSON.parse(value):value;
const normalizeReading=row=>({...row,solo:row.solo===null?null:Number(row.solo),temperatura:row.temperatura===null?null:Number(row.temperatura),umidade_ar:row.umidade_ar===null?null:Number(row.umidade_ar),nivel_rio:row.nivel_rio==null?null:Number(row.nivel_rio),nivel_poco:row.nivel_poco==null?null:Number(row.nivel_poco),nivel_caixa:row.nivel_caixa==null?null:Number(row.nivel_caixa),bombas:json(row.bombas),boias:row.boias?json(row.boias):null,simulado:!!row.simulado});
class OperationalStore extends require('./chat-store').ChatStore{
 async loadOperations(){
  const [actions]=await this.pool.execute('SELECT * FROM acionamentos ORDER BY id DESC LIMIT 2000');this.actions=actions;
  const [events]=await this.pool.execute('SELECT * FROM eventos ORDER BY id DESC LIMIT 200');this.eventLog=events;
 }
 async event({tipo,severidade='info',mensagem,simulado=false,data_hora=new Date()}){
  const result=await this.write('INSERT INTO eventos (tipo, severidade, mensagem, simulado, data_hora) VALUES (?, ?, ?, ?, ?)',[tipo,severidade,mensagem,simulado,data_hora]);
  const row={id:result?.insertId||Math.max(0,...this.eventLog.map(e=>e.id))+1,tipo,severidade,mensagem,simulado:!!simulado,data_hora};this.eventLog.push(row);this.eventLog=this.eventLog.slice(-1000);return row;
 }
 async listEvents({from,to,limit=100,offset=0}){
  if(this.mode==='mysql'){try{const [rows]=await this.pool.execute('SELECT * FROM eventos WHERE data_hora >= ? AND data_hora <= ? ORDER BY data_hora DESC, id DESC LIMIT ? OFFSET ?',[from,to,String(limit),String(offset)]);return rows.map(row=>({...row,simulado:!!row.simulado}));}catch{this.mode='memory';this.message='Histórico temporariamente em memória; banco indisponível.';}}
  return this.eventLog.filter(e=>new Date(e.data_hora)>=from&&new Date(e.data_hora)<=to).sort((a,b)=>new Date(b.data_hora)-new Date(a.data_hora)||b.id-a.id).slice(offset,offset+limit);
 }
 async history({from,to,limit=1000,offset=0}){
  if(this.mode==='mysql'){try{const [rows]=await this.pool.execute('SELECT * FROM leituras WHERE data_hora >= ? AND data_hora <= ? ORDER BY data_hora, id LIMIT ? OFFSET ?',[from,to,String(limit),String(offset)]);return rows.map(normalizeReading);}catch{this.mode='memory';this.message='Histórico temporariamente em memória; banco indisponível.';}}
  return this.readings.filter(r=>new Date(r.data_hora)>=from&&new Date(r.data_hora)<=to).sort((a,b)=>new Date(a.data_hora)-new Date(b.data_hora)||a.id-b.id).slice(offset,offset+limit).map(normalizeReading);
 }
 async *exportReadings({from,to}){
  if(this.mode!=='mysql'){const rows=await this.history({from,to,limit:10000,offset:0});for(const row of rows)yield row;return;}
  const [last]=await this.pool.execute('SELECT MAX(id) AS maximum FROM leituras WHERE data_hora >= ? AND data_hora <= ?',[from,to]);
  const maximum=last[0].maximum||0;let after=0;
  while(after<maximum){
   const [rows]=await this.pool.execute('SELECT * FROM leituras WHERE data_hora >= ? AND data_hora <= ? AND id > ? AND id <= ? ORDER BY id LIMIT 1000',[from,to,after,maximum]);
   if(!rows.length)return;for(const row of rows){yield normalizeReading(row);after=row.id;}
  }
 }
 async listActions({from,to,limit=100,offset=0,userId=null}){
  if(this.mode==='mysql'){try{
   const [rows]=await this.pool.execute('SELECT * FROM acionamentos WHERE COALESCE(inicio, fim) >= ? AND COALESCE(inicio, fim) <= ? AND (? IS NULL OR usuario_id = ?) ORDER BY id DESC LIMIT ? OFFSET ?',[from,to,userId,userId,String(limit),String(offset)]);return rows.map(r=>({...r,simulado:!!r.simulado,confirmado:!!r.confirmado,estimativa:true}));
  }catch{this.mode='memory';this.message='Acionamentos temporariamente em memória; banco indisponível.';}}
  return this.actions.filter(r=>{const at=new Date(r.inicio||r.fim);return at>=from&&at<=to&&(userId===null||r.usuario_id===userId);}).sort((a,b)=>b.id-a.id).slice(offset,offset+limit).map(r=>({...r,estimativa:true}));
 }
 async reserveOccurrence(key,{userId,profileId,scheduleId,simulate}){
  this.journal ||= new OccurrenceJournal(this.cfg.scheduleJournalDir||path.resolve('.data/schedule-occurrences'));
  if(!this.journal.claim(key,{simulate,scheduleId}))return null;
  // Falha/resultado ambíguo no INSERT não autoriza acionamento nem fallback de execução.
  let result;
  if(this.mode==='mysql'){
   try{[result]=await this.pool.execute("INSERT INTO acionamentos (bomba, origem, usuario_id, perfil_planta_id, agendamento_id, ocorrencia, inicio, status, simulado, confirmado) VALUES (3, 'agendada', ?, ?, ?, ?, NULL, 'reservada', ?, FALSE)",[userId,profileId,scheduleId,key,simulate]);}
   catch(error){if(error.code==='ER_DUP_ENTRY')return null;throw new Error('Não foi possível reservar ocorrência com segurança.');}
  }
  const row={id:result?.insertId||Math.max(0,...this.actions.map(a=>a.id))+1,bomba:3,origem:'agendada',usuario_id:userId,perfil_planta_id:profileId,agendamento_id:scheduleId,ocorrencia:key,inicio:null,fim:null,status:'reservada',simulado:!!simulate,confirmado:false};this.actions.push(row);return row;
 }
 async startAction({bomba,origem='auto',userId=null,profileId=null,reservation=null,simulate=false,flow=null,at=new Date()}){
  if(reservation){await this.write("UPDATE acionamentos SET inicio = ?, status = 'iniciada', confirmado = TRUE, vazao_l_min = ? WHERE id = ?",[at,flow,reservation.id]);Object.assign(reservation,{inicio:at,status:'iniciada',confirmado:true,vazao_l_min:flow});return reservation;}
  const result=await this.write("INSERT INTO acionamentos (bomba, origem, usuario_id, perfil_planta_id, inicio, status, simulado, confirmado, vazao_l_min) VALUES (?, ?, ?, ?, ?, 'iniciada', ?, TRUE, ?)",[bomba,origem,userId,profileId,at,simulate,flow]);
  const row={id:result?.insertId||Math.max(0,...this.actions.map(a=>a.id))+1,bomba,origem,usuario_id:userId,perfil_planta_id:profileId,inicio:at,fim:null,status:'iniciada',simulado:!!simulate,confirmado:true,vazao_l_min:flow};this.actions.push(row);return row;
 }
 async finishAction(row,{status='concluida',reason=null,at=new Date()}={}){
  const volume=row.inicio&&row.vazao_l_min!=null&&status==='concluida'?Math.max(0,(at-new Date(row.inicio))/60000)*Number(row.vazao_l_min):null;
  await this.write('UPDATE acionamentos SET fim = ?, status = ?, motivo = ?, volume_estimado_l = ? WHERE id = ?',[at,status,reason,volume,row.id]);Object.assign(row,{fim:at,status,motivo:reason,volume_estimado_l:volume});return row;
 }
 async recoverActions(){for(const row of [...this.actions])if(['reservada','iniciada'].includes(row.status))await this.finishAction(row,{status:'incerta',reason:'Servidor reiniciado; não reenviar comando nem presumir término físico.'});}
}
module.exports={OperationalStore};
