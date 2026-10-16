const crypto = require('crypto');
const cookieName = 'money_hold_seller';
const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/seller' });
const hash = token => crypto.createHash('sha256').update(token).digest('hex');
function readToken(req) {
  const part = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(cookieName + '='));
  const token = part ? part.slice(cookieName.length + 1) : '';
  return /^[a-f0-9]{64}$/.test(token) ? token : '';
}
module.exports = { cookieName, cookieOptions, hash, readToken };
