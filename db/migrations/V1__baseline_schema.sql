-- Flyway Migration: V1 Baseline Schema
-- Gera toda a estrutura inicial do banco petshop já com colunas de auditoria
-- Fonte combinada de: esquema_reverso.sql + melhorias_banco.sql (tabelas, colunas, constraints, indexes, views)

-- IMPORTANTE: Não recria o banco se já existir (Flyway assume schema petshop existente)
-- Caso esteja vazio, criar manualmente: CREATE DATABASE petshop CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE petshop;

-- ============================================================
-- Tabelas base
-- ============================================================
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) NULL,
    telefone VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL,
    endereco_rua VARCHAR(255) NULL,
    endereco_numero VARCHAR(10) NULL,
    endereco_complemento VARCHAR(100) NULL,
    endereco_bairro VARCHAR(100) NULL,
    endereco_cidade VARCHAR(100) NULL,
    endereco_estado CHAR(2) NULL,
    endereco_cep VARCHAR(10) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    ativo BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id_cliente),
    UNIQUE KEY cpf_UNIQUE (cpf),
    UNIQUE KEY email_UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS funcionarios (
    id_funcionario INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    cargo VARCHAR(50) NOT NULL,
    login VARCHAR(50) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    ativo BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id_funcionario),
    UNIQUE KEY login_UNIQUE (login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fornecedores (
    id_fornecedor INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    cnpj VARCHAR(18) NULL,
    telefone VARCHAR(15) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    ativo BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id_fornecedor),
    UNIQUE KEY cnpj_UNIQUE (cnpj)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS servicos (
    id_servico INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NULL,
    preco_base DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    ativo BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id_servico)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS produtos (
    id_produto INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    codigo_barras VARCHAR(50) NULL,
    descricao TEXT NULL,
    preco_venda DECIMAL(10,2) NOT NULL,
    preco_custo DECIMAL(10,2) NULL,
    estoque_minimo INT DEFAULT 0,
    categoria VARCHAR(50) NULL,
    id_fornecedor INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    ativo BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id_produto),
    KEY idx_fornecedor (id_fornecedor),
    CONSTRAINT fk_produtos_fornecedores FOREIGN KEY (id_fornecedor) REFERENCES fornecedores (id_fornecedor) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pets (
    id_pet INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    raca VARCHAR(50) NULL,
    sexo ENUM('Macho','Fêmea','Não informado') DEFAULT 'Não informado',
    peso DECIMAL(5,2) NULL COMMENT 'Peso em kg',
    cor VARCHAR(50) NULL,
    microchip VARCHAR(20) NULL,
    castrado BOOLEAN DEFAULT FALSE,
    observacoes TEXT NULL,
    data_nascimento DATE NULL,
    id_cliente INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    ativo BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id_pet),
    KEY idx_cliente (id_cliente),
    CONSTRAINT fk_pets_clientes FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS estoque (
    id_estoque INT NOT NULL AUTO_INCREMENT,
    id_produto INT NULL,
    lote VARCHAR(50) NULL,
    quantidade INT NOT NULL DEFAULT 0,
    data_vencimento DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_estoque),
    KEY idx_produto (id_produto),
    CONSTRAINT fk_estoque_produtos FOREIGN KEY (id_produto) REFERENCES produtos (id_produto) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS prontuario (
    id_prontuario INT NOT NULL AUTO_INCREMENT,
    id_pet INT NULL,
    historico_medico TEXT NULL,
    alergias TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_prontuario),
    UNIQUE KEY id_pet_UNIQUE (id_pet),
    CONSTRAINT fk_prontuario_pets FOREIGN KEY (id_pet) REFERENCES pets (id_pet) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS agendamentos (
    id_agendamento INT NOT NULL AUTO_INCREMENT,
    data_hora DATETIME NOT NULL,
    status ENUM('Agendado','Confirmado','Cancelado','Concluído') NOT NULL DEFAULT 'Agendado',
    id_servico INT NULL,
    id_pet INT NULL,
    id_funcionario INT NULL,
    observacoes TEXT NULL,
    valor_servico DECIMAL(10,2) NULL,
    duracao_estimada INT NULL COMMENT 'Duração em minutos',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_agendamento),
    KEY idx_pet (id_pet),
    KEY idx_funcionario (id_funcionario),
    KEY idx_servico (id_servico),
    CONSTRAINT fk_agendamentos_pets FOREIGN KEY (id_pet) REFERENCES pets (id_pet) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_agendamentos_funcionarios FOREIGN KEY (id_funcionario) REFERENCES funcionarios (id_funcionario) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_agendamentos_servicos FOREIGN KEY (id_servico) REFERENCES servicos (id_servico) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS consultas (
    id_consulta INT NOT NULL AUTO_INCREMENT,
    id_agendamento INT NULL,
    diagnostico TEXT NOT NULL,
    prescricao_medica TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_consulta),
    UNIQUE KEY id_agendamento_UNIQUE (id_agendamento),
    CONSTRAINT fk_consultas_agendamentos FOREIGN KEY (id_agendamento) REFERENCES agendamentos (id_agendamento) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vendas (
    id_venda INT NOT NULL AUTO_INCREMENT,
    data_hora_venda DATETIME NOT NULL,
    id_cliente INT NULL,
    id_funcionario INT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    desconto DECIMAL(10,2) DEFAULT 0,
    valor_desconto DECIMAL(10,2) DEFAULT 0,
    observacoes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_venda),
    KEY idx_cliente (id_cliente),
    KEY idx_funcionario (id_funcionario),
    CONSTRAINT fk_vendas_clientes FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_vendas_funcionarios FOREIGN KEY (id_funcionario) REFERENCES funcionarios (id_funcionario) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS itens_da_venda (
    id_venda INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade_vendida INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id_venda, id_produto),
    KEY idx_produto (id_produto),
    CONSTRAINT fk_itens_vendas FOREIGN KEY (id_venda) REFERENCES vendas (id_venda) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_itens_produtos FOREIGN KEY (id_produto) REFERENCES produtos (id_produto) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Pagamentos (
    id_Pagamentos INT NOT NULL AUTO_INCREMENT,
    id_venda INT NULL,
    forma_pagamento VARCHAR(50) NOT NULL,
    valor_pago DECIMAL(10,2) NOT NULL,
    data_pagamento DATETIME NOT NULL,
    PRIMARY KEY (id_Pagamentos),
    KEY idx_venda (id_venda),
    CONSTRAINT fk_pagamentos_vendas FOREIGN KEY (id_venda) REFERENCES vendas (id_venda) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Indexes adicionais (além dos já criados nas tabelas)
-- ============================================================
CREATE INDEX idx_clientes_nome ON clientes(nome);
CREATE INDEX idx_clientes_ativo ON clientes(ativo);
CREATE INDEX idx_clientes_deleted ON clientes(deleted_at);
CREATE INDEX idx_pets_nome ON pets(nome);
CREATE INDEX idx_pets_ativo ON pets(ativo);
CREATE INDEX idx_agendamentos_data ON agendamentos(data_hora);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);
CREATE INDEX idx_agendamentos_data_status ON agendamentos(data_hora, status);
CREATE INDEX idx_vendas_data ON vendas(data_hora_venda);
CREATE INDEX idx_vendas_created ON vendas(created_at);
CREATE INDEX idx_produtos_nome ON produtos(nome);
CREATE INDEX idx_produtos_categoria ON produtos(categoria);
CREATE INDEX idx_produtos_ativo ON produtos(ativo);
CREATE INDEX idx_produtos_codigo ON produtos(codigo_barras);
CREATE INDEX idx_funcionarios_login ON funcionarios(login);
CREATE INDEX idx_funcionarios_ativo ON funcionarios(ativo);

-- ============================================================
-- Constraints de validação
-- ============================================================
ALTER TABLE produtos 
    ADD CONSTRAINT chk_produtos_preco_venda CHECK (preco_venda > 0),
    ADD CONSTRAINT chk_produtos_preco_custo CHECK (preco_custo >= 0 OR preco_custo IS NULL),
    ADD CONSTRAINT chk_produtos_estoque_minimo CHECK (estoque_minimo >= 0);
ALTER TABLE estoque 
    ADD CONSTRAINT chk_estoque_quantidade CHECK (quantidade >= 0);
ALTER TABLE vendas 
    ADD CONSTRAINT chk_vendas_valor_total CHECK (valor_total >= 0),
    ADD CONSTRAINT chk_vendas_desconto CHECK (desconto >= 0),
    ADD CONSTRAINT chk_vendas_valor_desconto CHECK (valor_desconto >= 0);
ALTER TABLE clientes 
    ADD CONSTRAINT chk_clientes_email CHECK (email LIKE '%@%');
ALTER TABLE servicos 
    ADD CONSTRAINT chk_servicos_preco CHECK (preco_base >= 0);
ALTER TABLE itens_da_venda 
    ADD CONSTRAINT chk_itens_quantidade CHECK (quantidade_vendida > 0),
    ADD CONSTRAINT chk_itens_preco CHECK (preco_unitario >= 0);
ALTER TABLE Pagamentos 
    ADD CONSTRAINT chk_pagamentos_valor CHECK (valor_pago > 0);

-- ============================================================
-- Views
-- ============================================================
CREATE OR REPLACE VIEW vw_vendas_completas AS
SELECT 
    v.id_venda,
    v.data_hora_venda,
    c.nome as cliente_nome,
    c.cpf as cliente_cpf,
    c.telefone as cliente_telefone,
    f.nome as vendedor_nome,
    v.valor_total,
    v.desconto,
    v.valor_desconto,
    (v.valor_total - v.valor_desconto) as valor_final,
    COUNT(iv.id_produto) as total_itens,
    v.observacoes,
    v.created_at
FROM vendas v
LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
LEFT JOIN funcionarios f ON v.id_funcionario = f.id_funcionario
LEFT JOIN itens_da_venda iv ON v.id_venda = iv.id_venda
GROUP BY v.id_venda;

CREATE OR REPLACE VIEW vw_agendamentos_hoje AS
SELECT 
    a.id_agendamento,
    a.data_hora,
    a.status,
    p.nome as pet_nome,
    p.especie,
    c.nome as cliente_nome,
    c.telefone as cliente_telefone,
    s.nome as servico_nome,
    s.preco_base as servico_preco,
    f.nome as funcionario_nome,
    a.valor_servico,
    a.duracao_estimada,
    a.observacoes
FROM agendamentos a
JOIN pets p ON a.id_pet = p.id_pet
JOIN clientes c ON p.id_cliente = c.id_cliente
LEFT JOIN servicos s ON a.id_servico = s.id_servico
LEFT JOIN funcionarios f ON a.id_funcionario = f.id_funcionario
WHERE DATE(a.data_hora) = CURDATE()
ORDER BY a.data_hora;

CREATE OR REPLACE VIEW vw_produtos_estoque_baixo AS
SELECT 
    p.id_produto,
    p.nome,
    p.categoria,
    p.codigo_barras,
    COALESCE(SUM(e.quantidade), 0) as quantidade_total,
    p.estoque_minimo,
    (p.estoque_minimo - COALESCE(SUM(e.quantidade), 0)) as quantidade_faltante,
    p.preco_venda,
    f.nome as fornecedor_nome,
    f.telefone as fornecedor_telefone
FROM produtos p
LEFT JOIN estoque e ON p.id_produto = e.id_produto
LEFT JOIN fornecedores f ON p.id_fornecedor = f.id_fornecedor
WHERE p.ativo = TRUE
GROUP BY p.id_produto
HAVING quantidade_total < p.estoque_minimo
ORDER BY quantidade_faltante DESC;

CREATE OR REPLACE VIEW vw_clientes_pets AS
SELECT 
    c.id_cliente,
    c.nome as cliente_nome,
    c.cpf,
    c.email,
    c.telefone,
    c.endereco_rua,
    c.endereco_numero,
    c.endereco_bairro,
    c.endereco_cidade,
    c.endereco_estado,
    COUNT(p.id_pet) as total_pets,
    c.created_at as cliente_desde
FROM clientes c
LEFT JOIN pets p ON c.id_cliente = p.id_cliente AND p.ativo = TRUE AND p.deleted_at IS NULL
WHERE c.ativo = TRUE AND c.deleted_at IS NULL
GROUP BY c.id_cliente;

CREATE OR REPLACE VIEW vw_pets_historico AS
SELECT 
    p.id_pet,
    p.nome as pet_nome,
    p.especie,
    p.raca,
    p.sexo,
    p.peso,
    p.data_nascimento,
    TIMESTAMPDIFF(YEAR, p.data_nascimento, CURDATE()) as idade_anos,
    c.nome as dono_nome,
    c.telefone as dono_telefone,
    pr.historico_medico,
    pr.alergias,
    COUNT(DISTINCT a.id_agendamento) as total_agendamentos,
    p.created_at as cadastrado_em
FROM pets p
JOIN clientes c ON p.id_cliente = c.id_cliente
LEFT JOIN prontuario pr ON p.id_pet = pr.id_pet
LEFT JOIN agendamentos a ON p.id_pet = a.id_pet
WHERE p.ativo = TRUE AND p.deleted_at IS NULL
GROUP BY p.id_pet;

-- ============================================================
-- Triggers de auditoria (apenas para tabelas com updated_at)
-- ============================================================
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS agendamentos_updated_at BEFORE UPDATE ON agendamentos FOR EACH ROW BEGIN SET NEW.updated_at = NOW(); END$$
CREATE TRIGGER IF NOT EXISTS clientes_updated_at     BEFORE UPDATE ON clientes     FOR EACH ROW BEGIN SET NEW.updated_at = NOW(); END$$
CREATE TRIGGER IF NOT EXISTS consultas_updated_at    BEFORE UPDATE ON consultas    FOR EACH ROW BEGIN SET NEW.updated_at = NOW(); END$$
CREATE TRIGGER IF NOT EXISTS estoque_updated_at      BEFORE UPDATE ON estoque      FOR EACH ROW BEGIN SET NEW.updated_at = NOW(); END$$
CREATE TRIGGER IF NOT EXISTS fornecedores_updated_at BEFORE UPDATE ON fornecedores FOR EACH ROW BEGIN SET NEW.updated_at = NOW(); END$$
CREATE TRIGGER IF NOT EXISTS funcionarios_updated_at BEFORE UPDATE ON funcionarios FOR EACH ROW BEGIN SET NEW.updated_at = NOW(); END$$
CREATE TRIGGER IF NOT EXISTS pets_updated_at         BEFORE UPDATE ON pets         FOR EACH ROW BEGIN SET NEW.updated_at = NOW(); END$$
CREATE TRIGGER IF NOT EXISTS produtos_updated_at     BEFORE UPDATE ON produtos     FOR EACH ROW BEGIN SET NEW.updated_at = NOW(); END$$
CREATE TRIGGER IF NOT EXISTS prontuario_updated_at   BEFORE UPDATE ON prontuario   FOR EACH ROW BEGIN SET NEW.updated_at = NOW(); END$$
CREATE TRIGGER IF NOT EXISTS servicos_updated_at     BEFORE UPDATE ON servicos     FOR EACH ROW BEGIN SET NEW.updated_at = NOW(); END$$
CREATE TRIGGER IF NOT EXISTS vendas_updated_at       BEFORE UPDATE ON vendas       FOR EACH ROW BEGIN SET NEW.updated_at = NOW(); END$$
DELIMITER ;

-- Marcação final
SELECT 'V1 baseline aplicada' AS status;
