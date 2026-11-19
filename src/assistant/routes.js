const {ReferenceGuard}=require('./references');
const {Router}=require('express');
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
function nextChunk(iterator,signal){return new Promise((resolve,reject)=>{const abort=()=>reject(new Error('cancelado'));if(signal.aborted)return abort();signal.addEventListener('abort',abort,{once:true});Promise.resolve(iterator.next()).then(resolve,reject).finally(()=>signal.removeEventListener('abort',abort));});}
function assistantRoutes(service){
 const router=Router();service.controllers=new Set();
 router.get('/chat/status',(req,res)=>res.json(service.status()));
 router.get('/conversas',wrap(async(req,res)=>{const offset=Number(req.query.offset||0);if(!Number.isSafeInteger(offset)||offset<0||offset>1000000)return res.status(400).json({mensagem:'Paginação inválida.'});const rows=await service.store.chatList(req.user.id,{offset});res.json({conversas:rows,nextOffset:rows.length===100?offset+100:null});}));
 router.post('/conversas',wrap(async(req,res)=>res.status(201).json({conversaId:await service.store.chatNew(req.user.id,service.cfg.demo)})));
 router.get('/conversas/:id',wrap(async(req,res)=>{const before=req.query.before===undefined?Number.MAX_SAFE_INTEGER:Number(req.query.before);if(!Number.isSafeInteger(before)||before<1)return res.status(400).json({mensagem:'Paginação inválida.'});const rows=await service.store.chatMessages(req.user.id,req.params.id,{before});if(!rows.length)return res.status(404).json({mensagem:'Conversa não encontrada.'});res.json({mensagens:rows,nextBefore:rows.length===100?rows[0].id:null});}));
 router.post('/chat',wrap(async(req,res)=>{
  const job=await service.prepare(req.user,req.body),controller=new AbortController();service.controllers.add(controller);let memoryLow=false,timedOut=false,text='',complete=false,limited=false,received=false,stopReason='stop';
  const timer=setTimeout(()=>{timedOut=true;controller.abort();},service.cfg.timeoutMs);timer.unref();const disconnect=()=>controller.abort();res.on('close',disconnect);
  const send=(event,data)=>{if(!res.destroyed)res.write('event: '+event+'\ndata: '+JSON.stringify(data)+'\n\n');};
  res.status(200).set({'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','X-Accel-Buffering':'no'});res.flushHeaders();
  send('meta',{provider:service.engine,model:service.cfg.demo?null:service.cfg.model,conversaId:job.id,demo:service.cfg.demo,fonte:job.context.fonte,telemetria:job.context.telemetria,continuationOf:job.rootId,continuationIndex:job.continuationIndex,sources:job.documents.map(d=>({id:d.id,title:d.title})),referenceReview:{version:1,state:'context-only'}});
  let iterator,flushPending=()=>{},rawLength=job.usedOutputChars||0,continuationIndex=job.continuationIndex;const partStops=[];
  const checkMemory=()=>{if(service.engine==='ollama'&&service.memoryAvailable()<180*1048576){memoryLow=true;controller.abort();}};
  const memoryTimer=setInterval(checkMemory,200);memoryTimer.unref();checkMemory();const guard=new ReferenceGuard(job.documents);
  const deliver=part=>{if(part){text+=part;send('delta',{text:part});}};
  const sessionTimer=setInterval(()=>req.sessionStore.get(req.sessionID,(error,data)=>{if(error||!data||data.expiresAt<=Date.now()||!service.store.byId(data.userId)?.ativo)controller.abort();}),1000);sessionTimer.unref();
  try{
   text=job.rootId?'':(service.cfg.demo?'**Resposta de demonstração, sem IA real.**\n\n':'')+(job.context.fonte==='SIMULAÇÃO'?'Estou analisando dados simulados.\n\n':'')+(job.context.telemetria==='sem dados'?'Sem dados recentes de sensores; não é possível avaliar o estado atual da maquete.\n\n':'');
   if(text){rawLength=text.length;send('delta',{text});}
   const cap=Math.min(service.cfg.maxTokens*12,12000),maxAuto=Math.min(service.cfg.autoContinuations??2,service.cfg.maxContinuations-job.continuationIndex);let automatic=0,request=job.request;
   while(true){
    checkMemory();if(controller.signal.aborted)throw new Error('interrompido');
    send('generation',{phase:automatic?'continuation':'initial',continuationIndex,automatic:automatic>0});
    iterator=service.provider.stream(request,{signal:controller.signal,context:job.context,documents:job.documents,question:job.question})[Symbol.asyncIterator]();
    let prefix='',prefixChecked=automatic===0,partReceived=false;
    const accept=chunk=>{const part=chunk.slice(0,Math.max(0,cap-rawLength));rawLength+=part.length;deliver(guard.push(part));};
    const flushPrefix=()=>{if(prefixChecked)return;prefixChecked=true;let overlap=0;for(let n=Math.min(512,(text+guard.pending).length,prefix.length);n>=24;n--)if((text+guard.pending).endsWith(prefix.slice(0,n))){overlap=n;break;}accept(prefix.slice(overlap));prefix='';};
    flushPending=flushPrefix;
    while(true){const item=await nextChunk(iterator,controller.signal);if(item.done){limited=!!item.value?.limited;stopReason=limited?'length':'stop';flushPrefix();break;}if(typeof item.value!=='string'||!item.value)continue;received=true;partReceived=true;if(!prefixChecked){prefix+=item.value;if(prefix.length>=512||![...Array(Math.min(512,(text+guard.pending).length)+1).keys()].slice(24).some(n=>(text+guard.pending).slice(-n).startsWith(prefix)))flushPrefix();}else accept(item.value);if(rawLength>=cap){limited=true;stopReason='output_cap';break;}}
    if(rawLength>=cap){limited=true;stopReason='output_cap';}
    partStops.push({continuationIndex,stopReason});
    await iterator.return?.();iterator=null;
    if(!partReceived)throw new Error('resposta vazia');
    if(service.engine!=='ollama'||stopReason!=='length'||automatic>=maxAuto)break;
    checkMemory();if(controller.signal.aborted)throw new Error('interrompido');
    request=await service.automaticContinuation(job,text+guard.pending,continuationIndex+1);continuationIndex++;automatic++;
   }
   deliver(guard.finish());
   if(!received)throw new Error('resposta vazia');
   const saved=await service.save(job,text,{partial:false,limited,stopReason,continuationIndex,outputChars:rawLength,parts:partStops,referenceReview:{removed:guard.removed}});complete=true;send('done',{conversaId:job.id,messageId:saved.id,continuationOf:job.rootId,continuationIndex,parts:partStops,partial:false,continuationLimitReached:limited&&stopReason==='length'&&continuationIndex>=service.cfg.maxContinuations,canContinue:saved.metadados.canContinue,maxContinuations:service.cfg.maxContinuations,reviewedText:saved.mensagem,citations:saved.metadados.citations,referenceReview:saved.metadados.referenceReview,suggestion:job.rootId?null:service.suggestion(job),limited,stopReason});
  }catch(error){
   stopReason=memoryLow?'memory':error.code==='USAGE_LIMIT'?'quota':error.code==='CONTEXT_LIMIT'?'context':timedOut||error.code==='TIMEOUT'?'timeout':controller.signal.aborted||error.code==='CANCELLED'?'cancelled':'error';
   // Do not flush an unfinished reference after cancellation/timeout.
   if((text||job.rootId)&&!complete){const saved=await service.save(job,text,{partial:true,limited:false,stopReason,continuationIndex,outputChars:rawLength,parts:[...partStops,{continuationIndex,stopReason}],referenceReview:{removed:guard.removed+(guard.pending?1:0)}}).catch(()=>null);if(saved)send('review',{reviewedText:saved.mensagem,citations:saved.metadados.citations,referenceReview:saved.metadados.referenceReview});}
   const localMessages={USAGE_LIMIT:'Cota do assistente atingida durante a continuação. O texto recebido foi preservado.',MODEL_MISSING:'Modelo Ollama não encontrado. Confira OLLAMA_MODEL e os modelos já instalados.',INVALID_RESPONSE:'Ollama retornou uma resposta inválida ou interrompida.',CONTEXT_LIMIT:'Pergunta excede o orçamento local; reduza a pergunta.',CANCELLED:'Geração Ollama interrompida.'};
   if(service.engine==='ollama')send('error',{stopReason,mensagem:memoryLow?'Geração interrompida por memória disponível criticamente baixa (menos de 180 MiB). O texto recebido foi preservado.':stopReason==='cancelled'?'Geração interrompida. A parte recebida foi preservada; isso não é limite de tokens.':timedOut||error.code==='TIMEOUT'?'Tempo limite do Ollama atingido. Nenhum outro provedor foi utilizado.':(localMessages[error.code]||'Ollama indisponível. Verifique o serviço local; não houve troca de provedor.')});
   else send('error',{stopReason,mensagem:timedOut?'Tempo limite do assistente atingido. Tente novamente ou use o modo demonstração.':'Não foi possível concluir a resposta do assistente. Verifique conexão, chave e modelo no servidor ou use o modo demonstração. O painel e a irrigação continuam funcionando.'});
  }finally{clearTimeout(timer);clearInterval(sessionTimer);clearInterval(memoryTimer);controller.abort();if(iterator?.return)await Promise.resolve(iterator.return()).catch(()=>{});service.controllers.delete(controller);res.off('close',disconnect);job.release();if(!res.destroyed)res.end();}
 }));return router;
}
module.exports={assistantRoutes};
