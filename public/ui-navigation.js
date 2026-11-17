document.addEventListener('DOMContentLoaded',()=>{
 const toggle=document.getElementById('menu-toggle'),sidebar=document.getElementById('app-sidebar'),backdrop=document.getElementById('menu-backdrop'),dismiss=document.getElementById('menu-close'),main=document.getElementById('main-content');
 if(!toggle||!sidebar||!backdrop||sidebar.dataset.navigationReady)return;
 sidebar.dataset.navigationReady='true';
 const media=window.matchMedia('(max-width: 800px)');let previousMainInert=false,backgroundLocked=false;
 function update(){
  const open=media.matches&&document.body.classList.contains('menu-open');sidebar.inert=media.matches&&!open;
  if(open){sidebar.setAttribute('role','dialog');sidebar.setAttribute('aria-modal','true');if(main&&!backgroundLocked){previousMainInert=!!main.inert;main.inert=true;backgroundLocked=true;}}
  else{sidebar.removeAttribute('role');sidebar.removeAttribute('aria-modal');if(main&&backgroundLocked){main.inert=previousMainInert;backgroundLocked=false;}}
 }
 function close(restore=false){document.body.classList.remove('menu-open');toggle.setAttribute('aria-expanded','false');backdrop.hidden=true;update();if(restore&&media.matches)toggle.focus();}
 toggle.addEventListener('click',()=>{if(!media.matches)return;const opening=toggle.getAttribute('aria-expanded')!=='true';if(!opening)return close(true);document.body.classList.add('menu-open');toggle.setAttribute('aria-expanded','true');backdrop.hidden=false;update();(dismiss||sidebar.querySelector('button,a'))?.focus();});
 dismiss?.addEventListener('click',()=>close(true));backdrop.addEventListener('click',()=>close(true));
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){const notifications=document.getElementById('painel-notif');if(notifications?.style.display==='block'){notifications.style.display='none';document.getElementById('notification-toggle')?.setAttribute('aria-expanded','false');document.getElementById('notification-toggle')?.focus();}if(document.body.classList.contains('menu-open'))close(true);}
  if(event.key==='Tab'&&document.body.classList.contains('menu-open')){const items=[...sidebar.querySelectorAll('a[href],button:not(:disabled)')].filter(el=>el.getClientRects().length);const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
 });
 document.addEventListener('sda:viewchange',event=>{close();const heading=event.detail.element?.querySelector('h2,h3')||(event.detail.assistant?document.querySelector('#soil-assistant h2'):document.querySelector('#main-content .page-header h2'));if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}});
 media.addEventListener('change',()=>close(media.matches&&sidebar.contains(document.activeElement)));
 new MutationObserver(update).observe(document.body,{attributes:true,attributeFilter:['class']});update();
});
