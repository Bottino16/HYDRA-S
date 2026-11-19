const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');const {JSDOM}=require('jsdom');
const {encode,decode}=require('../src/protocol');const {DeviceLink}=require('../src/device-link');const {SimulatedBoard}=require('../src/simulated-board');const {limits}=require('../src/pump-control');
const state=()=>({type:'state',solo:10,temperatura:29.5,umidade_ar:68,caixa:50,boias:[true,true,false,true,false],pumps:[false,false,false],modo:'MANUAL',alertas:0});
const ack=(cmd,pumps=[false,false,true],ok=true,code=0)=>({type:'ack',cmd,ok,code,pumps,modo:'MANUAL'});
test('protocolo: versão, checksum, forma e sensores nulos',()=>{
 const original=encode(1,state());assert.deepEqual(decode(original).data,state());
 for(const line of [original.replace('"solo":10','"solo":11'),original.replace('"v":1','"v":2'),original.slice(0,-8),original+'x','x'.repeat(513)])assert.throws(()=>decode(line));
 const invalid=state();invalid.pumps=[true];assert.throws(()=>decode(encode(2,invalid)));
 const missing=state();missing.temperatura=null;missing.umidade_ar=null;missing.solo=null;assert.equal(decode(encode(3,missing)).data.temperatura,null);
 for(const data of [{cmd:'pump',id:4,on:true},{cmd:'pump',id:1,on:'true'},{cmd:'setMode',mode:'HACK'},{cmd:'heartbeat',extra:1}])assert.throws(()=>decode(encode(1,data),{command:true}));
});
test('backend descarta corrupção, repetição e fora de ordem; aceita rollover',()=>{
 const link=new DeviceLink(()=>{});assert.equal(link.receive(encode(0xfffffffe,state())),true);
 assert.equal(link.receive(encode(0xfffffffe,state())),false);assert.equal(link.receive(encode(0xfffffffd,state())),false);
 assert.equal(link.receive(encode(0xffffffff,state())),true);assert.equal(link.receive(encode(0,state())),true);
 const before=link.snapshot();assert.equal(link.receive(encode(1,state()).replace('"solo":10','"solo":11')),false);assert.equal(link.snapshot().seq,before.seq);assert.equal(link.snapshot().solo,10);link.close();
});
test('nenhum estado ligado é presumido antes de ACK/estado validado',async()=>{
 let sent;const link=new DeviceLink(line=>{sent=decode(line,{command:true});});link.receive(encode(1,state()));let completed=false;
 const pending=link.command({cmd:'pump',id:3,on:true});pending.then(()=>completed=true);
 await new Promise(resolve=>setImmediate(resolve));assert.equal(completed,false);assert.equal(link.snapshot().pumps[2],false);
 const valid=encode(2,ack(sent.seq));assert.equal(link.receive(valid.replace('"ok":true','"ok":false')),false);assert.equal(link.snapshot().pumps[2],false);
 link.receive(valid);await pending;assert.equal(link.snapshot().pumps[2],true);link.close();
});
test('NACK bloqueia comando, timeout não liga e reset cancela pendências',async()=>{
 let sent;const link=new DeviceLink(line=>{sent=decode(line,{command:true});},{ackMs:30});link.receive(encode(1,state()));
 const rejected=assert.rejects(link.command({cmd:'pump',id:3,on:true}),error=>error.status===409);link.receive(encode(2,ack(sent.seq,[false,false,false],false,2)));await rejected;
 const timeout=assert.rejects(link.command({cmd:'pump',id:3,on:true}),error=>error.status===504);
 await new Promise(resolve=>setTimeout(resolve,50));await timeout;assert.equal(link.snapshot().pumps[2],false);
 const reboot=assert.rejects(link.command({cmd:'pump',id:3,on:true}),error=>error.status===503);link.receive(encode(0,{type:'boot'}));await reboot;assert.deepEqual(link.snapshot().pumps,[null,null,null]);link.close();
});
test('telemetria vencida vira estado desconhecido',()=>{
 let now=0;const link=new DeviceLink(()=>{},{clock:()=>now,staleMs:3000});link.receive(encode(1,{...state(),pumps:[false,false,true]}));assert.equal(link.snapshot().connected,true);now=3001;assert.equal(link.snapshot().connected,false);assert.deepEqual(link.snapshot().pumps,[null,null,null]);link.close();
});
test('simulação: três bombas, cinco boias, fila e limite da fonte',()=>{
 let now=0;const frames=[];const board=new SimulatedBoard(line=>frames.push(decode(line)),{clock:()=>now,automatic:false});let seq=0;const command=data=>{board.write(encode(++seq,data));return frames.at(-1).data;};
 assert.deepEqual(board.control.pumps,[false,false,false]);assert.equal(frames.at(-1).data.boias.length,5);
 now=limits.boot;board.tick();command({cmd:'setMode',mode:'MANUAL'});board.soil=10;
 assert.equal(command({cmd:'pump',id:1,on:true}).ok,true);assert.equal(board.control.pumps[0],true);
 const queued=command({cmd:'pump',id:2,on:true});assert.equal(queued.ok,true);assert.equal(queued.pumps[1],false);
 command({cmd:'pump',id:1,on:false});now++;board.tick();assert.equal(board.control.pumps.filter(Boolean).length,0);
 now+=limits.gap;board.tick();assert.equal(board.control.pumps[1],true);assert.equal(board.control.pumps.filter(Boolean).length,1);board.close();
});
test('simulação: heartbeat perdido volta AUTO; falha DHT é null e bloqueia',()=>{
 let now=0;const frames=[];const board=new SimulatedBoard(line=>frames.push(decode(line)),{clock:()=>now,automatic:false});let seq=0;const command=data=>board.write(encode(++seq,data));
 now=limits.boot;board.tick();command({cmd:'setMode',mode:'MANUAL'});command({cmd:'pump',id:1,on:true});assert.equal(board.control.pumps[0],true);
 board.faults.dht=true;now++;board.tick();board.telemetry();assert.equal(board.control.pumps[0],false);assert.equal(frames.at(-1).data.temperatura,null);assert.equal(frames.at(-1).data.umidade_ar,null);
 board.faults.dht=false;board.soil=90;now+=limits.heartbeat;board.tick();assert.equal(board.control.mode,'AUTO');assert.equal(board.control.alerts&32,32);assert.deepEqual(board.control.pumps,[false,false,false]);board.close();
});
test('simulação bloqueia comando manual sem água e não o executa depois',()=>{
 let now=0;const frames=[];const board=new SimulatedBoard(line=>frames.push(decode(line)),{clock:()=>now,automatic:false});let seq=0;const command=data=>{board.write(encode(++seq,data));return frames.at(-1).data;};
 now=limits.boot;board.tick();command({cmd:'setMode',mode:'MANUAL'});board.river=0;
 const denied=command({cmd:'pump',id:1,on:true});assert.equal(denied.ok,false);assert.equal(denied.code,2);assert.equal(board.control.requested[0],false);
 board.river=80;now++;board.tick();assert.equal(board.control.pumps[0],false);board.close();
});
test('painel das três bombas não muda para ligada no clique',async()=>{
 const dom=new JSDOM('<main></main>',{runScripts:'outside-only',url:'http://localhost:3000'}),win=dom.window,handlers={};let complete;
 win.sdaReady=Promise.resolve({usuario:{nivel:'master'}});win.confirm=()=>true;win.socket={on:(name,fn)=>handlers[name]=fn};
 const initial={...state(),connected:true,v:1,seq:1};win.sdaRequest=async url=>url==='/api/estado'?{ok:true,json:async()=>initial}:new Promise(resolve=>{complete=resolve;});
 win.eval(fs.readFileSync('public/digital-twin.js','utf8'));win.eval(fs.readFileSync('public/maquete.js','utf8'));
 await new Promise(resolve=>setTimeout(resolve,20));
 const button=[...win.document.querySelectorAll('button')].find(b=>b.textContent==='Ligar');button.click();
 const label=[...win.document.querySelectorAll('span')].find(s=>s.textContent.startsWith('Bomba 1:'));
 assert.match(label.textContent,/DESLIGADA/);
 complete({ok:true,json:async()=>({ack:{pumps:[true,false,false]}})});await new Promise(resolve=>setTimeout(resolve,10));assert.match(label.textContent,/DESLIGADA/);
 handlers.estado_sistema({...initial,pumps:[true,false,false]});assert.match(label.textContent,/LIGADA \(confirmada\)/);
 handlers.disconnect();assert.match(label.textContent,/DESCONHECIDA/);dom.window.close();
});

