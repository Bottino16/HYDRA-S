const readline = require('node:readline/promises');
const { validatePassword, hashPassword } = require('../src/password');
async function adminCredentials(interactive = false) {
  let user = process.env.ADMIN_USER || '';
  let password = process.env.ADMIN_PASSWORD || '';
  if ((!user || !password) && interactive && process.stdin.isTTY) {
    // A senha deve preferencialmente vir do .env para não aparecer no terminal.
    const rl = readline.createInterface({input: process.stdin, output: process.stdout});
    try { user ||= await rl.question('Usuário do primeiro administrador: ');
      password ||= await rl.question('Senha forte (entrada visível; prefira .env): '); } finally { rl.close(); }
  }
  if (!/^[a-zA-Z0-9_.-]{3,50}$/.test(user)) throw new Error('Defina ADMIN_USER válido (3–50 letras, números, _, . ou -).');
  validatePassword(password, user);
  return {nome: user, usuario: user, senha_hash: await hashPassword(password), nivel: 'master', plano: 'premium', ativo: true};
}
async function seed(db, credentials) {
  const [rows] = await db.execute('SELECT id FROM usuarios WHERE usuario = ?', [credentials.usuario]);
  if (!rows.length) {
    await db.execute('INSERT INTO usuarios (nome, usuario, senha_hash, nivel, plano, ativo) VALUES (?, ?, ?, ?, ?, ?)',
      [credentials.nome, credentials.usuario, credentials.senha_hash, credentials.nivel, credentials.plano, true]);
  }
}
module.exports = { adminCredentials, seed };
