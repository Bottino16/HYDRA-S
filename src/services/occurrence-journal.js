const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
class OccurrenceJournal{
 constructor(directory){this.directory=directory;}
 claim(key,metadata={}){
  if(!this.directory)throw new Error('Diário persistente de ocorrências não configurado.');
  fs.mkdirSync(this.directory,{recursive:true});
  const file=path.join(this.directory,crypto.createHash('sha256').update(key).digest('hex')+'.json');
  let fd;try{fd=fs.openSync(file,'wx',0o600);}catch(error){if(error.code==='EEXIST')return false;throw error;}
  try{fs.writeFileSync(fd,JSON.stringify({key,reservedAt:new Date().toISOString(),...metadata}));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  return true;
 }
}
module.exports={OccurrenceJournal};
