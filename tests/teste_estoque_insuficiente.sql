USE petshop;

-- Variáveis dinâmicas para IDs existentes
SET @id_cliente := (SELECT id_cliente FROM clientes ORDER BY id_cliente LIMIT 1);
SET @id_funcionario := (SELECT id_funcionario FROM funcionarios ORDER BY id_funcionario LIMIT 1);
SET @id_prod := (
  SELECT e.id_produto FROM estoque e
  JOIN produtos p ON p.id_produto = e.id_produto
  ORDER BY e.id_produto LIMIT 1
);

-- Saldos e preços
SET @saldo := (SELECT quantidade FROM estoque WHERE id_produto = @id_prod LIMIT 1);
SET @preco := (SELECT preco_venda FROM produtos WHERE id_produto = @id_prod);
SET @qtd := @saldo + 1; -- forçar insuficiência

DELIMITER $$
DROP PROCEDURE IF EXISTS teste_insuficiente$$
CREATE PROCEDURE teste_insuficiente()
BEGIN
  DECLARE v_id_venda INT;
  DECLARE v_valor_final DECIMAL(10,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    SELECT 'OK: Erro de estoque insuficiente capturado' AS resultado;
    ROLLBACK; -- garantir estado
  END;

  SET @itens := JSON_ARRAY(JSON_OBJECT('id_produto', @id_prod, 'qtd', @qtd, 'preco', @preco));
  START TRANSACTION;
  CALL registrar_venda(@id_cliente, @id_funcionario, @itens, 0.00, v_id_venda, v_valor_final);
  COMMIT;

  -- Se chegou aqui sem erro, a validação falhou
  SELECT 'FALHA: venda não deveria ter sido concluída' AS resultado;
END$$
DELIMITER ;

CALL teste_insuficiente();
DROP PROCEDURE IF EXISTS teste_insuficiente;

SELECT 'fim' AS fim;
