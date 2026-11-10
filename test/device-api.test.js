const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),request=require('supertest');
const {config}=require('../src/config'),{createApplication}=require('../server');
async function login(agent,user,pass){const csrf=(await agent.get('/api/auth/csrf')).body.csrfToken;return agent.post('/api/login').set('X-CSRF-Token',csrf).send({user,pass});}
test('novas APIs: autenticação preservada e respostas de bomba contêm ACK real',async t=>{
 const password=crypto.randomBytes(20).toString('hex')+'Q!';Object.assign(process.env,{DB_MODE:'memory',ADMIN_USER:'operador_api',ADMIN_PASSWORD:password,SESSION_SECRET:crypto.randomBytes(32).toString('hex'),SIMULATE:'true'});
 const instance=await createApplication({config:config()}),started=Date.now();t.after(()=>instance.close());const master=request.agent(instance.app),client=request.agent(instance.app);
 for(const url of ['/api/estado','/api/bombas/1','/api/modo','/api/calibracao'])assert.equal((await request(instance.app).get(url)).status,401);
 for(const url of ['/firmware/sda/Config.h','/firmware/sda/sda.ino','/docs/TESTE-FISICO-FASE-1.md'])assert.equal((await request(instance.app).get(url)).status,404);
 const admin=await login(master,'operador_api',password),csrf=admin.body.csrfToken;
 const clientPassword=crypto.randomBytes(20).toString('hex')+'Q!';assert.equal((await master.post('/api/usuarios').set('X-CSRF-Token',csrf).send({usuario:'cliente_api',senha:clientPassword,nivel:'cliente',plano:'basico'})).status,201);
 const user=await login(client,'cliente_api',clientPassword),token=user.body.csrfToken;
 for(const url of ['/api/bombas/1','/api/modo','/api/limiares','/api/calibracao'])assert.equal((await client.post(url).set('X-CSRF-Token',token).send({})).status,403);
 const before=(await master.get('/api/estado')).body;assert.equal(before.v,1);assert.equal(before.pumps.length,3);assert.equal(before.boias.length,5);assert.deepEqual(before.pumps,[false,false,false]);
 const mode=await master.post('/api/modo').set('X-CSRF-Token',csrf).send({mode:'MANUAL'});assert.equal(mode.status,200);assert.equal(mode.body.ack.modo,'MANUAL');
 for(const body of [{on:'true'},{on:true,ms:120001}])assert.equal((await master.post('/api/bombas/1').set('X-CSRF-Token',csrf).send(body)).status,400);
 await new Promise(resolve=>setTimeout(resolve,Math.max(0,5600-(Date.now()-started))));
 const on=await master.post('/api/bombas/1').set('X-CSRF-Token',csrf).send({on:true});assert.equal(on.status,200);assert.equal(on.body.ack.ok,true);assert.equal(on.body.ack.pumps[0],true);
 assert.equal((await master.get('/api/estado')).body.pumps[0],true);
 const queued=await master.post('/api/bombas/2').set('X-CSRF-Token',csrf).send({on:true});assert.equal(queued.status,200);assert.equal(queued.body.ack.pumps[1],false);
 for(const id of [1,2])assert.equal((await master.post('/api/bombas/'+id).set('X-CSRF-Token',csrf).send({on:false})).status,200);
 assert.deepEqual((await master.get('/api/estado')).body.pumps,[false,false,false]);
});
