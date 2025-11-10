-- V8: Auditoria de movimentações de estoque
USE petshop;

-- Tabela de log de movimentações
CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
    id_movimentacao INT NOT NULL AUTO_INCREMENT,
    id_produto INT NOT NULL,
    id_estoque INT NULL,
    tipo ENUM('Entrada','Saída','Ajuste','Devolução') NOT NULL,
    quantidade INT NOT NULL,
    quantidade_anterior INT NULL,
    quantidade_nova INT NULL,
    lote VARCHAR(50) NULL,
    motivo VARCHAR(100) NULL,
    id_venda INT NULL,
    id_funcionario INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_movimentacao),
    KEY idx_produto (id_produto),
    KEY idx_estoque (id_estoque),
    KEY idx_tipo (tipo),
    KEY idx_created (created_at),
    CONSTRAINT fk_mov_produto FOREIGN KEY (id_produto) REFERENCES produtos (id_produto) ON DELETE CASCADE,
    CONSTRAINT fk_mov_estoque FOREIGN KEY (id_estoque) REFERENCES estoque (id_estoque) ON DELETE SET NULL,
    CONSTRAINT fk_mov_venda FOREIGN KEY (id_venda) REFERENCES vendas (id_venda) ON DELETE SET NULL,
    CONSTRAINT fk_mov_funcionario FOREIGN KEY (id_funcionario) REFERENCES funcionarios (id_funcionario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- View de resumo de movimentações
CREATE OR REPLACE VIEW vw_estoque_movimentacoes AS
SELECT 
    m.id_movimentacao,
    m.tipo,
    p.nome as produto_nome,
    p.codigo_barras,
    m.quantidade,
    m.quantidade_anterior,
    m.quantidade_nova,
    m.lote,
    m.motivo,
    m.id_venda,
    f.nome as funcionario_nome,
    m.created_at
FROM estoque_movimentacoes m
JOIN produtos p ON m.id_produto = p.id_produto
LEFT JOIN funcionarios f ON m.id_funcionario = f.id_funcionario
ORDER BY m.created_at DESC;

-- Atualiza registrar_venda para logar movimentações
DELIMITER $$
DROP PROCEDURE IF EXISTS registrar_venda$$
CREATE PROCEDURE registrar_venda(
    IN p_id_cliente INT,
    IN p_id_funcionario INT,
    IN p_itens JSON,
    IN p_desconto DECIMAL(10,2),
    OUT p_id_venda INT,
    OUT p_valor_final DECIMAL(10,2)
)
BEGIN
    DECLARE v_total DECIMAL(10,2) DEFAULT 0;
    DECLARE v_idx INT DEFAULT 0;
    DECLARE v_itens_count INT DEFAULT JSON_LENGTH(p_itens);
    DECLARE v_id_prod INT;
    DECLARE v_qtd INT;
    DECLARE v_preco DECIMAL(10,2);
    DECLARE v_estoque_atual INT;
    DECLARE v_id_estoque INT;
    DECLARE v_lote VARCHAR(50);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Calcula total
    WHILE v_idx < v_itens_count DO
        SET v_id_prod = JSON_EXTRACT(p_itens, CONCAT('$[',v_idx,'].id_produto'));
        SET v_qtd     = JSON_EXTRACT(p_itens, CONCAT('$[',v_idx,'].qtd'));
        SET v_preco   = JSON_EXTRACT(p_itens, CONCAT('$[',v_idx,'].preco'));
        IF v_qtd <= 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantidade inválida em item';
        END IF;
        SET v_total = v_total + (v_qtd * v_preco);
        SET v_idx = v_idx + 1;
    END WHILE;

    -- Registra venda
    INSERT INTO vendas(data_hora_venda, id_cliente, id_funcionario, valor_total, desconto, valor_desconto, observacoes)
    VALUES (NOW(), p_id_cliente, p_id_funcionario, v_total, p_desconto, p_desconto, NULL);
    SET p_id_venda = LAST_INSERT_ID();

    -- Processa itens e baixa estoque
    SET v_idx = 0;
    WHILE v_idx < v_itens_count DO
        SET v_id_prod = JSON_EXTRACT(p_itens, CONCAT('$[',v_idx,'].id_produto'));
        SET v_qtd     = JSON_EXTRACT(p_itens, CONCAT('$[',v_idx,'].qtd'));
        SET v_preco   = JSON_EXTRACT(p_itens, CONCAT('$[',v_idx,'].preco'));

        -- Bloqueia linha e captura dados
        SELECT e.id_estoque, e.quantidade, e.lote 
        INTO v_id_estoque, v_estoque_atual, v_lote
        FROM estoque e
        WHERE e.id_produto = v_id_prod
        ORDER BY e.id_estoque
        LIMIT 1
        FOR UPDATE;

        IF v_estoque_atual IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Produto sem estoque cadastrado';
        END IF;
        IF v_estoque_atual < v_qtd THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Estoque insuficiente para o produto';
        END IF;

        -- Registra item da venda
        INSERT INTO itens_da_venda(id_venda, id_produto, quantidade_vendida, preco_unitario)
        VALUES (p_id_venda, v_id_prod, v_qtd, v_preco);

        -- Baixa estoque
        UPDATE estoque 
        SET quantidade = quantidade - v_qtd 
        WHERE id_estoque = v_id_estoque;

        -- Registra movimentação
        INSERT INTO estoque_movimentacoes(id_produto, id_estoque, tipo, quantidade, quantidade_anterior, quantidade_nova, lote, motivo, id_venda, id_funcionario)
        VALUES (v_id_prod, v_id_estoque, 'Saída', v_qtd, v_estoque_atual, v_estoque_atual - v_qtd, v_lote, 'Venda', p_id_venda, p_id_funcionario);

        SET v_idx = v_idx + 1;
    END WHILE;

    SET p_valor_final = v_total - p_desconto;

    COMMIT;
END$$
DELIMITER ;

SELECT 'V8 auditoria de estoque aplicada' AS status;
