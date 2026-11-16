// Medição de layout somente: nenhuma requisição ou comando.
(()=>{
 if(window.sdaPolish)return;window.sdaPolish=true;
 document.addEventListener('DOMContentLoaded',()=>{
  const header=document.querySelector('.mobile-header');
  if(header){const measure=()=>document.body.style.setProperty('--hydra-mobile-header-height',header.getBoundingClientRect().height+'px');measure();window.addEventListener('resize',measure);if(typeof ResizeObserver!=='undefined')new ResizeObserver(measure).observe(header);}
  function controls(root){return [...root.querySelectorAll('*')].filter(el=>['INPUT','BUTTON','SELECT','TEXTAREA'].includes(el.tagName)&&!el.disabled&&el.type!=='hidden');}
  // Documentação e troca de senha: apenas foco e apresentação.
  const doc=document.getElementById('modal-doc');
  if(doc){let previous,open=false;new MutationObserver(()=>{const visible=doc.style.display==='flex';if(visible===open)return;open=visible;if(open){previous=document.activeElement;controls(doc)[0]?.focus();}else previous?.focus();}).observe(doc,{attributes:true,attributeFilter:['style']});doc.addEventListener('keydown',event=>trap(event,doc));}
  function trap(event,root){if(event.key!=='Tab')return;const items=controls(root),first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
  let password,previous,lastOutside=document.activeElement;
  document.addEventListener('focusin',event=>{if(!event.target.closest('#sda-password-dialog'))lastOutside=event.target;});
  new MutationObserver(()=>{const current=document.getElementById('sda-password-dialog');if(current===password)return;if(current){previous=lastOutside;current.addEventListener('keydown',event=>trap(event,current));}else if(password)previous?.focus();password=current;}).observe(document.body,{childList:true});
  document.querySelector('#toast-container')?.setAttribute('role','status');
 });
})();
