const bcrypt = require('bcryptjs');
function validatePassword(password, user = '') {
  if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password) > 72 ||
      !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password) ||
      /(password|senha|senai|admin|qwerty|123456|changeme)/i.test(password) ||
      (user.length >= 3 && password.toLowerCase().includes(user.toLowerCase()))) {
    throw Object.assign(new Error('Senha fraca: use 12+ caracteres, maiúscula, minúscula, número e símbolo, sem padrões ou nome do usuário (máximo 72 bytes).'), {status: 400});
  }
}
const hashPassword = password => bcrypt.hash(password, 12);
module.exports = { validatePassword, hashPassword, comparePassword: bcrypt.compare };
