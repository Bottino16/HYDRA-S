// Ensaio explícito: não é executado por npm test, não altera .env nem usa MySQL.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),{execFile}=require('node:child_process'),{promisify}=require('node:util');
const run=promisify(execFile),strong=()=>crypto.randomBytes(24).toString('hex')+'Z!';
async function main(){
 if(process.env.SDA_TEST_OLLAMA!=='true')throw new Error('Ative SDA_TEST_OLLAMA=true somente para este ensaio local de uma pergunta.');
 // O processo usa configuração efêmera; dotenv não sobrescreve estas opções.
 Object.assign(process.env,{DB_MODE:'memory',SIMULATE:'true',WEATHER_OFFLINE:'true',ASSISTANT_PROVIDER:'ollama',OLLAMA_BASE_URL:'http://127.0.0.1:11434',OLLAMA_MODEL:'llama3.2:3b',OLLAMA_NUM_CTX:'4096',OLLAMA_NUM_PREDICT:'32',ASSISTANT_TIMEOUT_SECONDS:'45',ADMIN_USER:'ensaio_local',ADMIN_PASSWORD:strong(),SESSION_SECRET:strong()});
 const {config}=require('../src/config'),{createApplication}=require('../server'),request=require('supertest');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hydra-real-ollama-')),cfg=config(),report={source:'Ollama real / backend SSE / SIMULAÇÃO / banco em memória',model:cfg.assistant.ollamaModel,context:4096,maxOutput:32,samples:[]};let app,monitor;
 const resources=async()=>{
  const sample={seconds:Math.round((Date.now()-start)/1000)};
  try{sample.ramAvailableMiB=Number((await run('powershell.exe',['-NoProfile','-Command','(Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory).AvailableMBytes'],{windowsHide:true,timeout:5000})).stdout.trim());}catch{sample.ramAvailableMiB=null;}
  try{sample.gpu=(await run('nvidia-smi',['--query-gpu=memory.used,memory.total,utilization.gpu','--format=csv,noheader,nounits'],{windowsHide:true,timeout:5000})).stdout.trim();}catch{sample.gpu=null;}
  try{const ps=await fetch('http://127.0.0.1:11434/api/ps',{signal:AbortSignal.timeout(2000)}).then(r=>r.json());sample.models=ps.models.map(m=>({model:m.model,size:m.size,size_vram:m.size_vram,context_length:m.context_length}));}catch{sample.models=[];}
  report.samples.push(sample);if(sample.ramAvailableMiB!==null&&sample.ramAvailableMiB<180){report.resourceAbort=true;for(const c of app?.assistant.controllers||[])c.abort();}
 };const start=Date.now();
 try{
  await resources();if(report.resourceAbort)throw new Error('Memória livre inicial inferior a 180 MiB; ensaio recusado.');
  app=await createApplication({config:{...cfg,settingsFile:path.join(dir,'settings.json'),scheduleJournalDir:path.join(dir,'journal')}});
  const agent=request.agent(app.app),csrf=(await agent.get('/api/auth/csrf')).body.csrfToken,login=await agent.post('/api/login').set('X-CSRF-Token',csrf).send({user:process.env.ADMIN_USER,pass:process.env.ADMIN_PASSWORD});
  if(login.status!==200)throw new Error('Falha no login efêmero.');
  let sampling=false;monitor=setInterval(()=>{if(sampling)return;sampling=true;resources().finally(()=>sampling=false);},4000);
  const begin=Date.now(),res=await agent.post('/api/chat').set('X-CSRF-Token',login.body.csrfToken).send({mensagem:'Em uma frase curta, por que calibrar o sensor de umidade do solo?'}).timeout({deadline:55000});
  report.durationMs=Date.now()-begin;report.httpStatus=res.status;report.events=res.text.trim().split('\n\n').filter(Boolean).map(block=>({event:block.match(/event: (.*)/)?.[1],data:JSON.parse(block.match(/data: (.*)/)[1])}));report.success=report.events.some(e=>e.event==='done')&&!report.events.some(e=>e.event==='error');
 }catch(error){report.success=false;report.error=error.message==='Memória livre inicial inferior a 180 MiB; ensaio recusado.'?error.message:'Ensaio não concluído; verifique eventos e recursos.';}
 finally{clearInterval(monitor);if(app)await app.close();await resources();fs.rmSync(dir,{recursive:true,force:true});console.log(JSON.stringify(report,null,2));if(!report.success)process.exitCode=1;}
}
main().catch(()=>{console.error('Ensaio local não iniciado. Use SDA_TEST_OLLAMA=true.');process.exitCode=1;});
