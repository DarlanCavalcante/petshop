# 📋 ANÁLISE E SUGESTÕES DE MELHORIAS - BANCO PETSHOP

## Status Atual: ✅ Funcional, mas pode melhorar

---

## 🚨 MELHORIAS CRÍTICAS (Altamente Recomendadas)

### 1. **Campos de Auditoria** (MUITO IMPORTANTE)

**Problema:** Não há rastreamento de quando os registros foram criados/modificados.

**Solução:**
```sql
-- Adicionar em TODAS as tabelas
ALTER TABLE clientes 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Repetir para: pets, funcionarios, fornecedores, produtos, 
-- servicos, vendas, agendamentos, consultas, estoque, prontuario
```

**Benefícios:**
- Rastreamento de criação
- Controle de alterações
- Auditoria e compliance
- Debugging facilitado

---

### 2. **Soft Delete** (Não perder histórico)

**Problema:** Ao deletar registros, você perde o histórico completamente.

**Solução:**
```sql
-- Adicionar em tabelas críticas
ALTER TABLE clientes ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE pets ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE vendas ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE produtos ADD COLUMN deleted_at TIMESTAMP NULL;

-- Criar índice para performance
CREATE INDEX idx_deleted_at ON clientes(deleted_at);
```

**Como usar:**
```sql
-- Em vez de deletar
DELETE FROM clientes WHERE id_cliente = 1;

-- Fazer soft delete
UPDATE clientes SET deleted_at = NOW() WHERE id_cliente = 1;

-- Buscar apenas ativos
SELECT * FROM clientes WHERE deleted_at IS NULL;
```

---

### 3. **Senha com Hash** (SEGURANÇA!)

**Problema:** Senha em VARCHAR(255) pode estar em texto plano.

**Solução:**
```sql
-- NUNCA armazene senhas em texto plano!
-- Use bcrypt, argon2 ou SHA256

-- Exemplo de como deve ser:
-- Antes de inserir: hash = bcrypt('senha123', 10)
INSERT INTO funcionarios (nome, cargo, login, senha) 
VALUES ('João', 'Veterinário', 'joao', '$2y$10$...' -- hash bcrypt
);
```

---

### 4. **Campos Faltantes Importantes**

#### **Tabela CLIENTES:**
```sql
ALTER TABLE clientes 
ADD COLUMN endereco_numero VARCHAR(10) NULL AFTER endereco_rua,
ADD COLUMN endereco_complemento VARCHAR(100) NULL AFTER endereco_numero,
ADD COLUMN endereco_bairro VARCHAR(100) NULL AFTER endereco_complemento,
ADD COLUMN endereco_cidade VARCHAR(100) NULL AFTER endereco_bairro,
ADD COLUMN endereco_estado CHAR(2) NULL AFTER endereco_cidade,
ADD COLUMN data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
```

#### **Tabela PETS:**
```sql
ALTER TABLE pets 
ADD COLUMN sexo ENUM('Macho', 'Fêmea', 'Não informado') DEFAULT 'Não informado',
ADD COLUMN peso DECIMAL(5,2) NULL COMMENT 'Peso em kg',
ADD COLUMN cor VARCHAR(50) NULL,
ADD COLUMN microchip VARCHAR(20) NULL,
ADD COLUMN castrado BOOLEAN DEFAULT FALSE,
ADD COLUMN observacoes TEXT NULL;
```

#### **Tabela AGENDAMENTOS:**
```sql
ALTER TABLE agendamentos 
ADD COLUMN observacoes TEXT NULL,
ADD COLUMN valor_servico DECIMAL(10,2) NULL,
ADD COLUMN duracao_estimada INT NULL COMMENT 'Duração em minutos';
```

#### **Tabela VENDAS:**
```sql
ALTER TABLE vendas 
ADD COLUMN desconto DECIMAL(10,2) DEFAULT 0,
ADD COLUMN valor_desconto DECIMAL(10,2) DEFAULT 0,
ADD COLUMN observacoes TEXT NULL;
```

