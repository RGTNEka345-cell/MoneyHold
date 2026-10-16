
const { pool } = require("../config/database");

class Customer {
  static async findByEmail(email) {
    const [rows] = await pool.execute(
      `SELECT id, first_name, last_name, email, phone, password_hash,
              role, is_active, email_verified, created_at, updated_at
       FROM customers WHERE email = ? LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  }

  static async findByPhone(phone) {
    const [rows] = await pool.execute("SELECT id FROM customers WHERE phone = ? LIMIT 1", [phone]);
    return rows[0] || null;
  }

  static async create({ firstName, lastName, email, phone, passwordHash }) {
    const [result] = await pool.execute(
      `INSERT INTO customers (first_name, last_name, email, phone, password_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [firstName, lastName, email, phone, passwordHash]
    );
    return this.findPublicById(result.insertId);
  }

  static async findPublicById(id) {
    const [rows] = await pool.execute(
      `SELECT id, first_name, last_name, email, phone, role,
              is_active, email_verified, created_at
       FROM customers WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async verifyEmail(id) {
    await pool.execute(
      `UPDATE customers
       SET email_verified = TRUE, is_active = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );
    return this.findPublicById(id);
  }
}

module.exports = Customer;
