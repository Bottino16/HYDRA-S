function redact(text,user={}){
 let result=String(text||'');
 const privateValues=[user.usuario,user.nome,...Object.entries(process.env).filter(([key])=>/(?:PASSWORD|SECRET|TOKEN|API_KEY)$/.test(key)).map(([,value])=>value)].filter(v=>typeof v==='string'&&v.length>=3).sort((a,b)=>b.length-a.length);
 for(const value of privateValues)result=result.replace(new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),'[privado]');
 return result.replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi,'[e-mail removido]')
  .replace(/\b(?:sk-ant-|sk-)[a-z0-9_-]+/gi,'[chave removida]')
  .replace(/Bearer\s+[^\s,;]+/gi,'[token removido]')
  .replace(/\b(?:senha|password|token|api[_ -]?key|chave)\s*[:=]\s*(?:"[^"\n]*"|'[^'\n]*'|[^\s,;]+)/gi,'[credencial removida]')
  .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,'[documento removido]')
  .replace(/(?:\+55\s*)?\(?\d{2}\)?[ -]?9?\d{4}[ -]?\d{4}\b/g,'[telefone removido]')
  .replace(/(?:meu nome [ée]|me chamo|sou o|sou a)\s+[^,.!?\n]+/gi,'[identificação removida]');
}
module.exports={redact};
