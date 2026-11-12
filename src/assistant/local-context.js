// Teto conservador por bytes UTF-8, com reserva para template/saída. Não é tokenizador exato.
const bytes=value=>Buffer.byteLength(value,'utf8');
function fitLocalRequest(request,config){
 const limit=(config.ollamaNumCtx||4096)-request.max_tokens-256;
 const last=JSON.parse(request.messages.at(-1).content),candidates=last.documentos||[];
 const data={...last,documentos:[]};const messages=[{role:'user',content:JSON.stringify(data)}];
 const cost=()=>bytes(request.system)+messages.reduce((n,m)=>n+bytes(m.content)+32,0);
 if(cost()>limit)throw Object.assign(new Error('Pergunta e contexto obrigatório não cabem no orçamento local. Reduza a pergunta; as instruções de segurança serão preservadas.'),{status:400,code:'CONTEXT_LIMIT'});
 // Uma fonte curta tem prioridade sobre histórico; preservar o contexto técnico atual inteiro.
 for(const doc of candidates.slice(0,1)){
  let text=doc.text.slice(0,360);while(text.length){const selected={id:doc.id,title:doc.title,text};data.documentos=[selected];messages.at(-1).content=JSON.stringify(data);if(cost()<=limit)break;text=text.slice(0,-24);}
  if(!text){data.documentos=[];messages.at(-1).content=JSON.stringify(data);}
 }
 const history=request.messages.slice(0,-1).slice(-4);
 for(let i=history.length-1;i>=0;i--){messages.unshift(history[i]);if(cost()>limit){messages.shift();break;}}
 return {messages,documents:data.documentos,budget:{estimatedInputUpperBound:cost(),inputLimit:limit,numCtx:config.ollamaNumCtx||4096,reservedTokens:256,outputTokens:request.max_tokens}};
}
module.exports={fitLocalRequest};
