
CREATE TABLE IF NOT EXISTS notifications (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 history_id BIGINT UNSIGNED NOT NULL,
 order_id BIGINT UNSIGNED NOT NULL,
 recipient_role ENUM('customer','seller') NOT NULL,
 recipient_id BIGINT UNSIGNED NOT NULL,
 message VARCHAR(255) NOT NULL,
 read_at DATETIME NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY event_recipient (history_id,recipient_role,recipient_id),
 INDEX inbox (recipient_role,recipient_id,read_at,id),
 FOREIGN KEY (history_id) REFERENCES order_status_history(id),
 FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;
