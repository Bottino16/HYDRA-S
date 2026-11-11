document.addEventListener('DOMContentLoaded',async()=>{
 const session=await window.sdaReady,master=session.usuario.nivel==='master',main=document.querySelector('main');
 const el=(tag,text,parent)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(parent)parent.append(node);return node;};
 const panel=el('section');panel.id='soil-assistant';panel.hidden=true;main.append(panel);
 const nav=document.querySelector('aside nav')||document.querySelector('nav');const open=el('button','Assistente do Solo',nav);open.className='nav-btn';open.type='button';open.setAttribute('aria-controls',panel.id);
 const previous=new Map();let viewing=false;
 function hideOthers(){for(const child of main.children)if(child!==panel&&child.id!=='sda-system-banner'){if(!previous.has(child))previous.set(child,child.hidden);child.hidden=true;}}
 function view(value){viewing=value;panel.hidden=!value;open.setAttribute('aria-expanded',String(value));if(value)hideOthers();else{for(const [child,hidden] of previous)child.hidden=hidden;previous.clear();}}
 const observer=new MutationObserver(()=>{if(viewing)hideOthers();});observer.observe(main,{childList:true});open.addEventListener('click',()=>view(true));
 el('h2','Assistente do Solo',panel);const back=el('button','Voltar à telemetria',panel);back.addEventListener('click',()=>view(false));
 const badge=el('p','Carregando assistente…',panel);badge.id='assistant-mode';
 el('p','A IA pode errar. Confirme orientações com análise de solo e agrônomo. Firmware NÃO VALIDADO; dados desta apresentação são simulados. Nenhuma bomba é acionada pelo chat.',panel).className='assistant-notice';
 el('p','Não envie nomes, e-mails, senhas, tokens ou outros dados pessoais. O envio à IA usa somente contexto sanitizado.',panel).className='assistant-notice';
 const toolbar=el('div',undefined,panel);toolbar.className='assistant-toolbar';const select=el('select',undefined,toolbar);select.setAttribute('aria-label','Conversas do assistente');const fresh=el('button','Nova conversa',toolbar),older=el('button','Carregar mensagens anteriores',toolbar);older.hidden=true;const more=el('button','Mais conversas',toolbar);more.hidden=true;
 const messages=el('div',undefined,panel);messages.id='assistant-messages';messages.setAttribute('aria-label','Mensagens do assistente');
 const status=el('p','',panel);status.id='assistant-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const quick=el('div',undefined,panel);quick.className='assistant-toolbar';const quickButtons=[];
 const form=el('form',undefined,panel),label=el('label','Sua pergunta sobre solo e irrigação',form),input=el('textarea',undefined,label);input.id='assistant-input';input.required=true;input.maxLength=2000;input.placeholder='Ex.: Meu solo está seco?';
 const submit=el('button','Enviar',form);submit.type='submit';const cancel=el('button','Interromper resposta',form);cancel.type='button';cancel.hidden=true;
 let conversationId=null,busy=false,abort=null,nextBefore=null,nextOffset=null;
 function setBusy(value){busy=value;submit.disabled=value;fresh.disabled=value;select.disabled=value;older.disabled=value;more.disabled=value;quickButtons.forEach(b=>b.disabled=value);cancel.hidden=!value;}
 function message(role,text,metadata={}){
  const card=el('article',undefined,messages);card.className='assistant-message';card.dataset.role=role;el('strong',role==='user'?'Você':'Assistente do Solo',card);
  if(role==='assistant')el('small',metadata.demo?'Resposta de demonstração, sem IA real.':'Resposta de IA • confira antes de aplicar',card).className='assistant-meta';
  const content=el('div',undefined,card);window.sdaMarkdown(content,text);
  if(role==='assistant'){
   const copy=el('button','Copiar resposta',card);copy.type='button';copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(content.textContent);status.textContent='Resposta copiada.';}catch{status.textContent='Não foi possível copiar. Selecione o texto manualmente.';}});
   if(metadata.partial)el('small','Resposta parcial/interrompida.',card).className='assistant-meta';
   if(metadata.sources?.length)el('small','Documentos recuperados: '+metadata.sources.map(s=>s.id).join(', '),card).className='assistant-meta';
  }
  messages.scrollTop=messages.scrollHeight;return {card,content};
 }
 async function list(offset=0){const response=await window.sdaRequest('/api/conversas?offset='+offset),data=await response.json();if(!response.ok)throw new Error(data.mensagem||'Lista indisponível.');if(offset===0){select.replaceChildren();const empty=el('option','Selecione uma conversa',select);empty.value='';}nextOffset=data.nextOffset;more.hidden=nextOffset===null;for(const c of data.conversas||[]){const option=el('option','Conversa — '+new Date(c.criada_em).toLocaleString('pt-BR'),select);option.value=c.conversa_id;}select.value=conversationId||'';}
 more.addEventListener('click',()=>list(nextOffset).catch(()=>{status.textContent='Não foi possível carregar outras conversas.';}));
 async function load(append=false){try{if(!conversationId)return;const response=await window.sdaRequest('/api/conversas/'+encodeURIComponent(conversationId)+(append?'?before='+nextBefore:'')),data=await response.json();if(!response.ok){status.textContent=data.mensagem;return;}if(!append)messages.replaceChildren();const previousNodes=append?[...messages.children]:[];if(append)messages.replaceChildren();for(const row of data.mensagens)message(row.papel,row.mensagem,row.metadados);if(append)messages.append(...previousNodes);nextBefore=data.nextBefore;older.hidden=!nextBefore;}catch{status.textContent='Não foi possível carregar a conversa. O painel continua funcionando.';}}
 fresh.addEventListener('click',async()=>{try{const response=await window.sdaRequest('/api/conversas',{method:'POST',body:'{}'});const data=await response.json();if(response.ok){conversationId=data.conversaId;await list();await load();input.focus();}else status.textContent=data.mensagem;}catch{status.textContent='Não foi possível criar a conversa. Tente novamente.';}});
 select.addEventListener('change',async()=>{conversationId=select.value||null;if(conversationId)await load();else messages.replaceChildren();});older.addEventListener('click',()=>load(true));cancel.addEventListener('click',()=>abort?.abort());
 for(const question of ['Meu solo está seco?','Qual a umidade ideal para alface?','Devo irrigar hoje?']){const button=el('button',question,quick);button.type='button';quickButtons.push(button);button.addEventListener('click',()=>{input.value=question;form.requestSubmit();});}
 function applyButton(card,suggestion){if(!master||!suggestion)return;const apply=el('button','Aplicar sugestão',card);apply.type='button';el('small',suggestion.label,card).className='assistant-meta';apply.addEventListener('click',async()=>{
  if(Date.now()>suggestion.expiresAt){status.textContent='Sugestão expirada. Consulte o estado e pergunte novamente.';apply.disabled=true;return;}
  if(!confirm(suggestion.label+' Confirmar envio manual? As travas do controlador continuam obrigatórias.'))return;
  apply.disabled=true;status.textContent='Aguardando ACK do controlador…';
  try{const response=await window.sdaRequest('/api/bombas/'+suggestion.bomba,{method:'POST',body:JSON.stringify({on:true,ms:suggestion.ms})}),data=await response.json();status.textContent=response.ok?(data.ack.pumps[suggestion.bomba-1]?'Saída ligada confirmada pelo ACK (SIMULAÇÃO).':'ACK recebido: bomba desligada ou em espera; observe o estado confirmado.'):(data.mensagem||'Comando bloqueado.');}catch{status.textContent='Sem confirmação do controlador. Nenhum estado ligado foi presumido.';}
 });}
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy||!input.value.trim())return;const question=input.value.trim();input.value='';setBusy(true);status.textContent='Digitando…';message('user',question);let target=null,text='',done=false;abort=new AbortController();
  try{
   const response=await window.sdaRequest('/api/chat',{method:'POST',body:JSON.stringify({mensagem:question,...(conversationId?{conversaId:conversationId}:{})}),signal:abort.signal});
   if(!response.ok){status.textContent=(await response.json()).mensagem;return;}
   const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
   function frame(value){let type='',data='';for(const line of value.split('\n')){if(line.startsWith('event: '))type=line.slice(7);if(line.startsWith('data: '))data+=line.slice(6);}if(!data)return;const payload=JSON.parse(data);
    if(type==='meta'){conversationId=payload.conversaId;target=message('assistant','',{demo:payload.demo,sources:payload.sources});el('small',payload.fonte+' • '+payload.telemetria,target.card).className='assistant-meta';}
    if(type==='delta'&&target){text+=payload.text;window.sdaMarkdown(target.content,text);messages.scrollTop=messages.scrollHeight;}
    if(type==='error'){status.textContent=payload.mensagem;if(target)el('small','Resposta parcial/interrompida.',target.card).className='assistant-meta';done=true;}
    if(type==='done'){status.textContent=payload.limited?'Resposta limitada pelo tamanho máximo.':'Resposta concluída. Revise antes de aplicar.';done=true;if(target)applyButton(target.card,payload.suggestion);}
   }
   while(true){const chunk=await reader.read();if(chunk.done)break;buffer+=decoder.decode(chunk.value,{stream:true});let at;while((at=buffer.indexOf('\n\n'))>=0){frame(buffer.slice(0,at));buffer=buffer.slice(at+2);}}
   if(!done)status.textContent='Resposta interrompida. Tente novamente.';
  }catch(error){status.textContent=error.name==='AbortError'?'Resposta interrompida pelo usuário.':'Assistente indisponível. O painel continua funcionando.';}
  finally{setBusy(false);abort=null;await list().catch(()=>{});}
 });
 try{const config=await (await window.sdaRequest('/api/chat/status')).json();badge.textContent=config.demo?'DEMONSTRAÇÃO — sem IA real':config.configured?'Claude via backend • SIMULAÇÃO de sensores':'Assistente sem configuração • use demonstração ou configure o backend';input.maxLength=config.messageMaxChars;await list();}catch{badge.textContent='Assistente indisponível; telemetria preservada.';}
});
