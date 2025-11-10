USE petshop;

-- Teste da procedure registrar_entrada_estoque
SET @id_produto := (SELECT id_produto FROM produtos ORDER BY id_produto LIMIT 1);
SET @id_func := (SELECT id_funcionario FROM funcionarios ORDER BY id_funcionario LIMIT 1);

CALL registrar_entrada_estoque(
    @id_produto,
    'LOTE-TESTE-001',
    100,
    DATE_ADD(CURDATE(), INTERVAL 6 MONTH),
    'Entrada',
    'Compra inicial de teste',
    @id_func,
    @id_estoque_new,
    @qtd_nova
);

SELECT 'Entrada registrada' AS msg, @id_estoque_new AS id_estoque, @qtd_nova AS quantidade_nova;

-- Verifica movimentação criada
SELECT * FROM estoque_movimentacoes WHERE tipo = 'Entrada' ORDER BY id_movimentacao DESC LIMIT 1;

-- Testa KPIs
SELECT '=== Top 5 Produtos Mais Vendidos ===' AS dashboard;
SELECT produto_nome, quantidade_total_vendida, receita_gerada, status_estoque 
FROM vw_produtos_mais_vendidos 
LIMIT 5;

SELECT '=== Vendas por Funcionário ===' AS dashboard;
SELECT funcionario_nome, total_vendas, receita_total, ticket_medio 
FROM vw_vendas_por_funcionario 
LIMIT 5;

SELECT '=== Receita Últimos 7 Dias ===' AS dashboard;
SELECT data, num_vendas, receita_liquida, ticket_medio 
FROM vw_receita_diaria 
ORDER BY data DESC 
LIMIT 7;

SELECT '=== Top 3 Clientes ===' AS dashboard;
SELECT cliente_nome, num_compras, receita_gerada, dias_sem_comprar 
FROM vw_top_clientes 
LIMIT 3;

-- Testa constraint: tentativa de deletar produto com vendas
SELECT '=== Teste Constraint: Delete Produto com Vendas ===' AS teste;
SET @prod_vendido := (
    SELECT DISTINCT id_produto FROM itens_da_venda LIMIT 1
);
DELETE FROM produtos WHERE id_produto = @prod_vendido;

SELECT 'fim' AS fim;
