const {fitLocalRequest}=require('./local-context');
class OllamaError extends Error{constructor(code){super(code);this.code=code;}}
function localBase(value){
 let url;try{url=new URL(value);}catch{throw new Error('OLLAMA_BASE_URL inválida.');}
 if(url.hostname==='localhost')url.hostname='127.0.0.1';
 if(!['127.0.0.1','[::1]'].includes(url.hostname)||url.protocol!=='http:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error('OLLAMA_BASE_URL exige HTTP em loopback literal, sem credenciais, caminho ou parâmetros.');
 return url.origin;
}
class OllamaProvider{
 constructor(config,{fetcher=fetch}={}){this.config=config;this.base=localBase(config.ollamaBaseUrl||'http://127.0.0.1:11434');this.fetcher=fetcher;}
 async *stream(request,{signal}){
  // Nunca redirecionar, baixar modelo ou enviar ferramentas/instruções de comando.
  const fitted=fitLocalRequest(request,this.config),controller=new AbortController();let timeout=false,reader;
  const abort=()=>controller.abort();if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(()=>{timeout=true;controller.abort();},this.config.timeoutMs||60000);timer.unref();
  try{
   const response=await this.fetcher(this.base+'/api/chat',{method:'POST',redirect:'error',signal:controller.signal,headers:{'Content-Type':'application/json','Accept':'application/x-ndjson'},body:JSON.stringify({model:request.model,stream:true,keep_alive:0,messages:[{role:'system',content:request.system},...fitted.messages],options:{num_ctx:this.config.ollamaNumCtx||4096,num_predict:request.max_tokens,temperature:0.2}})});
   if(!response.ok)throw new OllamaError(response.status===404?'MODEL_MISSING':'HTTP_ERROR');
   if(!response.body||!/^application\/(?:x-ndjson|json)(?:;|$)/i.test(response.headers.get('content-type')||''))throw new OllamaError('INVALID_RESPONSE');
   reader=response.body.getReader();const decoder=new TextDecoder('utf-8',{fatal:true});let buffer='',done=false,frames=0,content=false,output=0,limited=false;
   const parse=line=>{
    if(++frames>10000||line.length>65536)throw new OllamaError('INVALID_RESPONSE');
    let value;try{value=JSON.parse(line);}catch{throw new OllamaError('INVALID_RESPONSE');}
    if(value.error)throw new OllamaError('PROVIDER_ERROR');
    if(typeof value.done!=='boolean'||value.message?.role!=='assistant'||typeof value.message.content!=='string'||value.message.tool_calls?.length||value.model!==request.model)throw new OllamaError('INVALID_RESPONSE');
    if(value.message.content){content=true;output+=value.message.content.length;if(output>12000)throw new OllamaError('INVALID_RESPONSE');}
    if(value.done&&value.done_reason!==undefined&&!['stop','length'].includes(value.done_reason))throw new OllamaError('INVALID_RESPONSE');
    done=value.done;if(done)limited=value.done_reason==='length';return value.message.content;
   };
   while(!done){const item=await reader.read();if(item.done){buffer+=decoder.decode();if(buffer.trim()){const text=parse(buffer);if(text)yield text;buffer='';}break;}
    buffer+=decoder.decode(item.value,{stream:true});let at;
    while(!done&&(at=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,at).trim();buffer=buffer.slice(at+1);if(line){const text=parse(line);if(text)yield text;}}
    if(buffer.length>65536)throw new OllamaError('INVALID_RESPONSE');
   }
   if(!done||!content)throw new OllamaError('INVALID_RESPONSE');
   return {limited};
  }catch(error){if(error instanceof OllamaError)throw error;if(timeout)throw new OllamaError('TIMEOUT');if(signal?.aborted)throw new OllamaError('CANCELLED');if(error instanceof TypeError&&reader)throw new OllamaError('INVALID_RESPONSE');throw new OllamaError('UNAVAILABLE');}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);controller.abort();if(reader){await reader.cancel().catch(()=>{});reader.releaseLock();}}
 }
}
module.exports={OllamaProvider,OllamaError,localBase};
