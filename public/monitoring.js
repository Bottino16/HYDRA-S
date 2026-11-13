// Apresentação operacional: texto seguro, fonte explícita e histórico do backend.
document.addEventListener('DOMContentLoaded',async()=>{
 const session=await window.sdaReady,master=session.usuario.nivel==='master',socket=window.sdaSocket;
 const node=(tag,text,parent)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(parent)parent.append(el);return el;};
 const panel=node('section',undefined,document.getElementById('history-section')||document.querySelector('main'));panel.id='monitoring-panel';panel.className='monitoring-workspace';
 node('span','REGISTROS E RASTREABILIDADE',panel,'');node('h3','Histórico operacional',panel);
 const source=node('strong',session.simulate?'SIMULAÇÃO — dados virtuais':'HARDWARE — firmware NÃO VALIDADO',panel);source.id='data-source';
 const status=node('p','Aguardando telemetria',panel);status.id='telemetry-status';
 const applyState=state=>{status.textContent=state.connected?(state.simulate?'SIMULAÇÃO conectada':'Arduino conectado'):(state.simulate?'SIMULAÇÃO sem dados':'Arduino desconectado — sem dados');};
 socket.on('estado_sistema',applyState);
 socket.on('disconnect',()=>{status.textContent='Servidor desconectado — sem dados';if(typeof setBombaStatus==='function')setBombaStatus(null);document.getElementById('texto-bomba').textContent='STATUS: DESCONHECIDO';for(const id of ['texto-umidade','texto-temp','texto-umid-ar','texto-agua'])document.getElementById(id).textContent='sem dados';for(const id of ['prog-umidade','prog-temp','prog-umid-ar','prog-agua'])document.getElementById(id).style.width='0%';});
 const current=await window.sdaRequest('/api/estado');if(current.ok)applyState(await current.json());
 const message=node('p','',panel);message.id='history-feedback';message.setAttribute('role','status');
 const filters=node('div',undefined,panel);filters.className='history-period';filters.setAttribute('role','group');filters.setAttribute('aria-label','Período do histórico');const fromLabel=node('label','De',filters),toLabel=node('label','Até',filters);
 const from=node('input',undefined,fromLabel),to=node('input',undefined,toLabel);from.type=to.type='datetime-local';from.setAttribute('aria-label','Início do histórico');to.setAttribute('aria-label','Fim do histórico');
 const local=date=>new Date(date-date.getTimezoneOffset()*60000).toISOString().slice(0,16);from.value=local(new Date(Date.now()-86400000));to.value=local(new Date(Date.now()+60000));
 window.sdaHistoryQuery=()=>{const start=new Date(from.value),end=new Date(to.value);if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime()))throw new Error('Informe início e fim válidos.');if(start>end||end-start>31*86400000)throw new Error('Período inválido: máximo 31 dias por consulta.');return '?de='+encodeURIComponent(start.toISOString())+'&ate='+encodeURIComponent(end.toISOString());};
 const refresh=node('button','Consultar período',filters),csv=node('a','Exportar histórico completo CSV',filters);csv.className='shared-button';const periodLabel=node('p','Nenhum período consultado.',panel);periodLabel.id='history-applied-period';periodLabel.className='history-scope';
 const view=window.sdaHistoryView(panel);let loading=false;
 function exportEnabled(query){if(query){csv.href='/api/leituras.csv'+query;csv.removeAttribute('aria-disabled');csv.tabIndex=0;}else{csv.removeAttribute('href');csv.setAttribute('aria-disabled','true');csv.tabIndex=-1;}}
 function changed(){exportEnabled(null);message.dataset.state='warning';message.textContent='Filtros alterados. Consulte o período para atualizar os registros e o CSV.';}
 from.addEventListener('change',changed);to.addEventListener('change',changed);exportEnabled(null);
 async function load(){if(loading)return;loading=true;refresh.disabled=true;from.disabled=to.disabled=true;panel.setAttribute('aria-busy','true');message.dataset.state='loading';message.textContent='Consultando registros…';view.reset('Carregando registros…');exportEnabled(null);
  try{const query=window.sdaHistoryQuery();periodLabel.textContent='Período consultado: '+new Date(from.value).toLocaleString('pt-BR')+' até '+new Date(to.value).toLocaleString('pt-BR')+' · até 100 registros por categoria.';exportEnabled(query);
   const responses=await Promise.all(['/api/leituras','/api/acionamentos','/api/eventos'].map(url=>window.sdaRequest(url+query+'&limit=100')));
   const [h,a,e]=await Promise.all(responses.map(r=>r.json()));if(!responses.every(r=>r.ok))throw new Error(h.mensagem||a.mensagem||e.mensagem||'Consulta indisponível');
   if(!Array.isArray(h.leituras)||!Array.isArray(a.acionamentos)||!Array.isArray(e.eventos))throw new Error('Resposta de histórico inválida. Tente consultar novamente.');
   view.renderReadings(h.leituras);view.renderActions(a.acionamentos);view.renderEvents(e.eventos);message.dataset.state='success';message.textContent='Consulta concluída. Resumos e filtros locais usam somente os registros carregados.';
  }catch(error){view.reset('Consulta indisponível. Tente novamente.');message.dataset.state='error';message.textContent=error.message||'Histórico indisponível.';}finally{loading=false;refresh.disabled=false;from.disabled=to.disabled=false;panel.setAttribute('aria-busy','false');}}
 socket.on('evento',view.addEvent);refresh.addEventListener('click',load);
 // Histórico independe da montagem dos controles existentes de Configurações.
 load();
 const settingsRoot=document.querySelector('#settings-section .section-content')||panel,settingsPanel=node('section',undefined,settingsRoot);settingsPanel.className='shared-card';const settingsMessage=node('p','',settingsPanel);settingsMessage.setAttribute('role','status');node('h4','Vazão por bomba (L/min) — consumo sempre ESTIMATIVA',settingsPanel);const flowInputs=[];
 const settings=await (await window.sdaRequest('/api/configuracoes')).json();
 for(let i=0;i<3;i++){const label=node('label',' Bomba '+(i+1)+' ',settingsPanel),input=node('input',undefined,label);input.type='number';input.min='0.0001';input.step='any';input.placeholder='sem calibração';input.value=settings.vazoes_l_min[i]??'';input.disabled=!master;flowInputs.push(input);}
 const save=node('button','Salvar vazões',settingsPanel);save.disabled=!master;save.addEventListener('click',async()=>{const response=await window.sdaRequest('/api/configuracoes',{method:'PUT',body:JSON.stringify({vazoes_l_min:flowInputs.map(i=>i.value===''?null:Number(i.value))})});settingsMessage.textContent=response.ok?'Vazões salvas. Consumo permanece ESTIMATIVA.':(await response.json()).mensagem;});
 if(session.simulate&&master){const simulationPanel=node('section',undefined,settingsRoot);simulationPanel.className='shared-card';node('h4','Controles de SIMULAÇÃO (sem hardware)',simulationPanel);const simulationMessage=node('p','',simulationPanel);simulationMessage.setAttribute('role','status');for(const [label,body] of [['Pausar telemetria',{paused:true}],['Retomar telemetria',{paused:false}],['Cenário normal',{paused:false,scenario:'normal'}],['Rio seco',{scenario:'rio_seco'}],['Solo seco',{scenario:'solo_seco'}],['Falha DHT',{scenario:'erro_dht'}]]){const button=node('button',label,simulationPanel);button.addEventListener('click',async()=>{const response=await window.sdaRequest('/api/simulacao',{method:'POST',body:JSON.stringify(body)});simulationMessage.textContent=response.ok?'SIMULAÇÃO atualizada.':(await response.json()).mensagem;});}}
});
