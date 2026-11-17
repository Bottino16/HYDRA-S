const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const wait=()=>new Promise(r=>setTimeout(r,20));
async function fixture(t,master=true){
 const dom=new JSDOM('<main><section id="overview-section"></section></main>',{url:'http://localhost:3000/arthur.html',runScripts:'outside-only'});t.after(()=>dom.window.close());const w=dom.window,events={},calls=[];let resolve;
 const state={connected:true,simulate:true,modo:'MANUAL',rio:0,poco:20,caixa:75,solo:0,boias:[false,true,false,true,false],pumps:[false,false,false],alertas:0};
 w.sdaReady=Promise.resolve({usuario:{nivel:master?'master':'cliente'}});w.sdaSocket={on:(n,fn)=>events[n]=fn};w.confirm=()=>true;
 w.sdaRequest=async(url,options)=>{calls.push({url,options});return url==='/api/estado'?{ok:true,json:async()=>state}:new Promise(r=>resolve=r);};w.eval(fs.readFileSync('public/maquete.js','utf8'));await wait();return {w,d:w.document,events,state,calls,answer:r=>resolve(r)};
}
test('Water Experience: quatro cenários distintos, canteiros estáticos e cinco boias preservadas',async t=>{
 const f=await fixture(t);assert.deepEqual([...f.d.querySelectorAll('.reservoir-scene')].map(n=>n.dataset.scene),['river','well','elevated','farm']);assert.equal(f.d.querySelectorAll('.float-pill').length,5);assert.equal(f.d.querySelectorAll('.crop-leaves').length,12);
 assert.equal(f.d.querySelector('#circuit-level-0').textContent,'0%');assert.equal(f.d.querySelector('[data-reservoir="2"] .vessel-fill').style.height,'75%');assert.equal(f.d.querySelector('.soil-relative-fill').style.width,'0%');
 const crop=f.d.querySelector('.farm-art').outerHTML;f.events.estado_sistema({...f.state,solo:91});assert.equal(f.d.querySelector('.soil-relative-fill').style.width,'91%');assert.equal(f.d.querySelector('.farm-art').outerHTML,crop);assert.match(f.d.querySelector('.circuit-footnote').textContent,/sem indicar saúde ou crescimento medidos/);
 f.events.estado_sistema({...f.state,solo:null,poco:null});assert.equal(f.d.querySelector('#circuit-level-1').textContent,'Sem dados');assert.equal(f.d.querySelector('#circuit-level-3').textContent,'Sem dados');assert.equal(f.d.querySelector('.soil-relative-fill').style.width,'0%');assert.equal(f.d.querySelector('[data-reservoir="3"]').dataset.known,'false');
});
test('Water Experience: três atalhos são navegação, não comandos; saídas dependem da telemetria',async t=>{
 const f=await fixture(t);const links=[...f.d.querySelectorAll('.circuit-pump')];assert.equal(links.length,3);assert.equal(f.d.querySelectorAll('.water-experience button').length,0);
 for(let i=0;i<3;i++){assert.equal(links[i].getAttribute('href'),'#pump-card-'+(i+1));assert.equal(f.d.querySelector(links[i].getAttribute('href')).tabIndex,-1);links[i].click();}
 await wait();assert.equal(f.calls.length,1);assert.ok([...f.d.querySelectorAll('.circuit-confirmed-state')].every(n=>n.textContent==='Desligada · confirmada'));
 const control=f.d.querySelector('#pump-card-3 .pump-start');control.click();assert.equal(f.d.getElementById('pump-card-3').getAttribute('aria-busy'),'true');assert.equal(f.d.querySelector('[data-pump="3"]').dataset.state,'off');assert.equal(f.d.querySelector('[data-pump="3"] .circuit-pending').textContent,'Pedido pendente');
 f.answer({ok:true,json:async()=>({ack:{pumps:[false,false,true]}})});await wait();assert.equal(f.d.querySelector('[data-pump="3"]').dataset.state,'off');f.events.estado_sistema({...f.state,pumps:[false,null,true]});assert.equal(f.d.querySelector('[data-pump="3"]').dataset.state,'on');assert.equal(f.d.querySelector('[data-pump="2"] .circuit-confirmed-state').textContent,'Sem dados');
 f.events.disconnect();assert.ok([...f.d.querySelectorAll('.circuit-confirmed-state')].every(n=>n.textContent==='Sem dados'));
});
test('Water Experience: erro continua no controle e CLIENTE não ganha operação',async t=>{
 const f=await fixture(t);f.d.querySelector('#pump-card-1 .pump-start').click();f.answer({ok:false,json:async()=>({mensagem:'Sensor inválido <img src=x>'})});await wait();assert.equal(f.d.querySelector('#pump-card-1 .pump-feedback').dataset.state,'error');assert.equal(f.d.querySelector('.circuit-link').dataset.state,'off');assert.equal(f.d.querySelector('#pump-card-1 .pump-feedback img'),null);
 const client=await fixture(t,false);assert.ok([...client.d.querySelectorAll('.pump-actions button')].every(n=>n.disabled));client.d.querySelector('.circuit-pump').click();await wait();assert.equal(client.calls.length,1);
 const css=fs.readFileSync('public/water-experience.css','utf8');assert.ok(css.includes('prefers-reduced-motion:reduce'));assert.ok(css.includes('aria-busy=true'));assert.ok(css.includes('pump-feedback[data-state=error]'));
});

 test('V4.1: módulos mantêm identificação, função e percurso correto sem novos comandos',async t=>{
 const f=await fixture(t);const links=[...f.d.querySelectorAll('.circuit-pump')];
 assert.deepEqual(links.map(n=>n.querySelector('.circuit-module-id').textContent),['B01','B02','B03']);
 assert.deepEqual(links.map(n=>n.querySelector('.circuit-function').textContent),['Captação','Transferência','Irrigação']);
 assert.deepEqual(links.map(n=>n.querySelector('.circuit-pump-route').textContent),['Rio → Poço','Poço → Caixa','Caixa → Plantação']);
 for(const link of links)link.click();await wait();assert.equal(f.calls.length,1);
 f.events.estado_sistema({...f.state,pumps:[true,false,null]});
 assert.deepEqual(links.map(n=>n.querySelector('.circuit-confirmed-state').textContent),['Ligada · confirmada','Desligada · confirmada','Sem dados']);
 });
