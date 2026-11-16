// Ensaio real opt-in; não altera .env, MySQL ou modelos. Uma geração por vez.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),{execFile}=require('node:child_process'),{promisify}=require('node:util');
const run=promisify(execFile),free=()=>Math.round(os.freemem()/1048576),strong=()=>crypto.randomBytes(24).toString('hex')+'Z!';
async function main(){
 if(process.env.SDA_TEST_IA1!=='true')throw new Error('Ative SDA_TEST_IA1=true somente para um ensaio supervisionado.');
 const tokens=Number(process.argv.find(a=>a.startsWith('--tokens='))?.split('=')[1]);if(![256,384].includes(tokens))throw new Error('Use --tokens=256 ou --tokens=384.');
 const report={date:new Date().toISOString(),model:'llama3.2:3b',context:4096,tokens,timeoutMs:60000,ramStartMiB:free(),questions:[],samples:[],scope:'SIMULAÇÃO / memória / SSE real / sem comparação visual do navegador'};fs.mkdirSync('.data',{recursive:true});
 const output=()=>{fs.writeFileSync('.data/ia1-real-'+tokens+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));};
 // Folga inicial conservadora: não tentar carregar o modelo sob pressão já conhecida.
 if(report.ramStartMiB<1536){report.skipped='RAM livre inferior a 1536 MiB; nenhuma geração iniciada.';output();process.exitCode=2;return;}
 Object.assign(process.env,{DB_MODE:'memory',SIMULATE:'true',WEATHER_OFFLINE:'true',ASSISTANT_PROVIDER:'ollama',ASSISTANT_DEMO:'false',OLLAMA_BASE_URL:'http://127.0.0.1:11434',OLLAMA_MODEL:'llama3.2:3b',OLLAMA_NUM_CTX:'4096',OLLAMA_NUM_PREDICT:String(tokens),ASSISTANT_TIMEOUT_SECONDS:'60',ASSISTANT_MAX_TOKENS:'700',ADMIN_USER:'ensaio_ia1',ADMIN_PASSWORD:strong(),SESSION_SECRET:strong()});
 const {config}=require('../src/config'),{createApplication}=require('../server'),request=require('supertest'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'hydra-ia1-real-'));let app,guard,monitor,pendingSample;
 const sample=async()=>{const value={ramFreeMiB:free(),nodeRssMiB:Math.round(process.memoryUsage().rss/1048576)};try{value.gpu=(await run('nvidia-smi',['--query-gpu=memory.used,memory.total,utilization.gpu','--format=csv,noheader,nounits'],{windowsHide:true,timeout:3000})).stdout.trim();}catch{value.gpu=null;}try{value.ollama=(await fetch('http://127.0.0.1:11434/api/ps',{signal:AbortSignal.timeout(2000)}).then(r=>r.json())).models?.map(m=>({model:m.model,size_vram:m.size_vram}));}catch{value.ollama=null;}report.samples.push(value);};
 try{
  const installed=await fetch('http://127.0.0.1:11434/api/tags',{signal:AbortSignal.timeout(2500)}).then(r=>r.json());if(!installed.models?.some(m=>m.name==='llama3.2:3b'))throw new Error('Modelo local ausente.');
  const base=config();app=await createApplication({config:{...base,settingsFile:path.join(dir,'settings.json'),scheduleJournalDir:path.join(dir,'journal')}});const agent=request.agent(app.app),csrf=(await agent.get('/api/auth/csrf')).body.csrfToken,login=await agent.post('/api/login').set('X-CSRF-Token',csrf).send({user:process.env.ADMIN_USER,pass:process.env.ADMIN_PASSWORD});if(login.status!==200)throw new Error('Login de ensaio recusado.');
  await sample();guard=setInterval(()=>{if(free()<180){report.resourceAbort=true;for(const controller of app.assistant.controllers)controller.abort();}},200);
  monitor=setInterval(()=>{if(pendingSample)return;pendingSample=sample().finally(()=>pendingSample=null);},4000);
  for(const question of ['Qual é a umidade ideal para alface?','Por que calibrar um sensor capacitivo de umidade?',"Se minha caixa d'água está cheia, isso significa que minha plantação está encharcada?"]){
   if(report.resourceAbort||free()<768){report.stopped='Pressão de RAM; perguntas restantes não executadas.';break;}
   const start=Date.now();const generation=agent.post('/api/chat').set('X-CSRF-Token',login.body.csrfToken).send({mensagem:question}).timeout({deadline:65000});const running=generation.then(r=>r);await new Promise(r=>setTimeout(r,100));const probeStart=Date.now(),probe=await agent.get('/api/estado');const apiStateMs=Date.now()-probeStart;const res=await running;
   const events=res.status===200?res.text.trim().split('\n\n').filter(Boolean).map(b=>({event:b.match(/event: (.*)/)[1],data:JSON.parse(b.match(/data: (.*)/)[1])})):[];report.questions.push({question,durationMs:Date.now()-start,httpStatus:res.status,apiStateStatus:probe.status,apiStateMs,text:events.filter(e=>e.event==='delta').map(e=>e.data.text).join(''),termination:events.find(e=>e.event==='done'||e.event==='error')?.data,ramAfterMiB:free()});
  }
 }catch{report.error='Ensaio não concluído; sem troca de provedor ou download.';process.exitCode=1;}
 finally{clearInterval(guard);clearInterval(monitor);if(pendingSample)await pendingSample;if(app)await app.close();await sample();report.ramEndMiB=free();fs.rmSync(dir,{recursive:true,force:true});output();}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
