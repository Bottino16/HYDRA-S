const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const readline = require('node:readline/promises');
const { databaseOptions } = require('../src/config');
const { adminCredentials, seed } = require('./seed');
async function setup({reset = false} = {}) {
  const credentials = await adminCredentials(true); // Valida ANTES de conectar ou modificar o banco.
  const options = databaseOptions();
  if (!/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(options.database)) throw new Error('DB_NAME inválido.');
  if (reset) {
    if (!process.stdin.isTTY) throw new Error('db:reset exige confirmação explícita em terminal interativo.');
    const rl = readline.createInterface({input: process.stdin, output: process.stdout});
    let answer;
    try { answer = await rl.question(`Apagar todos os dados de ${options.database}? Digite APAGAR ${options.database}: `); } finally { rl.close(); }
    if (answer !== `APAGAR ${options.database}`) throw new Error('Reset cancelado.');
  }
  const {database, connectionLimit, waitForConnections, ...base} = options;
  const db = await mysql.createConnection(base);
  try {
    // Identificadores não aceitam execute: ?? faz escape pelo driver; nome também é validado acima.
    await db.query('CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', [database]);
    await db.changeUser({database});
    if (reset) {
      for (const table of ['conversas_ia','acionamentos','configuracao_rega','perfis_planta','leituras','eventos','usuarios']) {
        await db.query('DROP TABLE IF EXISTS ??', [table]);
      }
    }
    const statements = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8').split(';').map(s => s.trim()).filter(Boolean);
    for (const statement of statements) await db.query(statement);
    await require('../src/db/migrations').migrate(db);
    await seed(db, credentials);
    console.log('Banco pronto; administrador criado se ainda não existia.');
  } finally { await db.end(); }
}
if (require.main === module) setup({reset: process.argv.includes('--reset')}).catch(error => {
  if(error.status===400) console.error(error.message);
  console.error('Falha no setup. Verifique credenciais, força da senha, permissões, certificado e disponibilidade do MySQL.'); process.exitCode = 1;
});
module.exports = { setup };
