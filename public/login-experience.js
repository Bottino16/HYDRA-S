// Cinema do login: progressão visual local, sem API, telemetria ou comandos.
(()=>{
 const scene=document.getElementById('water-journey'),route=document.querySelector('[data-water-route]');
 if(!scene||!route||typeof matchMedia!=='function'||typeof requestAnimationFrame!=='function')return;
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),body=document.body;
 const fills=[...document.querySelectorAll('[data-water-fill]')],plant=document.querySelector('[data-water-plant]'),drop=document.querySelector('[data-travel-drop]');
 const stations=[...document.querySelectorAll('[data-station]')],nodes=[...document.querySelectorAll('[data-journey-node]')],access=document.getElementById('login-area');
 let frame=null,enabled=false,total=0,last=-1;
 try{if(typeof route.getTotalLength==='function')total=route.getTotalLength();}catch{}
 const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));
 function render(){
  frame=null;if(!enabled)return;
  // Todas as leituras geométricas antecedem as escritas; no máximo uma atualização por frame.
  const rect=scene.getBoundingClientRect(),accessTop=access?.getBoundingClientRect().top??innerHeight;
  const p=clamp(-rect.top/Math.max(1,rect.height-innerHeight));
  const rise=clamp(accessTop/Math.max(1,innerHeight))*22;
  body.style.setProperty('--hero-drift',Math.min(70,Math.max(0,scrollY)*.08)+'px');
  body.style.setProperty('--access-rise',rise+'px');body.style.setProperty('--access-opacity',String(1-rise/220));
  if(Math.abs(p-last)<.0001)return;last=p;scene.dataset.progress=p.toFixed(4);
  scene.style.setProperty('--route-offset',String(1-p));
  fills.forEach((el,i)=>el.style.transform='scaleY('+(0.12+.88*clamp((p-(i===0?.18:.45))/.28))+')');
  if(plant)plant.style.transform='scaleY('+(0.2+.8*clamp((p-.68)/.3))+')';
  const step=Math.min(3,Math.floor(p*4));
  stations.forEach((el,i)=>el.classList.toggle('is-current',i===step));
  nodes.forEach((el,i)=>{el.style.opacity=String(i<=step?1:.32);});
  if(drop&&total>0&&typeof route.getPointAtLength==='function'){
   const point=route.getPointAtLength(total*p);drop.setAttribute('transform','translate('+point.x+' '+point.y+')');
  }
 }
 function schedule(){if(enabled&&frame===null)frame=requestAnimationFrame(render);}
 function stop(){enabled=false;if(frame!==null)cancelAnimationFrame(frame);frame=null;body.classList.remove('cinema-ready');
  for(const name of ['--hero-drift','--access-rise','--access-opacity'])body.style.removeProperty(name);
  scene.style.removeProperty('--route-offset');delete scene.dataset.progress;
  for(const el of [...fills,...nodes,...(plant?[plant]:[])])el.removeAttribute('style');
  for(const el of stations)el.classList.remove('is-current');last=-1;
 }
 function start(){if(motion.matches||innerHeight<540||total<=0||typeof route.getPointAtLength!=='function')return stop();enabled=true;body.classList.add('cinema-ready');last=-1;schedule();}
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',()=>{if(motion.matches||innerHeight<540)stop();else if(!enabled)start();else schedule();},{passive:true});
 motion.addEventListener?.('change',()=>motion.matches?stop():start());
 addEventListener('pagehide',stop);addEventListener('pageshow',start);
 start();
})();
