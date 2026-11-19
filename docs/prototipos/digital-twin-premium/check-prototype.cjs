const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const script=fs.readFileSync(path.join(__dirname,'prototype.js'),'utf8');
function fixture(t){
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'http://127.0.0.1:3102/'});
 t.after(()=>dom.window.close());
 dom.window.fetch=()=>{throw Error('Protótipo não pode chamar rede');};
 dom.window.XMLHttpRequest=function(){throw Error('Protótipo não pode chamar rede');};
 dom.window.WebSocket=function(){throw Error('Protótipo não pode abrir socket');};
 dom.window.eval(script);return dom.window;
}
test('Protótipo isolado: seis comandos inativos, sem contratos ou dependências operacionais',t=>{
 const w=fixture(t),d=w.document;
 assert.equal(d.querySelectorAll('.pump-module').length,3);
 assert.equal(d.querySelectorAll('.command-line button').length,6);
 assert.ok([...d.querySelectorAll('.command-line button,.command-line input')].every(e=>e.disabled));
 assert.match(d.querySelector('meta[http-equiv="Content-Security-Policy"]').content,/connect-src 'none'/);
 assert.ok(!/fetch\s*\(|XMLHttpRequest|WebSocket|sdaRequest|\/api\//.test(script));
 for(const button of d.querySelectorAll('.command-line button'))button.click();
 assert.ok([...d.querySelectorAll('.pump-module')].every(e=>e.dataset.state==='off'));
});
test('Estados ilustrativos: espera e bloqueio não se tornam confirmação de bomba ligada',t=>{
 const w=fixture(t),d=w.document,select=d.querySelector('#preview-state');
 for(const [value,state] of [['confirmed','confirmed'],['pending','pending'],['blocked','blocked'],['unknown','unknown']]){
  select.value=value;select.dispatchEvent(new w.Event('change'));
  const id=value==='confirmed'?2:3,module=d.querySelector(`[data-module="${id}"]`);
  assert.equal(module.dataset.state,state);
  if(value==='pending'||value==='blocked')assert.match(module.querySelector('.pump-confirmed').textContent,/Desligada/);
  assert.ok([...d.querySelectorAll('.command-line button')].every(e=>e.disabled));
 }
 assert.ok([...d.querySelectorAll('.pump-confirmed')].every(e=>/Sem dados/.test(e.textContent)));
});
test('Cena responsiva: símbolos compartilhados, cultivo estático e IDs únicos',t=>{
 const w=fixture(t),d=w.document,ids=[...d.querySelectorAll('[id]')].map(e=>e.id);
 assert.equal(new Set(ids).size,ids.length);
 assert.equal(d.querySelectorAll('#crop-rows use').length,30);
 const plants=d.querySelector('#crop-rows').outerHTML;
 const select=d.querySelector('#preview-state');select.value='confirmed';select.dispatchEvent(new w.Event('change'));
 assert.equal(d.querySelector('#crop-rows').outerHTML,plants);
 for(const svg of d.querySelectorAll('svg.scene'))for(const id of [1,2,3])assert.equal(svg.querySelectorAll(`[data-pump="${id}"]`).length,1);
 assert.equal(d.querySelectorAll('.pump-deck').length,1);
 const css=fs.readFileSync(path.join(__dirname,'prototype.css'),'utf8');assert.match(css,/prefers-reduced-motion/);
});
