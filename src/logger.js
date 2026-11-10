// Logs estruturados sem corpos de login, cookies, senhas ou chaves.
function createLogger(sink=console){return {info:(event,details={})=>sink.info(JSON.stringify({at:new Date().toISOString(),level:'info',event,...details})),error:(event,details={})=>sink.error(JSON.stringify({at:new Date().toISOString(),level:'error',event,...details}))};}
module.exports={createLogger};
