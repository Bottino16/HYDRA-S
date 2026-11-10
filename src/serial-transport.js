const {SerialPort}=require('serialport');
const {MAX_LINE}=require('./protocol');
class SerialTransport{
 constructor(receive,reset,{path='auto',reconnectMs=3000,Port=SerialPort}={}){this.Port=Port;this.receive=receive;this.reset=reset;this.path=path;this.port=null;this.buffer='';this.overflow=false;this.closed=false;this.opening=false;this.timer=setInterval(()=>this.connect(),reconnectMs);this.timer.unref();this.connect();}
 async connect(){if(this.closed||this.opening||this.port)return;this.opening=true;
  try{
   let path=this.path;
   if(path==='auto'){
    const ports=(await this.Port.list()).filter(p=>['2341','2a03','1a86','10c4'].includes(p.vendorId?.toLowerCase()));
    if(ports.length!==1)return;path=ports[0].path;
   }
   if(this.closed)return;
   const port=new this.Port({path,baudRate:9600,autoOpen:false});this.port=port;
   port.on('error',()=>{if(this.port===port)this.port=null;this.buffer='';this.reset('Erro serial.');if(port.isOpen)port.close();});port.on('close',()=>{if(this.port!==port)return;this.port=null;this.buffer='';this.overflow=false;this.reset();});
   port.on('data',chunk=>{for(const byte of chunk){if(byte===10){if(!this.overflow)this.receive(this.buffer+'\n');this.buffer='';this.overflow=false;}else if(!this.overflow){this.buffer+=String.fromCharCode(byte);if(this.buffer.length>MAX_LINE){this.buffer='';this.overflow=true;}}}});
   port.open(error=>{if(error){if(this.port===port)this.port=null;this.reset('Porta serial indisponível.');}});
  }catch{this.reset('Detecção serial indisponível.');}finally{this.opening=false;}
 }
 write(line){if(!this.port?.isOpen)throw Object.assign(new Error('Arduino desconectado.'),{status:503});this.port.write(line,error=>{if(error)this.reset('Falha ao transmitir comando.');});}
 close(){this.closed=true;clearInterval(this.timer);if(this.port?.isOpen)this.port.close();}
}
module.exports={SerialTransport};
