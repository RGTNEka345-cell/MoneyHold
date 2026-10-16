require('dotenv').config({ path: require('path').join(__dirname, '../.env'), quiet: true });
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const ask = question => new Promise(resolve => rl.question(question, resolve));
  try {
    const name = (await ask('Seller name: ')).trim();
    const email = (await ask('Seller email: ')).trim().toLowerCase();
    const password = await ask('Password (visible, at least 12 characters): ');
    if (!name || name.length > 120 || email.length > 191 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || Buffer.byteLength(password) > 72) throw Error('Invalid details. Password must be 12+ characters and at most 72 UTF-8 bytes.');
    const sql = fs.readFileSync(path.join(__dirname, '../migrations/create_sellers_table.sql'), 'utf8');
    for (const statement of sql.split(';').filter(x => x.trim())) await pool.query(statement);
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.execute('INSERT INTO sellers (name,email,password_hash) VALUES (?,?,?)', [name, email, passwordHash]);
    console.log('Seller created. Sign in at /seller/login.');
  } finally { rl.close(); await pool.end(); }
}
main().catch(error => { console.error(error.code === 'ER_DUP_ENTRY' ? 'Seller already exists; account was not overwritten.' : error.message); process.exitCode = 1; });
