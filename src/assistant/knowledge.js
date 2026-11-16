const fs=require('node:fs'),path=require('node:path');
// Explicit equivalences avoid unsafe bidirectional prefix matching.
const aliases=new Map();
for(const group of [
 ['calibracao','calibracoes','calibrar','calibrado','calibrada','calibrados','calibradas'],
 ['sensor','sensores'],['capacitivo','capacitiva','capacitivos','capacitivas'],
 ['nutriente','nutrientes'],['cultura','culturas'],['raiz','raizes'],['solo','solos'],
 ['alface','alfaces'],['hortalica','hortalicas'],['ideal','ideais'],['universal','universais'],
 ['encharcamento','encharcado','encharcada','encharcados','encharcadas'],['falta','deficit'],
 ['irrigacao','irrigar','regar'],['bomba','bombas'],['reservatorio','reservatorios']
])for(const word of group)aliases.set(word,group[0]);
const words=text=>(String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\bexcesso\s+(?:de\s+)?agua\b/g,'encharcamento').match(/[a-z0-9]+/g)||[])
 .filter(w=>w.length>=3||w==='ph').map(w=>aliases.get(w)||w);
const stop=new Set(words('para como qual quais meu minha uma esta esse com que dos das por hoje isso significa sao fontes'));
const generic=new Set(['agua','solo','umidade','irrigacao','sensor']);
// Specific subjects must occur in explanatory text or its document title.
const anchors=new Set(words('ph calibracao sensor alface tomate milho feijao cacto gramado reservatorio caixa poco rio bomba hydra'));
function sections(content){
 let bibliography=false;const lines=[];
 for(const line of content.split(/\r?\n/)){
  if(/^\s*#{1,6}\s/.test(line)){
   bibliography=/\b(fontes?|referencias?|bibliografia)\b/.test(words(line).join(' '));lines.push('');continue;
  }
  if(bibliography||/^\s*(?:fontes?|refer[eê]ncias?|bibliografia)\s*:/i.test(line)||/Resumo educativo em portugu[eê]s|Refer[eê]ncias consultadas/i.test(line))continue;
  if(/^\s*(?:[-*]\s*)?(?:https?:\/\/|\[[^\]]+\]\(https?:\/\/)/i.test(line)||(/^\s*[-*]/.test(line)&&/https?:\/\//.test(line)))continue;
  lines.push(line);
 }
 return lines.join('\n').split(/\n\s*\n/).map(p=>p.trim()).filter(p=>p&&words(p).length>=3);
}
class Knowledge{
 constructor(directory){this.directory=directory;}
 search(question){
  if(!fs.existsSync(this.directory))return [];
  const query=[...new Set(words(question))].filter(w=>!stop.has(w)).slice(0,32);
  // An ideal moisture question concerns irrigation management, not universal fertilizer doses.
  const moistureManagement=query.includes('umidade')&&query.includes('ideal');
  if(moistureManagement&&!query.includes('irrigacao'))query.splice(Math.min(query.length,31),1,'irrigacao');
  if(!query.length)return [];
  const required=query.filter(w=>anchors.has(w));
  const documents=fs.readdirSync(this.directory).filter(name=>/^[a-z0-9-]+\.md$/i.test(name)&&name.toLowerCase()!=='readme.md').sort().slice(0,50).flatMap(id=>{
   const file=path.join(this.directory,id),stat=fs.lstatSync(file);if(!stat.isFile()||stat.size>65536)return [];
   const content=fs.readFileSync(file,'utf8'),title=(content.match(/^#\s+(.+)$/m)?.[1]||id).trim();
   const paragraphs=sections(content).map((text,index)=>({text,index,tokens:new Set(words(text))}));
   return [{id,title,paragraphs,titleTokens:new Set(words(title)),tokens:new Set(paragraphs.flatMap(p=>[...p.tokens]))}];
  });
  const frequency=word=>documents.filter(d=>d.tokens.has(word)).length;
  const weight=word=>(generic.has(word)?1:3)*(1+Math.log(1+documents.length/(1+frequency(word))));
  return documents.flatMap(doc=>{
   if(required.some(w=>!doc.titleTokens.has(w)||!doc.tokens.has(w)))return [];
   if(moistureManagement&&!doc.titleTokens.has('irrigacao'))return [];
   const ranked=doc.paragraphs.map(p=>{
    const matches=query.filter(w=>p.tokens.has(w));return {...p,score:matches.reduce((n,w)=>n+weight(w),0)};
   }).filter(p=>p.score>0).sort((a,b)=>b.score-a.score||a.index-b.index);
   if(!ranked.length)return [];
   const matches=query.filter(w=>doc.tokens.has(w));
   if(!required.length&&matches.length<2&&!matches.some(w=>!generic.has(w)))return [];
   const titleScore=query.filter(w=>doc.titleTokens.has(w)).reduce((n,w)=>n+weight(w)*2,0);
   return [{id:doc.id,title:doc.title,text:ranked.slice(0,2).map(p=>p.text).join('\n\n').slice(0,1600),score:ranked[0].score+titleScore,coverage:matches.length,titleScore}];
  }).sort((a,b)=>b.score-a.score||b.coverage-a.coverage||b.titleScore-a.titleScore||a.id.localeCompare(b.id,'en')).slice(0,3).map(({score,coverage,titleScore,...doc})=>doc);
 }
}
module.exports={Knowledge};
