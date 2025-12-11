-- Migration V13: Sistema de Pacotes (Combos e Cr�ditos)

-- Tabela de pacotes
CREATE TABLE pacotes (
    id_pacote INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    tipo ENUM('combo', 'creditos') NOT NULL DEFAULT 'combo',
    preco_base DECIMAL(10,2) NOT NULL,
    validade_dias INT NULL, -- Apenas para tipo creditos. NULL = sem validade
    max_usos INT NULL, -- Apenas para tipo creditos. Quantos servi�os pode usar
    ativo TINYINT(1) DEFAULT 1,
    data_criacao TIMESTAMP DEFAULT NOW(),
    data_atualizacao TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_pacotes_preco CHECK (preco_base > 0),
    CONSTRAINT chk_pacotes_validade CHECK (
        (tipo = 'combo' AND validade_dias IS NULL AND max_usos IS NULL) OR
        (tipo = 'creditos' AND validade_dias > 0 AND max_usos > 0)
    )
);

-- Tabela de relacionamento pacotes-servi�os
CREATE TABLE pacotes_servicos (
    id_pacote_servico INT AUTO_INCREMENT PRIMARY KEY,
    id_pacote INT NOT NULL,
    id_servico INT NOT NULL,
    quantidade INT DEFAULT 1, -- Quantas vezes este servi�o est� inclu�do no pacote
    FOREIGN KEY (id_pacote) REFERENCES pacotes(id_pacote) ON DELETE CASCADE,
    FOREIGN KEY (id_servico) REFERENCES servicos(id_servico) ON DELETE CASCADE,
    CONSTRAINT uk_pacote_servico UNIQUE (id_pacote, id_servico)
);

-- Tabela de pacotes comprados por clientes
CREATE TABLE clientes_pacotes (
    id_cliente_pacote INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_pacote INT NOT NULL,
    data_compra TIMESTAMP DEFAULT NOW(),
    data_validade DATE NULL, -- Calculado a partir de data_compra + validade_dias do pacote
    usos_restantes INT NULL, -- Para tipo creditos. Decresce a cada uso
    status ENUM('ativo', 'usado', 'expirado', 'cancelado') DEFAULT 'ativo',
    valor_pago DECIMAL(10,2) NOT NULL, -- Valor que o cliente pagou (pode ter desconto)
    observacoes TEXT,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (id_pacote) REFERENCES pacotes(id_pacote),
    INDEX idx_cliente_status (id_cliente, status),
    INDEX idx_data_validade (data_validade),
    CONSTRAINT chk_usos_restantes CHECK (usos_restantes IS NULL OR usos_restantes >= 0)
);

-- Tabela de hist�rico de uso de pacotes
CREATE TABLE clientes_pacotes_uso (
    id_uso INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente_pacote INT NOT NULL,
    id_agendamento INT NULL, -- Agendamento que consumiu o uso
    id_servico INT NULL, -- Servi�o espec�fico usado
    data_uso TIMESTAMP DEFAULT NOW(),
    observacoes TEXT,
    FOREIGN KEY (id_cliente_pacote) REFERENCES clientes_pacotes(id_cliente_pacote) ON DELETE CASCADE,
    FOREIGN KEY (id_agendamento) REFERENCES agendamentos(id_agendamento) ON DELETE SET NULL,
    FOREIGN KEY (id_servico) REFERENCES servicos(id_servico) ON DELETE SET NULL,
    INDEX idx_cliente_pacote (id_cliente_pacote),
    INDEX idx_data_uso (data_uso)
);

-- �ndices para performance
CREATE INDEX idx_pacotes_tipo ON pacotes(tipo);
CREATE INDEX idx_pacotes_ativo ON pacotes(ativo);
CREATE INDEX idx_pacotes_servicos_pacote ON pacotes_servicos(id_pacote);
CREATE INDEX idx_pacotes_servicos_servico ON pacotes_servicos(id_servico);

