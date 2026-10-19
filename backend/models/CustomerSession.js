const {pool}=require('../config/database');
module.exports={
  async create(id,hash,expires){await pool.execute('INSERT INTO customer_sessions (customer_id,token_hash,expires_at) VALUES (?,?,?)',[id,hash,expires]);},
  async find(hash){const [rows]=await pool.execute(`SELECT c.id,c.first_name,c.last_name,c.email,c.phone FROM customers c JOIN customer_sessions s ON s.customer_id=c.id WHERE s.token_hash=? AND s.expires_at>NOW() AND c.email_verified=TRUE AND c.is_active=TRUE`,[hash]);return rows[0];},
  async revoke(hash){await pool.execute('DELETE FROM customer_sessions WHERE token_hash=?',[hash]);}
};
