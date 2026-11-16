// Lexical selection inside already-retrieved documents; never searches the corpus.
const fold=text=>String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const aliases=new Map();
for(const group of [['calibracao','calibracoes','calibrar','calibre','calibrado','calibrada'],['sensor','sensores'],['capacitivo','capacitivos','capacitiva'],['irrigacao','irrigar','regar'],['encharcamento','encharcado','encharcada'],['boia','boias'],['bomba','bombas']])for(const term of group)aliases.set(term,group[0]);
const terms=text=>[...new Set((fold(text).match(/[a-z0-9]+/g)||[]).filter(t=>t.length>=3||t==='ph').map(t=>aliases.get(t)||t))];
const stop=new Set(terms('como qual quais para por que meu minha uma esta este esse isso sao deve pode posso porque serve diferenca significa necessariamente funciona funcionam cinco verdade'));
const generic=new Set(terms('solo agua umidade nivel sensor irrigacao'));
const crops=new Set(terms('alface tomate milho feijao cacto gramado'));
const segmenter=new Intl.Segmenter('pt-BR',{granularity:'sentence'});
function evidenceCandidates(documents,question){
 const query=terms(question).filter(t=>!stop.has(t)),focus=query.filter(t=>crops.has(t)),specific=query.filter(t=>!generic.has(t));
 const seen=new Set(),result=[];
 for(const [rank,doc] of (Array.isArray(documents)?documents:[]).slice(0,3).entries()){
  if(!doc||!/^[a-z0-9-]+\.md$/i.test(doc.id)||typeof doc.title!=='string'||doc.title.length>240||typeof doc.text!=='string'||doc.text.length>16384)continue;
  let bibliography=false;const lines=[];
  for(const line of doc.text.split(/\r?\n/)){
   if(/^\s*#{1,6}\s/.test(line)){bibliography=/fontes?|referencias?|bibliografia/.test(fold(line));lines.push('');continue;}
   if(/^\s*(?:fontes?|refer[eê]ncias?|bibliografia)\s*:/i.test(line)){bibliography=true;continue;}
   if(!bibliography)lines.push(line);
  }
  for(const [index,paragraph] of lines.join('\n').split(/\n\s*\n/).entries()){
   const text=paragraph.trim(),tokens=terms(text),key=fold(text);
   if(tokens.length<3||key===fold(doc.title)||seen.has(key)||/https?:\/\//i.test(text))continue;
   // A paragraph is atomic: keep its caveats, or omit it. Never slice a sentence.
   const sentences=[...segmenter.segment(text)].map(s=>s.segment.trim()).filter(Boolean);
   if(!sentences.length||sentences.some(s=>!/[.!?]["'”’\])]*$/.test(s)))continue;
   const matches=query.filter(t=>tokens.includes(t));
   if(!matches.length||(specific.length&&!specific.some(t=>tokens.includes(t)))||(focus.length&&!focus.some(t=>tokens.includes(t))))continue;
   const score=matches.reduce((n,t)=>n+(generic.has(t)?1:4),0);
   seen.add(key);result.push({id:doc.id,title:doc.title,text,matches,score,rank,index});
  }
 }
 const best=Math.max(0,...result.map(p=>p.score));
 return result.filter(p=>p.score>=best/2);
}
module.exports={evidenceCandidates};
