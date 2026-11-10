// Sessão fica apenas no cookie httpOnly; nunca é construída no navegador.
window.sdaReady = fetch('/api/me', {cache:'no-store'}).then(async response => {
  if (!response.ok) { location.replace('/login.html'); throw new Error('Sessão encerrada.'); }
  const data = await response.json();
  window.sdaCsrf = data.csrfToken;
  document.addEventListener('DOMContentLoaded', () => renderStatus(data), {once:true});
  if(document.readyState !== 'loading') renderStatus(data);
  return data;
});
function renderStatus(data) {
  let banner=document.getElementById('sda-system-banner');
  if(!banner){banner=document.createElement('div');banner.id='sda-system-banner';banner.setAttribute('role','status');banner.style.cssText='padding:12px;background:#17354a;color:#fff;border-radius:8px;margin-bottom:16px';(document.querySelector('main')||document.querySelector('.container')||document.body).prepend(banner);}
  banner.textContent=(data.simulate?'MODO SIMULAÇÃO':'HARDWARE — validação física pendente')+' • '+(data.warning||'Banco conectado.');
}
window.sdaRequest = async function(url, options={}) {
  await window.sdaReady;
  const headers=new Headers(options.headers||{});
  if(options.body) headers.set('Content-Type','application/json');
  if(!['GET','HEAD'].includes((options.method||'GET').toUpperCase()))headers.set('X-CSRF-Token',window.sdaCsrf);
  const response=await fetch(url,{...options,headers,cache:'no-store'});
  if(response.status===401)location.replace('/login.html');
  return response;
};
window.sdaLogout = async function() {
  const response=await window.sdaRequest('/api/logout',{method:'POST'});
  if(response.ok){sessionStorage.clear();location.replace('/login.html');}
};
window.sdaChangePassword = function() {
  if(document.getElementById('sda-password-dialog'))return;
  const overlay=document.createElement('div');overlay.id='sda-password-dialog';
  overlay.style.cssText='position:fixed;inset:0;z-index:20000;background:#000b;display:grid;place-items:center;padding:16px';
  const form=document.createElement('form');form.setAttribute('role','dialog');form.setAttribute('aria-modal','true');form.setAttribute('aria-label','Trocar senha');
  form.style.cssText='background:#161b22;color:#fff;border:1px solid #587080;border-radius:12px;padding:24px;max-width:400px;width:100%;box-sizing:border-box';
  const title=document.createElement('h2');title.textContent='Trocar senha';form.append(title);
  const inputs=[];
  for(const [name,label] of [['atual','Senha atual'],['nova','Nova senha'],['confirmacao','Confirme a nova senha']]){
    const row=document.createElement('label');row.textContent=label;row.style.display='block';
    const input=document.createElement('input');input.name=name;input.type='password';input.required=true;
    input.autocomplete=name==='atual'?'current-password':'new-password';input.style.cssText='display:block;width:100%;box-sizing:border-box;margin:8px 0 16px;padding:10px';
    row.append(input);form.append(row);inputs.push(input);
  }
  const help=document.createElement('p');help.textContent='Use 12+ caracteres, maiúscula, minúscula, número e símbolo, sem padrões ou nome do usuário.';form.append(help);
  const status=document.createElement('p');status.setAttribute('role','alert');form.append(status);
  const submit=document.createElement('button');submit.type='submit';submit.textContent='Salvar senha';
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancelar';cancel.addEventListener('click',()=>overlay.remove());
  form.append(submit,cancel);overlay.append(form);document.body.append(overlay);inputs[0].focus();
  form.addEventListener('keydown',e=>{if(e.key==='Escape')overlay.remove();});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(inputs[1].value!==inputs[2].value){status.textContent='A confirmação não coincide.';return;}
    submit.disabled=true;
    try{
      const response=await window.sdaRequest('/api/senha',{method:'POST',body:JSON.stringify({atual:inputs[0].value,nova:inputs[1].value})});
      if(response.ok){location.replace('/login.html');return;}
      status.textContent=(await response.json()).mensagem;
    }catch{status.textContent='Erro de conexão. Tente novamente.';}finally{submit.disabled=false;}
  });
};
