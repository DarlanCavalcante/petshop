-- V3: Views privadas para mascarar dados sensíveis (PII)
USE petshop;

-- View de clientes com CPF e email mascarados
CREATE OR REPLACE VIEW vw_clientes_privado AS
SELECT 
    c.id_cliente,
    c.nome AS cliente_nome,
    -- CPF mascarado: mantém últimos 2 dígitos
    CASE 
        WHEN c.cpf IS NULL OR c.cpf = '' THEN NULL
        ELSE CONCAT('***.',RIGHT(LEFT(c.cpf,7),3),'.***-',RIGHT(c.cpf,2))
    END AS cpf_mascarado,
    -- Email mascarado: primeira letra + '***' + domínio
    CASE 
        WHEN c.email IS NULL OR c.email = '' THEN NULL
        ELSE CONCAT(LEFT(c.email,1),'***@',SUBSTRING_INDEX(c.email,'@',-1))
    END AS email_mascarado,
    c.telefone,
    c.endereco_cidade,
    c.endereco_estado,
    c.created_at AS cliente_desde,
    COUNT(p.id_pet) AS total_pets
FROM clientes c
LEFT JOIN pets p ON c.id_cliente = p.id_cliente AND p.deleted_at IS NULL AND p.ativo = TRUE
WHERE c.deleted_at IS NULL AND c.ativo = TRUE
GROUP BY c.id_cliente;

-- View de pets reduzida sem histórico médico sensível
CREATE OR REPLACE VIEW vw_pets_privado AS
SELECT 
    p.id_pet,
    p.nome AS pet_nome,
    p.especie,
    p.raca,
    TIMESTAMPDIFF(YEAR, p.data_nascimento, CURDATE()) AS idade_anos,
    c.nome AS dono_nome,
    c.telefone AS dono_telefone,
    CASE WHEN p.microchip IS NULL OR p.microchip='' THEN NULL ELSE CONCAT('CHIP-',RIGHT(p.microchip,4)) END AS microchip_final,
    p.castrado,
    p.created_at AS cadastrado_em
FROM pets p
JOIN clientes c ON p.id_cliente = c.id_cliente
WHERE p.deleted_at IS NULL AND p.ativo = TRUE;

-- View de vendas anonimizada (não lista cliente completo)
CREATE OR REPLACE VIEW vw_vendas_anon AS
SELECT 
    v.id_venda,
    DATE(v.data_hora_venda) AS data,
    TIME(v.data_hora_venda) AS hora,
    CASE WHEN c.id_cliente IS NULL THEN 'SEM_CLIENTE' ELSE CONCAT('CLI-',LPAD(c.id_cliente,4,'0')) END AS cliente_codigo,
    v.valor_total,
    v.desconto,
    v.valor_desconto,
    (v.valor_total - v.valor_desconto) AS valor_final,
    COUNT(iv.id_produto) AS total_itens,
    v.created_at
FROM vendas v
LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
LEFT JOIN itens_da_venda iv ON v.id_venda = iv.id_venda
GROUP BY v.id_venda;

-- View de agenda sem dados de contato completos
CREATE OR REPLACE VIEW vw_agenda_privada AS
SELECT 
    a.id_agendamento,
    a.data_hora,
    a.status,
    p.nome AS pet_nome,
    c.nome AS cliente_nome,
    CONCAT(LEFT(c.telefone,4),'****') AS telefone_mascarado,
    s.nome AS servico_nome,
    a.valor_servico,
    a.duracao_estimada,
    a.observacoes
FROM agendamentos a
LEFT JOIN pets p ON a.id_pet = p.id_pet
LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
LEFT JOIN servicos s ON a.id_servico = s.id_servico
WHERE DATE(a.data_hora) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
ORDER BY a.data_hora DESC;

SELECT 'V3 views privadas aplicadas' AS status;