#### **Tabela PRODUTOS:**
```sql
ALTER TABLE produtos 
ADD COLUMN codigo_barras VARCHAR(50) NULL,
ADD COLUMN estoque_minimo INT DEFAULT 0,
ADD COLUMN ativo BOOLEAN DEFAULT TRUE,
ADD COLUMN categoria VARCHAR(50) NULL;
```

---

## ⚡ MELHORIAS DE PERFORMANCE

### 5. **Índices Adicionais**

```sql
-- Buscas frequentes
CREATE INDEX idx_clientes_cpf ON clientes(cpf);
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_pets_nome ON pets(nome);
CREATE INDEX idx_agendamentos_data ON agendamentos(data_hora);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);
CREATE INDEX idx_vendas_data ON vendas(data_hora_venda);
CREATE INDEX idx_produtos_nome ON produtos(nome);

-- Índice composto para queries comuns
CREATE INDEX idx_agendamentos_data_status ON agendamentos(data_hora, status);
```

---

## 🔒 MELHORIAS DE SEGURANÇA

### 6. **Constraints e Validações**

```sql
-- Garantir valores positivos
ALTER TABLE produtos 
ADD CONSTRAINT chk_preco_venda_positivo CHECK (preco_venda > 0),
ADD CONSTRAINT chk_preco_custo_positivo CHECK (preco_custo >= 0);

ALTER TABLE estoque 
ADD CONSTRAINT chk_quantidade_positiva CHECK (quantidade >= 0);

ALTER TABLE vendas 
ADD CONSTRAINT chk_valor_total_positivo CHECK (valor_total > 0);

-- Email válido (básico)
ALTER TABLE clientes 
ADD CONSTRAINT chk_email_valido CHECK (email LIKE '%@%');

-- CPF com 11 ou 14 caracteres (com formatação)
ALTER TABLE clientes 
ADD CONSTRAINT chk_cpf_tamanho CHECK (LENGTH(cpf) IN (11, 14) OR cpf IS NULL);
```

---

## 📊 MELHORIAS DE FUNCIONALIDADE

### 7. **Tabelas Adicionais Úteis**

#### **Histórico de Preços**
```sql
CREATE TABLE historico_precos (
    id_historico INT AUTO_INCREMENT PRIMARY KEY,
    id_produto INT NOT NULL,
    preco_venda_anterior DECIMAL(10,2),
    preco_venda_novo DECIMAL(10,2),
    data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_funcionario INT,
    FOREIGN KEY (id_produto) REFERENCES produtos(id_produto) ON DELETE CASCADE,
    FOREIGN KEY (id_funcionario) REFERENCES funcionarios(id_funcionario) ON DELETE SET NULL
);
```

#### **Log de Atividades**
```sql
CREATE TABLE log_atividades (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    tabela VARCHAR(50),
    acao ENUM('INSERT', 'UPDATE', 'DELETE'),
    id_registro INT,
    id_funcionario INT,
    dados_antigos JSON,
    dados_novos JSON,
    ip_address VARCHAR(45),
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_funcionario) REFERENCES funcionarios(id_funcionario) ON DELETE SET NULL
);
```

#### **Categoria de Produtos**
```sql
CREATE TABLE categorias_produtos (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar FK em produtos
ALTER TABLE produtos 
ADD COLUMN id_categoria INT NULL,
ADD FOREIGN KEY (id_categoria) REFERENCES categorias_produtos(id_categoria) ON DELETE SET NULL;
```

---

## 🎯 TRIGGERS ÚTEIS

### 8. **Automatizações**

#### **Atualizar estoque automaticamente**
```sql
DELIMITER $$

CREATE TRIGGER trg_after_venda_diminui_estoque
AFTER INSERT ON itens_da_venda
FOR EACH ROW
BEGIN
    UPDATE estoque 
    SET quantidade = quantidade - NEW.quantidade_vendida
    WHERE id_produto = NEW.id_produto;
END$$

DELIMITER ;
```

