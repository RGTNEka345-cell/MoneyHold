
const { pool } = require("../config/database");

class OTP {
  static async upsert({ customerId, otpHash, expiresAt }) {
    await pool.execute(
      `INSERT INTO otps (customer_id, purpose, otp_hash, expires_at, attempt_count, last_sent_at)
       VALUES (?, 'email_verification', ?, ?, 0, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE otp_hash = VALUES(otp_hash), expires_at = VALUES(expires_at),
         attempt_count = 0, last_sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`,
      [customerId, otpHash, expiresAt]
    );
  }

  static async findForCustomer(customerId) {
    const [rows] = await pool.execute(
      `SELECT id, customer_id, otp_hash, expires_at, attempt_count, last_sent_at
       FROM otps WHERE customer_id = ? AND purpose = 'email_verification' LIMIT 1`,
      [customerId]
    );
    return rows[0] || null;
  }

  static async incrementAttempts(id) {
    await pool.execute("UPDATE otps SET attempt_count = attempt_count + 1 WHERE id = ?", [id]);
  }

  static async removeForCustomer(customerId) {
    await pool.execute("DELETE FROM otps WHERE customer_id = ? AND purpose = 'email_verification'", [customerId]);
  }
}

module.exports = OTP;
