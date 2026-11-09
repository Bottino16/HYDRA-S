const { setup } = require('./setup');
(async () => {
  if (process.env.DB_MODE !== 'memory') await setup();
  await require('../server').start();
})().catch(error => { console.error(error.message); process.exitCode = 1; });
