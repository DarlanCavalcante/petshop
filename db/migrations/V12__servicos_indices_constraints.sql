-- V12: Melhorias em servicos (indices, constraint e coluna duracao_padrao)

-- 1) Indices (melhora performance e nao altera comportamento)
CREATE INDEX idx_servicos_nome ON servicos(nome);
CREATE INDEX idx_servicos_ativo ON servicos(ativo);

-- 2) Coluna opcional para duracao padrao do servico (em minutos)
ALTER TABLE servicos ADD duracao_padrao INT NULL;

-- 3) Constraint de validacao de preco (aplicar apenas se nao houver valores invalidos)
-- Verifique previamente com: SELECT * FROM servicos WHERE preco_base <= 0;
ALTER TABLE servicos ADD CONSTRAINT chk_servicos_preco_base CHECK (preco_base > 0);

