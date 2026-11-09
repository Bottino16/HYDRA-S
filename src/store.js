const mysql = require('mysql2/promise');
const { databaseOptions } = require('./config');
const { adminCredentials } = require('../db/seed');
const publicUser = row => ({id: row.id, nome: row.nome, usuario: row.usuario, user: row.usuario, nivel: row.nivel, plano: row.plano, ativo: !!row.ativo, criado_em: row.criado_em, ultimo_login: row.ultimo_login});
class Store {
  constructor(cfg) { this.cfg = cfg; this.users = []; this.profiles = []; this.schedules = []; this.readings = []; this.mode = 'memory'; this.pool = null; this.message = 'Demonstração em memória: dados perdidos ao reiniciar.'; }
  async init() {
    if (this.cfg.dbMode === 'mysql') {
      this.pool = mysql.createPool(databaseOptions());
      try {
        const [users] = await this.pool.execute('SELECT * FROM usuarios');
        if (!users.length) throw new Error('Banco sem administrador; execute npm run db:setup.');
        const [profiles] = await this.pool.execute('SELECT * FROM perfis_planta');
        const [schedules] = await this.pool.execute('SELECT * FROM configuracao_rega');
        this.users = users; this.profiles = profiles; this.schedules = schedules;
        this.mode = 'mysql'; this.message = ''; return;
      } catch { await this.pool.end(); this.pool = null; this.message = 'Banco indisponível ou não preparado. Modo memória: dados perdidos ao reiniciar; execute db:setup e reinicie para recuperar o banco.'; }
    }
    const admin = await adminCredentials();
    this.users = [{...admin, id: 1, criado_em: new Date()}];
  }
  status() { return {mode: this.mode, warning: this.message}; }
  // Após falha, não reaplica escritas na reconexão: evita divergências silenciosas.
  async write(sql, params) {
    if (this.mode !== 'mysql') return null;
    try { const [result] = await this.pool.execute(sql, params); return result; }
    catch (error) {
      if (['ER_DUP_ENTRY','ER_DATA_TOO_LONG','ER_NO_REFERENCED_ROW_2'].includes(error.code)) throw Object.assign(new Error('Dados conflitantes ou inválidos.'), {status: 409});
      this.mode = 'memory'; this.message = 'Conexão com banco perdida. Alterações agora são temporárias; reinicie após restabelecer o banco.';
      return null;
    }
  }
  findUser(name) { return this.users.find(u => u.usuario.toLowerCase() === String(name).toLowerCase()); }
  byId(id) { return this.users.find(u => u.id === Number(id)); }
  async createUser(data) {
    if (this.findUser(data.usuario)) throw Object.assign(new Error('Usuário já existe.'), {status: 409});
    const result = await this.write('INSERT INTO usuarios (nome, usuario, senha_hash, nivel, plano, ativo) VALUES (?, ?, ?, ?, ?, ?)', [data.nome, data.usuario, data.senha_hash, data.nivel, data.plano, data.ativo]);
    const row = {...data, id: result?.insertId || Math.max(0, ...this.users.map(u=>u.id)) + 1, criado_em: new Date()};
    this.users.push(row); return publicUser(row);
  }
  async updateUser(id, data) {
    const row = this.byId(id);
    if (!row) throw Object.assign(new Error('Usuário não encontrado.'), {status:404});
    if (this.users.some(u=>u.id !== row.id && u.usuario.toLowerCase() === data.usuario.toLowerCase())) throw Object.assign(new Error('Usuário já existe.'), {status:409});
    if (row.nivel === 'master' && row.ativo && (!data.ativo || data.nivel !== 'master') && this.users.filter(u=>u.ativo && u.nivel === 'master').length === 1) throw Object.assign(new Error('Preserve pelo menos um master ativo.'), {status:409});
    await this.write('UPDATE usuarios SET nome = ?, usuario = ?, senha_hash = ?, nivel = ?, plano = ?, ativo = ? WHERE id = ?', [data.nome,data.usuario,data.senha_hash,data.nivel,data.plano,data.ativo,row.id]);
    Object.assign(row, data); return publicUser(row);
  }
  async deleteUser(id) {
    const row = this.byId(id);
    if (!row) throw Object.assign(new Error('Usuário não encontrado.'), {status:404});
    if (row.nivel === 'master' && row.ativo && this.users.filter(u=>u.ativo && u.nivel === 'master').length === 1) throw Object.assign(new Error('Não é possível excluir o último master ativo.'), {status:409});
    await this.write('DELETE FROM usuarios WHERE id = ?', [row.id]); this.users = this.users.filter(u=>u.id !== row.id);
  }
  async lastLogin(user) { const at = new Date(); await this.write('UPDATE usuarios SET ultimo_login = ? WHERE id = ?', [at,user.id]); user.ultimo_login = at; }
  async saveProfiles(id, profiles) {
    // Atualiza por proprietário; nenhuma ID fornecida pelo navegador define outro dono.
    if (this.mode === 'mysql') {
      const connection = await this.pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.execute('DELETE FROM perfis_planta WHERE usuario_id = ?', [id]);
        for (const profile of profiles) await connection.execute('INSERT INTO perfis_planta (usuario_id, nome, limite_umidade) VALUES (?, ?, ?)', [id,profile.nome,profile.limite]);
        await connection.commit();
      } catch { await connection.rollback(); this.mode = 'memory'; this.message = 'Falha ao persistir perfis. Alterações temporárias em memória.'; }
      finally { connection.release(); }
    }
    this.profiles = this.profiles.filter(p=>p.usuario_id !== id).concat(profiles.map((p,i)=>({id:i+1,usuario_id:id,nome:p.nome,limite_umidade:p.limite})));
  }
  async saveSchedule(id, data) {
    const previous = this.schedules.find(s=>s.usuario_id === id && s.perfil_planta_id == null);
    const params = [data.hora,data.duracao,data.ativo,JSON.stringify(data.diasMes)];
    let result;
    if (previous) result = await this.write('UPDATE configuracao_rega SET hora = ?, duracao = ?, ativo = ?, dias_do_mes = ? WHERE id = ? AND usuario_id = ?', [...params,previous.id,id]);
    else result = await this.write('INSERT INTO configuracao_rega (hora, duracao, ativo, dias_do_mes, usuario_id) VALUES (?, ?, ?, ?, ?)', [...params,id]);
    const row = {id:previous?.id || result?.insertId || this.schedules.length+1, usuario_id:id, perfil_planta_id:null, hora:data.hora,duracao:data.duracao,ativo:data.ativo,dias_do_mes:data.diasMes};
    this.schedules = this.schedules.filter(s=>s !== previous).concat(row);
  }
  schedule(id) { const row=this.schedules.find(s=>s.usuario_id===id && s.perfil_planta_id==null); return row ? {hora:row.hora,duracao:row.duracao,ativo:!!row.ativo,diasMes:typeof row.dias_do_mes==='string'?JSON.parse(row.dias_do_mes):row.dias_do_mes} : {hora:'18:00',duracao:5,ativo:false,diasMes:[]}; }
  async reading(data) {
    this.readings.push({...data,data_hora:new Date()}); this.readings=this.readings.slice(-1000);
    await this.write('INSERT INTO leituras (solo, temperatura, umidade_ar, nivel_rio, nivel_poco, nivel_caixa, bombas) VALUES (?, ?, ?, ?, ?, ?, ?)', [data.solo,data.temperatura,data.umidade_ar,null,null,data.nivel_caixa,JSON.stringify(data.bombas)]);
  }
  async retain() { await this.write('DELETE FROM leituras WHERE data_hora < DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? DAY)', [this.cfg.retentionDays]); }
  async close() { if(this.pool) await this.pool.end(); }
}
module.exports = { Store, publicUser };
