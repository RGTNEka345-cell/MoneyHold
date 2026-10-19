CREATE TABLE IF NOT EXISTS customer_sessions (
 token_hash CHAR(64) PRIMARY KEY,
 customer_id BIGINT UNSIGNED NOT NULL,
 expires_at DATETIME NOT NULL,
 FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
 INDEX (expires_at)
) ENGINE=InnoDB;
