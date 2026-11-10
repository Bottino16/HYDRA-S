// Simulação transitória de uma bomba; a maquete completa entra na Fase 2.
function simulation(io, store, cfg) {
  let solo=42, distancia=2, pumping=false, until=0, refillAt=0;
  let history=[];
  const executed=new Map();
  function stop(message='Rega interrompida.') { pumping=false; until=0; io.emit('status_bomba',false); io.emit('aviso_agendamento',message); }
  function pump(minutes) {
    if (!Number.isInteger(minutes) || minutes<1 || minutes>30) throw Object.assign(new Error('Duração deve ser de 1 a 30 minutos.'),{status:400});
    if (distancia>=10.6) throw Object.assign(new Error('Reservatório vazio; comando bloqueado.'),{status:409});
    pumping=true; until=Date.now()+minutes*60000; io.emit('status_bomba',true); io.emit('aviso_agendamento','Rega simulada iniciada.');
  }
  function initial(socket, userId) {socket.emit('config_atual',store.schedule(userId)); socket.emit('historico_grafico',history); socket.emit('status_bomba',pumping); socket.emit('system_status',{simulate:true,...store.status()});}
  let lastSaved=0;
  const timer=setInterval(async()=>{
    const now=new Date();
    if (refillAt && Date.now()>=refillAt) {distancia=2;refillAt=0;}
    if(pumping) {
      if(distancia>=10.6){stop('ALERTA: Reservatório vazio. Rega simulada bloqueada.');refillAt=Date.now()+15000;}
      else if(Date.now()>=until) stop('Rega simulada finalizada.');
      else {solo+=(90-solo)*0.07;distancia=Math.min(11,distancia+0.12);}
    } else solo=Math.max(2,solo-0.5);
    // Somente um usuário master ativo controla a automação compartilhada nesta fase.
    const owner=store.users.find(u=>u.ativo&&u.nivel==='master');
    const profiles=owner?store.profiles.filter(p=>p.usuario_id===owner.id):[];
    const active=profiles.find(p=>p.selecionado)||profiles[0];
    const limit=active?Number(active.limite_umidade):15;
    if(!pumping&&solo<limit&&distancia<10.6) pump(1);
    for(const row of store.schedules) {
      const user=store.byId(row.usuario_id); if(!user?.ativo||user.nivel!=='master')continue;
      const schedule=store.schedule(user.id), hm=now.toTimeString().slice(0,5), key=now.toLocaleDateString('en-CA')+hm;
      if(schedule.ativo&&schedule.hora===hm&&schedule.diasMes.includes(now.getDate())&&executed.get(user.id)!==key){
        executed.set(user.id,key); if(solo<=limit&&!pumping&&distancia<10.6)pump(schedule.duracao);
      }
    }
    const temp=29.5+Math.sin(Date.now()/60000), air=68;
    io.emit('dados_sensores',`${Math.round(1023-solo/100*1023)},${distancia.toFixed(1)},${temp.toFixed(1)},${air}`);
    history.push({hora:now.toLocaleTimeString('pt-BR'),umidade:Math.round(solo)});history=history.slice(-15);
    io.emit('historico_grafico',history);
    io.emit('system_status',{simulate:true,...store.status()});
    if(Date.now()-lastSaved>=cfg.saveSeconds*1000){lastSaved=Date.now();await store.reading({solo,temperatura:temp,umidade_ar:air,nivel_caixa:Math.max(0,(11-distancia)/11*100),bombas:[pumping,false,false]});}
  },2000);
  timer.unref();
  return {pump,stop,initial,close:()=>clearInterval(timer)};
}
module.exports = { simulation };
