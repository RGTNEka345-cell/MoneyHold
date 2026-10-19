CREATE TABLE IF NOT EXISTS order_email_jobs (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 history_id BIGINT UNSIGNED NOT NULL UNIQUE,
 order_id BIGINT UNSIGNED NOT NULL,
 event_status VARCHAR(20) NOT NULL,
 status ENUM('pending','processing','sent','failed','simulated') NOT NULL DEFAULT 'pending',
 attempts INT UNSIGNED NOT NULL DEFAULT 0,
 available_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 lease_until DATETIME NULL,
 lease_token CHAR(64) NULL,
 last_error VARCHAR(80) NULL,
 sent_at DATETIME NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 INDEX ready (status,available_at),
 FOREIGN KEY (history_id) REFERENCES order_status_history(id),
 FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;
