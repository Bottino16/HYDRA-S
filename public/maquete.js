// Visão Geral V4.1: somente apresentação. Estados de saída vêm da telemetria confirmada.
document.addEventListener('DOMContentLoaded',async()=>{
 const session=await window.sdaReady,master=session.usuario.nivel==='master',socket=window.sdaSocket||window.socket;
 const node=(tag,text,parent,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;if(parent)parent.append(el);return el;};
 const panel=node('section');panel.id='hydra-console';panel.className='hydra-console';panel.setAttribute('aria-label','Central de controle hídrico');
 const heading=node('header',undefined,panel,'hydra-heading page-header'),titles=node('div',undefined,heading);node('span','HYDRA-S / DIGITAL TWIN',titles,'hydra-eyebrow');node('h2','Inteligência em cada gota.',titles);node('p','Central inteligente de gestão hídrica',titles);const connection=node('span','Sem dados',heading,'hydra-chip');connection.id='controller-connection';
 const metrics=node('div',undefined,panel,'telemetry-strip');metrics.setAttribute('aria-label','Telemetria atual');const metricCards=[...document.querySelectorAll('.bento-grid > .bento-card')].slice(0,4);metricCards.forEach((card,i)=>{card.dataset.metric=String(i);node('small',['Escala relativa · não volumétrica','Temperatura do ambiente','Umidade relativa do ar','Nível informado · ultrassônico'][i],card,'metric-context');metrics.append(card);});
 const circuit=node('div',undefined,panel,'water-circuit water-experience'),caption=node('div',undefined,circuit,'circuit-caption');node('strong','HYDRA-S Water Experience',caption);node('span','SIMULAÇÃO • firmware NÃO VALIDADO',caption);
 node('p','Circuito e operação integrados · comandos sujeitos à confirmação e às travas do controlador.',circuit,'pump-summary-note');
 const track=node('div',undefined,circuit,'circuit-track'),tanks=[],floatNodes=[],links=[],circuitStates=[];
 const floatNames=['Rio / presença','Poço / mínima','Poço / máxima','Caixa / mínima','Caixa / máxima'];
 for(const [i,name] of ['Rio','Poço','Caixa','Plantação'].entries()){
  const card=node('article',undefined,track,'water-node');card.dataset.known='false';card.dataset.reservoir=String(i);const head=node('header',undefined,card);node('span','0'+(i+1),head,'reservoir-index');node('h3',name,head);node('small',i===3?'Solo · escala relativa':i<2?'Nível informado pelo controlador':'Ultrassônico',head);
  const scene=node('div',undefined,card,'reservoir-scene');scene.dataset.scene=['river','well','elevated','farm'][i];
  const vessel=node('div',undefined,scene,'vessel'),fill=node('div',undefined,vessel,'vessel-fill');
  if(i===3)vessel.classList.add('plant-vessel');else vessel.classList.add(i===0?'river-vessel':'tank-vessel');
  const value=node('strong','Sem dados',vessel,'level-value');value.id='circuit-level-'+i;
  let meter;if(i===3){const scale=node('div',undefined,scene,'soil-relative-meter');scale.setAttribute('aria-hidden','true');meter=node('div',undefined,scale,'soil-relative-fill');}
  node('span',['Origem natural · ilustração','Corte subterrâneo · ilustração','Estrutura elevada · ilustração','Canteiros · ilustração conceitual'][i],scene,'scene-caption');
  const floats=node('div',undefined,card,'float-list');for(const index of [[0],[1,2],[3,4],[]][i]){const item=node('span',floatNames[index]+': Sem dados',floats,'float-pill');item.id='float-'+index;floatNodes[index]=item;}if(i===3)node('small','Escala do sensor, não volumétrica',floats);
  tanks.push({card,fill,value,meter});if(i<3){const link=node('div',undefined,track,'circuit-link');link.dataset.pump=String(i+1);const shortcut=node('article',undefined,link,'circuit-pump');
   node('span','B0'+(i+1),shortcut,'circuit-module-id');node('b','Bomba '+(i+1),shortcut);node('small',['Captação','Transferência','Irrigação'][i],shortcut,'circuit-function');node('small',['Rio → Poço','Poço → Caixa','Caixa → Plantação'][i],shortcut,'circuit-pump-route');const confirmed=node('span','Sem dados',shortcut,'circuit-confirmed-state');circuitStates.push(confirmed);node('span','Pedido pendente',shortcut,'circuit-pending');node('span','Ver aviso nos controles',shortcut,'circuit-command-error');links.push(link);}
 }
 node('p','Conexões indicam o percurso. Saída ligada não comprova vazão; nenhum fluxo de água é medido. Ondas e canteiros são ilustrações, sem indicar saúde ou crescimento medidos.',circuit,'circuit-footnote');
 const alertNames=[[1,'Rio sem água'],[2,'Poço abaixo do mínimo'],[4,'Caixa abaixo do mínimo'],[8,'Falha de sensor'],[16,'Comando bloqueado'],[32,'Heartbeat perdido'],[64,'Limite de ciclo'],[128,'Comando em fila'],[256,'Retenção de partida']];
 const alerts=node('div','Aguardando telemetria',panel,'controller-alert');alerts.id='controller-alerts';alerts.setAttribute('role','status');
 const operation=circuit;
 const bar=node('div',undefined,operation,'operating-bar'),controlTitle=node('div',undefined,bar);node('h3','Controle das bombas',controlTitle).id='pump-operation-title';const mode=node('p','Modo confirmado: Sem dados',controlTitle);const modes=node('div',undefined,bar,'mode-switch');modes.setAttribute('role','group');modes.setAttribute('aria-label','Modo de operação');
 circuit.insertBefore(bar,track);
 const labels=[],buttons=[],modeButtons=[],pumpCards=[],pendingButtons=new Set();let current={pumps:[null,null,null],connected:false};
 for(let i=1;i<=3;i++){
  const card=links[i-1].querySelector('.circuit-pump');card.classList.add('pump-card');card.id='pump-card-'+i;card.tabIndex=-1;const chip=node('span','Sem dados',card,'hydra-chip sr-only');chip.setAttribute('aria-hidden','true');const label=node('span','Bomba '+i+': DESCONHECIDA',card,'pump-state sr-only');labels.push(label);
  const durationLabel=node('label','Duração manual (s)',card),duration=node('input',undefined,durationLabel);duration.type='number';duration.min='1';duration.max='120';duration.value='4';duration.setAttribute('aria-label','Duração manual da bomba '+i+' em segundos');
  const actions=node('div',undefined,card,'pump-actions'),feedback=node('p',master?'Comandos sujeitos às travas do controlador.':'Somente leitura • operação exclusiva do MASTER.',card,'pump-feedback');feedback.setAttribute('role','status');pumpCards.push({card,chip,feedback,duration,pending:false});
  for(const on of [true,false]){const button=node('button',on?'Ligar':'Desligar',actions,on?'pump-start':'pump-stop');button.type='button';button.disabled=true;button.setAttribute('aria-label',(on?'Ligar':'Desligar')+' bomba '+i);buttons.push(button);
   button.addEventListener('click',async()=>{if(pendingButtons.has(button))return;const ms=on?Number(duration.value)*1000:0,max=current.limites?.cycles[i-1]??60000;if(on&&(!Number.isInteger(ms)||ms<1000||ms>max)){feedback.textContent='Duração inválida; máximo desta bomba: '+max/1000+' s.';feedback.dataset.state='error';return;}if(on&&!confirm('Confirmar bomba '+i+'? As travas do controlador continuam obrigatórias.'))return;
    feedback.textContent='Aguardando confirmação do controlador…';feedback.dataset.state='pending';pendingButtons.add(button);card.setAttribute('aria-busy','true');button.disabled=true;
    try{const response=await window.sdaRequest('/api/bombas/'+i,{method:'POST',body:JSON.stringify({on,ms})});const data=await response.json();feedback.textContent=response.ok?(data.ack.pumps[i-1]?'Estado ligado confirmado pelo ACK; aguarde a telemetria.':'Comando confirmado; bomba desligada ou aguardando vaga/intervalo.'):(data.mensagem||'Comando não confirmado.');feedback.dataset.state=response.ok?'confirmed':'error';}
    catch{feedback.textContent='Sem confirmação. Confira o estado recebido.';feedback.dataset.state='error';}finally{pendingButtons.delete(button);card.setAttribute('aria-busy',String([...actions.querySelectorAll('button')].some(b=>pendingButtons.has(b))));button.disabled=!master||!current.connected;}
   });
  }
 }
 const modeFeedback=node('p','',bar,'pump-feedback');modeFeedback.setAttribute('role','status');
 for(const value of ['AUTO','MANUAL']){const button=node('button','Modo '+value,modes);button.type='button';button.disabled=true;button.setAttribute('aria-pressed','false');buttons.push(button);modeButtons.push({button,value});button.addEventListener('click',async()=>{pendingButtons.add(button);button.disabled=true;modeFeedback.textContent='Aguardando confirmação do modo…';try{const response=await window.sdaRequest('/api/modo',{method:'POST',body:JSON.stringify({mode:value})});modeFeedback.textContent=response.ok?'Comando confirmado; o seletor acompanha a telemetria.':(await response.json()).mensagem;}catch{modeFeedback.textContent='Modo sem confirmação. Confira a conexão.';}finally{pendingButtons.delete(button);button.disabled=!master||!current.connected;}});}
 const safety=node('p','Travas locais preservadas. Firmware NÃO VALIDADO fisicamente.',operation,'controller-safety');
 const additional=document.querySelector('.legacy-manual');if(additional){
  const irrigation=pumpCards[2];irrigation.card.append(additional);additional.querySelector('summary').textContent='Avançado · duração em minutos';
  additional.querySelectorAll('[onclick="regarManual()"],[onclick="pararRega()"]').forEach(button=>button.remove());
  const transfer=node('button','Usar duração em minutos',additional,'btn btn-outline');transfer.type='button';transfer.disabled=!master;
  transfer.addEventListener('click',()=>{if(!master)return;irrigation.duration.value=String(Number(document.getElementById('tempo-manual').value)*60);irrigation.feedback.textContent='Duração transferida para segundos. Use Ligar para solicitar; os limites continuam obrigatórios.';});
  const legacyHeading=additional.querySelector('.bento-card-header');if(legacyHeading)legacyHeading.textContent='Conversão de duração · não envia comando';
  const legacyStatus=document.getElementById('texto-bomba');if(legacyStatus?.parentElement)legacyStatus.parentElement.classList.add('sr-only');
 }
 const digitalTwin=window.HydraDigitalTwin.mount(circuit,{track,tanks,links});
 const main=document.getElementById('overview-section')||document.querySelector('main'),banner=document.getElementById('sda-system-banner');if(banner?.parentElement===main)banner.after(panel);else main.prepend(panel);
 function render(state){current=state;const valid=state.connected===true;metricCards.forEach((card,i)=>{const value=[state.solo,state.temperatura,state.umidade_ar,state.caixa][i];card.dataset.known=String(valid&&typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=(i===1?60:100));});
  connection.textContent=valid?(state.simulate?'SIMULAÇÃO conectada':'Arduino conectado'):'Sem dados • controlador desconectado';connection.dataset.state=valid?'on':'error';
  if(state.limites){safety.textContent='Proteções ativas: até '+state.limites.max+' bomba(s) simultânea(s) • partidas espaçadas em '+state.limites.gap/1000+' s • firmware NÃO VALIDADO.';for(const id of ['input-duracao','tempo-manual']){const input=document.getElementById(id);if(input)input.max=Math.max(1,Math.floor(state.limites.cycles[2]/60000));}}
  [state.rio,state.poco,state.caixa,state.solo].forEach((value,i)=>{const known=valid&&typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=100;tanks[i].card.dataset.known=String(known);tanks[i].card.dataset.empty=String(known&&value===0);tanks[i].card.dataset.condition=known?'normal':'unknown';tanks[i].value.textContent=known?value+'%':'Sem dados';tanks[i].fill.style.height=known?value+'%':'0%';if(tanks[i].meter)tanks[i].meter.style.width=known?value+'%':'0%';});
  floatNodes.forEach((item,i)=>{const value=valid?state.boias?.[i]:null;item.textContent=floatNames[i]+': '+(typeof value==='boolean'?(value?'Ativa':'Inativa'):'Sem dados');item.dataset.state=typeof value==='boolean'?(value?'on':'off'):'error';});
  const mask=valid&&Number.isInteger(state.alertas)&&state.alertas>=0&&state.alertas<=511?state.alertas:null;alerts.textContent=mask===null?'Sem dados recentes de alertas. Estados desconhecidos.':mask===0?'Controlador sem alertas ativos • travas de segurança preservadas.':alertNames.filter(([bit])=>mask&bit).map(([,text])=>text).join(' • ')+' (máscara '+mask+')';alerts.dataset.state=mask===0?'normal':'error';
  for(const [low,high] of [[1,2],[3,4]])if(valid&&state.boias?.[low]===false&&state.boias?.[high]===true){tanks[low===1?1:2].card.dataset.condition='contradiction';for(const i of [low,high]){floatNodes[i].dataset.state='error';floatNodes[i].textContent=floatNames[i]+': Contradição';}}
  mode.textContent='Modo confirmado: '+(valid&&['AUTO','MANUAL'].includes(state.modo)?state.modo:'Sem dados');modeButtons.forEach(({button,value})=>button.setAttribute('aria-pressed',String(valid&&state.modo===value)));
  labels.forEach((label,i)=>{const value=valid?state.pumps?.[i]:null,known=typeof value==='boolean',status=known?(value?'on':'off'):'unknown';label.textContent='Bomba '+(i+1)+': '+(!known?'DESCONHECIDA':value?'LIGADA (confirmada)':'DESLIGADA (confirmada)');pumpCards[i].card.dataset.state=status;pumpCards[i].chip.dataset.state=status;pumpCards[i].chip.textContent=!known?'Sem dados':value?'Ligada':'Desligada';links[i].dataset.state=status;circuitStates[i].textContent=!known?'Sem dados':value?'Ligada · confirmada':'Desligada · confirmada';pumpCards[i].duration.disabled=!master||!valid;if(state.limites?.cycles?.[i])pumpCards[i].duration.max=String(state.limites.cycles[i]/1000);});
  buttons.forEach(button=>button.disabled=!master||!valid||pendingButtons.has(button));
  digitalTwin.sync();
 }
 socket.on('estado_sistema',render);socket.on('disconnect',()=>render({connected:false,pumps:[null,null,null]}));
 const response=await window.sdaRequest('/api/estado');if(response.ok)render(await response.json());
});
