const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const pause=()=>new Promise(r=>setTimeout(r,20));
async function fixture(t,master=true){
 const dom=new JSDOM('<main><section id="overview-section"><div class="bento-grid">'+[0,1,2,3].map(i=>'<div class="bento-card"><span id="metric-'+i+'"></span></div>').join('')+'</div></section><section id="history-section" hidden></section></main>',{url:'http://localhost:3000',runScripts:'outside-only'});t.after(()=>dom.window.close());
 const w=dom.window,handlers={},requests=[];let resolve;
 const state={connected:true,simulate:true,rio:0,poco:35,caixa:60,solo:0,temperatura:0,umidade_ar:0,pumps:[false,false,false],boias:[false,true,false,true,false],alertas:0,modo:'MANUAL',limites:{max:1,gap:2000,cycles:[120000,120000,60000]}};
 w.sdaReady=Promise.resolve({usuario:{nivel:master?'master':'cliente'}});w.sdaSocket={on:(name,fn)=>handlers[name]=fn};w.confirm=()=>true;
 w.sdaRequest=async(url,options)=>{requests.push({url,options});if(url==='/api/estado')return {ok:true,json:async()=>state};return new Promise(r=>resolve=r);};
 w.eval(fs.readFileSync('public/maquete.js','utf8'));await pause();return {w,d:w.document,state,handlers,requests,answer:value=>resolve(value)};
}
test('Visão Geral V2: zero válido, valores ausentes e cinco boias sem inferir vazão',async t=>{
 const f=await fixture(t);assert.equal(f.d.querySelector('#circuit-level-0').textContent,'0%');assert.equal(f.d.querySelector('#circuit-level-3').textContent,'0%');
 assert.ok([...f.d.querySelectorAll('.telemetry-strip .bento-card')].every(c=>c.dataset.known==='true'));assert.equal(f.d.querySelectorAll('.float-pill').length,5);
 assert.equal(f.d.querySelectorAll('.vessel-fill')[0].style.height,'0%');assert.equal(f.d.querySelector('#pump-card-3 input').max,'60');
 f.handlers.estado_sistema({...f.state,rio:null,poco:NaN,caixa:101,solo:-1,temperatura:null});assert.ok([...f.d.querySelectorAll('.level-value')].every(el=>el.textContent==='Sem dados'));
 assert.match(f.d.querySelector('.circuit-footnote').textContent,/nenhum fluxo de água é medido/);
 f.handlers.estado_sistema({...f.state,boias:[true,false,true,true,false],alertas:8});assert.equal(f.d.querySelector('[data-reservoir="1"]').dataset.condition,'contradiction');assert.match(f.d.querySelector('#float-1').textContent,/Contradição/);assert.match(f.d.querySelector('#controller-alerts').textContent,/Falha de sensor/);
 f.handlers.disconnect();assert.ok([...f.d.querySelectorAll('.pump-actions button')].every(b=>b.disabled));assert.match(f.d.querySelector('#pump-card-3 .pump-state').textContent,/DESCONHECIDA/);
});
test('Visão Geral V2: comando conserva payload e só a telemetria confirma saída ligada',async t=>{
 const f=await fixture(t),card=f.d.getElementById('pump-card-3');card.querySelector('.pump-start').click();assert.equal(card.getAttribute('aria-busy'),'true');assert.match(card.querySelector('.pump-feedback').textContent,/Aguardando/);
 assert.deepEqual(JSON.parse(f.requests.at(-1).options.body),{on:true,ms:4000});assert.equal(f.requests.at(-1).url,'/api/bombas/3');assert.match(card.querySelector('.pump-state').textContent,/DESLIGADA/);
 f.answer({ok:true,json:async()=>({ack:{pumps:[false,false,true]}})});await pause();assert.match(card.querySelector('.pump-state').textContent,/DESLIGADA/);f.handlers.estado_sistema({...f.state,pumps:[false,false,true]});assert.match(card.querySelector('.pump-state').textContent,/LIGADA \(confirmada\)/);
 card.querySelector('.pump-stop').click();f.answer({ok:false,json:async()=>({mensagem:'Bloqueio de teste <img src=x>'})});await pause();assert.match(card.querySelector('.pump-feedback').textContent,/Bloqueio de teste/);assert.equal(card.querySelector('.pump-feedback img'),null);
});
test('Visão Geral V2: CLIENTE permanece somente leitura',async t=>{
 const f=await fixture(t,false);assert.ok([...f.d.querySelectorAll('.pump-actions button,.mode-switch button,.pump-card input')].every(el=>el.disabled));assert.equal(f.requests.length,1);
});
test('Visão Geral V2: rótulos reduzidos conservam todos os pontos e estado vazio do gráfico',t=>{
 const html=fs.readFileSync('public/arthur.html','utf8'),dom=new JSDOM('<body><canvas id="graficoUmidade"></canvas><p id="overview-chart-empty"></p></body>',{runScripts:'outside-only'});t.after(()=>dom.window.close());const w=dom.window;let chart,history;
 w.matchMedia=()=>({matches:false});w.HTMLCanvasElement.prototype.getContext=()=>({createLinearGradient:()=>({addColorStop(){}})});
 w.Chart=class{static defaults={font:{}};constructor(ctx,options){chart=this;this.data=options.data;this.options=options.options;}update(){}};w.socket={on:(name,fn)=>history=fn};
 const source=html.slice(html.indexOf('    // --- GRÁFICO E EXPORTAÇÕES ---'),html.indexOf('    function baixarRelatorio()'));w.eval(source);
 const data=Array.from({length:60},(_,i)=>({hora:'12:'+String(i).padStart(2,'0'),umidade:i}));history(data);assert.deepEqual(Array.from(chart.data.labels),data.map(p=>p.hora));assert.deepEqual(Array.from(chart.data.datasets[0].data),data.map(p=>p.umidade));assert.equal(chart.options.scales.x.ticks.maxTicksLimit,6);assert.equal(chart.options.scales.x.ticks.maxRotation,0);assert.equal(w.document.getElementById('overview-chart-empty').hidden,true);history([]);assert.equal(w.document.getElementById('overview-chart-empty').hidden,false);
});
