const crypto=require('node:crypto');
const normalize=row=>({...row,metadados:typeof row.metadados==='string'?JSON.parse(row.metadados):(row.metadados||{})});
class ChatStore{
 async chatAppend(userId,conversationId,role,text,metadata={}){
  let id;if(this.mode==='mysql'){const [r]=await this.pool.execute('INSERT INTO conversas_ia (usuario_id, conversa_id, papel, mensagem, metadados) VALUES (?, ?, ?, ?, ?)',[userId,conversationId,role,text,JSON.stringify(metadata)]);id=r.insertId;}
  this.chatRows||=[];this.nextChatId||=1;const row={id:id||this.nextChatId++,usuario_id:userId,conversa_id:conversationId,papel:role,mensagem:text,metadados:metadata,data_hora:new Date()};this.nextChatId=Math.max(this.nextChatId,row.id+1);this.chatRows.push(row);return row;
 }
 async chatNew(userId,demo){const id=crypto.randomUUID();await this.chatAppend(userId,id,'assistant','Olá! Sou o Assistente do Solo. Como posso ajudar com solo e irrigação?',{kind:'inicio',demo});return id;}
 async chatList(userId,{offset=0}={}){
  let rows;if(this.mode==='mysql'){[rows]=await this.pool.execute('SELECT conversa_id, MIN(data_hora) AS criada_em, MAX(data_hora) AS atualizada_em, COUNT(*) AS mensagens FROM conversas_ia WHERE usuario_id = ? GROUP BY conversa_id ORDER BY atualizada_em DESC, conversa_id LIMIT 100 OFFSET ?',[userId,String(offset)]);}
  else{const grouped=new Map();for(const row of this.chatRows||[])if(row.usuario_id===userId){const value=grouped.get(row.conversa_id)||{conversa_id:row.conversa_id,criada_em:row.data_hora,mensagens:0};value.atualizada_em=row.data_hora;value.mensagens++;grouped.set(row.conversa_id,value);}rows=[...grouped.values()].reverse().slice(offset,offset+100);}return rows;
 }
 async chatMessages(userId,conversationId,{limit=100,before=Number.MAX_SAFE_INTEGER}={}){
  let rows;if(this.mode==='mysql'){[rows]=await this.pool.execute('SELECT id, conversa_id, papel, mensagem, metadados, data_hora FROM conversas_ia WHERE usuario_id = ? AND conversa_id = ? AND id < ? ORDER BY id DESC LIMIT ?',[userId,conversationId,before,String(limit)]);rows.reverse();}
  else rows=(this.chatRows||[]).filter(r=>r.usuario_id===userId&&r.conversa_id===conversationId&&r.id<before).slice(-limit);
  return rows.map(({usuario_id,...row})=>normalize(row));
 }
 async chatUsage(userId,now=new Date()){
  const day=new Date(+now-86400000),hour=new Date(+now-3600000);
  if(this.mode==='mysql'){const [rows]=await this.pool.execute("SELECT SUM(data_hora >= ?) AS hourly, COUNT(*) AS daily FROM conversas_ia WHERE usuario_id = ? AND papel = 'user' AND data_hora >= ?",[hour,userId,day]);return {hourly:Number(rows[0].hourly||0),daily:Number(rows[0].daily)};}
  const rows=(this.chatRows||[]).filter(r=>r.usuario_id===userId&&r.papel==='user'&&new Date(r.data_hora)>=day);return {hourly:rows.filter(r=>new Date(r.data_hora)>=hour).length,daily:rows.length};
 }
}
module.exports={ChatStore};
