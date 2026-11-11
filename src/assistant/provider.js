const Anthropic=require('@anthropic-ai/sdk');
class ClaudeProvider{
 constructor(config,{fetcher}={}){this.config=config;this.fetcher=fetcher;}
 async *stream(request,{signal}){
  const client=new Anthropic({apiKey:this.config.key,timeout:this.config.timeoutMs,maxRetries:0,logLevel:'off',openTelemetry:false,baseURL:'https://api.anthropic.com',...(this.fetcher?{fetch:this.fetcher}:{})});
  const stream=await client.messages.create({...request,stream:true},{signal});
  try{for await(const event of stream){if(event.type==='content_block_delta'&&event.delta.type==='text_delta')yield event.delta.text;}}finally{stream.controller?.abort();}
 }
}
class DemoProvider{
 async *stream(request,{signal,context,documents,question}){
  const subject=String(question).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  let body;
  if(/agrotoxic|veneno|dose|adub|calcario|fertiliz|diagnostic/.test(subject))body='Não forneço doses químicas nem diagnóstico laboratorial. Procure um agrônomo e uma análise de solo antes de definir o manejo.';
  else if(/alface/.test(subject))body='A alface pede manejo de água regular na zona das raízes. Não existe um percentual universal do sensor: textura, estágio, drenagem e calibração precisam ser considerados.';
  else if(/seco|umidade|irrig|agua/.test(subject))body=context.telemetria==='sem dados'?'Estamos sem dados recentes. Não posso avaliar o estado atual do solo nem afirmar se deve irrigar; retome as medições e confira o painel.':'Confira o solo e o limite configurado no perfil, a disponibilidade de água e as travas. Uma leitura relativa isolada não comprova necessidade de irrigação. Nenhuma bomba foi acionada por esta resposta.';
  else if(/solo|textura|ph|materia|organica|capacidade|sensor|calibr/.test(subject))body='Para avaliar o solo, combine textura, drenagem, matéria orgânica e análise laboratorial. Calibre o sensor no próprio substrato; sua escala relativa não mede pH ou nutrientes.';
  else body='Posso ajudar com ciência do solo, agronomia e irrigação. Reformule sua pergunta dentro desses temas.';
  const text=body+(documents.length?'\n\nDocumentos consultados: '+documents.map(d=>'['+d.id+']').join(', '):'');
  for(const part of text.match(/.{1,64}(?:\n|$)?/gs)||[]){if(signal.aborted)throw signal.reason;yield part;await new Promise(resolve=>setTimeout(resolve,5));}
 }
}
module.exports={ClaudeProvider,DemoProvider};
