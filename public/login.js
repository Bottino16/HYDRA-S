let csrfToken;
async function fazerLogin(){
 const button=document.getElementById('entrar'), error=document.getElementById('mensagem-erro');
 error.style.display='none';button.disabled=true;button.textContent='Acessando...';
 try {
  if(!csrfToken){const response=await fetch('/api/auth/csrf',{cache:'no-store'});csrfToken=(await response.json()).csrfToken;}
  const response=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrfToken},body:JSON.stringify({user:document.getElementById('campo-usuario').value.trim(),pass:document.getElementById('campo-senha').value})});
  const data=await response.json();
  if(!response.ok)throw new Error(data.mensagem||'Não foi possível entrar.');
  sessionStorage.clear();location.replace('/arthur.html');
 }catch(e){error.textContent=e.message;error.style.display='block';}
 finally{button.disabled=false;button.textContent='Entrar';}
}
document.getElementById('entrar').addEventListener('click',fazerLogin);
for(const id of ['campo-usuario','campo-senha'])document.getElementById(id).addEventListener('keydown',e=>{if(e.key==='Enter')fazerLogin();});
