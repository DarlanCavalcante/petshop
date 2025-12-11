-- V6: Reforço de integridade no registrar_venda (checagem de estoque e rollback em erro)



DROP PROCEDURE IF EXISTS registrar_venda
CREATE PROCEDURE registrar_venda(
    IN p_id_cliente INT,
    IN p_id_funcionario INT,
    IN p_itens JSON,                -- Ex.: [{"id_produto":1,"qtd":2,"preco":10.00},{...}]
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

    -- Garante rollback automático em qualquer exceção
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Calcula total percorrendo JSON
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

    INSERT INTO vendas(data_hora_venda, id_cliente, id_funcionario, valor_total, desconto, valor_desconto, observacoes)
    VALUES (NOW(), p_id_cliente, p_id_funcionario, v_total, p_desconto, p_desconto, NULL);
    SET p_id_venda = LAST_INSERT_ID();

    -- Insere itens e baixa estoque com checagem
    SET v_idx = 0;
    WHILE v_idx < v_itens_count DO
        SET v_id_prod = JSON_EXTRACT(p_itens, CONCAT('$[',v_idx,'].id_produto'));
        SET v_qtd     = JSON_EXTRACT(p_itens, CONCAT('$[',v_idx,'].qtd'));
        SET v_preco   = JSON_EXTRACT(p_itens, CONCAT('$[',v_idx,'].preco'));

        -- Verifica existência e saldo do estoque (lock da linha)
        SELECT quantidade INTO v_estoque_atual
        FROM estoque
        WHERE id_produto = v_id_prod
        FOR UPDATE;

        IF v_estoque_atual IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Produto sem estoque cadastrado';
        END IF;
        IF v_estoque_atual < v_qtd THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Estoque insuficiente para o produto';
        END IF;

        INSERT INTO itens_da_venda(id_venda, id_produto, quantidade_vendida, preco_unitario)
        VALUES (p_id_venda, v_id_prod, v_qtd, v_preco);

        UPDATE estoque SET quantidade = quantidade - v_qtd WHERE id_produto = v_id_prod LIMIT 1;
        SET v_idx = v_idx + 1;
    END WHILE;

    SET p_valor_final = v_total - p_desconto;

    COMMIT;
END
DELIMITER ;

SELECT 'V6 registrar_venda com estoque seguro aplicado' AS status;

