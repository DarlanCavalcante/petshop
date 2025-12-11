-- V4: Procedures de negócio (registrar venda e agendar serviço)



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

    -- Insere itens e baixa estoque
    SET v_idx = 0;
    WHILE v_idx < v_itens_count DO
        SET v_id_prod = JSON_EXTRACT(p_itens, CONCAT('$[',v_idx,'].id_produto'));
        SET v_qtd     = JSON_EXTRACT(p_itens, CONCAT('$[',v_idx,'].qtd'));
        SET v_preco   = JSON_EXTRACT(p_itens, CONCAT('$[',v_idx,'].preco'));

        INSERT INTO itens_da_venda(id_venda, id_produto, quantidade_vendida, preco_unitario)
        VALUES (p_id_venda, v_id_prod, v_qtd, v_preco);

        -- Simples: baixa do estoque somando negativo (assume registro por produto consolidado)
        UPDATE estoque SET quantidade = quantidade - v_qtd WHERE id_produto = v_id_prod LIMIT 1;
        SET v_idx = v_idx + 1;
    END WHILE;

    SET p_valor_final = v_total - p_desconto;

    COMMIT;
END

DROP PROCEDURE IF EXISTS agendar_servico
CREATE PROCEDURE agendar_servico(
    IN p_id_pet INT,
    IN p_id_servico INT,
    IN p_id_funcionario INT,
    IN p_data_hora DATETIME,
    IN p_duracao_estimada INT,
    IN p_observacoes TEXT,
    OUT p_id_agendamento INT
)
BEGIN
    DECLARE v_conflict INT;

    -- Verifica conflito com intervalo simples (mesma hora exata)
    SELECT COUNT(*) INTO v_conflict
    FROM agendamentos
    WHERE id_funcionario = p_id_funcionario
      AND data_hora = p_data_hora
      AND status IN ('Agendado','Confirmado');

    IF v_conflict > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Conflito de horário para o funcionário.';
    END IF;

    INSERT INTO agendamentos(data_hora, status, id_servico, id_pet, id_funcionario, observacoes, valor_servico, duracao_estimada)
    VALUES(p_data_hora, 'Agendado', p_id_servico, p_id_pet, p_id_funcionario, p_observacoes, NULL, p_duracao_estimada);

    SET p_id_agendamento = LAST_INSERT_ID();
END
DELIMITER ;

SELECT 'V4 procedures de negocio aplicadas' AS status;

