const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const vm=require('node:vm');
const request=require('supertest');
const {io}=require('socket.io-client');
const {JSDOM}=require('jsdom');
const {config}=require('../src/config');
const {createApplication}=require('../server');
const {validatePassword,hashPassword,comparePassword}=require('../src/password');
const {adminCredentials}=require('../db/seed');
const strong=()=>crypto.randomBytes(20).toString('hex')+'Q!';
async function login(agent,user,password){const csrf=(await agent.get('/api/auth/csrf')).body.csrfToken;return agent.post('/api/login').set('X-CSRF-Token',csrf).send({user,pass:password});}
function socketResult(url,options){return new Promise(resolve=>{const socket=io(url,{...options,forceNew:true,reconnection:false,timeout:3000});socket.once('connect',()=>resolve({socket}));socket.once('connect_error',error=>{socket.close();resolve({error});});});}
test('Fase 0.5 — segurança HTTP, sessão, sockets, fallback e telas',async t=>{
 const password=strong();Object.assign(process.env,{DB_MODE:'memory',ADMIN_USER:'operador_teste',ADMIN_PASSWORD:password,SESSION_SECRET:crypto.randomBytes(32).toString('hex'),SIMULATE:'true'});
 const cfg=config();const app=await createApplication({config:cfg});
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+app.server.address().port;
 const master=request.agent(app.app),client=request.agent(app.app);
 t.after(()=>app.close());
 let masterCsrf,clientCsrf,clientCookie,clientPassword=strong(),clientId;
 await t.test('anônimo recebe 401 em todas as APIs privadas',async()=>{
  for(const path of ['/api/me','/api/usuarios','/api/perfis','/api/agendamento'])assert.equal((await request(app.app).get(path)).status,401);
  assert.equal((await request(app.app).post('/api/rega').send({minutos:1})).status,401);
 });
 await t.test('arquivos internos e caminhos codificados retornam 404',async()=>{
  for(const path of ['/server.js','/server-original.js','/setup-db.js','/db/schema.sql','/db/seed.js','/knowledge/README.md','/.env','/.env.example','/package.json','/node_modules/express/package.json','/src/store.js','/public/arthur.html','/%61rthur.html','/arthur%2ehtml','/%70ainel-adm.html'])assert.equal((await request(app.app).get(path)).status,404,path);
  assert.equal((await request(app.app).get('/arthur.html')).status,302);
  assert.equal((await request(app.app).get('/painel-adm.html')).status,302);
 });
 await t.test('seed recusa senha fraca e bcrypt não armazena texto puro',async()=>{
  const original=process.env.ADMIN_PASSWORD;process.env.ADMIN_PASSWORD='fraca';await assert.rejects(adminCredentials(),/Senha fraca/);process.env.ADMIN_PASSWORD=original;
  const hash=await hashPassword(password);assert.notEqual(hash,password);assert.ok(await comparePassword(password,hash));
  for(const weak of ['123456','Senha123456!','adminADMIN123!'])assert.throws(()=>validatePassword(weak,'operador'),/Senha fraca/);
 });
 await t.test('login exige CSRF, bloqueia origem externa e cria cookie httpOnly SameSite',async()=>{
  assert.equal((await master.post('/api/login').send({user:'operador_teste',pass:password})).status,403);
  assert.equal((await master.get('/api/auth/csrf').set('Origin','https://fora.invalid')).status,403);
  const response=await login(master,'operador_teste',password);assert.equal(response.status,200);masterCsrf=response.body.csrfToken;
  const cookie=response.headers['set-cookie'][0];assert.match(cookie,/HttpOnly/i);assert.match(cookie,/SameSite=Strict/i);
  assert.equal((await master.get('/arthur.html')).status,200);
 });
 await t.test('CRUD real, hashes ocultos e duplicatas recusadas',async()=>{
  const response=await master.post('/api/usuarios').set('X-CSRF-Token',masterCsrf).send({usuario:'cliente_teste',nome:'<img src=x onerror=alert(1)>',senha:clientPassword,nivel:'cliente',plano:'basico'});
  assert.equal(response.status,201);clientId=response.body.usuario.id;assert.equal(response.body.usuario.senha_hash,undefined);
  const list=await master.get('/api/usuarios');assert.equal(list.status,200);assert.equal(list.body.length,2);assert.ok(list.body.every(u=>!u.senha_hash&&!u.senha));
  const duplicate=await master.post('/api/usuarios').set('X-CSRF-Token',masterCsrf).send({usuario:'cliente_teste',senha:strong()});assert.equal(duplicate.status,409);
 });
 await t.test('cliente recebe 403 nas rotas master e na página administrativa',async()=>{
  const response=await login(client,'cliente_teste',clientPassword);assert.equal(response.status,200);clientCsrf=response.body.csrfToken;clientCookie=response.headers['set-cookie'][0].split(';')[0];
  assert.equal((await client.get('/api/usuarios')).status,403);
  assert.equal((await client.get('/painel-adm.html')).status,403);
  assert.equal((await client.post('/api/rega').set('X-CSRF-Token',clientCsrf).send({minutos:1})).status,403);
  assert.equal((await client.post('/api/usuarios').set('X-CSRF-Token',clientCsrf).send({})).status,403);
 });
 await t.test('CSRF e valores de comando inválidos são recusados',async()=>{
  assert.equal((await master.post('/api/rega').send({minutos:1})).status,403);
  for(const minutos of [-1,0,31,'3',null])assert.equal((await master.post('/api/rega').set('X-CSRF-Token',masterCsrf).send({minutos})).status,400);
 });
 await t.test('último master não pode ser removido ou rebaixado',async()=>{
  assert.equal((await master.delete('/api/usuarios/1').set('X-CSRF-Token',masterCsrf)).status,409);
  assert.equal((await master.put('/api/usuarios/1').set('X-CSRF-Token',masterCsrf).send({nivel:'cliente'})).status,409);
 });
 await t.test('perfis e agendamentos ficam isolados por usuário',async()=>{
  assert.equal((await client.put('/api/perfis').set('X-CSRF-Token',clientCsrf).send([{nome:'Alface',limite:45}])).status,200);
  assert.equal((await master.get('/api/perfis')).body.length,0);
  assert.equal((await client.put('/api/agendamento').set('X-CSRF-Token',clientCsrf).send({hora:'18:00',duracao:2,ativo:true,diasMes:[1,15]})).status,200);
  assert.deepEqual((await client.get('/api/agendamento')).body.diasMes,[1,15]);
  assert.equal((await master.get('/api/agendamento')).body.ativo,false);
 });
 await t.test('sockets anônimos e sem CSRF são recusados',async()=>{
  assert.equal((await socketResult(url,{})).error.data.status,401);
  const cookie=clientCookie;
  assert.equal((await socketResult(url,{extraHeaders:{Cookie:cookie}})).error.data.status,403);
 });
 await t.test('socket autenticado recebe telemetria e cliente não envia comando master',async()=>{
  const cookie=clientCookie;
  const {socket,error}=await socketResult(url,{extraHeaders:{Cookie:cookie},auth:{csrfToken:clientCsrf}});assert.ifError(error);
  try {
   const command=await socket.timeout(3000).emitWithAck('regar_manual',1);assert.equal(command.status,403);
   const reading=await new Promise((resolve,reject)=>{socket.once('dados_sensores',resolve);setTimeout(()=>reject(new Error('Sem telemetria')),3500).unref();});assert.equal(reading.split(',').length,4);
   const disconnected=new Promise(resolve=>socket.once('disconnect',resolve));
   assert.equal((await client.post('/api/logout').set('X-CSRF-Token',clientCsrf)).status,200);await disconnected;
   assert.equal((await client.get('/api/me')).status,401);
   assert.equal((await socketResult(url,{extraHeaders:{Cookie:cookie},auth:{csrfToken:clientCsrf}})).error.data.status,401);
  }finally{socket.close();}
 });
 await t.test('master redefine senha, revoga sessão antiga e cliente troca a própria senha',async()=>{
  let response=await login(client,'cliente_teste',clientPassword);clientCsrf=response.body.csrfToken;
  const replacement=strong();response=await master.post('/api/usuarios/'+clientId+'/senha').set('X-CSRF-Token',masterCsrf).send({senha:replacement});assert.equal(response.status,200);
  assert.equal((await client.get('/api/me')).status,401);
  assert.equal((await login(client,'cliente_teste',clientPassword)).status,401);
  response=await login(client,'cliente_teste',replacement);assert.equal(response.status,200);clientCsrf=response.body.csrfToken;
  const next=strong();assert.equal((await client.post('/api/senha').set('X-CSRF-Token',clientCsrf).send({atual:replacement,nova:next})).status,200);
  assert.equal((await client.get('/api/me')).status,401);assert.equal((await login(client,'cliente_teste',next)).status,200);
 });
 await t.test('bloqueio temporário após tentativas incorretas',async()=>{
  const attacker=request.agent(app.app);
  for(let i=0;i<cfg.attempts;i++)assert.equal((await login(attacker,'inexistente',strong())).status,401);
  assert.equal((await login(attacker,'inexistente',strong())).status,429);
 });
 await t.test('tabela e mensagens tratam payload XSS como texto e usam backend real',()=>{
  const html=fs.readFileSync('public/painel-adm.html','utf8');
  const dom=new JSDOM(html,{runScripts:'outside-only',url:'http://localhost:3000'});
  dom.window.sdaReady=new Promise(()=>{});
  const script=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');dom.window.eval(script);
  const payload=`<img src=x onerror="window.xss=true">'"`;
  dom.window.renderizarTabela([{id:2,usuario:payload,nivel:'cliente',plano:'basico'}]);
  assert.equal(dom.window.document.querySelector('#tabela-usuarios td').textContent,payload);
  assert.equal(dom.window.document.querySelector('#tabela-usuarios img'),null);
  assert.equal(dom.window.document.querySelector('#tabela-usuarios [onclick]'),null);
  dom.window.mostrarToast(payload);assert.equal(dom.window.document.querySelector('#toast-container img'),null);
  assert.ok(!html.includes('window.fetch='));assert.ok(!html.includes('sessionStorage.setItem'));
  dom.window.close();
 });
 await t.test('JavaScript das telas é sintaticamente válido e não contém bypass',()=>{
  for(const file of ['arthur.html','login.html','painel-adm.html']){
   const html=fs.readFileSync('public/'+file,'utf8');assert.ok(!html.includes('sessionStorage.setItem'));
   for(const match of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
  }
 });
});
test('fallback real quando MySQL não responde',async()=>{
 const previous=process.env.DB_PORT;process.env.DB_PORT='1';
 const cfg={...config(),dbMode:'mysql'};const instance=await createApplication({config:cfg});
 try{assert.equal(instance.store.mode,'memory');assert.match(instance.store.message,/indisponível/);const agent=request.agent(instance.app);assert.equal((await login(agent,process.env.ADMIN_USER,process.env.ADMIN_PASSWORD)).status,200);}finally{await instance.close();if(previous)process.env.DB_PORT=previous;else delete process.env.DB_PORT;}
});
test('expiração invalida HTTP e desconecta socket',async()=>{
 const instance=await createApplication({config:{...config(),ttl:1200}});await new Promise(resolve=>instance.server.listen(0,'127.0.0.1',resolve));
 const agent=request.agent(instance.app);
 try{
  const response=await login(agent,process.env.ADMIN_USER,process.env.ADMIN_PASSWORD);assert.equal(response.status,200);
  const cookie=response.headers['set-cookie'][0].split(';')[0];
  const {socket,error}=await socketResult('http://127.0.0.1:'+instance.server.address().port,{extraHeaders:{Cookie:cookie},auth:{csrfToken:response.body.csrfToken}});assert.ifError(error);
  await new Promise((resolve,reject)=>{socket.once('disconnect',resolve);setTimeout(()=>reject(new Error('Sessão expirou sem desconectar socket')),4000).unref();});
  assert.equal((await request(instance.app).get('/api/me').set('Cookie',cookie)).status,401);socket.close();
 }finally{await instance.close();}
});

test('dashboard carrega com sessão, perfis reais e telemetria do backend',async()=>{
 const instance=await createApplication({config:config()});await new Promise(resolve=>instance.server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+instance.server.address().port;
 const agent=request.agent(instance.app);let dom,socket;
 try{
  const response=await login(agent,process.env.ADMIN_USER,process.env.ADMIN_PASSWORD);assert.equal(response.status,200);
  const cookie=response.headers['set-cookie'][0].split(';')[0];
  const html=(await agent.get('/arthur.html')).text;
  dom=new JSDOM(html,{runScripts:'outside-only',url:url+'/arthur.html'});
  const win=dom.window;const errors=[];
  win.addEventListener('error',e=>errors.push(e.message));
  win.fetch=async(input,options={})=>{
   if(String(input).startsWith('https://api.open-meteo.com'))return {ok:true,json:async()=>({current_weather:{weathercode:0,temperature:29}})};
   const headers=new Headers(options.headers||{});headers.set('Cookie',cookie);
   return fetch(new URL(input,url),{...options,headers});
  };
  win.Headers=Headers;win.HTMLCanvasElement.prototype.getContext=()=>({createLinearGradient:()=>({addColorStop(){}})});
  win.Chart=class{static defaults={font:{}};constructor(ctx,options){this.data=options.data;}update(){}};
  win.io=options=>{socket=io(url,{...options,forceNew:true,reconnection:false,extraHeaders:{Cookie:cookie}});return socket;};
  win.eval(fs.readFileSync('public/auth.js','utf8'));
  for(const match of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))if(match[1].trim())win.eval(match[1]);
  await win.sdaReady;
  await new Promise((resolve,reject)=>{socket.on('dados_sensores',()=>setTimeout(resolve,20));setTimeout(()=>reject(new Error('Dashboard sem dados')),4000).unref();});
  assert.deepEqual(errors,[]);
  assert.match(win.document.getElementById('texto-umidade').textContent,/%/);
  assert.match(win.document.getElementById('sda-system-banner').textContent,/SIMULAÇÃO/);
  assert.equal((await agent.get('/api/perfis')).body.length,4);
  assert.equal(win.document.getElementById('seletorPlanta').options.length,4);
 }finally{socket?.close();dom?.window.close();await instance.close();}
});
