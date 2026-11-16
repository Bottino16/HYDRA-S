const {evidenceCandidates}=require('./evidence');
const bytes=value=>Buffer.byteLength(value,'utf8');
// Heuristic, NOT the Llama tokenizer. Latin words: conservatively ~2 UTF-8 bytes/token.
// Symbols/non-Latin text and long opaque strings use the byte fallback ceiling.
// Reserve 768 tokens separately for chat-template overhead and estimation error.
function estimateTokens(text){
 return (String(text).match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]+|\s+|[^A-Za-zÀ-ÖØ-öø-ÿ0-9\s]+/gu)||[]).reduce((n,part)=>n+(
  /^\s+$/u.test(part)?Math.ceil(part.length/4):/^[A-Za-zÀ-ÖØ-öø-ÿ0-9]+$/u.test(part)&&part.length<32?Math.ceil(bytes(part)/2):bytes(part)
 ),0);
}
const inputTokens=(system,messages)=>estimateTokens(system)+32+messages.reduce((n,m)=>n+estimateTokens(m.content)+32,0);
function fitLocalRequest(request,config){
 const numCtx=config.ollamaNumCtx||4096,reservedTokens=768,limit=numCtx-request.max_tokens-reservedTokens;
 const last=JSON.parse(request.messages.at(-1).content),candidates=evidenceCandidates(last.documentos,last.pergunta);
 const data={...last,documentos:[]},messages=[{role:'user',content:''}],selected=[],covered=new Set();
 function render(){
  data.documentos=[];
  for(const item of selected){let doc=data.documentos.find(d=>d.id===item.id);if(!doc){doc={id:item.id,title:item.title,text:item.text};data.documentos.push(doc);}else doc.text+='\n\n'+item.text;}
  data.evidencia_documental={estado:selected.length?'parcial':'sem evidência pertinente que caiba no orçamento',trechos:selected.length,aviso:'Use somente os trechos; sem suporte para uma afirmação específica, informe a limitação.'};
  messages.at(-1).content=JSON.stringify(data);
 }
 render();const cost=()=>inputTokens(request.system,messages);
 if(cost()>limit)throw Object.assign(new Error('Pergunta e contexto obrigatório não cabem no orçamento local. Reduza a pergunta; as instruções de segurança serão preservadas.'),{status:400,code:'CONTEXT_LIMIT'});
 const pending=[...candidates];
 while(pending.length&&selected.length<4){
  pending.sort((a,b)=>(b.score+8*b.matches.filter(t=>!covered.has(t)).length)-(a.score+8*a.matches.filter(t=>!covered.has(t)).length)||a.rank-b.rank||a.index-b.index||a.id.localeCompare(b.id,'en'));
  const item=pending.shift();selected.push(item);render();
  if(cost()>limit){selected.pop();render();continue;}
  for(const term of item.matches)covered.add(term);
 }
 // Mandatory rules/question/telemetry/continuation precede evidence, then recent history.
 const history=request.messages.slice(0,-1).slice(-4);
 for(let i=history.length-1;i>=0;i--){messages.unshift(history[i]);if(cost()>limit){messages.shift();break;}}
 return {messages,documents:data.documentos,budget:{estimatedInputTokens:cost(),serializedBytes:bytes(request.system)+messages.reduce((n,m)=>n+bytes(m.content),0),inputLimit:limit,numCtx,reservedTokens,outputTokens:request.max_tokens,evidenceCount:selected.length,estimator:'latin-2bytes-with-byte-fallback-v1'}};
}
module.exports={fitLocalRequest,estimateTokens,inputTokens};
