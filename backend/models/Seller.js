
const { pool } = require('../config/database');
module.exports = {
  async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM sellers WHERE email = ?', [email]);
    return rows[0];
  },
  async createSession(id, hash, expires) {
    await pool.execute('INSERT INTO seller_sessions (seller_id, token_hash, expires_at) VALUES (?, ?, ?)', [id, hash, expires]);
  },
  async session(hash) {
    const [rows] = await pool.execute(`SELECT s.id, s.name, s.email FROM sellers s
      JOIN seller_sessions t ON t.seller_id=s.id
      WHERE t.token_hash=? AND t.expires_at>NOW() AND s.is_active=TRUE`, [hash]);
    return rows[0];
  },
  async revoke(hash) {
    await pool.execute('DELETE FROM seller_sessions WHERE token_hash=?', [hash]);
  }
};
