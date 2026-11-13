document.addEventListener('DOMContentLoaded',()=>{
 const toggle=document.getElementById('menu-toggle'),sidebar=document.getElementById('app-sidebar'),backdrop=document.getElementById('menu-backdrop');
 if(!toggle||!sidebar)return;
 function close(restore=false){document.body.classList.remove('menu-open');toggle.setAttribute('aria-expanded','false');backdrop.hidden=true;if(restore)toggle.focus();}
 toggle.addEventListener('click',()=>{const opening=toggle.getAttribute('aria-expanded')!=='true';if(!opening)return close();sidebar.inert=false;document.body.classList.add('menu-open');toggle.setAttribute('aria-expanded','true');backdrop.hidden=false;sidebar.querySelector('button,a')?.focus();});
 backdrop.addEventListener('click',()=>close(true));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){const notifications=document.getElementById('painel-notif');if(notifications?.style.display==='block'){notifications.style.display='none';document.getElementById('notification-toggle')?.setAttribute('aria-expanded','false');document.getElementById('notification-toggle')?.focus();}if(document.body.classList.contains('menu-open'))close(true);}if(event.key==='Tab'&&document.body.classList.contains('menu-open')){const items=[...sidebar.querySelectorAll('a[href],button:not(:disabled)')].filter(el=>el.getClientRects().length);const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});
 document.addEventListener('sda:viewchange',event=>{close();const heading=event.detail.element?.querySelector('h2,h3')||(event.detail.assistant?document.querySelector('#soil-assistant h2'):document.querySelector('#main-content .page-header h2'));if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}});
 const media=window.matchMedia('(max-width: 800px)');media.addEventListener('change',()=>close());
 // Menu fora da tela não deve receber foco pelo teclado.
 const update=()=>{sidebar.inert=media.matches&&!document.body.classList.contains('menu-open');};
 new MutationObserver(update).observe(document.body,{attributes:true,attributeFilter:['class']});media.addEventListener('change',update);update();
});
