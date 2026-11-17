const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const markup=fs.readFileSync('public/login.html','utf8'),script=fs.readFileSync('public/login-experience.js','utf8');
function page(t){const dom=new JSDOM(markup,{url:'http://localhost:3000/login.html',runScripts:'outside-only'});t.after(()=>dom.window.close());return dom.window;}
function cinema(w,{reduced=false,height=800}={}){
 let top=0,changes,frameId=0;const pending=new Map(),motion={matches:reduced,addEventListener:(name,fn)=>{changes=fn;}};
 Object.defineProperty(w,'innerHeight',{value:height,writable:true});
 w.matchMedia=()=>motion;w.requestAnimationFrame=fn=>{pending.set(++frameId,fn);return frameId;};w.cancelAnimationFrame=id=>pending.delete(id);
 const scene=w.document.getElementById('water-journey'),route=w.document.querySelector('[data-water-route]');
 scene.getBoundingClientRect=()=>({top,height:2400});w.document.getElementById('login-area').getBoundingClientRect=()=>({top:700});
 route.getTotalLength=()=>800;route.getPointAtLength=n=>({x:n,y:300-n/8});
 return {scene,route,pending,at(value){top=value;w.dispatchEvent(new w.Event('scroll'));},flush(){const callbacks=[...pending.values()];pending.clear();for(const fn of callbacks)fn();},motion(value){motion.matches=value;changes({matches:value});}};
}
test('Login V2: três seções, acesso direto inclusive mobile e formulário intacto sem animação',t=>{
 const w=page(t),d=w.document;w.eval(script);const sections=[...d.querySelectorAll('main>section')];assert.equal(sections.length,3);assert.equal(sections[2].id,'login-area');
 for(const a of d.querySelectorAll('a[href^="#"]'))assert.ok(d.querySelector(a.getAttribute('href')));
 assert.ok(d.querySelector('.hero-access[href="#login-area"]'));assert.ok(d.querySelector('[data-logo-slot]'));
 assert.equal(d.querySelectorAll('#login-form').length,1);assert.equal(d.querySelector('#campo-senha').type,'password');assert.equal(d.querySelector('#campo-usuario').autocomplete,'username');assert.equal(d.body.classList.contains('cinema-ready'),false);
 assert.equal(d.querySelectorAll('script[src="/login.js"]').length,1);assert.equal(d.querySelector('#login-form').closest('.login-reveal'),null);
});
test('Login V2: scroll desenha linha, move gota, preenche reservatórios e reverte sem animação automática',t=>{
 const w=page(t),f=cinema(w);w.eval(script);f.flush();assert.equal(f.scene.dataset.progress,'0.0000');assert.equal(f.scene.style.getPropertyValue('--route-offset'),'1');
 f.at(-800);f.flush();assert.equal(f.scene.dataset.progress,'0.5000');assert.equal(f.scene.style.getPropertyValue('--route-offset'),'0.5');assert.equal(w.document.querySelector('[data-travel-drop]').getAttribute('transform'),'translate(400 250)');assert.ok(w.document.querySelector('[data-station="2"]').classList.contains('is-current'));
 const fullWell=w.document.querySelector('[data-water-fill="well"]').style.transform;assert.equal(fullWell,'scaleY(1)');
 f.at(-1600);f.flush();assert.equal(f.scene.dataset.progress,'1.0000');assert.equal(w.document.querySelector('[data-water-plant]').style.transform,'scaleY(1)');
 f.at(-400);f.flush();assert.equal(f.scene.dataset.progress,'0.2500');assert.equal(f.scene.style.getPropertyValue('--route-offset'),'0.75');assert.notEqual(w.document.querySelector('[data-water-fill="well"]').style.transform,fullWell);assert.equal(f.pending.size,0);
});
test('Login V2: eventos agrupados em um frame e movimento reduzido restaura pôster estático',t=>{
 const w=page(t),f=cinema(w);w.eval(script);f.at(-100);f.at(-200);assert.equal(f.pending.size,1);f.flush();
 f.at(-500);f.motion(true);assert.equal(f.pending.size,0);assert.equal(w.document.body.classList.contains('cinema-ready'),false);assert.equal(f.scene.dataset.progress,undefined);assert.equal(w.document.querySelector('[data-water-fill]').getAttribute('style'),null);
 f.motion(false);f.flush();assert.equal(w.document.body.classList.contains('cinema-ready'),true);
});
test('Login V2: preferência reduzida inicial, SVG indisponível e viewport curto mantêm acesso estático',t=>{
 const w=page(t),f=cinema(w,{reduced:true});w.eval(script);assert.equal(w.document.body.classList.contains('cinema-ready'),false);assert.equal(f.pending.size,0);
 const w2=page(t);cinema(w2);w2.document.querySelector('[data-water-route]').getTotalLength=undefined;w2.eval(script);assert.equal(w2.document.body.classList.contains('cinema-ready'),false);
 const w3=page(t),short=cinema(w3,{height:500});w3.eval(script);assert.equal(w3.document.body.classList.contains('cinema-ready'),false);w3.innerHeight=800;w3.dispatchEvent(new w3.Event('resize'));short.flush();assert.equal(w3.document.body.classList.contains('cinema-ready'),true);
});
test('Login V2: saída limpa estado e volta pelo cache reinicia a cena',t=>{
 const w=page(t),f=cinema(w);w.eval(script);f.flush();w.dispatchEvent(new w.Event('pagehide'));assert.equal(w.document.body.classList.contains('cinema-ready'),false);w.dispatchEvent(new w.Event('pageshow'));f.flush();assert.equal(w.document.body.classList.contains('cinema-ready'),true);
});
