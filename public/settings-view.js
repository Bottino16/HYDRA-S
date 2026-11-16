// Apresentação somente: nenhum acesso à API ou comando operacional.
(()=>{
 if(window.sdaSettings)return;
 function feedback(id,text,state='info'){const el=document.getElementById(id);if(el){el.textContent=text;el.dataset.state=state;}}
 function profiles(items,selected){
  const root=document.getElementById('settings-profile-cards');if(!root)return;root.replaceChildren();
  for(const profile of items){const card=document.createElement('article');card.className='settings-profile';const active=String(profile.id)===String(selected);card.classList.toggle('is-selected',active);
   for(const [tag,text] of [['span',active?'Selecionado':'Disponível'],['h4',profile.nome],['p','Limite de umidade: '+profile.limite+'%']]){const el=document.createElement(tag);el.textContent=text;card.append(el);}root.append(card);
  }
  const current=items.find(p=>String(p.id)===String(selected));const context=document.getElementById('settings-schedule-profile');if(context)context.textContent=current?'Perfil: '+current.nome:'Nenhum perfil selecionado';
 }
 function days(values){const el=document.getElementById('settings-days');if(el)el.textContent=values.length?'Dias selecionados: '+values.join(', '):'Nenhum dia selecionado.';}
 window.sdaSettings={profiles,days,feedback};
 document.addEventListener('DOMContentLoaded',()=>{
  // Aviso local, sem salvar automaticamente nem recriar os campos na navegação.
  document.querySelector('.settings-schedule')?.addEventListener('input',()=>feedback('schedule-feedback','Alterações no formulário ainda não enviadas.','warning'));
  for(const id of ['modal-perfil','modal-calendario']){
   const modal=document.getElementById(id);if(!modal)continue;let previous,open=false;
   const controls=()=>[...modal.querySelectorAll('*')].filter(el=>['INPUT','BUTTON','SELECT','TEXTAREA'].includes(el.tagName)&&!el.disabled&&el.type!=='hidden');
   const observer=new MutationObserver(()=>{const visible=modal.style.display==='flex';if(visible===open)return;open=visible;if(open){previous=document.activeElement;controls()[0]?.focus();}else{previous?.focus();previous=null;}});observer.observe(modal,{attributes:true,attributeFilter:['style']});
   modal.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const items=controls(),first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}});
  }
 });
})();
