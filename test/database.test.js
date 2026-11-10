const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const mysql=require('mysql2/promise');
const {setup}=require('../db/setup');
const {Store}=require('../src/store');
const {config,databaseOptions}=require('../src/config');
const {hashPassword}=require('../src/password');
const strong=()=>crypto.randomBytes(20).toString('hex')+'Q!';
test('MySQL real: schema idempotente, seed, CRUD, persistência e retenção',{skip:!process.env.SDA_TEST_MYSQL_PORT},async t=>{
 const name='sda_test_'+crypto.randomBytes(6).toString('hex');
 Object.assign(process.env,{DB_MODE:'mysql',DB_HOST:'127.0.0.1',DB_PORT:process.env.SDA_TEST_MYSQL_PORT,DB_USER:process.env.SDA_TEST_MYSQL_USER||'root',DB_PASSWORD:process.env.SDA_TEST_MYSQL_PASSWORD||'',DB_NAME:name,DB_SSL:'false',ADMIN_USER:'gestor_teste',ADMIN_PASSWORD:strong(),SESSION_SECRET:crypto.randomBytes(32).toString('hex'),READING_RETENTION_DAYS:'1'});
 const root=await mysql.createConnection({host:'127.0.0.1',port:Number(process.env.DB_PORT),user:process.env.DB_USER,password:process.env.DB_PASSWORD});
 t.after(async()=>{await root.query('DROP DATABASE IF EXISTS ??',[name]);await root.end();});
 await setup();await setup();
 const store=new Store(config());await store.init();t.after(()=>store.close());assert.equal(store.mode,'mysql');assert.equal(store.users.length,1);
 const user=await store.createUser({nome:'Cliente teste',usuario:'cliente_teste',senha_hash:await hashPassword(strong()),nivel:'cliente',plano:'basico',ativo:true});
 await store.saveProfiles(user.id,[{nome:'Alface',limite:45}]);
 await store.saveSchedule(user.id,{hora:'18:30',duracao:2,ativo:true,diasMes:[1,15]});
 await store.reading({solo:42,temperatura:29,umidade_ar:68,nivel_caixa:50,bombas:[false,false,false]});
 await root.changeUser({database:name});
 const [tables]=await root.query('SHOW TABLES');assert.equal(tables.length,7);
 await root.execute('INSERT INTO leituras (solo,bombas,data_hora) VALUES (?, ?, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 100 DAY))',[10,'[false,false,false]']);
 await store.retain();const [readings]=await root.execute('SELECT * FROM leituras');assert.equal(readings.length,1);assert.equal(Number(readings[0].temperatura),29);
 const restarted=new Store(config());await restarted.init();
 try{assert.equal(restarted.mode,'mysql');assert.equal(restarted.users.length,2);assert.equal(restarted.profiles.length,1);assert.deepEqual(restarted.schedule(user.id).diasMes,[1,15]);}finally{await restarted.close();}
 const old=store.byId(user.id);await store.updateUser(user.id,{...old,nome:'Atualizado',ativo:false});assert.equal(store.byId(user.id).ativo,false);
 await store.deleteUser(user.id);const [users]=await root.execute('SELECT * FROM usuarios');assert.equal(users.length,1);assert.ok(!users[0].senha_hash.includes(process.env.ADMIN_PASSWORD));
 await assert.rejects(setup({reset:true}),/confirmação explícita/);
});
test('TLS MySQL valida certificado e não usa rejectUnauthorized=false',()=>{
 const previous=process.env.DB_SSL;process.env.DB_SSL='true';assert.equal(databaseOptions().ssl.rejectUnauthorized,true);if(previous)process.env.DB_SSL=previous;else delete process.env.DB_SSL;
});
