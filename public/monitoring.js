// Apresentação operacional: texto seguro, fonte explícita e histórico do backend.
document.addEventListener('DOMContentLoaded',async()=>{
 const session=await window.sdaReady,master=session.usuario.nivel==='master',socket=window.sdaSocket;
 const node=(tag,text,parent)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(parent)parent.append(el);return el;};
 const panel=node('section',undefined,document.querySelector('main'));panel.id='monitoring-panel';panel.style.cssText='border:1px solid #587080;border-radius:12px;padding:20px;margin:24px 0;overflow:auto';
 node('h3','Histórico, eventos e configuração',panel);
 const source=node('strong',session.simulate?'SIMULAÇÃO — dados virtuais':'HARDWARE — firmware NÃO VALIDADO',panel);source.id='data-source';
 const status=node('p','Aguardando telemetria',panel);status.id='telemetry-status';
 const applyState=state=>{status.textContent=state.connected?(state.simulate?'SIMULAÇÃO conectada':'Arduino conectado'):(state.simulate?'SIMULAÇÃO sem dados':'Arduino desconectado — sem dados');};
 socket.on('estado_sistema',applyState);
 socket.on('disconnect',()=>{status.textContent='Servidor desconectado — sem dados';if(typeof setBombaStatus==='function')setBombaStatus(null);document.getElementById('texto-bomba').textContent='STATUS: DESCONHECIDO';for(const id of ['texto-umidade','texto-temp','texto-umid-ar','texto-agua'])document.getElementById(id).textContent='sem dados';for(const id of ['prog-umidade','prog-temp','prog-umid-ar','prog-agua'])document.getElementById(id).style.width='0%';});
 const current=await window.sdaRequest('/api/estado');if(current.ok)applyState(await current.json());
 const message=node('p','',panel);message.setAttribute('role','status');
 const from=node('input',undefined,panel),to=node('input',undefined,panel);from.type=to.type='datetime-local';from.setAttribute('aria-label','Início do histórico');to.setAttribute('aria-label','Fim do histórico');
 const local=date=>new Date(date-date.getTimezoneOffset()*60000).toISOString().slice(0,16);from.value=local(new Date(Date.now()-86400000));to.value=local(new Date(Date.now()+60000));
 window.sdaHistoryQuery=()=>'?de='+encodeURIComponent(new Date(from.value).toISOString())+'&ate='+encodeURIComponent(new Date(to.value).toISOString());
 const refresh=node('button','Consultar período',panel),csv=node('a','Exportar histórico completo CSV',panel);csv.style.margin='12px';
 const history=node('pre','',panel),actions=node('pre','',panel),events=node('ul',undefined,panel);history.id='reading-history';actions.id='water-estimate';events.id='operational-events';
 async function load(){try{const query=window.sdaHistoryQuery();csv.href='/api/leituras.csv'+query;
  const responses=await Promise.all(['/api/leituras','/api/acionamentos','/api/eventos'].map(url=>window.sdaRequest(url+query+'&limit=100')));
  const [h,a,e]=await Promise.all(responses.map(r=>r.json()));if(!responses.every(r=>r.ok))throw new Error(h.mensagem||a.mensagem||e.mensagem||'Consulta indisponível');
  history.textContent='Última consulta: '+h.leituras.length+' leituras (até 100 exibidas; CSV contém todo o período).\n'+h.leituras.map(r=>new Date(r.data_hora).toLocaleString('pt-BR')+' | '+(r.simulado?'SIMULAÇÃO':'HARDWARE')+' | solo '+(r.solo??'sem dados')+'% | '+(r.temperatura??'sem dados')+'°C | ar '+(r.umidade_ar??'sem dados')+'% | níveis '+[r.nivel_rio,r.nivel_poco,r.nivel_caixa].map(v=>v??'sem dados').join('/')+' | bombas '+r.bombas.map(v=>v===null?'?':v?'ON':'OFF').join('/')).join('\n');
  const known=a.acionamentos.filter(r=>r.volume_estimado_l!==null&&r.volume_estimado_l!==undefined);const volume=known.reduce((sum,r)=>sum+Number(r.volume_estimado_l),0);
  actions.textContent='Consumo de água: ESTIMATIVA — '+(known.length?volume.toFixed(3)+' L estimados nos ciclos concluídos':'sem ciclos concluídos com vazão calibrada')+'\n'+a.acionamentos.map(r=>'Bomba '+r.bomba+' • '+r.origem+' • '+r.status+' • '+(r.simulado?'SIMULAÇÃO':'HARDWARE')+' • '+(r.volume_estimado_l==null?'volume indisponível':Number(r.volume_estimado_l).toFixed(3)+' L — ESTIMATIVA')).join('\n');
  events.replaceChildren();e.eventos.forEach(addEvent);message.textContent='Consulta concluída.';
 }catch(error){message.textContent=error.message||'Histórico indisponível.';}}
 function addEvent(e){const item=node('li',new Date(e.data_hora).toLocaleString('pt-BR')+' • '+e.severidade+' • '+e.tipo+' • '+e.mensagem);events.prepend(item);while(events.children.length>100)events.lastChild.remove();}
 socket.on('evento',addEvent);refresh.addEventListener('click',load);
 node('h4','Vazão por bomba (L/min) — consumo sempre ESTIMATIVA',panel);const flowInputs=[];
 const settings=await (await window.sdaRequest('/api/configuracoes')).json();
 for(let i=0;i<3;i++){const label=node('label',' Bomba '+(i+1)+' ',panel),input=node('input',undefined,label);input.type='number';input.min='0.0001';input.step='any';input.placeholder='sem calibração';input.value=settings.vazoes_l_min[i]??'';input.disabled=!master;flowInputs.push(input);}
 const save=node('button','Salvar vazões',panel);save.disabled=!master;save.addEventListener('click',async()=>{const response=await window.sdaRequest('/api/configuracoes',{method:'PUT',body:JSON.stringify({vazoes_l_min:flowInputs.map(i=>i.value===''?null:Number(i.value))})});message.textContent=response.ok?'Vazões salvas. Consumo permanece ESTIMATIVA.':(await response.json()).mensagem;});
 if(session.simulate&&master){node('h4','Controles de SIMULAÇÃO (sem hardware)',panel);for(const [label,body] of [['Pausar telemetria',{paused:true}],['Retomar telemetria',{paused:false}],['Cenário normal',{paused:false,scenario:'normal'}],['Rio seco',{scenario:'rio_seco'}],['Solo seco',{scenario:'solo_seco'}],['Falha DHT',{scenario:'erro_dht'}]]){const button=node('button',label,panel);button.addEventListener('click',async()=>{const response=await window.sdaRequest('/api/simulacao',{method:'POST',body:JSON.stringify(body)});message.textContent=response.ok?'SIMULAÇÃO atualizada.':(await response.json()).mensagem;});}}
 await load();
});
