-- V2: Índices e constraints práticos para performance e qualidade de dados
USE petshop;

-- Substitui índice não-único por único em produtos.codigo_barras (permite múltiplos NULLs)
ALTER TABLE produtos 
  DROP INDEX idx_produtos_codigo,
  ADD UNIQUE INDEX uq_produtos_codigo_barras (codigo_barras);

-- Unique em pets.microchip (permite múltiplos NULLs)
ALTER TABLE pets 
  ADD UNIQUE INDEX uq_pets_microchip (microchip);

-- Compostos úteis para relatórios e telas
ALTER TABLE vendas 
  ADD INDEX idx_vendas_cliente_data (id_cliente, data_hora_venda);

ALTER TABLE estoque 
  ADD INDEX idx_estoque_produto_vencimento (id_produto, data_vencimento);

ALTER TABLE agendamentos 
  ADD INDEX idx_agenda_func_data (id_funcionario, data_hora),
  ADD INDEX idx_agenda_pet_data (id_pet, data_hora);

-- Checks adicionais de qualidade de dados
ALTER TABLE pets 
  ADD CONSTRAINT chk_pets_peso_nonnegative CHECK (peso >= 0 OR peso IS NULL);

ALTER TABLE agendamentos 
  ADD CONSTRAINT chk_agenda_valor_servico_nonnegative CHECK (valor_servico >= 0 OR valor_servico IS NULL);

ALTER TABLE vendas 
  ADD CONSTRAINT chk_vendas_valor_desconto_total CHECK (valor_desconto <= valor_total);

SELECT 'V2 indices e constraints aplicados' AS status;
