-- V5: Tuning adicional de índices para relatórios
USE petshop;

-- NOTA: MySQL não suporta CREATE INDEX IF NOT EXISTS (8.4). Simplesmente criamos; caso já exista o DBA deve ajustar manualmente.
-- Servicos por nome
CREATE INDEX idx_servicos_nome ON servicos(nome);

-- Pagamentos por venda e data
CREATE INDEX idx_pagamentos_venda_data ON Pagamentos(id_venda, data_pagamento);

-- Agendamentos por status+data (ordem diferente de idx_agendamentos_data_status existente)
CREATE INDEX idx_agenda_status_data ON agendamentos(status, data_hora);

-- Pets por dono+nome
CREATE INDEX idx_pets_cliente_nome ON pets(id_cliente, nome);

SELECT 'V5 tuning de indices aplicado' AS status;
