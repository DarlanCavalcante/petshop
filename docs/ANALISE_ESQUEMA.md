# ENGENHARIA REVERSA - ESQUEMA DO BANCO DE DADOS PETSHOP

## 📋 Informações Gerais
- **Arquivo Original:** esquema db.mwb
- **Data da Análise:** 09/11/2025
- **Total de Tabelas:** 13
- **SGBD:** MySQL

---

## 🗂️ ESTRUTURA DO BANCO DE DADOS

### 1. **CLIENTES** (Tabela Principal)
Armazena informações dos clientes do petshop.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id_cliente` | INT | PK, AUTO_INCREMENT, NOT NULL | Identificador único |
| `nome` | VARCHAR(100) | NOT NULL | Nome completo |
| `cpf` | VARCHAR(14) | UNIQUE | CPF do cliente |
| `telefone` | VARCHAR(15) | NOT NULL | Telefone de contato |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL | Email |
| `endereco_rua` | VARCHAR(255) | NULL | Endereço |
| `endereco_cep` | VARCHAR(10) | NULL | CEP |

**Índices:**
- PRIMARY KEY (id_cliente)
- UNIQUE (cpf)
- UNIQUE (email)

---

### 2. **PETS**
Informações sobre os animais de estimação dos clientes.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id_pet` | INT | PK, AUTO_INCREMENT, NOT NULL | Identificador único |
| `nome` | VARCHAR(100) | NOT NULL | Nome do pet |
| `especie` | VARCHAR(50) | NOT NULL | Cachorro, gato, etc |
| `raca` | VARCHAR(50) | NULL | Raça do animal |
| `data_nascimento` | DATE | NULL | Data de nascimento |
| `id_cliente` | INT | FK, NOT NULL | Dono do pet |

**Relacionamentos:**
- FK → `clientes.id_cliente` (CASCADE on DELETE/UPDATE)

---

### 3. **FUNCIONARIOS**
Cadastro de funcionários do petshop.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id_funcionario` | INT | PK, AUTO_INCREMENT, NOT NULL | Identificador único |
| `nome` | VARCHAR(100) | NOT NULL | Nome completo |
| `cargo` | VARCHAR(50) | NOT NULL | Cargo/função |
| `login` | VARCHAR(50) | UNIQUE, NOT NULL | Login de acesso |
| `senha` | VARCHAR(255) | NOT NULL | Senha (hash) |

**Índices:**
- UNIQUE (login)

---

### 4. **SERVICOS**
Catálogo de serviços oferecidos (banho, tosa, consulta, etc).

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id_servico` | INT | PK, AUTO_INCREMENT, NOT NULL | Identificador único |
| `nome` | VARCHAR(100) | NOT NULL | Nome do serviço |
| `descricao` | TEXT | NULL | Descrição detalhada |
| `preco_base` | DECIMAL | NOT NULL | Preço base do serviço |

---

### 5. **FORNECEDORES**
Cadastro de fornecedores de produtos.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id_fornecedor` | INT | PK, AUTO_INCREMENT, NOT NULL | Identificador único |
| `nome` | VARCHAR(100) | NOT NULL | Nome/Razão social |
| `cnpj` | VARCHAR(18) | UNIQUE | CNPJ |
| `telefone` | VARCHAR(15) | NULL | Telefone de contato |

**Índices:**
- UNIQUE (cnpj)

---

### 6. **PRODUTOS**
Catálogo de produtos vendidos no petshop.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id_produto` | INT | PK, AUTO_INCREMENT, NOT NULL | Identificador único |
| `nome` | VARCHAR(100) | NOT NULL | Nome do produto |
| `descricao` | TEXT | NULL | Descrição |
| `preco_venda` | DECIMAL | NOT NULL | Preço de venda |
| `preco_custo` | DECIMAL | NULL | Preço de custo |
| `id_fornecedor` | INT | FK, NULL | Fornecedor |

**Relacionamentos:**
- FK → `fornecedores.id_fornecedor` (SET NULL on DELETE)

---

### 7. **ESTOQUE**
Controle de estoque de produtos.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id_estoque` | INT | PK, AUTO_INCREMENT, NOT NULL | Identificador único |
| `id_produto` | INT | FK, NULL | Produto |
| `lote` | VARCHAR(50) | NULL | Número do lote |
| `quantidade` | INT | NOT NULL | Quantidade em estoque |
| `data_vencimento` | DATE | NULL | Data de vencimento |

**Relacionamentos:**
- FK → `produtos.id_produto` (CASCADE on DELETE/UPDATE)

---

### 8. **PRONTUARIO**
Histórico médico dos pets.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id_prontuario` | INT | PK, AUTO_INCREMENT, NOT NULL | Identificador único |
| `id_pet` | INT | FK, UNIQUE, NULL | Pet relacionado |
| `historico_medico` | TEXT | NULL | Histórico médico |
| `alergias` | TEXT | NULL | Alergias conhecidas |

**Relacionamentos:**
- FK → `pets.id_pet` (CASCADE on DELETE/UPDATE)
- Relação 1:1 com pets (id_pet UNIQUE)

---