test('fila envia apenas um comando até receber ACK, sem estourar RX do UNO',async()=>{
 const sent=[],link=new DeviceLink(line=>sent.push(decode(line,{command:true})));
 link.receive(encode(1,state()));const first=link.command({cmd:'heartbeat'}),second=link.command({cmd:'setMode',mode:'MANUAL'});
 assert.equal(sent.length,1);link.receive(encode(2,ack(sent[0].seq)));await first;await new Promise(resolve=>setImmediate(resolve));assert.equal(sent.length,2);
 link.receive(encode(3,ack(sent[1].seq)));await second;link.close();
});

test('ferramenta supervisionada só gera comandos conhecidos e durações seguras',()=>{
 const {parseCommand}=require('../scripts/serial-bench');
 assert.deepEqual(parseCommand('stop'),{cmd:'setMode',mode:'MANUAL'});
 assert.deepEqual(parseCommand('pump 3 on 4000'),{cmd:'pump',id:3,on:true,ms:4000});
 assert.deepEqual(parseCommand('pump 1 off'),{cmd:'pump',id:1,on:false,ms:0});
 assert.deepEqual(parseCommand('calibrate 800 300'),{cmd:'calibrate',dry:800,wet:300});
 for(const cmd of ['pump 4 on 4000','pump 3 on 60001','pump 1 on -1','pump 1 on 0','pump 1 on 4000 extra','mode ROOT','calibrate 300 800','thresholds 40 25'])assert.throws(()=>parseCommand(cmd));
});
