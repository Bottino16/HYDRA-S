const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { Server } = require('socket.io');
const { config } = require('./src/config');
const { Store, publicUser } = require('./src/store');
const { validatePassword, hashPassword, comparePassword } = require('./src/password');
const { simulation } = require('./src/simulation');
const {WeatherService}=require('./src/services/weather');
const {monitoringRoutes}=require('./src/routes/monitoring-routes');
const {AssistantService}=require('./src/assistant/service');
const {assistantRoutes}=require('./src/assistant/routes');
const asyncRoute = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
const fail = (status,message) => Object.assign(new Error(message),{status});
function validUser(body) {
  const {usuario,nome=usuario,nivel='cliente',plano='basico',ativo=true}=body;
  if(typeof usuario!=='string'||! /^[a-zA-Z0-9_.-]{3,50}$/.test(usuario)||typeof nome!=='string'||!nome.trim()||nome.length>100||!['master','cliente'].includes(nivel)||!['basico','premium'].includes(plano)||typeof ativo!=='boolean')throw fail(400,'Dados de usuário inválidos.');
  return {usuario,nome:nome.trim(),nivel,plano,ativo};
}
function validSchedule(data) {
  if(!data||typeof data.hora!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.hora)||!Number.isInteger(data.duracao)||data.duracao<1||data.duracao>30||typeof data.ativo!=='boolean'||!Array.isArray(data.diasMes)||data.diasMes.length>31||data.diasMes.some(d=>!Number.isInteger(d)||d<1||d>31))throw fail(400,'Agendamento inválido.');
  if(data.perfilPlantaId!=null&&(!Number.isInteger(data.perfilPlantaId)||data.perfilPlantaId<1))throw fail(400,'Perfil inválido.');
  return {hora:data.hora,duracao:data.duracao,ativo:data.ativo,diasMes:[...new Set(data.diasMes)],perfilPlantaId:data.perfilPlantaId??null};
}
async function createApplication(options={}) {
  const cfg=options.config||config();
  const store=options.store||new Store(cfg); await store.init();
  const app=express(), server=http.createServer(app);
  app.disable('x-powered-by');
  // Inline legado apenas na interface; conteúdo dinâmico de usuário usa textContent.
  app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'","'unsafe-inline'",'https://cdn.jsdelivr.net','https://unpkg.com'],scriptSrcAttr:["'unsafe-inline'"],styleSrc:["'self'","'unsafe-inline'",'https://fonts.googleapis.com'],fontSrc:["'self'",'https://fonts.gstatic.com','https://cdn.jsdelivr.net','https://unpkg.com','data:'],connectSrc:["'self'",'https://unpkg.com','https://cdn.jsdelivr.net'],imgSrc:["'self'",'data:'],upgradeInsecureRequests:null}},strictTransportSecurity:cfg.secure?undefined:false}));
  app.use(express.json({limit:'32kb'}));
  const sessionStore=new session.MemoryStore();
  const sessionMiddleware=session({name:'sda.sid',secret:cfg.secret,resave:false,saveUninitialized:false,store:sessionStore,cookie:{httpOnly:true,sameSite:'strict',secure:cfg.secure,maxAge:cfg.ttl}});
  app.use(sessionMiddleware);
  app.use('/api', (req,res,next)=>{res.set('Cache-Control','no-store');next();});
  const io=new Server(server,{cors:{origin:cfg.origin,credentials:true},allowRequest:(req,done)=>done(null,!req.headers.origin||req.headers.origin===cfg.origin)});
  io.engine.use(sessionMiddleware);
  function auth(req,res,next){const user=store.byId(req.session.userId);if(!user?.ativo||!req.session.expiresAt||req.session.expiresAt<=Date.now())return res.status(401).json({mensagem:'Faça login para continuar.'});req.user=user;next();}
  function master(req,res,next){if(req.user.nivel!=='master')return res.status(403).json({mensagem:'Acesso exclusivo do master.'});next();}
  function origin(req,res,next){if(req.headers.origin&&req.headers.origin!==cfg.origin)return res.status(403).json({mensagem:'Origem não permitida.'});next();}
  function csrf(req,res,next){if(!['GET','HEAD','OPTIONS'].includes(req.method)&&(!req.session.csrf||req.get('x-csrf-token')!==req.session.csrf))return res.status(403).json({mensagem:'Proteção CSRF: atualize a página.'});next();}
  app.use('/api',origin);
  app.get('/api/auth/csrf',(req,res)=>{req.session.csrf ||= crypto.randomBytes(32).toString('hex');res.json({csrfToken:req.session.csrf});});
  const failures=new Map();
  const cleanup=setInterval(()=>{for(const [key,value] of failures)if(Date.now()-value.last>cfg.lockMs)failures.delete(key);},60000);cleanup.unref();
  const loginLimit=rateLimit({windowMs:15*60000,limit:50,standardHeaders:'draft-8',legacyHeaders:false,message:{mensagem:'Muitas tentativas. Aguarde antes de tentar novamente.'}});
  const dummyHash=await hashPassword(crypto.randomBytes(24).toString('hex'));
  app.post('/api/login',loginLimit,csrf,asyncRoute(async(req,res)=>{
    const {user,pass}=req.body;
    if(typeof user!=='string'||typeof pass!=='string'||user.length>50||pass.length>256)throw fail(400,'Credenciais inválidas.');
    const keys=['ip:'+req.ip,'user:'+user.toLowerCase()];
    if(keys.some(key=>{const v=failures.get(key);return v&&v.count>=cfg.attempts&&Date.now()-v.last<cfg.lockMs;}))throw fail(429,'Acesso temporariamente bloqueado. Aguarde para tentar novamente.');
    const row=store.findUser(user);
    const valid=await comparePassword(pass,row?.senha_hash||dummyHash);
    if(!valid||!row?.ativo){for(const key of keys){const v=failures.get(key);failures.set(key,{count:v&&Date.now()-v.last<cfg.lockMs?v.count+1:1,last:Date.now()});}throw fail(401,'Usuário ou senha incorretos.');}
    for(const key of keys)failures.delete(key);
    await new Promise((resolve,reject)=>req.session.regenerate(err=>err?reject(err):resolve()));
    req.session.userId=row.id;req.session.expiresAt=Date.now()+cfg.ttl;req.session.csrf=crypto.randomBytes(32).toString('hex');
    await store.lastLogin(row);
    await new Promise((resolve,reject)=>req.session.save(err=>err?reject(err):resolve()));
    res.json({sucesso:true,usuario:publicUser(row),csrfToken:req.session.csrf});
  }));
  app.use('/api',auth,csrf);
  const apiLimit=rateLimit({windowMs:60000,limit:300,legacyHeaders:false,standardHeaders:'draft-8'});app.use('/api',apiLimit);
  const sim=simulation(io,store,cfg,options.deviceOptions||{});await sim.ready;
  const weather=options.weather||new WeatherService(cfg);
  const assistant=new AssistantService({store,device:sim,weather,config:cfg.assistant,provider:options.assistantProvider});
  app.use('/api',assistantRoutes(assistant));
  async function revoke(userId){
    const sessions=await new Promise((resolve,reject)=>sessionStore.all((error,data)=>error?reject(error):resolve(data)));
    for(const [id,data] of Object.entries(sessions))if(data.userId===Number(userId)){
      await new Promise((resolve,reject)=>sessionStore.destroy(id,error=>error?reject(error):resolve()));io.in('session:'+id).disconnectSockets(true);
    }
  }
  app.get('/api/me',(req,res)=>res.json({usuario:publicUser(req.user),csrfToken:req.session.csrf,...store.status(),simulate:cfg.simulate}));
  app.post('/api/logout',asyncRoute(async(req,res)=>{const id=req.sessionID;await new Promise((resolve,reject)=>req.session.destroy(error=>error?reject(error):resolve()));io.in('session:'+id).disconnectSockets(true);res.clearCookie('sda.sid',{httpOnly:true,sameSite:'strict',secure:cfg.secure});res.json({sucesso:true});}));
  app.get('/api/usuarios',master,(req,res)=>res.json(store.users.map(publicUser)));
  app.post('/api/usuarios',master,asyncRoute(async(req,res)=>{const data=validUser(req.body);validatePassword(req.body.senha,data.usuario);data.senha_hash=await hashPassword(req.body.senha);res.status(201).json({sucesso:true,usuario:await store.createUser(data)});}));
  app.put('/api/usuarios/:id',master,asyncRoute(async(req,res)=>{const row=store.byId(req.params.id);if(!row)throw fail(404,'Usuário não encontrado.');const data=validUser({...publicUser(row),...req.body});data.senha_hash=row.senha_hash;if(req.body.senha){validatePassword(req.body.senha,data.usuario);data.senha_hash=await hashPassword(req.body.senha);}const result=await store.updateUser(row.id,data);await revoke(row.id);res.json({sucesso:true,usuario:result});}));
  app.delete('/api/usuarios/:id',master,asyncRoute(async(req,res)=>{await store.deleteUser(req.params.id);await revoke(req.params.id);res.json({sucesso:true});}));
  app.post('/api/usuarios/:id/senha',master,asyncRoute(async(req,res)=>{const row=store.byId(req.params.id);if(!row)throw fail(404,'Usuário não encontrado.');validatePassword(req.body.senha,row.usuario);await store.updateUser(row.id,{...row,senha_hash:await hashPassword(req.body.senha)});await revoke(row.id);res.json({sucesso:true});}));
  app.post('/api/senha',asyncRoute(async(req,res)=>{if(typeof req.body.atual!=='string'||!await comparePassword(req.body.atual,req.user.senha_hash))throw fail(400,'Senha atual incorreta.');validatePassword(req.body.nova,req.user.usuario);await store.updateUser(req.user.id,{...req.user,senha_hash:await hashPassword(req.body.nova)});await revoke(req.user.id);res.json({sucesso:true});}));
  app.get('/api/perfis',(req,res)=>res.json(store.profiles.filter(p=>p.usuario_id===req.user.id).map(p=>({id:String(p.id),nome:p.nome,limite:p.limite_umidade,selecionado:!!p.selecionado}))));
  app.put('/api/perfis',asyncRoute(async(req,res)=>{const profiles=req.body;if(!Array.isArray(profiles)||!profiles.length||profiles.length>30||profiles.some(p=>typeof p.nome!=='string'||!p.nome.trim()||p.nome.length>100||!Number.isInteger(Number(p.limite))||Number(p.limite)<1||Number(p.limite)>99))throw fail(400,'Perfis inválidos.');await store.saveProfiles(req.user.id,profiles.map(p=>({id:p.id,nome:p.nome.trim(),limite:Number(p.limite),selecionado:!!p.selecionado})));res.json({sucesso:true});}));
  app.get('/api/agendamento',(req,res)=>res.json(store.schedule(req.user.id,req.query.perfil??null)));
  app.get('/api/agendamentos',(req,res)=>res.json(store.schedules.filter(row=>row.usuario_id===req.user.id).map(row=>store.schedule(req.user.id,row.perfil_planta_id))));
  app.put('/api/agendamento',asyncRoute(async(req,res)=>{await store.saveSchedule(req.user.id,validSchedule(req.body));await sim.event('agendamento_configurado','info','Agendamento por perfil atualizado.');res.json({sucesso:true});}));
  app.use('/api',monitoringRoutes({store,device:sim,weather},master));
  app.use('/api',(req,res)=>res.status(404).json({mensagem:'Rota inexistente.'}));
  io.use((socket,next)=>{
    const req=socket.request,user=store.byId(req.session?.userId);
    if(!user?.ativo||!req.session.expiresAt||req.session.expiresAt<=Date.now())return next(Object.assign(new Error('Não autenticado.'),{data:{status:401}}));
    if(!req.session.csrf||socket.handshake.auth.csrfToken!==req.session.csrf)return next(Object.assign(new Error('CSRF inválido.'),{data:{status:403}}));
    next();
  });
  io.on('connection',socket=>{
    const id=socket.request.sessionID;socket.join('session:'+id);sim.initial(socket,socket.request.session.userId);
    let count=0,windowStart=Date.now();
    socket.use((packet,next)=>{
      if(Date.now()-windowStart>60000){windowStart=Date.now();count=0;}
      if(++count>60){socket.disconnect(true);return;}
      // Revalida a sessão a cada pacote, inclusive após expiração ou revogação.
      sessionStore.get(id,(error,data)=>{
        const user=store.byId(data?.userId);
        if(error||!data||!user?.ativo||(!data.expiresAt||data.expiresAt<=Date.now())) {socket.emit('auth_error',{status:401});socket.disconnect(true);return;}
        socket.currentUser=user;next();
      });
    });
    const handle=(name,masterOnly,fn)=>socket.on(name,async(data,ack)=>{
      try{if(masterOnly&&socket.currentUser.nivel!=='master')throw fail(403,'Acesso exclusivo do master.');await fn(data);if(typeof ack==='function')ack({sucesso:true});}
      catch(error){const result={sucesso:false,status:error.status||500,mensagem:error.status?error.message:'Erro interno.'};if(typeof ack==='function')ack(result);else socket.emit('command_error',result);}
    });
    handle('salvar_agendamento',false,async data=>{const valid=validSchedule(data);await store.saveSchedule(socket.currentUser.id,valid);socket.emit('config_atual',valid);});
    handle('regar_manual',true,data=>sim.pump(data,{userId:socket.currentUser.id}));
    handle('parar_rega_manual',true,()=>sim.stop());
    // Eventos administrativos legados não operam fora das rotas autorizadas.
    handle('admin_pedir_usuarios',true,()=>socket.emit('admin_lista_usuarios',store.users.map(publicUser)));
    handle('admin_editar_usuario',true,()=>{throw fail(400,'Use a API autenticada de usuários.');});
  });
  const publicDir=path.join(__dirname,'public');
  const pageAuth=(req,res,next)=>{const user=store.byId(req.session.userId);if(!user?.ativo||!req.session.expiresAt||req.session.expiresAt<=Date.now())return res.redirect('/login.html');req.user=user;res.set('Cache-Control','no-store');next();};
  app.get(['/', '/index.html'],(req,res)=>res.redirect(store.byId(req.session.userId)?.ativo&&req.session.expiresAt>Date.now()?'/arthur.html':'/login.html'));
  app.get('/documentacao',(req,res)=>res.redirect('/login.html'));
  app.get('/arthur.html',pageAuth,(req,res)=>res.sendFile(path.join(publicDir,'arthur.html')));
  app.get('/painel-adm.html',pageAuth,(req,res)=>req.user.nivel==='master'?res.sendFile(path.join(publicDir,'painel-adm.html')):res.status(403).send('Acesso exclusivo do master.'));
  app.get('/login.html',(req,res)=>res.sendFile(path.join(publicDir,'login.html')));
  // HTML só passa pelas rotas acima; impede contorno por caminhos codificados.
  app.use((req,res,next)=>{
    let decoded;try{decoded=decodeURIComponent(req.path);}catch{return res.sendStatus(404);}
    if(!['.js','.css','.png','.woff','.woff2','.svg','.ico'].includes(path.extname(decoded).toLowerCase()))return res.sendStatus(404);
    next();
  });
  app.use(express.static(publicDir,{index:false,dotfiles:'deny'}));
  app.use((req,res)=>res.status(404).send('Não encontrado.'));
  app.use((error,req,res,next)=>{if(res.headersSent)return next(error);res.status(error.status||500).json({mensagem:error.status&&[400,401,403,404,409,429,503,504].includes(error.status)?error.message:'Erro interno; tente novamente.'});});
  await store.retain();
  const retention=setInterval(()=>store.retain().catch(()=>{}),3600000);retention.unref();
  const socketExpiry=setInterval(()=>{
    for(const socket of io.sockets.sockets.values())sessionStore.get(socket.request.sessionID,(error,data)=>{
      if(error||!data||!store.byId(data.userId)?.ativo||(!data.expiresAt||data.expiresAt<=Date.now()))socket.disconnect(true);
    });
  },1000);socketExpiry.unref();
  return {app,server,io,store,device:sim,assistant,async close(){assistant.close();clearInterval(socketExpiry);clearInterval(cleanup);clearInterval(retention);await sim.close();await new Promise(resolve=>io.close(resolve));await store.close();}};
}
async function start(){const cfg=config(),instance=await createApplication({config:cfg});await new Promise(resolve=>instance.server.listen(cfg.port,cfg.host,resolve));console.log(`SDA: ${cfg.origin} | ${cfg.simulate?'simulação':'serial (validação física pendente)'} | banco: ${instance.store.mode}`);if(instance.store.message)console.warn(instance.store.message);return instance;}
if(require.main===module)start().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={createApplication,start};
