// Migrações aditivas: preservam dados e as sete tabelas da Fase 0.5.
const columns={
 leituras:{simulado:'BOOLEAN NOT NULL DEFAULT FALSE',boias:'JSON NULL',modo:"VARCHAR(10) NULL"},
 eventos:{simulado:'BOOLEAN NOT NULL DEFAULT FALSE'},
 acionamentos:{ocorrencia:'VARCHAR(120) NULL',agendamento_id:'INT UNSIGNED NULL',perfil_planta_id:'INT UNSIGNED NULL',status:"VARCHAR(20) NOT NULL DEFAULT 'iniciada'",motivo:'VARCHAR(255) NULL',simulado:'BOOLEAN NOT NULL DEFAULT FALSE',confirmado:'BOOLEAN NOT NULL DEFAULT FALSE',vazao_l_min:'DECIMAL(12,4) NULL',volume_estimado_l:'DECIMAL(12,4) NULL'}
};
async function migrate(db){
 for(const [table,fields] of Object.entries(columns)){
  const [found]=await db.execute('SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?', [table]);
  const known=new Set(found.map(row=>row.COLUMN_NAME));
  for(const [column,spec] of Object.entries(fields))if(!known.has(column))await db.query('ALTER TABLE ?? ADD COLUMN ?? '+spec,[table,column]);
 }
 const [nullable]=await db.execute("SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='acionamentos' AND COLUMN_NAME='inicio'");
 if(nullable[0]?.IS_NULLABLE==='NO')await db.query('ALTER TABLE acionamentos MODIFY inicio DATETIME(3) NULL');
 const [indexes]=await db.execute("SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='acionamentos' AND INDEX_NAME='idx_ocorrencia_unica'");
 if(!indexes.length)await db.query('ALTER TABLE acionamentos ADD UNIQUE KEY idx_ocorrencia_unica (ocorrencia)');
}
module.exports={migrate};
