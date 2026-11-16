const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),request=require('supertest');
const {OllamaProvider,localBase}=require('../src/assistant/ollama'),{fitLocalRequest}=require('../src/assistant/local-context'),{SYSTEM_PROMPT}=require('../src/assistant/prompt'),{config}=require('../src/config'),{createApplication}=require('../server');
const cfg={ollamaBaseUrl:'http://127.0.0.1:11434',ollamaNumCtx:4096,timeoutMs:500};
const payload=()=>({model:'llama3.2:3b',max_tokens:128,system:SYSTEM_PROMPT,messages:[{role:'user',content:JSON.stringify({pergunta:'Como calibrar o sensor?',contexto:{fonte:'SIMULAÇÃO',solo:'sem dados'},documentos:[{id:'sensor.md',title:'Sensor',text:'Calibre com referências locais.'}]})}]});
const frame=(content,done=false)=>JSON.stringify({model:'llama3.2:3b',message:{role:'assistant',content},done});
const response=text=>new Response(text,{headers:{'Content-Type':'application/x-ndjson'}});
async function collect(provider,signal=new AbortController().signal){let text='';for await(const chunk of provider.stream(payload(),{signal}))text+=chunk;return text;}
test('Ollama: NDJSON fragmentado, UTF-8 e término sem newline viram deltas; parâmetros locais e sem ferramentas',async()=>{
 let sent,options;const bytes=new TextEncoder().encode(frame('Simulação: ')+'\n'+frame('solo.')+'\n'+frame('',true));
 const provider=new OllamaProvider(cfg,{fetcher:async(url,opt)=>{assert.equal(url,'http://127.0.0.1:11434/api/chat');options=opt;sent=JSON.parse(opt.body);return new Response(new ReadableStream({start(c){for(let i=0;i<bytes.length;i+=3)c.enqueue(bytes.slice(i,i+3));c.close();}}),{headers:{'Content-Type':'application/x-ndjson'}});}});
 assert.equal(await collect(provider),'Simulação: solo.');assert.equal(sent.keep_alive,0);assert.equal(sent.options.num_ctx,4096);assert.equal(sent.options.num_predict,128);assert.equal(sent.messages[0].content,SYSTEM_PROMPT);assert.equal(sent.tools,undefined);assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,undefined);
});
test('Ollama: rejeita resposta inválida, incompleta, vazia, ferramentas e modelo diferente',async()=>{
 for(const text of ['{','null',frame('texto'),frame('',true),JSON.stringify({error:'segredo interno'}),JSON.stringify({model:'outro',message:{role:'assistant',content:'x'},done:true}),JSON.stringify({model:'llama3.2:3b',message:{role:'assistant',content:'x',tool_calls:[{}]},done:true})]){
  const provider=new OllamaProvider(cfg,{fetcher:async()=>response(text)});await assert.rejects(collect(provider),e=>['INVALID_RESPONSE','PROVIDER_ERROR'].includes(e.code)&&!e.message.includes('segredo'));
 }
 for(const result of [new Response('html',{headers:{'Content-Type':'text/html'}}),new Response(null,{status:404}),new Response(null,{status:500})])await assert.rejects(collect(new OllamaProvider(cfg,{fetcher:async()=>result})),e=>['INVALID_RESPONSE','MODEL_MISSING','HTTP_ERROR'].includes(e.code));
 await assert.rejects(collect(new OllamaProvider(cfg,{fetcher:async()=>{throw new Error('credencial secreta');}})),{code:'UNAVAILABLE',message:'UNAVAILABLE'});
});
test('Ollama: término por limite de tokens é sinalizado ao consumidor SSE',async()=>{
 const data=JSON.parse(frame('curta',true));data.done_reason='length';const provider=new OllamaProvider(cfg,{fetcher:async()=>response(JSON.stringify(data))}),iterator=provider.stream(payload(),{signal:new AbortController().signal});assert.equal((await iterator.next()).value,'curta');assert.deepEqual(await iterator.next(),{done:true,value:{limited:true}});
});
test('Ollama: timeout e cancelamento abortam transporte; leitor é liberado',async()=>{
 const pending=async(url,{signal})=>new Promise((resolve,reject)=>{const abort=()=>reject(new DOMException('aborted','AbortError'));if(signal.aborted)abort();else signal.addEventListener('abort',abort,{once:true});});
 // Mantém o processo vivo enquanto o timer de proteção (unref) vence.
 const keep=setInterval(()=>{},1000);try{await assert.rejects(collect(new OllamaProvider({...cfg,timeoutMs:20},{fetcher:pending})),{code:'TIMEOUT'});}finally{clearInterval(keep);}
 const abort=new AbortController(),promise=collect(new OllamaProvider(cfg,{fetcher:pending}),abort.signal);abort.abort();await assert.rejects(promise,{code:'CANCELLED'});
 let cancelled=false;const provider=new OllamaProvider(cfg,{fetcher:async()=>new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode(frame('parcial')+'\n'));},cancel(){cancelled=true;}}),{headers:{'Content-Type':'application/x-ndjson'}})});
 const iterator=provider.stream(payload(),{signal:new AbortController().signal});assert.equal((await iterator.next()).value,'parcial');await iterator.return();assert.equal(cancelled,true);
});
test('Ollama: endpoint só permite loopback literal HTTP, sem caminhos, credenciais ou redirecionamento',()=>{
 assert.equal(localBase('http://localhost:11434'),'http://127.0.0.1:11434');assert.equal(localBase('http://[::1]:11434'),'http://[::1]:11434');
 for(const url of ['http://192.168.1.2:11434','https://127.0.0.1','http://example.com','http://user:pass@127.0.0.1','http://127.0.0.1/api','http://127.0.0.1?token=x'])assert.throws(()=>localBase(url));
});
test('Ollama: orçamento mantém regras, pergunta e contexto; limita RAG/histórico e recusa excesso',()=>{
 const req=payload();req.messages.unshift({role:'assistant',content:'x'.repeat(10000)});const fitted=fitLocalRequest(req,cfg);assert.ok(fitted.budget.estimatedInputTokens<=fitted.budget.inputLimit);assert.equal(fitted.messages.length,1);const data=JSON.parse(fitted.messages.at(-1).content);assert.equal(data.pergunta,'Como calibrar o sensor?');assert.equal(data.contexto.solo,'sem dados');assert.equal(req.system,SYSTEM_PROMPT);assert.equal(data.documentos[0].id,'sensor.md');
 req.messages.at(-1).content=JSON.stringify({pergunta:'x'.repeat(10000),contexto:{},documentos:[]});assert.throws(()=>fitLocalRequest(req,cfg),{code:'CONTEXT_LIMIT',status:400});
});
test('Ollama: saída 256 respeita teto geral e mantém contexto 4096 com todas as regras',async t=>{
 const f=await fixture(t),old=f.app.assistant,{AssistantService}=require('../src/assistant/service');
 const service=new AssistantService({store:old.store,device:old.device,weather:old.weather,config:{...old.cfg,ollamaNumPredict:256,maxTokens:700},simulate:true,provider:old.provider});
 const job=await service.prepare({id:1,nivel:'master',usuario:'ollama_admin'},{mensagem:'Por que calibrar um sensor capacitivo?'});
 try{assert.equal(job.request.max_tokens,256);assert.equal(job.budget.inputLimit,3072);assert.equal(job.request.system,SYSTEM_PROMPT);assert.match(SYSTEM_PROMPT,/até três tópicos curtos/);assert.match(SYSTEM_PROMPT,/NUNCA aciona bombas/);assert.match(SYSTEM_PROMPT,/SIMULAÇÃO/);assert.ok(job.budget.estimatedInputTokens<=3072);
 let sent;const adapter=new OllamaProvider(cfg,{fetcher:async(url,options)=>{sent=JSON.parse(options.body);return response(frame('Calibre com referências locais.',true));}});for await(const part of adapter.stream(job.request,{signal:new AbortController().signal}))assert.ok(part);assert.equal(sent.options.num_predict,256);assert.equal(sent.options.num_ctx,4096);
 }finally{job.release();}const lower=new AssistantService({store:old.store,device:old.device,weather:old.weather,config:{...old.cfg,ollamaNumPredict:256,maxTokens:64},simulate:true,provider:old.provider});assert.equal(lower.cfg.maxTokens,64);
});
async function fixture(t){
 const strong=()=>crypto.randomBytes(24).toString('hex')+'Z!';Object.assign(process.env,{DB_MODE:'memory',SIMULATE:'true',WEATHER_OFFLINE:'true',ADMIN_USER:'ollama_admin',ADMIN_PASSWORD:strong(),SESSION_SECRET:strong()});
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hydra-ollama-')),base=config();const settings={...base,settingsFile:path.join(dir,'settings.json'),scheduleJournalDir:path.join(dir,'journal'),assistant:{...base.assistant,provider:'ollama',demo:true,key:'',ollamaModel:'llama3.2:3b'}};
 const app=await createApplication({config:settings,assistantProvider:new OllamaProvider(settings.assistant,{fetcher:async()=>response(frame('Analiso dados simulados. <img src=x onerror=alert(1)>',true))})});t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 const agent=request.agent(app.app),csrf=(await agent.get('/api/auth/csrf')).body.csrfToken;const session=await agent.post('/api/login').set('X-CSRF-Token',csrf).send({user:process.env.ADMIN_USER,pass:process.env.ADMIN_PASSWORD});assert.equal(session.status,200);return {app,agent,csrf:session.body.csrfToken};
}
test('Ollama: SSE autenticado sem chave, identidade persistida, sem fallback e payload não escolhe endpoint',async t=>{
 const f=await fixture(t);
 const post=body=>f.agent.post('/api/chat').set('X-CSRF-Token',f.csrf).send(body);
 assert.equal((await post({mensagem:'solo',endpoint:'http://externo'})).status,400);
 const res=await post({mensagem:'Como calibrar o sensor?'});assert.equal(res.status,200);assert.match(res.text,/event: delta/);assert.match(res.text,/"provider":"ollama"/);assert.match(res.text,/"model":"llama3.2:3b"/);assert.match(res.text,/"demo":false/);assert.match(res.text,/event: done/);
 const row=f.app.store.chatRows.find(r=>r.papel==='assistant'&&!r.metadados.kind);assert.equal(row.metadados.provider,'ollama');assert.equal(row.metadados.model,'llama3.2:3b');assert.equal(f.app.assistant.status().maxConcurrent,1);assert.equal(f.app.assistant.status().configured,true);
 f.app.assistant.provider=new OllamaProvider(cfg,{fetcher:async()=>{throw new Error('segredo');}});const fail=await post({mensagem:'textura do solo'});assert.match(fail.text,/Ollama indisponível/);assert.ok(!fail.text.includes('segredo'));assert.ok(!fail.text.includes('event: done'));assert.equal((await f.agent.get('/api/estado')).status,200);
});
test('Ollama: limite global sem fila entre contas, liberação após erro e bloqueio fora de simulação',async t=>{
 const f=await fixture(t),service=f.app.assistant,user={id:1,nivel:'master',usuario:'ollama_admin'};const job=await service.prepare(user,{mensagem:'solo'});await assert.rejects(service.prepare({...user,id:2},{mensagem:'solo'}),e=>e.status===429);await assert.rejects(service.prepare(user,{mensagem:'solo'}),e=>e.status===409);job.release();assert.equal(service.active.size,0);
 await assert.rejects(service.prepare(user,{mensagem:'x'.repeat(1900)}),e=>e.code==='CONTEXT_LIMIT');assert.equal(service.active.size,0);service.simulate=false;await assert.rejects(service.prepare(user,{mensagem:'solo'}),e=>e.status===503);
});
test('Ollama: seleção explícita do ambiente não depende de chave nem do legado demo',()=>{
 const names=['ASSISTANT_PROVIDER','ASSISTANT_DEMO','OLLAMA_MODEL','OLLAMA_BASE_URL','ANTHROPIC_API_KEY'],saved=Object.fromEntries(names.map(n=>[n,process.env[n]]));
 try{Object.assign(process.env,{ASSISTANT_PROVIDER:'ollama',ASSISTANT_DEMO:'true',OLLAMA_MODEL:'llama3.2:3b',OLLAMA_BASE_URL:'http://localhost:11434',ANTHROPIC_API_KEY:''});const c=config().assistant;assert.equal(c.provider,'ollama');assert.equal(c.ollamaBaseUrl,'http://127.0.0.1:11434');process.env.ASSISTANT_PROVIDER='outro';assert.throws(()=>config(),/ASSISTANT_PROVIDER/);}finally{for(const n of names)if(saved[n]===undefined)delete process.env[n];else process.env[n]=saved[n];}
});
test('Ollama: interface identifica modelo no status, streaming e histórico com HTML escapado',async t=>{
 const {JSDOM}=require('jsdom'),f=await fixture(t);await new Promise(r=>f.app.server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+f.app.server.address().port;
 const agent=request.agent(f.app.app),csrf=(await agent.get('/api/auth/csrf')).body.csrfToken,session=await agent.post('/api/login').set('X-CSRF-Token',csrf).send({user:process.env.ADMIN_USER,pass:process.env.ADMIN_PASSWORD}),cookie=session.headers['set-cookie'][0].split(';')[0];
 const dom=new JSDOM('<aside><nav></nav></aside><main></main>',{runScripts:'outside-only',url}),win=dom.window;t.after(()=>win.close());win.TextDecoder=TextDecoder;win.AbortController=AbortController;win.sdaReady=Promise.resolve({...session.body,simulate:true});win.sdaRequest=(input,options={})=>fetch(new URL(input,url),{...options,headers:{Cookie:cookie,'Content-Type':'application/json','X-CSRF-Token':session.body.csrfToken}});
 for(const file of ['assistant-markdown.js','assistant.js'])win.eval(fs.readFileSync('public/'+file,'utf8'));const wait=async check=>{for(let i=0;i<100;i++){if(check())return;await new Promise(r=>setTimeout(r,20));}assert.fail('Interface não concluiu no prazo');};
 await wait(()=>win.document.getElementById('assistant-mode')?.textContent.includes('llama3.2:3b'));assert.match(win.document.getElementById('assistant-mode').textContent,/Ollama local.*SIMULAÇÃO/);
 win.document.getElementById('assistant-input').value='Solo';win.document.querySelector('form').dispatchEvent(new win.Event('submit',{cancelable:true}));await wait(()=>win.document.getElementById('assistant-status').textContent.includes('Resposta concluída'));
 assert.match(win.document.querySelector('.assistant-message[data-role="assistant"] .assistant-meta').textContent,/Ollama local.*llama3.2:3b/);assert.equal(win.document.querySelector('#assistant-messages img'),null);
 const select=win.document.querySelector('select');await wait(()=>select.value);select.dispatchEvent(new win.Event('change'));await wait(()=>win.document.querySelectorAll('.assistant-message').length===3);assert.ok([...win.document.querySelectorAll('.assistant-meta')].some(n=>/Ollama local.*llama3.2:3b/.test(n.textContent)));assert.equal(win.document.querySelector('#assistant-messages img'),null);
});
