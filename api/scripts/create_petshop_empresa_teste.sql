-- Script completo para criar e popular o banco de demonstração: petshop_empresa_teste
-- Uso sugerido:
--   mysql -u root -p < api/scripts/create_petshop_empresa_teste.sql
-- Após criar, já pode usar "X-Empresa: teste" nas requisições para o backend.

CREATE DATABASE IF NOT EXISTS petshop_empresa_teste
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE petshop_empresa_teste;

-- =============================================
-- Tabelas (extraído e adaptado de V1 baseline)
-- =============================================
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
    peso DECIMAL(5,2) NULL,
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
    duracao_estimada INT NULL,
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

-- Indexes principais
-- Criação de índices com IF NOT EXISTS (MySQL 8.0+: via INFORMATION_SCHEMA)
SET @exists := (SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='produtos' AND INDEX_NAME='idx_produtos_nome');
SET @sql := IF(@exists=0, 'CREATE INDEX idx_produtos_nome ON produtos(nome)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='produtos' AND INDEX_NAME='idx_produtos_categoria');
SET @sql := IF(@exists=0, 'CREATE INDEX idx_produtos_categoria ON produtos(categoria)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='vendas' AND INDEX_NAME='idx_vendas_data');
SET @sql := IF(@exists=0, 'CREATE INDEX idx_vendas_data ON vendas(data_hora_venda)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='clientes' AND INDEX_NAME='idx_clientes_nome');
SET @sql := IF(@exists=0, 'CREATE INDEX idx_clientes_nome ON clientes(nome)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Checks essenciais
ALTER TABLE produtos 
    ADD CONSTRAINT chk_produtos_preco_venda CHECK (preco_venda > 0),
    ADD CONSTRAINT chk_produtos_preco_custo CHECK (preco_custo >= 0 OR preco_custo IS NULL),
    ADD CONSTRAINT chk_produtos_estoque_minimo CHECK (estoque_minimo >= 0);
ALTER TABLE estoque ADD CONSTRAINT chk_estoque_quantidade CHECK (quantidade >= 0);
ALTER TABLE vendas ADD CONSTRAINT chk_vendas_valor_total CHECK (valor_total >= 0);
ALTER TABLE itens_da_venda ADD CONSTRAINT chk_itens_quantidade CHECK (quantidade_vendida > 0);
ALTER TABLE Pagamentos ADD CONSTRAINT chk_pagamentos_valor CHECK (valor_pago > 0);

-- =============================================
-- Procedure registrar_venda simplificada
-- =============================================
DELIMITER $$
DROP PROCEDURE IF EXISTS registrar_venda$$
CREATE PROCEDURE registrar_venda(
    IN p_id_cliente INT,
    IN p_id_funcionario INT,
    IN p_itens JSON,
    IN p_desconto DECIMAL(10,2),
    OUT p_id_venda INT,
    OUT p_valor_final DECIMAL(10,2)
)
BEGIN
    DECLARE v_total DECIMAL(10,2) DEFAULT 0;
    DECLARE v_idx INT DEFAULT 0;
    DECLARE v_itens_count INT DEFAULT JSON_LENGTH(p_itens);
    DECLARE v_id_prod INT;
    DECLARE v_qtd INT;
    DECLARE v_preco DECIMAL(10,2);

    START TRANSACTION;
    WHILE v_idx < v_itens_count DO
        SET v_id_prod = JSON_EXTRACT(p_itens, CONCAT('$[',v_idx,'].id_produto'));
        SET v_qtd     = JSON_EXTRACT(p_itens, CONCAT('$[',v_idx,'].qtd'));
        SET v_preco   = JSON_EXTRACT(p_itens, CONCAT('$[',v_idx,'].preco'));
        IF v_qtd <= 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantidade inválida';
        END IF;
        SET v_total = v_total + (v_qtd * v_preco);
        SET v_idx = v_idx + 1;
    END WHILE;

    INSERT INTO vendas(data_hora_venda, id_cliente, id_funcionario, valor_total, desconto, valor_desconto)
    VALUES (NOW(), p_id_cliente, p_id_funcionario, v_total, p_desconto, p_desconto);
    SET p_id_venda = LAST_INSERT_ID();

    SET v_idx = 0;
    WHILE v_idx < v_itens_count DO
        SET v_id_prod = JSON_EXTRACT(p_itens, CONCAT('$[',v_idx,'].id_produto'));
        SET v_qtd     = JSON_EXTRACT(p_itens, CONCAT('$[',v_idx,'].qtd'));
        SET v_preco   = JSON_EXTRACT(p_itens, CONCAT('$[',v_idx,'].preco'));
        INSERT INTO itens_da_venda(id_venda, id_produto, quantidade_vendida, preco_unitario)
        VALUES (p_id_venda, v_id_prod, v_qtd, v_preco);
        UPDATE estoque SET quantidade = quantidade - v_qtd WHERE id_produto = v_id_prod LIMIT 1;
        SET v_idx = v_idx + 1;
    END WHILE;

    SET p_valor_final = v_total - p_desconto;
    COMMIT;
END$$
DELIMITER ;

-- =============================================
-- Seed de dados fictícios
-- =============================================
-- Funcionário admin (senha = admin123)
INSERT INTO funcionarios (nome, cargo, login, senha)
VALUES ('Administrador Demo', 'Admin', 'admin', '$2b$12$u1eQzeuQgm7pUVjQzQWveO3FxZpZxXCMVvj.fAnCmvY/fx/n6PvWy')
ON DUPLICATE KEY UPDATE nome=VALUES(nome);

-- Fornecedores
INSERT INTO fornecedores (nome, cnpj, telefone) VALUES
 ('Pet Distribuidora', '11.111.111/0001-11', '1130001000'),
 ('Saúde Animal', '22.222.222/0001-22', '1130002000')
ON DUPLICATE KEY UPDATE telefone=VALUES(telefone);

-- Serviços
INSERT INTO servicos (nome, descricao, preco_base) VALUES
 ('Banho', 'Banho completo com produtos neutros', 60.00),
 ('Tosa', 'Tosa padrão higiênica', 80.00),
 ('Consulta Veterinária', 'Avaliação clínica completa', 150.00)
ON DUPLICATE KEY UPDATE preco_base=VALUES(preco_base);

-- Clientes
INSERT INTO clientes (nome, cpf, telefone, email, endereco_cidade, endereco_estado) VALUES
 ('João Pereira', '123.456.789-10', '11912341234', 'joao@example.com', 'São Paulo', 'SP'),
 ('Ana Lima', '987.654.321-00', '11987654321', 'ana@example.com', 'São Paulo', 'SP'),
 ('Carlos Mendes', '111.222.333-44', '11955554444', 'carlos@example.com', 'Guarulhos', 'SP')
ON DUPLICATE KEY UPDATE telefone=VALUES(telefone);

-- Pets
INSERT INTO pets (nome, especie, raca, sexo, id_cliente, data_nascimento) VALUES
 ('Rex', 'Cão', 'SRD', 'Macho', (SELECT id_cliente FROM clientes WHERE cpf='123.456.789-10'), '2022-05-10'),
 ('Luna', 'Cão', 'Poodle', 'Fêmea', (SELECT id_cliente FROM clientes WHERE cpf='987.654.321-00'), '2021-11-02'),
 ('Mimi', 'Gato', 'Persa', 'Fêmea', (SELECT id_cliente FROM clientes WHERE cpf='111.222.333-44'), '2020-08-20')
ON DUPLICATE KEY UPDATE especie=VALUES(especie);

-- Produtos
INSERT INTO produtos (nome, codigo_barras, descricao, preco_venda, preco_custo, estoque_minimo, categoria, id_fornecedor) VALUES
 ('Ração Premium Adulto', '789100000001', 'Ração premium para cães adultos', 129.90, 85.00, 10, 'Alimentação', (SELECT id_fornecedor FROM fornecedores ORDER BY id_fornecedor LIMIT 1)),
 ('Ração Filhotes', '789100000002', 'Ração para filhotes', 139.90, 90.00, 8, 'Alimentação', (SELECT id_fornecedor FROM fornecedores ORDER BY id_fornecedor LIMIT 1)),
 ('Shampoo Neutro', '789100000003', 'Shampoo pH balanceado', 27.50, 14.00, 5, 'Higiene', (SELECT id_fornecedor FROM fornecedores ORDER BY id_fornecedor LIMIT 1)),
 ('Antipulgas SpotOn', '789100000004', 'Tratamento antipulgas mensal', 89.00, 50.00, 4, 'Medicamentos', (SELECT id_fornecedor FROM fornecedores ORDER BY id_fornecedor LIMIT 2,1)),
 ('Brinquedo Corda', '789100000005', 'Brinquedo para interação e mordida', 35.00, 18.00, 3, 'Acessórios', (SELECT id_fornecedor FROM fornecedores ORDER BY id_fornecedor LIMIT 1)),
 ('Petiscos Naturais', '789100000006', 'Petiscos desidratados naturais', 24.90, 12.00, 6, 'Alimentação', (SELECT id_fornecedor FROM fornecedores ORDER BY id_fornecedor LIMIT 2,1))
ON DUPLICATE KEY UPDATE preco_venda=VALUES(preco_venda);

-- Estoque inicial
INSERT INTO estoque (id_produto, lote, quantidade, data_vencimento)
SELECT id_produto, 'L1', CASE codigo_barras
    WHEN '789100000001' THEN 40
    WHEN '789100000002' THEN 25
    WHEN '789100000003' THEN 60
    WHEN '789100000004' THEN 15
    WHEN '789100000005' THEN 50
    WHEN '789100000006' THEN 70
END, DATE_ADD(CURDATE(), INTERVAL 180 DAY)
FROM produtos p
WHERE NOT EXISTS (SELECT 1 FROM estoque e WHERE e.id_produto = p.id_produto);

-- Venda exemplo usando procedure
SET @itens = JSON_ARRAY(
  JSON_OBJECT('id_produto', (SELECT id_produto FROM produtos WHERE codigo_barras='789100000001'), 'qtd', 2, 'preco', 129.90),
  JSON_OBJECT('id_produto', (SELECT id_produto FROM produtos WHERE codigo_barras='789100000003'), 'qtd', 1, 'preco', 27.50)
);
CALL registrar_venda(
  (SELECT id_cliente FROM clientes WHERE cpf='123.456.789-10'),
  (SELECT id_funcionario FROM funcionarios WHERE login='admin'),
  @itens,
  10.00,
  @id_venda_out,
  @valor_final_out
);

-- Pagamento da venda
INSERT INTO Pagamentos (id_venda, forma_pagamento, valor_pago, data_pagamento)
SELECT @id_venda_out, 'Cartao', @valor_final_out, NOW();

-- Agendamento exemplo
INSERT INTO agendamentos (data_hora, status, id_servico, id_pet, id_funcionario, observacoes, valor_servico, duracao_estimada)
VALUES (DATE_ADD(NOW(), INTERVAL 1 DAY), 'Agendado', (SELECT id_servico FROM servicos WHERE nome='Banho'), (SELECT id_pet FROM pets WHERE nome='Rex'), (SELECT id_funcionario FROM funcionarios WHERE login='admin'), 'Banho padrão', 60.00, 45);

SELECT 'Banco petshop_empresa_teste criado e populado' AS status;
