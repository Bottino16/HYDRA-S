// Subconjunto Markdown por criação de nós. HTML, URLs e imagens nunca são executados.
window.sdaMarkdown=function(container,text){
 const fragment=document.createDocumentFragment();let pre=null;
 function inline(parent,value){const pattern=/(\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*)/g;let at=0;for(const m of value.matchAll(pattern)){parent.append(document.createTextNode(value.slice(at,m.index)));const el=document.createElement(m[2]?'strong':m[3]?'code':'em');el.textContent=m[2]||m[3]||m[4];parent.append(el);at=m.index+m[0].length;}parent.append(document.createTextNode(value.slice(at)));}
 for(const line of String(text).split('\n')){
  if(/^```/.test(line)){if(pre)pre=null;else{pre=document.createElement('pre');fragment.append(pre);}continue;}
  if(pre){pre.append(document.createTextNode(line+'\n'));continue;}
  const heading=line.match(/^(#{1,3})\s+(.+)$/),bullet=line.match(/^[-*]\s+(.+)$/);const el=document.createElement(heading?'h'+(heading[1].length+2):bullet?'p':'p');if(bullet)el.className='assistant-bullet';inline(el,heading?heading[2]:bullet?'• '+bullet[1]:line);fragment.append(el);
 }
 container.replaceChildren(fragment);
};
