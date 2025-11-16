-- V16__adicionar_user_id_password_reset_tokens.sql
-- Adiciona coluna user_id à tabela password_reset_tokens

ALTER TABLE password_reset_tokens ADD user_id INT NOT NULL;
CREATE INDEX idx_password_reset_user_id ON password_reset_tokens (user_id);