#### **Calcular valor total da venda**
```sql
DELIMITER $$

CREATE TRIGGER trg_after_item_atualiza_total
AFTER INSERT ON itens_da_venda
FOR EACH ROW
BEGIN
    UPDATE vendas 
    SET valor_total = (
        SELECT SUM(quantidade_vendida * preco_unitario)
        FROM itens_da_venda
        WHERE id_venda = NEW.id_venda
    )
    WHERE id_venda = NEW.id_venda;
END$$

DELIMITER ;
```

---

## 📈 VIEWS ÚTEIS

### 9. **Relatórios Prontos**

```sql
-- Visão de vendas com detalhes
CREATE VIEW vw_vendas_completas AS
SELECT 
    v.id_venda,
    v.data_hora_venda,
    c.nome as cliente,
    f.nome as vendedor,
    v.valor_total,
    COUNT(iv.id_produto) as total_itens
FROM vendas v
LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
LEFT JOIN funcionarios f ON v.id_funcionario = f.id_funcionario
LEFT JOIN itens_da_venda iv ON v.id_venda = iv.id_venda
GROUP BY v.id_venda;

-- Visão de agendamentos do dia
CREATE VIEW vw_agendamentos_hoje AS
SELECT 
    a.id_agendamento,
    a.data_hora,
    a.status,
    p.nome as pet,
    c.nome as cliente,
    c.telefone,
    s.nome as servico,
    f.nome as funcionario
FROM agendamentos a
JOIN pets p ON a.id_pet = p.id_pet
JOIN clientes c ON p.id_cliente = c.id_cliente
LEFT JOIN servicos s ON a.id_servico = s.id_servico
LEFT JOIN funcionarios f ON a.id_funcionario = f.id_funcionario
WHERE DATE(a.data_hora) = CURDATE();

-- Produtos com estoque baixo
CREATE VIEW vw_produtos_estoque_baixo AS
SELECT 
    p.id_produto,
    p.nome,
    SUM(e.quantidade) as quantidade_total,
    p.estoque_minimo
FROM produtos p
LEFT JOIN estoque e ON p.id_produto = e.id_produto
GROUP BY p.id_produto
HAVING quantidade_total < p.estoque_minimo OR quantidade_total IS NULL;
```

---

## 📝 PRIORIZAÇÃO DAS MELHORIAS

### 🔴 **URGENTE** (Implementar AGORA):
1. ✅ Campos de auditoria (created_at, updated_at)
2. ✅ Hash nas senhas
3. ✅ Constraints de valores positivos
4. ✅ Campo `ativo` em clientes/produtos

### 🟡 **IMPORTANTE** (Próxima sprint):
5. ✅ Soft delete
6. ✅ Campos adicionais (endereço completo, peso do pet, etc)
7. ✅ Índices de performance
8. ✅ Campo observações em agendamentos

### 🟢 **DESEJÁVEL** (Quando possível):
9. ✅ Tabelas de log/histórico
10. ✅ Triggers automáticos
11. ✅ Views de relatórios
12. ✅ Categoria de produtos

---

## 💡 MINHA RECOMENDAÇÃO

Execute este script para as melhorias essenciais:

```sql
-- SCRIPT DE MELHORIAS ESSENCIAIS
USE petshop;

-- 1. Campos de auditoria em todas as tabelas
ALTER TABLE clientes 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN ativo BOOLEAN DEFAULT TRUE;

-- (Repetir para outras tabelas principais)

-- 2. Melhorias em PETS
ALTER TABLE pets 
ADD COLUMN sexo ENUM('Macho', 'Fêmea') NULL,
ADD COLUMN peso DECIMAL(5,2) NULL,
ADD COLUMN castrado BOOLEAN DEFAULT FALSE;

-- 3. Índices de performance
CREATE INDEX idx_agendamentos_data_status ON agendamentos(data_hora, status);
CREATE INDEX idx_vendas_data ON vendas(data_hora_venda);

-- 4. Constraints
ALTER TABLE produtos 
ADD CONSTRAINT chk_preco_positivo CHECK (preco_venda > 0);
```

---

## ❓ Quer que eu implemente alguma dessas melhorias agora?

Posso gerar o script SQL completo para as melhorias que você escolher!
