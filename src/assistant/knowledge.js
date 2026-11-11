const fs=require('node:fs'),path=require('node:path');
const words=text=>String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/[a-z0-9]{3,}/g)||[];
const stop=new Set(['para','como','qual','meu','minha','uma','esta','esse','com','que','dos','das','por','hoje']);
class Knowledge{
 constructor(directory){this.directory=directory;}
 search(question){
  if(!fs.existsSync(this.directory))return [];
  const query=[...new Set(words(question).filter(w=>!stop.has(w)))].slice(0,32);
  return fs.readdirSync(this.directory).filter(name=>/^[a-z0-9-]+\.md$/i.test(name)&&name.toLowerCase()!=='readme.md').slice(0,50).flatMap(name=>{
   const file=path.join(this.directory,name),stat=fs.lstatSync(file);if(!stat.isFile()||stat.size>65536)return [];
   const content=fs.readFileSync(file,'utf8'),paragraphs=content.split(/\n\s*\n/);const ranked=paragraphs.map(text=>{const tokens=[...new Set(words(text))];return {text,score:query.reduce((n,w)=>n+(tokens.some(v=>v.startsWith(w)||w.startsWith(v))?1:0),0)};}).filter(p=>p.score>0).sort((a,b)=>b.score-a.score);
   if(!ranked.length)return [];return [{id:name,title:content.split('\n')[0].replace(/^#+\s*/,''),text:ranked.slice(0,2).map(p=>p.text).join('\n\n').slice(0,1600),score:ranked[0].score}];
  }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,3).map(({score,...doc})=>doc);
 }
}
module.exports={Knowledge};
