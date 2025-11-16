-- ============================================================
-- ENGENHARIA REVERSA DO ESQUEMA DO BANCO DE DADOS
-- Arquivo original: esquema db.mwb
-- Data: 2025-11-09
-- ============================================================

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS petshop;
USE petshop;

-- ============================================================
-- TABELA: clientes
-- ============================================================
CREATE TABLE clientes (
    id_cliente INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) NULL,
    telefone VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL,
    endereco_rua VARCHAR(255) NULL,
    endereco_cep VARCHAR(10) NULL,
    PRIMARY KEY (id_cliente),
    UNIQUE KEY cpf_UNIQUE (cpf),
    UNIQUE KEY email_UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABELA: pets
-- ============================================================
CREATE TABLE pets (
    id_pet INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    raca VARCHAR(50) NULL,
    data_nascimento DATE NULL,
    id_cliente INT NOT NULL,
    PRIMARY KEY (id_pet),
    KEY idx_cliente (id_cliente),
    CONSTRAINT fk_pets_clientes FOREIGN KEY (id_cliente) 
        REFERENCES clientes (id_cliente)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABELA: funcionarios
-- ============================================================
CREATE TABLE funcionarios (
    id_funcionario INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    cargo VARCHAR(50) NOT NULL,
    login VARCHAR(50) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    PRIMARY KEY (id_funcionario),
    UNIQUE KEY login_UNIQUE (login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABELA: servicos
-- ============================================================
CREATE TABLE servicos (
    id_servico INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NULL,
    preco_base DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id_servico)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABELA: fornecedores
-- ============================================================
CREATE TABLE fornecedores (
    id_fornecedor INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    cnpj VARCHAR(18) NULL,
    telefone VARCHAR(15) NULL,
    PRIMARY KEY (id_fornecedor),
    UNIQUE KEY cnpj_UNIQUE (cnpj)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABELA: produtos
-- ============================================================
CREATE TABLE produtos (
    id_produto INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NULL,
    preco_venda DECIMAL(10,2) NOT NULL,
    preco_custo DECIMAL(10,2) NULL,
    id_fornecedor INT NULL,
    PRIMARY KEY (id_produto),
    KEY idx_fornecedor (id_fornecedor),
    CONSTRAINT fk_produtos_fornecedores FOREIGN KEY (id_fornecedor) 
        REFERENCES fornecedores (id_fornecedor)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABELA: estoque
-- ============================================================
CREATE TABLE estoque (
    id_estoque INT NOT NULL AUTO_INCREMENT,
    id_produto INT NULL,
    lote VARCHAR(50) NULL,
    quantidade INT NOT NULL DEFAULT 0,
    data_vencimento DATE NULL,
    PRIMARY KEY (id_estoque),
    KEY idx_produto (id_produto),
    CONSTRAINT fk_estoque_produtos FOREIGN KEY (id_produto) 
        REFERENCES produtos (id_produto)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABELA: prontuario
-- ============================================================
CREATE TABLE prontuario (
    id_prontuario INT NOT NULL AUTO_INCREMENT,
    id_pet INT NULL,
    historico_medico TEXT NULL,
    alergias TEXT NULL,
    PRIMARY KEY (id_prontuario),
    UNIQUE KEY id_pet_UNIQUE (id_pet),
    CONSTRAINT fk_prontuario_pets FOREIGN KEY (id_pet) 
        REFERENCES pets (id_pet)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABELA: agendamentos
-- ============================================================
CREATE TABLE agendamentos (
    id_agendamento INT NOT NULL AUTO_INCREMENT,
    data_hora DATETIME NOT NULL,
    status ENUM('Agendado', 'Confirmado', 'Cancelado', 'Concluído') NOT NULL DEFAULT 'Agendado',
    id_pet INT NULL,
    id_funcionario INT NULL,
    PRIMARY KEY (id_agendamento),
    KEY idx_pet (id_pet),
    KEY idx_funcionario (id_funcionario),
    CONSTRAINT fk_agendamentos_pets FOREIGN KEY (id_pet) 
        REFERENCES pets (id_pet)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_agendamentos_funcionarios FOREIGN KEY (id_funcionario) 
        REFERENCES funcionarios (id_funcionario)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABELA: consultas
-- ============================================================
CREATE TABLE consultas (
    id_consulta INT NOT NULL AUTO_INCREMENT,
    id_agendamento INT NULL,
    diagnostico TEXT NOT NULL,
    prescricao_medica TEXT NULL,
    PRIMARY KEY (id_consulta),
    UNIQUE KEY id_agendamento_UNIQUE (id_agendamento),
    CONSTRAINT fk_consultas_agendamentos FOREIGN KEY (id_agendamento) 
        REFERENCES agendamentos (id_agendamento)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABELA: vendas
-- ============================================================
CREATE TABLE vendas (
    id_venda INT NOT NULL AUTO_INCREMENT,
    data_hora_venda DATETIME NOT NULL,
    id_cliente INT NULL,
    id_funcionario INT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id_venda),
    KEY idx_cliente (id_cliente),
    KEY idx_funcionario (id_funcionario),
    CONSTRAINT fk_vendas_clientes FOREIGN KEY (id_cliente) 
        REFERENCES clientes (id_cliente)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_vendas_funcionarios FOREIGN KEY (id_funcionario) 
        REFERENCES funcionarios (id_funcionario)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABELA: itens_da_venda
-- ============================================================
CREATE TABLE itens_da_venda (
    id_venda INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade_vendida INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id_venda, id_produto),
    KEY idx_produto (id_produto),
    CONSTRAINT fk_itens_vendas FOREIGN KEY (id_venda) 
        REFERENCES vendas (id_venda)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_itens_produtos FOREIGN KEY (id_produto) 
        REFERENCES produtos (id_produto)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABELA: Pagamentos
-- ============================================================
CREATE TABLE Pagamentos (
    id_Pagamentos INT NOT NULL AUTO_INCREMENT,
    id_venda INT NULL,
    forma_pagamento VARCHAR(50) NOT NULL,
    valor_pago DECIMAL(10,2) NOT NULL,
    data_pagamento DATETIME NOT NULL,
    PRIMARY KEY (id_Pagamentos),
    KEY idx_venda (id_venda),
    CONSTRAINT fk_pagamentos_vendas FOREIGN KEY (id_venda) 
        REFERENCES vendas (id_venda)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
