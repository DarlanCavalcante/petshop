-- V10: Dashboard de KPIs e views analíticas
USE petshop;

-- Vendas por funcionário (período configurável via WHERE)
CREATE OR REPLACE VIEW vw_vendas_por_funcionario AS
SELECT 
    f.id_funcionario,
    f.nome as funcionario_nome,
    f.cargo,
    COUNT(DISTINCT v.id_venda) as total_vendas,
    COALESCE(SUM(v.valor_total - v.valor_desconto), 0) as receita_total,
    COALESCE(AVG(v.valor_total - v.valor_desconto), 0) as ticket_medio,
    DATE(MIN(v.data_hora_venda)) as primeira_venda,
    DATE(MAX(v.data_hora_venda)) as ultima_venda
FROM funcionarios f
LEFT JOIN vendas v ON f.id_funcionario = v.id_funcionario 
    AND v.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
WHERE f.ativo = TRUE
GROUP BY f.id_funcionario
ORDER BY receita_total DESC;

-- Produtos mais vendidos (últimos 30 dias)
CREATE OR REPLACE VIEW vw_produtos_mais_vendidos AS
SELECT 
    p.id_produto,
    p.nome as produto_nome,
    p.categoria,
    p.codigo_barras,
    COUNT(DISTINCT iv.id_venda) as num_vendas,
    SUM(iv.quantidade_vendida) as quantidade_total_vendida,
    SUM(iv.quantidade_vendida * iv.preco_unitario) as receita_gerada,
    COALESCE(SUM(e.quantidade), 0) as estoque_atual,
    p.estoque_minimo,
    CASE 
        WHEN COALESCE(SUM(e.quantidade), 0) < p.estoque_minimo THEN 'ALERTA'
        WHEN COALESCE(SUM(e.quantidade), 0) = 0 THEN 'RUPTURA'
        ELSE 'OK'
    END as status_estoque
FROM produtos p
LEFT JOIN itens_da_venda iv ON p.id_produto = iv.id_produto
LEFT JOIN vendas v ON iv.id_venda = v.id_venda 
    AND v.data_hora_venda >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
LEFT JOIN estoque e ON p.id_produto = e.id_produto
WHERE p.ativo = TRUE
GROUP BY p.id_produto
ORDER BY quantidade_total_vendida DESC;

-- Histórico de rupturas (produtos zerados nos últimos 90 dias)
CREATE OR REPLACE VIEW vw_historico_rupturas AS
SELECT 
    p.id_produto,
    p.nome as produto_nome,
    p.categoria,
    m.created_at as data_ruptura,
    m.quantidade_anterior as qtd_antes,
    m.quantidade_nova as qtd_depois,
    m.motivo,
    m.id_venda,
    f.nome as funcionario_responsavel
FROM estoque_movimentacoes m
JOIN produtos p ON m.id_produto = p.id_produto
LEFT JOIN funcionarios f ON m.id_funcionario = f.id_funcionario
WHERE m.quantidade_nova = 0 
    AND m.tipo = 'Saída'
    AND m.created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
ORDER BY m.created_at DESC;

-- Receita diária (últimos 30 dias)
CREATE OR REPLACE VIEW vw_receita_diaria AS
SELECT 
    DATE(v.data_hora_venda) as data,
    COUNT(DISTINCT v.id_venda) as num_vendas,
    COUNT(DISTINCT v.id_cliente) as num_clientes,
    SUM(v.valor_total) as receita_bruta,
    SUM(v.valor_desconto) as total_descontos,
    SUM(v.valor_total - v.valor_desconto) as receita_liquida,
    AVG(v.valor_total - v.valor_desconto) as ticket_medio,
    SUM((SELECT COUNT(*) FROM itens_da_venda WHERE id_venda = v.id_venda)) as total_itens_vendidos
FROM vendas v
WHERE v.data_hora_venda >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(v.data_hora_venda)
ORDER BY data DESC;

-- Top clientes (por receita gerada)
CREATE OR REPLACE VIEW vw_top_clientes AS
SELECT 
    c.id_cliente,
    c.nome as cliente_nome,
    c.telefone,
    c.email,
    COUNT(DISTINCT v.id_venda) as num_compras,
    SUM(v.valor_total - v.valor_desconto) as receita_gerada,
    AVG(v.valor_total - v.valor_desconto) as ticket_medio,
    DATE(MIN(v.data_hora_venda)) as primeira_compra,
    DATE(MAX(v.data_hora_venda)) as ultima_compra,
    DATEDIFF(CURDATE(), MAX(v.data_hora_venda)) as dias_sem_comprar
FROM clientes c
LEFT JOIN vendas v ON c.id_cliente = v.id_cliente
WHERE c.ativo = TRUE AND c.deleted_at IS NULL
GROUP BY c.id_cliente
HAVING num_compras > 0
ORDER BY receita_gerada DESC;

-- Agendamentos por status (visão gerencial)
CREATE OR REPLACE VIEW vw_agendamentos_resumo AS
SELECT 
    a.status,
    COUNT(*) as total,
    COUNT(DISTINCT a.id_pet) as pets_unicos,
    COUNT(DISTINCT p.id_cliente) as clientes_unicos,
    SUM(COALESCE(a.valor_servico, s.preco_base)) as receita_estimada,
    AVG(a.duracao_estimada) as duracao_media_min
FROM agendamentos a
LEFT JOIN pets p ON a.id_pet = p.id_pet
LEFT JOIN servicos s ON a.id_servico = s.id_servico
WHERE a.data_hora >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY a.status
ORDER BY 
    CASE a.status
        WHEN 'Agendado' THEN 1
        WHEN 'Confirmado' THEN 2
        WHEN 'Concluído' THEN 3
        WHEN 'Cancelado' THEN 4
    END;

SELECT 'V10 dashboard KPIs aplicado' AS status;
