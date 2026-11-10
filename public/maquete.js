// Estados exibidos vêm de telemetria/ACK validado; clique nunca presume acionamento.
document.addEventListener('DOMContentLoaded',async()=>{
 const session=await window.sdaReady,master=session.usuario.nivel==='master';
 const panel=document.createElement('section');panel.style.cssText='border:1px solid #587080;border-radius:12px;padding:20px;margin-bottom:24px';
 const title=document.createElement('h3');title.textContent='Maquete • Rio → Poço → Caixa → Plantação';panel.append(title);
 const safety=document.createElement('p');panel.append(safety);
 const connection=document.createElement('p'),levels=document.createElement('p'),floats=document.createElement('p'),alerts=document.createElement('p'),mode=document.createElement('p'),feedback=document.createElement('p');feedback.setAttribute('role','status');panel.append(connection,levels,floats,alerts,mode);
 const durationLabel=document.createElement('label');durationLabel.textContent='Duração manual (segundos): ';
 const duration=document.createElement('input');duration.type='number';duration.min='1';duration.max='120';duration.value='4';duration.style.width='90px';durationLabel.append(duration);panel.append(durationLabel);
 const labels=[],buttons=[];let current={pumps:[null,null,null],connected:false};
 for(let i=1;i<=3;i++){
  const row=document.createElement('div');row.style.cssText='display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:8px 0';
  const label=document.createElement('span');labels.push(label);row.append(label);
  for(const on of [true,false]){const button=document.createElement('button');button.textContent=on?'Ligar':'Desligar';button.className='btn-outline';button.disabled=!master;buttons.push(button);row.append(button);
   button.addEventListener('click',async()=>{const ms=on?Number(duration.value)*1000:0;const max=current.limites?.cycles[i-1]??60000;if(on&&(!Number.isInteger(ms)||ms<1000||ms>max)){feedback.textContent='Duração inválida; máximo desta bomba: '+max/1000+' s.';return;}if(on&&!confirm('Confirmar bomba '+i+'? As travas do controlador continuam obrigatórias.'))return;
    feedback.textContent='Aguardando confirmação do controlador…';button.disabled=true;
    try{const response=await window.sdaRequest('/api/bombas/'+i,{method:'POST',body:JSON.stringify({on,ms})});const data=await response.json();feedback.textContent=response.ok?(data.ack.pumps[i-1]?'Estado ligado confirmado.':'Comando confirmado; bomba desligada ou aguardando vaga/intervalo.'):(data.mensagem||'Comando não confirmado.');}
    catch{feedback.textContent='Sem confirmação. Confira o estado recebido.';}finally{button.disabled=!master||!current.connected;}
   });
  }
  panel.append(row);
 }
 for(const value of ['AUTO','MANUAL']){const button=document.createElement('button');button.textContent='Modo '+value;button.disabled=!master;buttons.push(button);panel.append(button);button.addEventListener('click',async()=>{const response=await window.sdaRequest('/api/modo',{method:'POST',body:JSON.stringify({mode:value})});feedback.textContent=response.ok?'Modo confirmado.':(await response.json()).mensagem;});}
 panel.append(feedback);document.querySelector('main').prepend(panel);
 const percent=value=>value===null||value===undefined?'—':value+'%';
 function render(state){current=state;const valid=state.connected;
  if(state.limites){safety.textContent='Proteção: até '+state.limites.max+' bomba(s) simultânea(s), partidas espaçadas em '+state.limites.gap/1000+' s.';
   for(const id of ['input-duracao','tempo-manual']){const input=document.getElementById(id);if(input)input.max=Math.max(1,Math.floor(state.limites.cycles[2]/60000));}}

  connection.textContent=valid?'Controlador conectado • protocolo v'+state.v+' • seq '+state.seq:'Sem telemetria recente. Estado das bombas desconhecido.';
  levels.textContent=valid?'Rio '+percent(state.rio)+' • Poço '+percent(state.poco)+' • Caixa '+percent(state.caixa):'Níveis indisponíveis';
  floats.textContent=valid?'Boias [rio, poço mín/máx, caixa mín/máx]: '+state.boias.map(v=>v===null?'inválida':v?'ativa':'inativa').join(' | '):'';
  alerts.textContent=valid?'Alertas (máscara): '+state.alertas:'';
  mode.textContent='Modo confirmado: '+(valid?state.modo:'desconhecido');
  labels.forEach((label,i)=>{label.textContent='Bomba '+(i+1)+': '+(!valid||state.pumps[i]===null?'DESCONHECIDA':state.pumps[i]?'LIGADA (confirmada)':'DESLIGADA (confirmada)');});
  buttons.forEach(button=>button.disabled=!master||!valid);
 }
 socket.on('estado_sistema',render);socket.on('disconnect',()=>render({connected:false,pumps:[null,null,null]}));
 const response=await window.sdaRequest('/api/estado');if(response.ok)render(await response.json());
});
