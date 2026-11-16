// Animação de apresentação apenas. O formulário permanece acessível sem este script.
(()=>{
 const items=[...document.querySelectorAll('.login-reveal')];
 if(!items.length||typeof IntersectionObserver==='undefined'||typeof matchMedia!=='function')return;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 if(motion.matches)return;
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){
   entry.target.classList.add('is-visible');
   observer.unobserve(entry.target);
  }
 },{threshold:0.12});
 for(const item of items){item.dataset.revealReady='true';observer.observe(item);}
 const revealAll=()=>{observer.disconnect();for(const item of items){item.classList.add('is-visible');delete item.dataset.revealReady;}};
 motion.addEventListener?.('change',event=>{if(event.matches)revealAll();});
 // Limpeza ao sair e restauração da apresentação pelo cache de navegação.
 addEventListener('pagehide',revealAll,{once:true});
})();
