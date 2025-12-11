-- V7: Seed de dados mínimos para demonstração e testes


-- Clientes (se vazio)
INSERT INTO clientes (nome, cpf, telefone, email, endereco_cidade, endereco_estado)
SELECT 'João Pereira', '123.456.789-10', '11912341234', 'joao@example.com', 'São Paulo', 'SP'
WHERE NOT EXISTS (SELECT 1 FROM clientes LIMIT 1);

-- Funcionários (se vazio)
INSERT INTO funcionarios (nome, cargo, login, senha)
SELECT 'Maria Souza', 'Vendedor', 'maria', 'senha-hash-aqui'
WHERE NOT EXISTS (SELECT 1 FROM funcionarios LIMIT 1);

-- Fornecedores (se vazio)
INSERT INTO fornecedores (nome, cnpj, telefone)
SELECT 'Fornecedor Demo', '00.000.000/0000-00', '1133334444'
WHERE NOT EXISTS (SELECT 1 FROM fornecedores LIMIT 1);

-- Servicos (se vazio)
INSERT INTO servicos (nome, descricao, preco_base)
SELECT 'Banho', 'Banho completo', 60.00
WHERE NOT EXISTS (SELECT 1 FROM servicos LIMIT 1);

-- Produtos (se vazio)
INSERT INTO produtos (nome, codigo_barras, descricao, preco_venda, preco_custo, estoque_minimo, categoria, id_fornecedor)
SELECT 'Ração Premium', '789100000001', 'Ração para cães', 120.00, 80.00, 10, 'Alimentação', f.id_fornecedor
FROM fornecedores f
ORDER BY f.id_fornecedor
LIMIT 1;

INSERT INTO produtos (nome, codigo_barras, descricao, preco_venda, preco_custo, estoque_minimo, categoria, id_fornecedor)
SELECT 'Shampoo Neutro', '789100000002', 'Shampoo para pets', 25.00, 12.00, 5, 'Higiene', f.id_fornecedor
FROM fornecedores f
ORDER BY f.id_fornecedor
LIMIT 1;

-- Estoque (se não existir para os produtos acima)
INSERT INTO estoque (id_produto, lote, quantidade)
SELECT p.id_produto, 'L1', 50 FROM produtos p WHERE p.codigo_barras='789100000001'
AND NOT EXISTS (SELECT 1 FROM estoque e WHERE e.id_produto = p.id_produto LIMIT 1);

INSERT INTO estoque (id_produto, lote, quantidade)
SELECT p.id_produto, 'L1', 30 FROM produtos p WHERE p.codigo_barras='789100000002'
AND NOT EXISTS (SELECT 1 FROM estoque e WHERE e.id_produto = p.id_produto LIMIT 1);

-- Pets (se vazio)
SET @id_cliente := (SELECT id_cliente FROM clientes ORDER BY id_cliente LIMIT 1);
INSERT INTO pets (nome, especie, raca, id_cliente)
SELECT 'Rex', 'Cão', 'SRD', @id_cliente
WHERE NOT EXISTS (SELECT 1 FROM pets LIMIT 1);

SELECT 'V7 seed demo aplicada' AS status;

