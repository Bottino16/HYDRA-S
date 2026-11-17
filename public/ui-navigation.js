document.addEventListener('DOMContentLoaded',()=>{
 const toggle=document.getElementById('menu-toggle'),sidebar=document.getElementById('app-sidebar'),backdrop=document.getElementById('menu-backdrop'),dismiss=document.getElementById('menu-close'),main=document.getElementById('main-content'),collapse=document.getElementById('sidebar-collapse');
 if(!toggle||!sidebar||!backdrop||sidebar.dataset.navigationReady)return;
 sidebar.dataset.navigationReady='true';
 const media=window.matchMedia('(max-width: 800px)'),tablet=window.matchMedia('(min-width: 801px) and (max-width: 1200px)');let previousMainInert=false,backgroundLocked=false,preference=null;
 try{const saved=localStorage.getItem('hydra_sidebar_collapsed');if(saved==='compact'||saved==='expanded')preference=saved==='compact';}catch{}
 const tip=document.createElement('div');tip.id='nav-tooltip';tip.setAttribute('role','tooltip');tip.hidden=true;document.body.append(tip);let tipTarget=null,priorDescription=null;
 function hideTip(){tip.hidden=true;if(tipTarget){if(priorDescription===null)tipTarget.removeAttribute('aria-describedby');else tipTarget.setAttribute('aria-describedby',priorDescription);}tipTarget=null;}
 function decorate(){for(const button of sidebar.querySelectorAll('.nav-btn')){
  if(button.id==='assistant-nav')for(const child of [...button.childNodes])if(child.nodeType===3&&child.textContent.trim()){const label=document.createElement('span');label.textContent=child.textContent;child.replaceWith(label);}
  const label=button.getAttribute('aria-label')||[...button.childNodes].filter(child=>child.nodeType===3||(child.nodeType===1&&child.getAttribute('aria-hidden')!=='true'&&!child.classList.contains('badge'))).map(child=>child.textContent).join(' ').replace(/\s+/g,' ').trim();
  if(label){button.dataset.navLabel=label;if(!button.hasAttribute('aria-label'))button.setAttribute('aria-label',label);}
 }}
 function compact(){return !media.matches&&(preference===null?tablet.matches:preference);}
 function updateSize(){hideTip();const small=compact();document.body.classList.toggle('sidebar-compact',small);if(collapse){collapse.setAttribute('aria-expanded',String(!small));const label=small?'Expandir menu':'Recolher menu';collapse.setAttribute('aria-label',label);collapse.title=label;}}
 function showTip(button){if(!button||!compact())return;hideTip();tip.textContent=button.dataset.navLabel||button.getAttribute('aria-label')||'';if(!tip.textContent)return;tip.hidden=false;const r=button.getBoundingClientRect();tip.style.left=(sidebar.getBoundingClientRect().right+10)+'px';tip.style.top=Math.max(8,Math.min(r.top+(r.height-tip.offsetHeight)/2,window.innerHeight-tip.offsetHeight-8))+'px';tipTarget=button;priorDescription=button.getAttribute('aria-describedby');button.setAttribute('aria-describedby',[priorDescription,'nav-tooltip'].filter(Boolean).join(' '));}
 function update(){const open=media.matches&&document.body.classList.contains('menu-open');sidebar.inert=media.matches&&!open;
  if(open){sidebar.setAttribute('role','dialog');sidebar.setAttribute('aria-modal','true');if(main&&!backgroundLocked){previousMainInert=!!main.inert;main.inert=true;backgroundLocked=true;}}
  else{sidebar.removeAttribute('role');sidebar.removeAttribute('aria-modal');if(main&&backgroundLocked){main.inert=previousMainInert;backgroundLocked=false;}}
 }
 function close(restore=false){hideTip();document.body.classList.remove('menu-open');toggle.setAttribute('aria-expanded','false');backdrop.hidden=true;update();if(restore&&media.matches)toggle.focus();}
 collapse?.addEventListener('click',()=>{if(media.matches)return;preference=!compact();try{localStorage.setItem('hydra_sidebar_collapsed',preference?'compact':'expanded');}catch{}updateSize();});
 toggle.addEventListener('click',()=>{if(!media.matches)return;const opening=toggle.getAttribute('aria-expanded')!=='true';if(!opening)return close(true);hideTip();document.body.classList.add('menu-open');toggle.setAttribute('aria-expanded','true');backdrop.hidden=false;update();(dismiss||sidebar.querySelector('button,a'))?.focus();});
 dismiss?.addEventListener('click',()=>close(true));backdrop.addEventListener('click',()=>close(true));
 sidebar.addEventListener('pointerover',event=>{const button=event.target.closest('.nav-btn');if(button&&!button.contains(event.relatedTarget))showTip(button);});
 sidebar.addEventListener('pointerout',event=>{if(tipTarget&&!tipTarget.contains(event.relatedTarget))hideTip();});
 sidebar.addEventListener('focusin',event=>showTip(event.target.closest('.nav-btn')));sidebar.addEventListener('focusout',hideTip);
 sidebar.querySelector('nav')?.addEventListener('scroll',hideTip,{passive:true});window.addEventListener('resize',hideTip);
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){hideTip();const notifications=document.getElementById('painel-notif');if(notifications?.style.display==='block'){notifications.style.display='none';document.getElementById('notification-toggle')?.setAttribute('aria-expanded','false');document.getElementById('notification-toggle')?.focus();hideTip();}if(document.body.classList.contains('menu-open'))close(true);}
  if(event.key==='Tab'&&document.body.classList.contains('menu-open')){const items=[...sidebar.querySelectorAll('a[href],button:not(:disabled)')].filter(el=>el.getClientRects().length);const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
 });
 document.addEventListener('sda:viewchange',event=>{close();const heading=event.detail.element?.querySelector('h2,h3')||(event.detail.assistant?document.querySelector('#soil-assistant h2'):document.querySelector('#main-content .page-header h2'));if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}});
 media.addEventListener('change',()=>{close(media.matches&&sidebar.contains(document.activeElement));updateSize();});tablet.addEventListener('change',updateSize);
 new MutationObserver(update).observe(document.body,{attributes:true,attributeFilter:['class']});
 const nav=sidebar.querySelector('nav');if(nav)new MutationObserver(decorate).observe(nav,{childList:true,subtree:true});decorate();updateSize();update();
});
