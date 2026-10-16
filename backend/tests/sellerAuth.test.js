const { test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const Seller = require('../models/Seller');
const { pool } = require('../config/database');
const app = require('../index');

test('seller session access, validation, origin checks and logout', async () => {
  const sessions = new Map();
  const password = 'test-password-only-123';
  const seller = { id: 1, name: 'Test Seller', email: 'seller@example.test', is_active: 1, password_hash: await bcrypt.hash(password, 4) };
  const original = { ...Seller };
  Seller.findByEmail = async email => email === seller.email ? seller : undefined;
  Seller.createSession = async (id, token, expires) => sessions.set(token, { id, expires });
  Seller.session = async token => sessions.has(token) && sessions.get(token).expires > new Date() && seller.is_active ? { id: seller.id, name: seller.name, email: seller.email } : undefined;
  Seller.revoke = async token => sessions.delete(token);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/seller`;
  const call = (path, body, cookie, origin = 'http://localhost:3000') => fetch(base + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, ...(cookie ? { Cookie: cookie } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  try {
    assert.equal((await call('/dashboard')).status, 401);
    assert.equal((await call('/me', undefined, 'money_hold_seller=forged')).status, 401);
    assert.equal((await call('/login', {})).status, 422);
    assert.equal((await call('/login', { email: seller.email, password: 'wrong' })).status, 401);
    assert.equal((await call('/login', { email: 'customer@example.test', password })).status, 401);
    assert.equal((await call('/login', { email: seller.email, password }, undefined, 'https://evil.example')).status, 403);
    const response = await call('/login', { email: seller.email, password, remember: true });
    assert.equal(response.status, 200);
    const cookieHeader = response.headers.get('set-cookie');
    assert.match(cookieHeader, /HttpOnly/i); assert.match(cookieHeader, /SameSite=Lax/i); assert.match(cookieHeader, /Max-Age=/i);
    assert.equal((await response.json()).seller.password_hash, undefined);
    const cookie = cookieHeader.split(';')[0];
    assert.equal((await call('/dashboard', undefined, cookie)).status, 200);
    seller.is_active = 0;
    assert.equal((await call('/me', undefined, cookie)).status, 401);
    seller.is_active = 1;
    for (const session of sessions.values()) session.expires = new Date(0);
    assert.equal((await call('/me', undefined, cookie)).status, 401);
    assert.equal((await call('/logout', {}, cookie)).status, 200);
    assert.equal(sessions.size, 0);
    assert.equal((await call('/dashboard', undefined, cookie)).status, 401);
  } finally {
    Object.assign(Seller, original);
    await new Promise(resolve => server.close(resolve));
    await pool.end();
  }
});
