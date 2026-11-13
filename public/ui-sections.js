// Navegação local: mantém os mesmos nós, formulários, sockets e gerações ativos.
(()=>{
 if(window.sdaSections)return;
 const main=document.querySelector('main');if(!main)return;
 const sections=new Map(),positions=new Map();let active='overview';
 const buttons=()=>document.querySelectorAll('[data-app-target]');
 function register(name,element){if(sections.has(name))return;sections.set(name,element);element.dataset.appSection=name;element.hidden=name!==active;sync();}
 function sync(){buttons().forEach(button=>{const selected=button.dataset.appTarget===active;button.classList.toggle('is-active',selected);if(selected)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');if(button.id==='assistant-nav')button.setAttribute('aria-expanded',String(selected));});}
 function show(name){if(!sections.has(name))return false;positions.set(active,main.scrollTop);active=name;sections.forEach((element,key)=>element.hidden=key!==name);sync();main.scrollTop=positions.get(name)||0;document.dispatchEvent(new CustomEvent('sda:viewchange',{detail:{section:name,assistant:name==='assistant',element:sections.get(name)}}));return true;}
 window.sdaSections={register,show,get active(){return active;}};
 for(const element of main.querySelectorAll(':scope > [data-app-section]'))register(element.dataset.appSection,element);
 for(const element of document.querySelectorAll('[data-section-target]')){const target=sections.get(element.dataset.sectionTarget);if(target)target.querySelector('.section-content').append(element);}
 document.querySelector('aside nav')?.addEventListener('click',event=>{const target=event.target.closest('[data-app-target]');if(target)show(target.dataset.appTarget);});
})();
