-- V11: Constraints avançados para integridade referencial e regras de negócio
USE petshop;

-- Trigger: impede deletar produtos que já foram vendidos
DELIMITER $$
DROP TRIGGER IF EXISTS produtos_before_delete$$
CREATE TRIGGER produtos_before_delete
BEFORE DELETE ON produtos
FOR EACH ROW
BEGIN
    DECLARE v_vendas INT;
    SELECT COUNT(*) INTO v_vendas FROM itens_da_venda WHERE id_produto = OLD.id_produto;
    IF v_vendas > 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Não é possível deletar produto com vendas registradas. Use soft delete (ativo=FALSE).';
    END IF;
END$$
DELIMITER ;

-- Trigger: impede deletar clientes com vendas ou pets ativos
DELIMITER $$
DROP TRIGGER IF EXISTS clientes_before_delete$$
CREATE TRIGGER clientes_before_delete
BEFORE DELETE ON clientes
FOR EACH ROW
BEGIN
    DECLARE v_vendas INT;
    DECLARE v_pets INT;
    SELECT COUNT(*) INTO v_vendas FROM vendas WHERE id_cliente = OLD.id_cliente;
    SELECT COUNT(*) INTO v_pets FROM pets WHERE id_cliente = OLD.id_cliente AND ativo = TRUE;
    IF v_vendas > 0 OR v_pets > 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Não é possível deletar cliente com vendas ou pets ativos. Use soft delete (ativo=FALSE).';
    END IF;
END$$
DELIMITER ;

-- Trigger: valida data da venda (não pode ser futura)
DELIMITER $$
DROP TRIGGER IF EXISTS vendas_before_insert$$
CREATE TRIGGER vendas_before_insert
BEFORE INSERT ON vendas
FOR EACH ROW
BEGIN
    IF NEW.data_hora_venda > NOW() THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Data da venda não pode ser futura';
    END IF;
    -- Garante que valor_desconto não excede valor_total
    IF NEW.valor_desconto > NEW.valor_total THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Desconto não pode exceder o valor total da venda';
    END IF;
END$$
DELIMITER ;

-- Trigger: valida atualização de venda
DELIMITER $$
DROP TRIGGER IF EXISTS vendas_before_update$$
CREATE TRIGGER vendas_before_update
BEFORE UPDATE ON vendas
FOR EACH ROW
BEGIN
    IF NEW.data_hora_venda > NOW() THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Data da venda não pode ser futura';
    END IF;
    IF NEW.valor_desconto > NEW.valor_total THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Desconto não pode exceder o valor total da venda';
    END IF;
END$$
DELIMITER ;

-- Trigger: valida data de agendamento (deve ser futura ou hoje)
DELIMITER $$
DROP TRIGGER IF EXISTS agendamentos_before_insert$$
CREATE TRIGGER agendamentos_before_insert
BEFORE INSERT ON agendamentos
FOR EACH ROW
BEGIN
    IF DATE(NEW.data_hora) < CURDATE() THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Data de agendamento não pode ser no passado';
    END IF;
END$$
DELIMITER ;

-- Constraint: produtos com estoque vencido devem ser sinalizados
-- (Implementado via view para facilitar monitoramento)
CREATE OR REPLACE VIEW vw_produtos_vencidos AS
SELECT 
    p.id_produto,
    p.nome as produto_nome,
    p.categoria,
    e.id_estoque,
    e.lote,
    e.quantidade,
    e.data_vencimento,
    DATEDIFF(CURDATE(), e.data_vencimento) as dias_vencido
FROM produtos p
JOIN estoque e ON p.id_produto = e.id_produto
WHERE e.data_vencimento IS NOT NULL 
    AND e.data_vencimento < CURDATE()
    AND e.quantidade > 0
ORDER BY e.data_vencimento ASC;

SELECT 'V11 constraints avançados aplicados' AS status;
