const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const markup=fs.readFileSync('public/login.html','utf8'),script=fs.readFileSync('public/login-experience.js','utf8');
function page(t){const dom=new JSDOM(markup,{url:'http://localhost:3000/login.html',runScripts:'outside-only'});t.after(()=>dom.window.close());return dom.window;}
test('Login: hero antecede acesso, âncoras funcionam sem animação e contrato do formulário permanece',t=>{
 const w=page(t),d=w.document;w.eval(script);
 const sections=[...d.querySelectorAll('main>section')];assert.equal(sections.length,3);assert.ok(sections[0].classList.contains('login-hero'));assert.equal(sections[2].id,'login-area');
 for(const a of d.querySelectorAll('a[href^="#"]'))assert.ok(d.querySelector(a.getAttribute('href')));
 assert.equal(d.querySelectorAll('#login-form').length,1);assert.equal(d.querySelector('#campo-senha').type,'password');assert.equal(d.querySelector('#campo-usuario').autocomplete,'username');assert.equal(d.querySelectorAll('[data-reveal-ready]').length,0);
 assert.ok(d.querySelector('[data-logo-slot]'));assert.equal(d.querySelectorAll('script[src="/login.js"]').length,1);
});
test('Login: revelação acontece uma vez e preferência por menos movimento libera todos os elementos',t=>{
 const w=page(t),d=w.document;let callback,change,disconnected=0;const observed=[],released=[];
 w.matchMedia=()=>({matches:false,addEventListener:(name,fn)=>{assert.equal(name,'change');change=fn;}});
 w.IntersectionObserver=class{constructor(fn,options){callback=fn;assert.equal(options.threshold,.12);}observe(el){observed.push(el);}unobserve(el){released.push(el);}disconnect(){disconnected++;}};
 w.eval(script);assert.equal(observed.length,3);
 callback([{target:observed[0],isIntersecting:false}]);assert.equal(observed[0].classList.contains('is-visible'),false);
 callback([{target:observed[0],isIntersecting:true}]);assert.ok(observed[0].classList.contains('is-visible'));assert.deepEqual(released,[observed[0]]);
 change({matches:true});assert.equal(disconnected,1);assert.equal(d.querySelectorAll('[data-reveal-ready]').length,0);assert.ok(observed.every(el=>el.classList.contains('is-visible')));
});
test('Login: movimento reduzido não cria observador; formulário nunca depende de revelação',t=>{
 const w=page(t);w.matchMedia=()=>({matches:true});w.IntersectionObserver=class{constructor(){assert.fail('Não deve animar com movimento reduzido');}};w.eval(script);
 assert.equal(w.document.querySelectorAll('[data-reveal-ready]').length,0);assert.equal(w.document.querySelector('#login-form').closest('.login-reveal'),null);
});
