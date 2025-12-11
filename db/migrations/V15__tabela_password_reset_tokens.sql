-- V15__tabela_password_reset_tokens.sql
-- Cria tabela para tokens de reset de senha

CREATE TABLE password_reset_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    used_at TIMESTAMP NULL,

    INDEX idx_password_reset_email (email),
    INDEX idx_password_reset_token (token),
    INDEX idx_password_reset_expires (expires_at),
    INDEX idx_password_reset_used (used)
);
