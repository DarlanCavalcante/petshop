-- V9: Procedure para registrar entradas de estoque com auditoria

-- NOTA: Esta procedure est� em sintaxe MySQL. Para SQL Server, seria necess�rio reescrever completamente.
-- Por enquanto, mantendo apenas para compatibilidade futura.

DROP PROCEDURE IF EXISTS registrar_entrada_estoque;
CREATE PROCEDURE registrar_entrada_estoque(
    IN p_id_produto INT,
    IN p_lote VARCHAR(50),
    IN p_quantidade INT,
    IN p_data_vencimento DATE,
    IN p_tipo VARCHAR(20), -- Tipo: Entrada, Compra, Devolução, Ajuste
    IN p_motivo VARCHAR(100),
    IN p_id_funcionario INT,
    OUT p_id_estoque INT,
    OUT p_quantidade_nova INT
)
BEGIN
    DECLARE v_id_estoque INT;
    DECLARE v_quantidade_anterior INT DEFAULT 0;
    DECLARE v_existe INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Validações
    IF p_quantidade <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantidade deve ser positiva';
    END IF;

    -- Verifica se produto existe
    IF NOT EXISTS (SELECT 1 FROM produtos WHERE id_produto = p_id_produto AND ativo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Produto não encontrado ou inativo';
    END IF;

    -- Verifica se já existe registro de estoque para este produto/lote
    SELECT COUNT(*), MAX(id_estoque), COALESCE(SUM(quantidade), 0)
    INTO v_existe, v_id_estoque, v_quantidade_anterior
    FROM estoque
    WHERE id_produto = p_id_produto AND lote = p_lote;

    IF v_existe > 0 THEN
        -- Atualiza estoque existente
        UPDATE estoque
        SET quantidade = quantidade + p_quantidade,
            data_vencimento = COALESCE(p_data_vencimento, data_vencimento),
            updated_at = NOW()
        WHERE id_estoque = v_id_estoque;

        SET p_id_estoque = v_id_estoque;
        SET p_quantidade_nova = v_quantidade_anterior + p_quantidade;
    ELSE
        -- Cria novo registro de estoque
        INSERT INTO estoque (id_produto, lote, quantidade, data_vencimento)
        VALUES (p_id_produto, p_lote, p_quantidade, p_data_vencimento);

        SET p_id_estoque = LAST_INSERT_ID();
        SET v_quantidade_anterior = 0;
        SET p_quantidade_nova = p_quantidade;
    END IF;

    -- Registra movimentação
    INSERT INTO estoque_movimentacoes(
        id_produto, id_estoque, tipo, quantidade, 
        quantidade_anterior, quantidade_nova, lote, motivo, id_funcionario
    )
    VALUES (
        p_id_produto, p_id_estoque, p_tipo, p_quantidade,
        v_quantidade_anterior, p_quantidade_nova, p_lote, p_motivo, p_id_funcionario
    );

    COMMIT;
END
DELIMITER ;

SELECT 'V9 procedure entrada estoque aplicada' AS status;