### 9. **AGENDAMENTOS**
Agendamento de serviços/consultas.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id_agendamento` | INT | PK, AUTO_INCREMENT, NOT NULL | Identificador único |
| `data_hora` | DATETIME | NOT NULL | Data e hora do agendamento |
| `status` | ENUM | NOT NULL | Status do agendamento |
| `id_pet` | INT | FK, NULL | Pet |
| `id_funcionario` | INT | FK, NULL | Funcionário responsável |

**Valores do ENUM status:**
- Agendado
- Confirmado
- Cancelado
- Concluído

**Relacionamentos:**
- FK → `pets.id_pet` (CASCADE on DELETE/UPDATE)
- FK → `funcionarios.id_funcionario` (SET NULL on DELETE)

---

### 10. **CONSULTAS**
Detalhes das consultas veterinárias.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id_consulta` | INT | PK, AUTO_INCREMENT, NOT NULL | Identificador único |
| `id_agendamento` | INT | FK, UNIQUE, NULL | Agendamento relacionado |
| `diagnostico` | TEXT | NOT NULL | Diagnóstico |
| `prescricao_medica` | TEXT | NULL | Prescrição médica |

**Relacionamentos:**
- FK → `agendamentos.id_agendamento` (CASCADE on DELETE/UPDATE)
- Relação 1:1 com agendamentos

---

### 11. **VENDAS**
Registro de vendas realizadas.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id_venda` | INT | PK, AUTO_INCREMENT, NOT NULL | Identificador único |
| `data_hora_venda` | DATETIME | NOT NULL | Data/hora da venda |
| `id_cliente` | INT | FK, NULL | Cliente |
| `id_funcionario` | INT | FK, NULL | Vendedor |
| `valor_total` | DECIMAL | NOT NULL | Valor total da venda |

**Relacionamentos:**
- FK → `clientes.id_cliente` (SET NULL on DELETE)
- FK → `funcionarios.id_funcionario` (SET NULL on DELETE)

---

### 12. **ITENS_DA_VENDA**
Itens individuais de cada venda.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id_venda` | INT | PK, FK, NOT NULL | Venda |
| `id_produto` | INT | PK, FK, NOT NULL | Produto vendido |
| `quantidade_vendida` | INT | NOT NULL | Quantidade |
| `preco_unitario` | DECIMAL | NOT NULL | Preço unitário |

**Chave Primária Composta:** (id_venda, id_produto)

**Relacionamentos:**
- FK → `vendas.id_venda` (CASCADE on DELETE/UPDATE)
- FK → `produtos.id_produto` (CASCADE on DELETE/UPDATE)

---

### 13. **PAGAMENTOS**
Registro de pagamentos das vendas.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id_Pagamentos` | INT | PK, AUTO_INCREMENT, NOT NULL | Identificador único |
| `id_venda` | INT | FK, NULL | Venda relacionada |
| `forma_pagamento` | VARCHAR(50) | NOT NULL | Dinheiro, cartão, etc |
| `valor_pago` | DECIMAL | NOT NULL | Valor pago |
| `data_pagamento` | DATETIME | NOT NULL | Data/hora do pagamento |

**Relacionamentos:**
- FK → `vendas.id_venda` (CASCADE on DELETE/UPDATE)

---

## 🔗 DIAGRAMA DE RELACIONAMENTOS

```
clientes (1) ─────< (N) pets (1) ────── (1) prontuario
    │                   │
    │                   └────< (N) agendamentos (1) ────── (1) consultas
    │                               │
    │                               └───> (1) funcionarios
    │
    └───< (N) vendas >───< (N) itens_da_venda >───< (N) produtos
            │                                            │
            │                                            └───> (1) fornecedores
            │                                                       │
            └───< (N) Pagamentos                                   │
                                                                   │
            funcionarios ────────────────────────────────────────────┘
                                                                   
                        produtos (1) ─────< (N) estoque
```

---

## 📊 ANÁLISE E OBSERVAÇÕES

### ✅ Pontos Fortes:
1. **Normalização adequada** - Estrutura bem normalizada, evitando redundância
2. **Integridade referencial** - Uso correto de foreign keys
3. **Índices únicos** - CPF, CNPJ, email com UNIQUE constraints
4. **Relações bem definidas** - Relacionamentos claros entre entidades
5. **Controle de estoque** - Sistema de lotes e vencimento

### ⚠️ Observações:
1. **Senha em texto?** - Verificar se há hash/criptografia implementada
2. **data_hora_venda** - Tipo definido como DECIMAL, deveria ser DATETIME
3. **Status de agendamento** - ENUM é bom, mas valores podem estar diferentes
4. **Auditoria** - Faltam campos de created_at/updated_at em algumas tabelas
5. **Soft delete** - Considerar adicionar campos deleted_at para não perder histórico

### 💡 Sugestões de Melhoria:
1. Adicionar campos de auditoria (created_at, updated_at, deleted_at)
2. Criar tabela de log de alterações
3. Adicionar campo "observacoes" em agendamentos
4. Criar tabela separada para endereços (normalização)
5. Adicionar campo "valor_desconto" em vendas
6. Criar tabela de histórico de preços de produtos

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Criar banco de dados MySQL
2. ✅ Executar script SQL de criação
3. ⬜ Inserir dados de teste
4. ⬜ Criar views para relatórios
5. ⬜ Implementar triggers para controle de estoque
6. ⬜ Criar stored procedures para operações complexas

---

**Gerado por:** GitHub Copilot - Engenharia Reversa Automatizada
**Data:** 09/11/2025
