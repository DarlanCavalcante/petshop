-- ============================================================
-- SCRIPT DE MELHORIAS DO BANCO PETSHOP
-- Data: 09/11/2025
-- Melhorias: Críticas e Importantes
-- ============================================================

USE petshop;

-- ============================================================
-- 1. CAMPOS DE AUDITORIA EM TODAS AS TABELAS
-- ============================================================

-- CLIENTES
ALTER TABLE clientes 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN ativo BOOLEAN DEFAULT TRUE;

-- PETS
ALTER TABLE pets 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN ativo BOOLEAN DEFAULT TRUE;

-- FUNCIONARIOS
ALTER TABLE funcionarios 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN ativo BOOLEAN DEFAULT TRUE;

-- FORNECEDORES
ALTER TABLE fornecedores 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN ativo BOOLEAN DEFAULT TRUE;

-- PRODUTOS
ALTER TABLE produtos 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN ativo BOOLEAN DEFAULT TRUE;

-- SERVICOS
ALTER TABLE servicos 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN ativo BOOLEAN DEFAULT TRUE;

-- VENDAS
ALTER TABLE vendas 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- AGENDAMENTOS
ALTER TABLE agendamentos 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- CONSULTAS
ALTER TABLE consultas 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ESTOQUE
ALTER TABLE estoque 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- PRONTUARIO
ALTER TABLE prontuario 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ============================================================
-- 2. CAMPOS ADICIONAIS IMPORTANTES
-- ============================================================

-- CLIENTES - Endereço completo
ALTER TABLE clientes 
ADD COLUMN endereco_numero VARCHAR(10) NULL AFTER endereco_rua,
ADD COLUMN endereco_complemento VARCHAR(100) NULL AFTER endereco_numero,
ADD COLUMN endereco_bairro VARCHAR(100) NULL AFTER endereco_complemento,
ADD COLUMN endereco_cidade VARCHAR(100) NULL AFTER endereco_bairro,
ADD COLUMN endereco_estado CHAR(2) NULL AFTER endereco_cidade;

-- PETS - Informações adicionais
ALTER TABLE pets 
ADD COLUMN sexo ENUM('Macho', 'Fêmea', 'Não informado') DEFAULT 'Não informado' AFTER raca,
ADD COLUMN peso DECIMAL(5,2) NULL COMMENT 'Peso em kg' AFTER sexo,
ADD COLUMN cor VARCHAR(50) NULL AFTER peso,
ADD COLUMN microchip VARCHAR(20) NULL AFTER cor,
ADD COLUMN castrado BOOLEAN DEFAULT FALSE AFTER microchip,
ADD COLUMN observacoes TEXT NULL AFTER castrado;

-- AGENDAMENTOS - Campos úteis
ALTER TABLE agendamentos 
ADD COLUMN observacoes TEXT NULL AFTER id_funcionario,
ADD COLUMN valor_servico DECIMAL(10,2) NULL AFTER observacoes,
ADD COLUMN duracao_estimada INT NULL COMMENT 'Duração em minutos' AFTER valor_servico;

-- VENDAS - Descontos e observações
ALTER TABLE vendas 
ADD COLUMN desconto DECIMAL(10,2) DEFAULT 0 AFTER valor_total,
ADD COLUMN valor_desconto DECIMAL(10,2) DEFAULT 0 AFTER desconto,
ADD COLUMN observacoes TEXT NULL AFTER valor_desconto;

-- PRODUTOS - Código de barras e estoque mínimo
ALTER TABLE produtos 
ADD COLUMN codigo_barras VARCHAR(50) NULL AFTER nome,
ADD COLUMN estoque_minimo INT DEFAULT 0 AFTER preco_custo,
ADD COLUMN categoria VARCHAR(50) NULL AFTER estoque_minimo;

-- ============================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- ============================================================

-- Índices em campos de busca frequente
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
-- 4. CONSTRAINTS DE VALIDAÇÃO
-- ============================================================

-- Garantir valores positivos em preços
ALTER TABLE produtos 
ADD CONSTRAINT chk_produtos_preco_venda CHECK (preco_venda > 0),
ADD CONSTRAINT chk_produtos_preco_custo CHECK (preco_custo >= 0 OR preco_custo IS NULL),
ADD CONSTRAINT chk_produtos_estoque_minimo CHECK (estoque_minimo >= 0);

-- Garantir estoque não negativo
ALTER TABLE estoque 
ADD CONSTRAINT chk_estoque_quantidade CHECK (quantidade >= 0);

-- Garantir valores positivos em vendas
ALTER TABLE vendas 
ADD CONSTRAINT chk_vendas_valor_total CHECK (valor_total >= 0),
ADD CONSTRAINT chk_vendas_desconto CHECK (desconto >= 0),
ADD CONSTRAINT chk_vendas_valor_desconto CHECK (valor_desconto >= 0);

-- Validação básica de email
ALTER TABLE clientes 
ADD CONSTRAINT chk_clientes_email CHECK (email LIKE '%@%');

-- Garantir valores positivos em serviços
ALTER TABLE servicos 
ADD CONSTRAINT chk_servicos_preco CHECK (preco_base >= 0);

-- Garantir valores positivos em itens de venda
ALTER TABLE itens_da_venda 
ADD CONSTRAINT chk_itens_quantidade CHECK (quantidade_vendida > 0),
ADD CONSTRAINT chk_itens_preco CHECK (preco_unitario >= 0);

-- Garantir valores positivos em pagamentos
ALTER TABLE Pagamentos 
ADD CONSTRAINT chk_pagamentos_valor CHECK (valor_pago > 0);

-- ============================================================
-- 5. VIEWS ÚTEIS PARA RELATÓRIOS
-- ============================================================

-- View: Vendas completas com detalhes
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

-- View: Agendamentos de hoje
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

-- View: Produtos com estoque baixo
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

-- View: Clientes ativos com seus pets
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

-- View: Histórico completo de pets
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
-- FIM DO SCRIPT DE MELHORIAS
-- ============================================================

SELECT 'Melhorias aplicadas com sucesso!' as Status;
