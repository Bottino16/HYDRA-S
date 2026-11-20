// DEMO-1: sequenciador exclusivo da simulação. Não decide nem altera travas.
class IrrigationDemo{
 constructor({read,reset,freeze,pump,stopAll,event,readWet,clock=Date.now,holdMs=25000,introMs=8000}){Object.assign(this,{read,reset,freeze,pump,stopAll,event,readWet,clock,holdMs,introMs});this.state='idle';this.stage=0;this.phase='intro';this.nextAt=0;this.userId=null;this.message='Pronto para preparar o cenário simulado.';this.queue=Promise.resolve();this.busy=false;}
 get active(){return this.state!=='idle';}
 snapshot(){return {state:this.state,stage:this.stage,phase:this.phase,wetTarget:this.wetTarget(),message:this.message,remainingMs:Math.max(0,this.nextAt-this.clock()),simulated:true};}
 exclusive(fn){const job=this.queue.then(async()=>{this.busy=true;try{return await fn();}finally{this.busy=false;}});this.queue=job.catch(()=>{});return job;}
 async record(message,severity='info'){this.message=message;await this.event('demonstracao_irrigacao',severity,'SIMULAÇÃO • '+message);}
 action(action,userId){return this.exclusive(async()=>{
  if(['start','restart'].includes(action)){
   await this.stopAll();this.freeze(true);try{this.reset();}catch(error){this.state='blocked';await this.record('Cenário não preparado: '+error.message,'aviso');throw Object.assign(error,{status:409});}this.userId=userId;this.state='running';this.stage=0;this.phase='intro';this.nextAt=this.clock()+this.introMs;
   await this.record('Demonstração preparada: Rio 85%, Poço 10%, Caixa 8%; solo abaixo do limiar configurado. Retenções e intervalos reais preservados.');
  }else if(action==='pause'){
   if(this.state!=='running')throw Object.assign(new Error('A demonstração não está em execução.'),{status:409});
   this.remaining=Math.max(0,this.nextAt-this.clock());this.wasPhase=this.phase;await this.stopAll();this.freeze(true);this.state='paused';
   await this.record('Demonstração pausada; bombas desligadas por comando confirmado e níveis congelados. Telemetria permanece ativa.');
  }else if(action==='resume'){
   if(this.state!=='paused')throw Object.assign(new Error('A demonstração não está pausada.'),{status:409});
   this.state='running';this.phase=this.wasPhase==='pumping'?'waiting':this.wasPhase;this.nextAt=this.clock()+(this.remaining||0);this.freeze(false);
   await this.record('Demonstração retomada; novas partidas aguardam os intervalos de segurança.');
  }else if(action==='stop'){
   await this.stopAll();this.freeze(false);this.state='idle';this.phase='intro';await this.record('Demonstração encerrada com saídas desligadas e modo MANUAL.');
  }else throw Object.assign(new Error('Ação de demonstração inválida.'),{status:400});
  return this.snapshot();
 });}
 tick(){if(this.busy||this.state!=='running')return Promise.resolve();return this.exclusive(async()=>{
  const state=this.read();if(!state.connected){await this.stopAll().catch(()=>{});this.freeze(true);this.state='blocked';await this.record('Demonstração interrompida: telemetria ausente; estados não presumidos.','aviso');return;}
  const now=this.clock();
  if(['intro','hold','waiting'].includes(this.phase)){
   if(now<this.nextAt)return;
   this.freeze(false);
   try{const ack=await this.pump(this.stage+1,this.userId);if(!ack.pumps[this.stage]){this.phase='waiting';this.nextAt=now+1000;this.message='Pedido confirmado; aguardando partida segura da bomba '+(this.stage+1)+'.';return;}
    this.phase='pumping';await this.record(['Captação: bomba 1 confirmada, Rio → Poço.','Transferência: bomba 2 confirmada, Poço → Caixa.','Irrigação: bomba 3 confirmada, Caixa → Plantação.'][this.stage]);
   }catch(error){if([1,5,8].includes(error.code)){this.phase='waiting';this.nextAt=now+1000;this.message='Aguardando segurança: '+error.message;return;}await this.block(error.message);}
   return;
  }
  if(this.phase==='pumping'){
   const reached=this.stage===0?state.poco>=80:this.stage===1?state.caixa>=60:this.read().solo>=this.wetTarget();
   if(reached){await this.stopAll();this.freeze(true);if(this.stage===2){this.state='completed';await this.record('Ciclo concluído: três etapas confirmadas e umidade do solo aumentada. Saídas desligadas; valores finais congelados.');}
    else{this.stage++;this.phase='hold';this.nextAt=now+this.holdMs;await this.record('Etapa concluída; intervalo de apresentação de 25 s, com bombas desligadas.');}
   }else if(state.pumps[this.stage]!==true)await this.block('A bomba '+(this.stage+1)+' parou antes da meta; confira sensores e travas. Nenhum acionamento foi forçado.');
  }
 });}
 wetTarget(){return this.readWet?this.readWet():this.targetWet;}
 async block(reason){await this.stopAll().catch(()=>{});this.freeze(true);this.state='blocked';await this.record('Demonstração bloqueada: '+reason,'aviso');}
}
module.exports={IrrigationDemo};
