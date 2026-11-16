const numeric=(value,min=-Infinity,max=Infinity)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max?value:'sem dados';
// MySQL DECIMAL may be a string; never coerce null, empty strings, booleans or containers.
function profileLimit(value){
 if(typeof value==='string'){if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim()))return 'sem dados';value=Number(value);}
 return numeric(value,0,100);
}
async function contextFor({store,device,weather,userId}){
 const alerts=await store.listEvents({from:new Date(Date.now()-86400000),to:new Date(),limit:1000});
 const labels=['rio sem água','poço baixo','caixa baixa','falha de sensor','comando bloqueado','comunicação perdida','limite de ciclo','fila de bombas','retenção de partida'];
 const describe=mask=>Number.isInteger(mask)&&mask>=0&&mask<=511?(mask===0?['sem alertas ativos']:labels.filter((_,i)=>mask&(1<<i))):['sem dados'];
 const masks=alerts.filter(e=>e.tipo==='alertas_controlador').slice(0,3).map(e=>{const matched=String(e.mensagem).match(/máscara (\d{1,3})/);return {tipo:'alertas_controlador',severidade:['info','aviso','erro'].includes(e.severidade)?e.severidade:'aviso',alertas:describe(matched?Number(matched[1]):String(e.mensagem).includes('normalizados')?0:null)};});
 let climate=null;try{const result=await weather.get();if(!result.offline&&result.data)climate={temperatura:numeric(result.data.temperature),chuvoso:typeof result.data.rainy==='boolean'?result.data.rainy:'sem dados'};}catch{}
 const state=device.snapshot(),fresh=state.connected===true;
 const pumps=Array.isArray(state.pumps)&&state.pumps.length===3?state.pumps:[null,null,null];
 const sensor=key=>fresh?numeric(state[key],0,key==='temperatura'?60:100):'sem dados';
 const profile=store.profiles.find(p=>p.usuario_id===userId&&p.selecionado)||store.profiles.find(p=>p.usuario_id===userId);
 // Nome livre do perfil pode conter identificação/injeção: só cultura reconhecida sai do backend.
 const crop=profile?.nome?.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/\b(alface|tomate|cacto|gramado|hortalica|tropical|milho|feijao)\b/)?.[0]||'não identificada';
 return {fonte:state.simulate?'SIMULAÇÃO':'HARDWARE — NÃO VALIDADO',telemetria:fresh?'recente':'sem dados',
  solo_percentual_relativo:sensor('solo'),temperatura_c:sensor('temperatura'),umidade_ar_percentual:sensor('umidade_ar'),
  niveis:{rio:sensor('rio'),poco:sensor('poco'),caixa:sensor('caixa')},bombas:fresh?pumps.map(v=>typeof v==='boolean'?v?'ligada confirmada':'desligada confirmada':'sem dados'):['sem dados','sem dados','sem dados'],
  alerta_atual:fresh&&Number.isInteger(state.alertas)?numeric(state.alertas,0,511):'sem dados',alertas_atuais:fresh?describe(state.alertas):['sem dados'],ultimos_alertas:masks,perfil:profile?{cultura:crop,limite_configurado_percentual:profileLimit(profile.limite_umidade)}:'sem dados',clima:climate||'sem dados'};
}
module.exports={contextFor};
