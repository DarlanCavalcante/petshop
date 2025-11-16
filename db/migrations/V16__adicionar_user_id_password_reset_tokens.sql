-- V16__adicionar_user_id_password_reset_tokens.sql
-- Adiciona coluna user_id à tabela password_reset_tokens

ALTER TABLE password_reset_tokens ADD COLUMN user_id INT NOT NULL AFTER email;
ALTER TABLE password_reset_tokens ADD INDEX idx_password_reset_user_id (user_id);