-- V14__tabela_usuarios_multitenant.sql
-- Cria tabela usuarios para autenticação multi-tenant

CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    empresa_id INT NOT NULL DEFAULT 1,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    INDEX idx_usuarios_email (email),
    INDEX idx_usuarios_empresa (empresa_id),
    INDEX idx_usuarios_ativo (ativo)
    -- FOREIGN KEY (empresa_id) REFERENCES empresas(id) -- Removido pois tabela empresas não existe
);

-- Inserir usuário admin padrão se não existir
INSERT IGNORE INTO usuarios (nome, email, senha, empresa_id, is_admin, ativo)
VALUES ('Super Admin', 'admin@petshop.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6fMhZaP1G', 1, TRUE, TRUE);
-- Senha: admin123