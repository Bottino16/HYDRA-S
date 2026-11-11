const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ quiet: true });
function number(name, fallback, min = 1, max = 1000000) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`Configuração inválida: ${name}`);
  return value;
}
function config() {
  const production = process.env.NODE_ENV === 'production';
  const secret = process.env.SESSION_SECRET || '';
  if (secret.length < 32) throw new Error('Defina SESSION_SECRET aleatório com pelo menos 32 caracteres no .env.');
  const secure = process.env.COOKIE_SECURE === 'true';
  if (production && !secure) throw new Error('Produção exige COOKIE_SECURE=true e HTTPS.');
  const origin = new URL(process.env.APP_ORIGIN || 'http://localhost:3000').origin;
  const mode = process.env.DB_MODE || 'mysql';
  if (!['mysql', 'memory'].includes(mode)) throw new Error('DB_MODE deve ser mysql ou memory.');
  const timeZone=process.env.SCHEDULE_TIMEZONE||'America/Fortaleza';
  new Intl.DateTimeFormat('en-CA',{timeZone}).format();
  const flows=[1,2,3].map(i=>{const raw=process.env['FLOW_PUMP_'+i+'_L_MIN'];if(!raw)return null;const v=Number(raw);if(!Number.isFinite(v)||v<=0||v>1000)throw new Error('Vazão inválida.');return v;});
  return {
    assistant:{demo:process.env.ASSISTANT_DEMO==='true',key:process.env.ANTHROPIC_API_KEY||'',model:process.env.ANTHROPIC_MODEL||'',
      hourly:number('ASSISTANT_MESSAGES_PER_HOUR',20,1,1000),daily:number('ASSISTANT_MESSAGES_PER_DAY',100,1,10000),
      messageChars:number('ASSISTANT_MESSAGE_MAX_CHARS',2000,50,8000),maxTokens:number('ASSISTANT_MAX_TOKENS',700,64,4096),
      historyChars:number('ASSISTANT_HISTORY_MAX_CHARS',6000,100,24000),timeoutMs:number('ASSISTANT_TIMEOUT_SECONDS',30,1,120)*1000,
      knowledgeDir:path.resolve('knowledge')},
    dataStaleMs:number('DATA_STALE_SECONDS',5,1,300)*1000,
    serialReconnectMs:number('SERIAL_RECONNECT_MS',3000,100,60000),serialPath:process.env.SERIAL_PORT||'auto',
    scheduleTimeZone:timeZone,scheduleJournalDir:path.resolve(process.env.SCHEDULE_JOURNAL_DIR||'.data/schedule-occurrences'),
    settingsFile:path.resolve(process.env.SETTINGS_FILE||'.data/device-settings.json'),flows,
    weatherOffline:process.env.WEATHER_OFFLINE!=='false',weatherCacheMs:number('WEATHER_CACHE_SECONDS',600,1,86400)*1000,
    weatherTimeoutMs:number('WEATHER_TIMEOUT_MS',2000,100,15000),weatherKey:process.env.OPENWEATHER_API_KEY||'',
    host: process.env.HOST || '127.0.0.1', port: number('PORT', 3000, 1, 65535), origin,
    secret, secure, ttl: number('SESSION_TTL_MINUTES', 60, 1, 1440) * 60000,
    simulate: process.env.SIMULATE !== 'false', dbMode: mode,
    attempts: number('LOGIN_MAX_ATTEMPTS', 5, 1, 20), lockMs: number('LOGIN_LOCK_MINUTES', 15, 1, 1440) * 60000,
    retentionDays: number('READING_RETENTION_DAYS', 90), saveSeconds: number('READING_SAVE_SECONDS', 10),
  };
}
function databaseOptions() {
  const ssl = process.env.DB_SSL === 'true';
  return { host: process.env.DB_HOST || '127.0.0.1', port: number('DB_PORT', 3306, 1, 65535),
    user: process.env.DB_USER || 'sda', password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sda', connectTimeout: number('DB_CONNECT_TIMEOUT_MS', 3000),
    ...(ssl ? {ssl: {rejectUnauthorized: true, ...(process.env.DB_SSL_CA ? {ca: fs.readFileSync(process.env.DB_SSL_CA)} : {})}} : {}),
    waitForConnections: true, connectionLimit: 5, timezone: 'Z' };
}
module.exports = { config, databaseOptions };
