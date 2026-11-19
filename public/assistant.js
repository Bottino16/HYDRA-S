document.addEventListener('DOMContentLoaded',async()=>{
 const session=await window.sdaReady,master=session.usuario.nivel==='master',main=document.querySelector('main');
 const el=(tag,text,parent)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(parent)parent.append(node);return node;};
 const panel=el('section');panel.id='soil-assistant';panel.hidden=true;main.append(panel);
 const nav=document.getElementById('assistant-nav-slot')||document.querySelector('aside nav')||document.querySelector('nav');const open=el('button','Assistente do Solo',nav);open.className='nav-btn';open.type='button';open.setAttribute('aria-controls',panel.id);
 const previous=new Map();let viewing=false;const dashboard=document.getElementById('dashboard-nav');open.id='assistant-nav';open.dataset.appTarget='assistant';window.sdaSections?.register('assistant',panel);open.setAttribute('aria-expanded','false');
 function hideOthers(){for(const child of main.children)if(child!==panel&&child.id!=='sda-system-banner'){if(!previous.has(child))previous.set(child,child.hidden);child.hidden=true;}}
 function view(value){if(window.sdaSections){window.sdaSections.show(value?'assistant':'overview');return;}viewing=value;panel.hidden=!value;open.setAttribute('aria-expanded',String(value));if(value)hideOthers();else{for(const [child,hidden] of previous)child.hidden=hidden;previous.clear();}open.classList.toggle('is-active',value);dashboard?.classList.toggle('is-active',!value);if(value){open.setAttribute('aria-current','page');dashboard?.removeAttribute('aria-current');}else{open.removeAttribute('aria-current');dashboard?.setAttribute('aria-current','page');}document.dispatchEvent(new CustomEvent('sda:viewchange',{detail:{assistant:value}}));}
 const observer=new MutationObserver(()=>{if(viewing)hideOthers();});if(!window.sdaSections){observer.observe(main,{childList:true});open.addEventListener('click',()=>view(true));}
 const heading=el('header',undefined,panel);heading.className='assistant-heading';const identity=el('div',undefined,heading);el('span','HYDRA-S / INTELIGÊNCIA AGRONÔMICA',identity).className='assistant-eyebrow';el('h2','Assistente do Solo',identity);const headingActions=el('div',undefined,heading);headingActions.className='assistant-heading-actions';const historyToggle=el('button','Conversas',headingActions);historyToggle.type='button';historyToggle.id='assistant-history-toggle';historyToggle.setAttribute('aria-controls','assistant-history');historyToggle.setAttribute('aria-expanded','false');const back=el('button','Voltar ao painel',headingActions);back.type='button';back.className='back-to-dashboard';back.addEventListener('click',()=>{view(false);const target=main.querySelector('#overview-section h2')||main.querySelector('.page-header h2')||dashboard;target?.setAttribute('tabindex','-1');target?.focus();});if(!window.sdaSections)dashboard?.addEventListener('click',()=>view(false));
 const badge=el('p','Carregando assistente…',panel);badge.id='assistant-mode';
 const workspace=el('div',undefined,panel);workspace.className='assistant-workspace';const historyBackdrop=el('button',undefined,workspace);historyBackdrop.type='button';historyBackdrop.className='assistant-history-backdrop';historyBackdrop.setAttribute('aria-label','Fechar histórico');historyBackdrop.hidden=true;
 const historyPanel=el('div',undefined,workspace);historyPanel.id='assistant-history';historyPanel.setAttribute('role','complementary');historyPanel.setAttribute('aria-label','Histórico de conversas');el('span','SEU CADERNO DE CAMPO',historyPanel).className='assistant-eyebrow';el('h3','Conversas',historyPanel);const toolbar=el('div',undefined,historyPanel);toolbar.className='assistant-toolbar';const fresh=el('button','Nova conversa',toolbar);fresh.type='button';fresh.className='assistant-primary';const select=el('select',undefined,historyPanel);select.setAttribute('aria-label','Conversas do assistente');select.hidden=true;const historyList=el('div',undefined,historyPanel);historyList.id='assistant-history-list';historyList.setAttribute('aria-label','Conversas disponíveis');historyList.tabIndex=0;const historyEmpty=el('p','Suas conversas aparecerão aqui.',historyPanel);historyEmpty.className='assistant-history-empty';const more=el('button','Mais conversas',historyPanel);more.type='button';more.hidden=true;
 const chat=el('div',undefined,workspace);chat.className='assistant-chat';const notices=el('details',undefined,chat);notices.className='assistant-safety';el('summary','SIMULAÇÃO • orientação educativa, sem acionamento automático',notices);el('p','A IA pode errar. Confirme orientações com análise de solo e agrônomo. Firmware NÃO VALIDADO. Nenhuma bomba é acionada pelo chat.',notices).className='assistant-notice';el('p','Não envie nomes, e-mails, senhas, tokens ou outros dados pessoais. O envio à IA usa somente contexto sanitizado.',notices).className='assistant-notice';
 const transcript=el('div',undefined,chat);transcript.className='assistant-transcript';const older=el('button','Carregar mensagens anteriores',transcript);older.type='button';older.hidden=true;const messages=el('div',undefined,transcript);messages.id='assistant-messages';messages.setAttribute('aria-label','Mensagens do assistente');messages.setAttribute('role','log');messages.setAttribute('aria-live','off');messages.tabIndex=0;
 const composer=el('div',undefined,chat);composer.className='assistant-composer';const generation=el('span','Gerando orientação…',composer);generation.className='assistant-generation';generation.hidden=true;generation.setAttribute('aria-hidden','true');const status=el('p','',composer);status.id='assistant-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');const quick=el('div',undefined,composer);quick.className='assistant-quick';const quickButtons=[];
 const form=el('form',undefined,composer),label=el('label','Sua pergunta sobre solo e irrigação',form),input=el('textarea',undefined,label);input.id='assistant-input';input.required=true;input.maxLength=2000;input.rows=2;input.placeholder='Pergunte sobre o solo, cultivo ou irrigação…';const composerActions=el('div',undefined,form);composerActions.className='assistant-composer-actions';const submit=el('button','Enviar',composerActions);submit.type='submit';submit.className='assistant-primary';const cancel=el('button','Interromper resposta',composerActions);cancel.type='button';cancel.hidden=true;const counter=el('small','0 / 2000 caracteres',composerActions);counter.id='assistant-counter';const hint=el('small','Ctrl+Enter envia · Enter quebra linha · a IA pode errar',composer);hint.className='assistant-disclaimer';hint.id='assistant-input-hint';input.setAttribute('aria-describedby','assistant-counter assistant-input-hint');input.addEventListener('input',()=>{counter.textContent=input.value.length+' / '+input.maxLength+' caracteres';input.style.height='auto';input.style.height=Math.min(144,Math.max(56,input.scrollHeight))+'px';});input.addEventListener('keydown',event=>{if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)&&!event.isComposing){event.preventDefault();if(!busy)form.requestSubmit();}});
 let loadedRows=[],models=new Map(),historyViews=new Map();
 let conversationId=null,busy=false,abort=null,nextBefore=null,nextOffset=null,historyLoading=false;
 const historyMedia=window.matchMedia?.('(max-width: 900px)')||{matches:false};historyPanel.tabIndex=-1;
 function syncLayout(){const active=window.sdaSections?window.sdaSections.active==='assistant':viewing;document.body.classList.toggle('assistant-view',active);if(active){const viewport=window.visualViewport;document.body.style.setProperty('--chat-viewport-height',viewport&&viewport.scale===1?viewport.height+'px':'100dvh');}else historyDrawer(false);}
 document.addEventListener('sda:viewchange',syncLayout);window.addEventListener('resize',syncLayout);window.visualViewport?.addEventListener('resize',syncLayout);historyMedia.addEventListener?.('change',()=>historyDrawer(false));syncLayout();
 function historyDrawer(value,restore=false){historyPanel.inert=historyMedia.matches&&!value;chat.inert=historyMedia.matches&&value;historyPanel.setAttribute('role',historyMedia.matches&&value?'dialog':'complementary');if(historyMedia.matches&&value)historyPanel.setAttribute('aria-modal','true');else historyPanel.removeAttribute('aria-modal');workspace.classList.toggle('history-open',value);historyToggle.setAttribute('aria-expanded',String(value));historyBackdrop.hidden=!value;if(value)(historyPanel.querySelector('button:not(:disabled)')||historyPanel).focus();else if(restore)historyToggle.focus();}
 historyToggle.addEventListener('click',()=>historyDrawer(!workspace.classList.contains('history-open')));historyBackdrop.addEventListener('click',()=>historyDrawer(false,true));document.addEventListener('keydown',event=>{if(!workspace.classList.contains('history-open'))return;if(event.key==='Escape'){historyDrawer(false,true);event.preventDefault();}if(event.key==='Tab'&&historyMedia.matches){const nodes=[...historyPanel.querySelectorAll('button:not(:disabled),[tabindex="0"]')].filter(n=>n.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&(document.activeElement===first||document.activeElement===historyPanel)){event.preventDefault();(last||historyPanel).focus();}else if(!event.shiftKey&&(document.activeElement===last||!first)){event.preventDefault();(first||historyPanel).focus();}}});historyDrawer(false);
 function historySelection(){for(const button of historyList.querySelectorAll('button')){const selected=button.dataset.conversationId===conversationId;button.classList.toggle('is-selected',selected);button.setAttribute('aria-pressed',String(selected));button.disabled=busy||historyLoading;}}
 function setBusy(value){busy=value;panel.dataset.busy=String(value);messages.setAttribute('aria-busy',String(value));generation.hidden=!value;const locked=value||historyLoading;submit.disabled=locked;fresh.disabled=locked;select.disabled=locked;older.disabled=locked;more.disabled=locked;quickButtons.forEach(b=>b.disabled=locked);cancel.hidden=!value;messages.querySelectorAll('.assistant-continue').forEach(button=>button.disabled=locked||button.dataset.consumed==='true');historySelection();}
 let following=true,expectedScrollTop=null;messages.addEventListener('scroll',()=>{if(expectedScrollTop!==null&&Math.abs(messages.scrollTop-expectedScrollTop)<2)return;expectedScrollTop=null;following=messages.scrollHeight-messages.scrollTop-messages.clientHeight<64;});
 function scrollEnd(force=false){if(following||force){messages.scrollTop=messages.scrollHeight;expectedScrollTop=messages.scrollTop;}}
 function emptyConversation(){if(messages.childElementCount)return;const empty=el('div',undefined,messages);empty.className='assistant-empty';el('span','◈',empty).setAttribute('aria-hidden','true');el('h3','Vamos cuidar do seu solo?',empty);el('p','Pergunte sobre umidade, cultivo ou irrigação. As leituras da maquete são simuladas.',empty);}
 emptyConversation();
 function engineLabel(data){return data.demo?'Resposta de demonstração, sem IA real.':data.provider==='ollama'?'Ollama local • '+data.model:data.provider==='claude'?'Claude • '+data.model:'Resposta de IA • confira antes de aplicar';}
 function renderSources(card,metadata){
  const previousSources=card.querySelector('.assistant-sources'),sourcesOpen=previousSources?.open,sourcesFocused=previousSources?.contains(document.activeElement);previousSources?.remove();
  if(!metadata.sources?.length&&!metadata.referenceReview)return;
  const details=el('details',undefined,card);details.className='assistant-sources';details.open=!!sourcesOpen;const sourceSummary=el('summary','Fontes e rastreabilidade',details);if(sourcesFocused)sourceSummary.focus({preventScroll:true});
  el('p',metadata.referenceReview?'Evidências enviadas ao modelo:':'Registro antigo de fontes, sem auditoria de trechos:',details);
  if(!metadata.sources?.length)el('p','Sem evidência documental selecionada para esta parte.',details);
  const items=el('ul',undefined,details);for(const source of metadata.sources||[]){const item=el('li',undefined,items);el('strong',source.title||source.id,item);el('small',source.id,item);}
  if(metadata.referenceReview?.state==='context-only')el('p','Citações ainda não conferidas para esta parte.',details);
  else if(metadata.referenceReview){el('p','IDs citados nesta resposta: '+((metadata.citations||[]).map(s=>s.id).join(', ')||'nenhum'),details);if(metadata.referenceReview.removed)el('p','Referências não verificadas do texto foram omitidas.',details);}
  el('p','Envio de evidência ou ID válido não comprova a precisão de cada afirmação.',details);
 }
 function outcome(data={}){
  const reason=data.stopReason||(data.limited?'length':data.partial?'error':'stop');
  const labels={stop:'Resposta concluída. Revise antes de aplicar.',length:'Resposta limitada por tokens. A explicação pode estar incompleta.',output_cap:'Resposta interrompida pelo limite total de caracteres. O texto recebido foi preservado.',timeout:'Resposta parcial: tempo limite atingido.',cancelled:'Resposta parcial: interrompida pelo usuário.',memory:'Resposta parcial: proteção de memória acionada.',quota:'Resposta parcial: cota do assistente atingida.',context:'Resposta parcial: contexto disponível insuficiente.',error:'Resposta parcial/interrompida por erro.'};
  return {reason,text:labels[reason]||labels.error,state:reason==='stop'&&!data.partial?'success':['length','output_cap','cancelled'].includes(reason)?'warning':'error'};
 }
 function refresh(model,terminal=false){
  const last=model.parts.at(-1),metadata=last.metadata||{};
  window.sdaMarkdown(model.content,model.parts.map(p=>p.text).join('\n\n'));
  for(const part of model.parts)if(part.id)models.set(part.id,model);
  if(!model.card.id&&model.parts[0].id)model.card.id='assistant-message-'+model.parts[0].id;
  const sources=new Map(),citations=new Map();let removed=0,review;
  for(const part of model.parts){for(const source of part.metadata.sources||[])sources.set(source.id,source);for(const cited of part.metadata.citations||[])citations.set(cited.id||cited,typeof cited==='string'?{id:cited}:cited);if(part.metadata.referenceReview){review=part.metadata.referenceReview;removed+=review.removed||0;}}
  renderSources(model.card,{sources:[...sources.values()],citations:[...citations.values()],referenceReview:review?{...review,removed}:undefined});
  const previousParts=model.card.querySelector('.assistant-parts'),partsOpen=previousParts?.open,partsFocused=previousParts?.contains(document.activeElement);previousParts?.remove();
  if(model.parts.length>1||model.parts.some(p=>p.metadata.parts?.length>1)){
   const details=el('details',undefined,model.card);details.className='assistant-parts';details.open=!!partsOpen;const partSummary=el('summary','Partes e encerramento',details);if(partsFocused)partSummary.focus({preventScroll:true});
   const list=el('ol',undefined,details);let number=0;
   for(const part of model.parts){for(const segment of part.metadata.parts||[part.metadata])el('li','Geração '+(++number)+' · '+(part.metadata.streaming&&!terminal?'Gerando resposta…':outcome(segment).text),list);if(part.metadata.sources?.length)el('li','Evidências desta parte: '+part.metadata.sources.map(source=>source.id).join(', '),list);}
  }
  model.card.querySelector('.assistant-incomplete-history')?.remove();
  const missingRoot=model.parts[0].metadata.continuationOf&&model.parts[0].id!==model.parts[0].metadata.continuationOf;
  model.card.querySelector('.assistant-message-actions button').disabled=!!missingRoot;
  if(missingRoot)el('p','O início desta resposta não está carregado neste bloco. Carregue mensagens anteriores para copiar a resposta completa.',model.card).className='assistant-meta assistant-incomplete-history';
  if(terminal){
   model.card.querySelectorAll('.assistant-outcome,.assistant-continue,.assistant-continuation-note').forEach(n=>n.remove());
   const state=outcome(metadata),note=el('p',state.text,model.card);note.className='assistant-outcome';note.dataset.state=state.state;model.card.dataset.termination=state.reason;
   if(metadata.limited&&state.reason==='length'&&!metadata.partial)continuationButton(model.card,{...metadata,messageId:last.id});
  }
  scrollEnd();
 }
 function copyText(node){
  if(node.nodeType===3)return node.textContent;
  if(node.nodeName==='BR')return '\n';
  if(node.nodeName==='PRE')return node.textContent+'\n\n';
  const text=[...node.childNodes].map(copyText).join('');
  return text+(/^(P|H[1-6]|LI|BLOCKQUOTE)$/.test(node.nodeName)&&text?'\n\n':'');
 }
 function message(role,text,metadata={}){
  messages.querySelector('.assistant-empty')?.remove();const card=el('article',undefined,messages);card.className='assistant-message';card.dataset.role=role;card.dataset.provider=metadata.provider||'';if(role==='user')messages.querySelectorAll('.assistant-continue').forEach(button=>{button.dataset.consumed='true';button.disabled=true;button.title='Somente a última resposta limitada pode continuar.';});const author=el('header',undefined,card);author.className='assistant-author';const avatar=el('span',role==='user'?'V':'H',author);avatar.className='assistant-avatar';avatar.setAttribute('aria-hidden','true');el('strong',role==='user'?'Você':'Assistente do Solo',author);
  if(metadata.messageId)card.id='assistant-message-'+metadata.messageId;
  if(role==='assistant')el('small',engineLabel(metadata),card).className='assistant-meta';
  const content=el('div',undefined,card);content.className='assistant-content';window.sdaMarkdown(content,text);
  const model={card,content,parts:metadata.logicalParts||[{id:metadata.messageId,text,metadata}]};
  if(role==='assistant'){
   const actions=el('div',undefined,card);actions.className='assistant-message-actions';const copy=el('button','Copiar resposta',actions);copy.type='button';copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(copyText(content).trimEnd());status.dataset.state='success';status.textContent='Resposta copiada.';}catch{status.dataset.state='warning';status.textContent='Não foi possível copiar. Selecione o texto manualmente.';}});
   refresh(model,!metadata.streaming);
  }
  scrollEnd();return model;
 }
 function renderHistory(rows){
  messages.replaceChildren();models.clear();const previousViews=historyViews;historyViews=new Map();const groups=[];let active;
  for(const row of rows){const metadata=row.metadados||{};
   if(row.papel==='user'&&(metadata.kind==='continuacao'||metadata.automatic))continue;
   if(row.papel!=='assistant'){groups.push({origin:row,role:row.papel,text:row.mensagem,metadata});active=null;continue;}
   const part={id:row.id,text:row.mensagem,metadata};
   if(metadata.continuationOf&&active?.root===metadata.continuationOf)active.parts.push(part);
   else{active={origin:row,role:'assistant',root:metadata.continuationOf||row.id,parts:[part]};groups.push(active);}
  }
  let lastModel;
  for(const group of groups){let model=previousViews.get(group.origin);
   if(group.parts){const first=group.parts[0],last=group.parts.at(-1);if(model){model.parts=group.parts;messages.append(model.card);refresh(model,true);}else model=message('assistant','',{...first.metadata,...last.metadata,messageId:first.id,logicalParts:group.parts});}
   else if(model)messages.append(model.card);else model=message(group.role,group.text,group.metadata);
   historyViews.set(group.origin,model);lastModel=model;
  }
  messages.querySelectorAll('.assistant-continue').forEach(button=>{const consumed=button.closest('.assistant-message')!==lastModel?.card;button.dataset.consumed=String(consumed);button.disabled=busy||historyLoading||consumed;});
 }
 async function list(offset=0){const response=await window.sdaRequest('/api/conversas?offset='+offset),data=await response.json();if(!response.ok)throw new Error(data.mensagem||'Lista indisponível.');if(offset===0){historyList.replaceChildren();select.replaceChildren();const empty=el('option','Selecione uma conversa',select);empty.value='';}nextOffset=data.nextOffset;more.hidden=nextOffset===null;for(const c of data.conversas||[]){const option=el('option','Conversa — '+new Date(c.criada_em).toLocaleString('pt-BR'),select);option.value=c.conversa_id;const row=el('button',undefined,historyList);row.type='button';row.dataset.conversationId=c.conversa_id;el('span','Conversa do Solo',row);const stamp=new Date(c.criada_em);el('small',Number.isNaN(stamp.getTime())?'Data indisponível':stamp.toLocaleString('pt-BR'),row);row.addEventListener('click',()=>chooseConversation(c.conversa_id));}select.value=conversationId||'';historyEmpty.hidden=historyList.childElementCount>0;historySelection();}
 more.addEventListener('click',async()=>{if(busy||historyLoading)return;historyLoading=true;setBusy(busy);status.dataset.state='loading';status.textContent='Carregando outras conversas…';try{await list(nextOffset);status.dataset.state='success';status.textContent='Lista de conversas atualizada.';}catch{status.dataset.state='error';status.textContent='Não foi possível carregar outras conversas.';}finally{historyLoading=false;setBusy(busy);}});
 async function load(append=false){const oldHeight=messages.scrollHeight,oldTop=messages.scrollTop;try{if(!conversationId)return;const response=await window.sdaRequest('/api/conversas/'+encodeURIComponent(conversationId)+(append?'?before='+nextBefore:'')),data=await response.json();if(!response.ok){status.dataset.state='error';status.textContent=data.mensagem;return false;}
  const seen=new Set();loadedRows=(append?[...data.mensagens,...loadedRows]:data.mensagens).filter(row=>{if(row.id===undefined)return true;if(seen.has(row.id))return false;seen.add(row.id);return true;});
  const savedFollowing=following;following=false;renderHistory(loadedRows);nextBefore=data.nextBefore;older.hidden=!nextBefore;emptyConversation();if(append){messages.scrollTop=oldTop+messages.scrollHeight-oldHeight;following=savedFollowing;}else{following=true;scrollEnd(true);}status.dataset.state='success';status.textContent=append?'Mensagens anteriores recuperadas.':'Conversa recuperada.';return true;}catch{status.dataset.state='error';status.textContent='Não foi possível carregar a conversa. O painel continua funcionando.';return false;}}
 async function chooseConversation(id){if(busy||historyLoading)return;const previousId=conversationId;historyLoading=true;setBusy(busy);status.dataset.state='loading';status.textContent='Carregando conversa…';try{conversationId=id;select.value=id||'';if(conversationId){if(!await load()){conversationId=previousId;select.value=previousId||'';}}else{messages.replaceChildren();models.clear();loadedRows=[];emptyConversation();}historySelection();historyDrawer(false);input.focus();}finally{historyLoading=false;setBusy(busy);}}
 fresh.addEventListener('click',async()=>{if(busy||historyLoading)return;historyLoading=true;setBusy(busy);status.dataset.state='loading';status.textContent='Criando conversa…';try{const response=await window.sdaRequest('/api/conversas',{method:'POST',body:'{}'});const data=await response.json();if(response.ok){conversationId=data.conversaId;messages.replaceChildren();emptyConversation();await list();await load();historyDrawer(false);input.focus();}else{status.dataset.state='error';status.textContent=data.mensagem;}}catch{status.dataset.state='error';status.textContent='Não foi possível criar a conversa. Tente novamente.';}finally{historyLoading=false;setBusy(busy);}});
 select.addEventListener('change',()=>chooseConversation(select.value||null));older.addEventListener('click',async()=>{if(busy||historyLoading)return;historyLoading=true;setBusy(busy);try{await load(true);}finally{historyLoading=false;setBusy(busy);}});cancel.addEventListener('click',()=>abort?.abort());
 for(const question of ['Meu solo está seco?','Qual a umidade ideal para alface?','Devo irrigar hoje?']){const button=el('button',question,quick);button.type='button';quickButtons.push(button);button.addEventListener('click',()=>{input.value=question;form.requestSubmit();});}
 function applyButton(card,suggestion){if(!master||!suggestion)return;const apply=el('button','Aplicar sugestão',card);apply.type='button';el('small',suggestion.label,card).className='assistant-meta';apply.addEventListener('click',async()=>{
  if(Date.now()>suggestion.expiresAt){status.textContent='Sugestão expirada. Consulte o estado e pergunte novamente.';apply.disabled=true;return;}
  if(!confirm(suggestion.label+' Confirmar envio manual? As travas do controlador continuam obrigatórias.'))return;
  apply.disabled=true;status.textContent='Aguardando ACK do controlador…';
  try{const response=await window.sdaRequest('/api/bombas/'+suggestion.bomba,{method:'POST',body:JSON.stringify({on:true,ms:suggestion.ms})}),data=await response.json();status.textContent=response.ok?(data.ack.pumps[suggestion.bomba-1]?'Saída ligada confirmada pelo ACK (SIMULAÇÃO).':'ACK recebido: bomba desligada ou em espera; observe o estado confirmado.'):(data.mensagem||'Comando bloqueado.');}catch{status.textContent='Sem confirmação do controlador. Nenhum estado ligado foi presumido.';}
 });}
 function continuationButton(card,metadata){
  if(card.dataset.provider!=='ollama'||!metadata.messageId||metadata.partial||metadata.stopReason==='output_cap')return;if(metadata.canContinue===false){el('small',metadata.maxContinuations===0?'Continuação manual desativada na configuração.':'Limite de continuações atingido. Faça uma pergunta mais específica.',card).className='assistant-meta';return;}
  const button=el('button','Continuar resposta',card.querySelector('.assistant-message-actions')||card);button.type='button';button.className='assistant-continue';button.disabled=busy||historyLoading;
  button.addEventListener('click',()=>{if(busy||historyLoading)return;button.dataset.consumed='true';sendQuestion('Continuar resposta.',metadata.messageId);});
 }
 form.addEventListener('submit',event=>{event.preventDefault();if(busy||historyLoading||!input.value.trim())return;const question=input.value.trim();input.value='';counter.textContent='0 / '+input.maxLength+' caracteres';input.style.height='';sendQuestion(question);});
 async function sendQuestion(question,continuationId=null){
  if(busy||historyLoading)return;setBusy(true);status.dataset.state='loading';following=true;status.textContent='Gerando resposta…';generation.textContent='Gerando resposta…';if(!continuationId){message('user',question);loadedRows.push({papel:'user',mensagem:question,metadados:{}});}let target=null,part=null,text='',done=false,contextSources=[];abort=new AbortController();
  try{
   const response=await window.sdaRequest('/api/chat',{method:'POST',body:JSON.stringify({...(continuationId?{continuarRespostaId:continuationId}:{mensagem:question}),...(conversationId?{conversaId:conversationId}:{})}),signal:abort.signal});
   if(!response.ok){status.dataset.state='error';status.textContent=(await response.json()).mensagem;return;}
   const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
   function frame(value){let type='',data='';for(const line of value.split('\n')){if(line.startsWith('event: '))type=line.slice(7);if(line.startsWith('data: '))data+=line.slice(6);}if(!data)return;const payload=JSON.parse(data);
    if(done)return;
    if(type==='meta'){
     contextSources=payload.sources||[];conversationId=payload.conversaId;const metadata={...payload,streaming:true};
     target=continuationId?models.get(continuationId):null;
     if(target){part={text:'',metadata};target.parts.push(part);target.card.querySelectorAll('.assistant-outcome,.assistant-continue,.assistant-continuation-note').forEach(n=>n.remove());}
     else{target=message('assistant','',metadata);part=target.parts[0];el('small',payload.fonte+' • '+payload.telemetria,target.card).className='assistant-meta';}
     part.row={papel:'assistant',mensagem:'',metadados:metadata};loadedRows.push(part.row);
    }
    if(type==='generation'){const continuing=payload.phase==='continuation';generation.textContent=continuing?'Continuando resposta automaticamente…':'Gerando resposta…';status.dataset.state='loading';status.textContent=generation.textContent;}
    if(type==='delta'&&target){text+=payload.text;part.text=text;refresh(target);}
    if((type==='done'||type==='review')&&target){if(typeof payload.reviewedText==='string'){text=payload.reviewedText;part.text=text;}part.metadata={...part.metadata,...payload,sources:contextSources};if(payload.messageId)part.id=payload.messageId;refresh(target);}
    if(type==='error'){const metadata={stopReason:payload.stopReason||'error',partial:true,streaming:false};if(part){part.metadata={...part.metadata,...metadata};refresh(target,true);}const state=outcome(metadata);status.dataset.state=state.state;status.textContent=state.text+(payload.mensagem?' '+payload.mensagem:'');done=true;}
    if(type==='done'){const metadata={...payload,partial:!!payload.partial,streaming:false};const state=outcome(metadata);status.dataset.state=state.state;status.textContent=state.text;done=true;if(target){part.metadata={...part.metadata,...metadata};refresh(target,true);applyButton(target.card,payload.suggestion);}}

   }
   while(true){const chunk=await reader.read();if(chunk.done)break;buffer+=decoder.decode(chunk.value,{stream:true});let at;while((at=buffer.indexOf('\n\n'))>=0){frame(buffer.slice(0,at));buffer=buffer.slice(at+2);}}
   buffer+=decoder.decode();if(buffer.trim())frame(buffer);
   if(!done){status.dataset.state='warning';status.textContent='Resposta parcial/interrompida: conexão encerrada sem conclusão.';if(part){part.metadata={...part.metadata,partial:true,streaming:false,stopReason:'error'};refresh(target,true);}}
  }catch(error){status.dataset.state=error.name==='AbortError'?'warning':'error';status.textContent=error.name==='AbortError'?'Resposta interrompida pelo usuário.':'Assistente indisponível. O painel continua funcionando.';if(part){part.metadata={...part.metadata,partial:true,streaming:false,stopReason:error.name==='AbortError'?'cancelled':'error'};refresh(target,true);}}
  finally{if(part?.row){part.row.id=part.id;part.row.mensagem=part.text;part.row.metadados={...part.metadata};}setBusy(false);abort=null;await list().catch(()=>{});}
 }
 try{const config=await (await window.sdaRequest('/api/chat/status')).json();badge.textContent=config.demo?'DEMONSTRAÇÃO — sem IA real':config.configured?((config.provider==='ollama'?'Ollama local':'Claude via backend')+' • '+(config.model||'modelo não definido')+' • '+(session.simulate?'SIMULAÇÃO de sensores':'HARDWARE não validado')):'Assistente sem configuração • use demonstração ou configure o backend';input.maxLength=config.messageMaxChars;counter.textContent=input.value.length+' / '+input.maxLength+' caracteres';if(!config.configured){status.dataset.state='unavailable';status.textContent='Assistente sem configuração disponível. O restante do sistema continua funcionando.';}await list().catch(()=>{status.dataset.state='error';status.textContent='Não foi possível carregar as conversas. O motor selecionado permanece o mesmo.';historyEmpty.textContent='Histórico indisponível no momento.';});}catch{badge.textContent='Assistente indisponível; telemetria preservada.';status.dataset.state='unavailable';status.textContent='Não foi possível carregar o estado do assistente. Tente novamente mais tarde.';}
});
