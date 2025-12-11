-- Teste E2E: Seed + Agendamento + Venda + Movimentação de Estoque
USE petshop;
SET @@session.time_zone = '+00:00';

-- Limpeza mínima (mantém estrutura)
DELETE FROM itens_da_venda;
DELETE FROM Pagamentos;
DELETE FROM vendas;
DELETE FROM consultas;
DELETE FROM agendamentos;
DELETE FROM prontuario;
DELETE FROM estoque;
DELETE FROM produtos;
DELETE FROM servicos;
DELETE FROM pets;
DELETE FROM clientes;
DELETE FROM funcionarios;
DELETE FROM fornecedores;

-- Seed básico
INSERT INTO fornecedores(id_fornecedor, nome, cnpj, telefone) VALUES (1,'Fornecedor Central','12.345.678/0001-90','11999990000');
INSERT INTO funcionarios(id_funcionario, nome, cargo, login, senha) VALUES (1,'Carlos Silva','Atendente','carlos','hash_senha');
INSERT INTO clientes(id_cliente, nome, cpf, telefone, email) VALUES (1,'João Pereira','123.456.789-10','11912341234','joao@example.com');
INSERT INTO servicos(nome, descricao, preco_base) VALUES ('Banho','Banho completo',50.00), ('Tosa','Tosa padrão',70.00);
INSERT INTO produtos(nome, descricao, preco_venda, preco_custo, id_fornecedor, codigo_barras, estoque_minimo, categoria) VALUES
  ('Ração Premium','Ração adultos',120.00,80.00,(SELECT id_fornecedor FROM fornecedores LIMIT 1),'7894900011111',10,'Alimentos'),
  ('Brinquedo Bola','Bola para pets',25.00,10.00,(SELECT id_fornecedor FROM fornecedores LIMIT 1),'7894900012222',5,'Brinquedos');

INSERT INTO pets(nome, especie, raca, data_nascimento, id_cliente, sexo) VALUES ('Rex','Cão','SRD','2023-01-10',(SELECT id_cliente FROM clientes LIMIT 1),'Macho');
INSERT INTO prontuario(id_pet, historico_medico, alergias) VALUES ((SELECT id_pet FROM pets LIMIT 1),'Saudável','Nenhuma');

-- Entrada de estoque (simples: insere lotes)
INSERT INTO estoque(id_produto, lote, quantidade, data_vencimento) VALUES
  ((SELECT id_produto FROM produtos WHERE nome='Ração Premium' LIMIT 1),'L1',50,'2026-01-01'),
  ((SELECT id_produto FROM produtos WHERE nome='Brinquedo Bola' LIMIT 1),'L2',30,'2025-07-01');

-- Agendamento de serviço (usar procedure)
CALL agendar_servico((SELECT id_pet FROM pets LIMIT 1), (SELECT id_servico FROM servicos WHERE nome='Banho' LIMIT 1), (SELECT id_funcionario FROM funcionarios LIMIT 1), '2025-11-10 10:00:00', 60, 'Agendar banho', @id_ag);
SELECT 'Agendamento criado', @id_ag AS id_agendamento;



-- Registrar venda com JSON itens (Ração 2un, Brinquedo 1un)
SET @itens = JSON_ARRAY(
  JSON_OBJECT('id_produto', (SELECT id_produto FROM produtos WHERE nome='Ração Premium' LIMIT 1),'qtd',2,'preco',120.00),
  JSON_OBJECT('id_produto', (SELECT id_produto FROM produtos WHERE nome='Brinquedo Bola' LIMIT 1),'qtd',1,'preco',25.00)
);
CALL registrar_venda(1, 1, @itens, 10.00, @id_venda, @valor_final);
SELECT 'Venda registrada', @id_venda AS id_venda, @valor_final AS valor_final;

-- Verificar itens da venda
SELECT * FROM itens_da_venda WHERE id_venda=@id_venda;

-- Verificar baixa de estoque
SELECT id_produto, quantidade FROM estoque ORDER BY id_produto;

-- Criar pagamento da venda
INSERT INTO Pagamentos(id_venda, forma_pagamento, valor_pago, data_pagamento) VALUES (@id_venda,'Cartao', @valor_final, NOW());
SELECT * FROM Pagamentos WHERE id_venda=@id_venda;

-- Views privadas
SELECT * FROM vw_clientes_privado LIMIT 5;
SELECT * FROM vw_pets_privado LIMIT 5;
SELECT * FROM vw_vendas_anon LIMIT 5;
SELECT * FROM vw_agenda_privada LIMIT 5;

-- Consistência: valor_desconto <= valor_total
SELECT id_venda, valor_total, valor_desconto FROM vendas WHERE valor_desconto > valor_total;

-- Fim
SELECT 'Teste E2E concluído' AS fim;
