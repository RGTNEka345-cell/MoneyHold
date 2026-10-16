
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Seller = require('../models/Seller');
const { cookieName, cookieOptions, readToken, hash } = require('../utils/sellerSession');
const dummyHash = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 12);

exports.login = async (req, res, next) => {
  try {
    const { email, password, remember } = req.body || {};
    if (typeof email !== 'string' || email.length > 191 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== 'string' || Buffer.byteLength(password) > 72 || !password) {
      return res.status(422).json({ message: 'Enter a valid email and password.' });
    }
    const seller = await Seller.findByEmail(email.trim().toLowerCase());
    const valid = await bcrypt.compare(password, seller?.password_hash || dummyHash);
    if (!seller || !valid || !seller.is_active) return res.status(401).json({ message: 'Invalid seller email or password.' });
    const token = crypto.randomBytes(32).toString('hex');
    const duration = remember === true ? 7 * 86400000 : 8 * 3600000;
    const old = readToken(req);
    if (old) await Seller.revoke(hash(old));
    await Seller.createSession(seller.id, hash(token), new Date(Date.now() + duration));
    res.cookie(cookieName, token, { ...cookieOptions(), ...(remember === true ? { maxAge: duration } : {}) });
    res.json({ success: true, seller: { id: seller.id, name: seller.name, email: seller.email } });
  } catch (error) { next(error); }
};
exports.me = (req, res) => res.json({ seller: req.seller });
exports.logout = async (req, res, next) => {
  try {
    const token = readToken(req);
    if (token) await Seller.revoke(hash(token));
    res.clearCookie(cookieName, cookieOptions());
    res.json({ success: true });
  } catch (error) { next(error); }
};
