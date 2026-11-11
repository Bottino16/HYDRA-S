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
  const job=await service.prepare(req.user,req.body),controller=new AbortController();service.controllers.add(controller);let timedOut=false,text='',complete=false,limited=false,received=false;
  const timer=setTimeout(()=>{timedOut=true;controller.abort();},service.cfg.timeoutMs);timer.unref();const disconnect=()=>controller.abort();res.on('close',disconnect);
  const send=(event,data)=>{if(!res.destroyed)res.write('event: '+event+'\ndata: '+JSON.stringify(data)+'\n\n');};
  res.status(200).set({'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','X-Accel-Buffering':'no'});res.flushHeaders();
  send('meta',{conversaId:job.id,demo:service.cfg.demo,fonte:job.context.fonte,telemetria:job.context.telemetria,sources:job.documents.map(d=>({id:d.id,title:d.title}))});
  let iterator;
  const sessionTimer=setInterval(()=>req.sessionStore.get(req.sessionID,(error,data)=>{if(error||!data||data.expiresAt<=Date.now()||!service.store.byId(data.userId)?.ativo)controller.abort();}),1000);sessionTimer.unref();
  try{
   text=(service.cfg.demo?'**Resposta de demonstração, sem IA real.**\n\n':'')+(job.context.fonte==='SIMULAÇÃO'?'Estou analisando dados simulados.\n\n':'')+(job.context.telemetria==='sem dados'?'Sem dados recentes de sensores; não é possível avaliar o estado atual da maquete.\n\n':'');
   if(text)send('delta',{text});
   iterator=service.provider.stream(job.request,{signal:controller.signal,context:job.context,documents:job.documents,question:job.question})[Symbol.asyncIterator]();
   const cap=Math.min(service.cfg.maxTokens*12,12000);
   while(true){const item=await nextChunk(iterator,controller.signal);if(item.done)break;if(typeof item.value!=='string'||!item.value)continue;received=true;const part=item.value.slice(0,cap-text.length);text+=part;send('delta',{text:part});if(text.length>=cap){limited=true;break;}}
   if(!received)throw new Error('resposta vazia');
   await service.save(job,text,{partial:false,limited});complete=true;send('done',{conversaId:job.id,suggestion:service.suggestion(job),limited});
  }catch{
   if(text&&!complete)await service.save(job,text,{partial:true}).catch(()=>{});
   send('error',{mensagem:timedOut?'Tempo limite do assistente atingido. Tente novamente ou use o modo demonstração.':'Não foi possível concluir a resposta do assistente. Verifique conexão, chave e modelo no servidor ou use o modo demonstração. O painel e a irrigação continuam funcionando.'});
  }finally{clearTimeout(timer);clearInterval(sessionTimer);controller.abort();if(iterator?.return)Promise.resolve(iterator.return()).catch(()=>{});service.controllers.delete(controller);res.off('close',disconnect);job.release();if(!res.destroyed)res.end();}
 }));return router;
}
module.exports={assistantRoutes};
