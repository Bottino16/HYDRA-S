const crypto=require('node:crypto');
const hash=text=>crypto.createHash('sha256').update(text,'utf8').digest('hex');
function provenance(documents,origin='retrieved',rootId=null){
 const snapshots=documents.map(d=>({id:d.id,title:d.title,text:d.text,sha256:hash(d.text),paragraphs:d.text.split(/\n\s*\n/).map(text=>({id:d.id+'#'+hash(text).slice(0,16),sha256:hash(text)}))}));
 return {version:1,origin,rootId,documents:snapshots,sha256:hash(JSON.stringify(snapshots))};
}
function originalDocuments(trace){
 if(trace?.version!==1||!Array.isArray(trace.documents))return [];
 return trace.documents.filter(d=>/^[a-z0-9-]+\.md$/i.test(d.id)&&typeof d.title==='string'&&typeof d.text==='string'&&d.sha256===hash(d.text)).map(({id,title,text})=>({id,title,text}));
}
// Only IDs actually present in this request are allowed citations. External bibliography
// is not part of the fitted context, so generated links/attributions are not trusted.
class ReferenceGuard{
 constructor(documents){this.allowed=new Set(documents.map(d=>d.id));this.pending='';this.removed=0;}
 push(part,final=false){
  if(this.bibliography)return '';
  this.pending+=part;let output='';
  const starters=['http://','https://','www.','doi:','segundo ','conforme ','fonte:','fontes:','referências:','referencias:','bibliografia:','de acordo com '];
  while(this.pending){
   const match=/\[|https?:\/\/|www\.|doi:|\b(?:segundo|conforme)\s+|\b(?:fontes?|refer[eê]ncias?|bibliografia)\s*(?::|\n)|\bde acordo com\s+|\b(?:[a-z0-9-]+\.)+(?:com|org|net|edu|gov|br|invalid|io)\b/iu.exec(this.pending);
   if(!match){
    let keep=0;if(!final){const lower=this.pending.toLowerCase();for(const start of starters)for(let n=1;n<=Math.min(start.length-1,lower.length);n++)if(lower.endsWith(start.slice(0,n)))keep=Math.max(keep,n);
     const word=this.pending.match(/[\p{L}\p{N}_.-]+$/u)?.[0];if(word&&/^[a-z0-9_.-]+$/i.test(word))keep=Math.max(keep,word.length);
    }
    output+=this.pending.slice(0,this.pending.length-keep);this.pending=this.pending.slice(this.pending.length-keep);break;
   }
   output+=this.pending.slice(0,match.index);this.pending=this.pending.slice(match.index);
   if(/^(?:fontes|refer[eê]ncias?|bibliografia)\s*(?::|\n)/i.test(this.pending)){this.bibliography=true;this.pending='';this.removed++;break;}
   if(this.pending[0]==='['){
    const close=this.pending.indexOf(']');if(close<0){if(final){this.removed++;this.pending='';}break;}
    if(close===this.pending.length-1&&!final)break;
    if(this.pending[close+1]==='('){const end=this.pending.indexOf(')',close+2);if(end<0&&!final)break;this.pending=end<0?'':this.pending.slice(end+1);this.removed++;continue;}
    const id=this.pending.slice(1,close);if(this.allowed.has(id))output+='['+id+']';else this.removed++;
    this.pending=this.pending.slice(close+1);continue;
   }
   const attribution=/^(?:segundo|conforme|de acordo com)\b/i.test(this.pending),bibliography=/^(?:fontes?|refer[eê]ncias?|bibliografia)\s*:/i.test(this.pending);
   const end=attribution?this.pending.search(/[,\n]/):bibliography?this.pending.indexOf('\n'):this.pending.search(/\s/);
   if(end<0){if(final){this.removed++;this.pending='';}break;}
   this.pending=this.pending.slice(end+(attribution?1:0));this.removed++;
  }
  return output;
 }
 finish(){return this.push('',true);}
}
function review(text,documents,removed=0){
 const guard=new ReferenceGuard(documents);let clean=guard.push(text,true);
 // Author-year and DOI forms need a complete answer to inspect safely.
 clean=clean.replace(/\b[\p{Lu}][\p{L}-]+(?:\s+(?:[\p{Lu}][\p{L}-]+|et\s+al\.?)){0,3}\s*\((?:19|20)\d{2}[a-z]?\)/gu,()=>{guard.removed++;return '';});
 const ids=new Set([...clean.matchAll(/\[([a-z0-9-]+\.md)\]/gi)].map(m=>m[1]));
 return {text:clean,citations:documents.filter(d=>ids.has(d.id)).map(d=>({id:d.id,title:d.title})),referenceReview:{version:1,state:'ids-only-not-claim-validation',removed:removed+guard.removed}};
}
module.exports={provenance,originalDocuments,ReferenceGuard,review};
