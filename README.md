## Petshop – Sistema Multi-Empresa (FastAPI + Next.js)

Aplicação completa para Petshop com suporte multi-empresa usando **estratégia de banco separado por empresa** (separate-database). Backend em FastAPI + MySQL com autenticação JWT, vendas via procedure transacional, agendamentos de serviços e KPIs expostas por views. Frontend em Next.js com páginas: Login, Produtos, Vendas, Agendamentos e KPIs.

**Arquitetura:** Cada empresa possui seu próprio banco MySQL físico, mapeado via `databases.json` e selecionado dinamicamente pelo header `X-Empresa` ou campo `empresa` no JWT.

Scripts rápidos:
- Subir tudo: `./start_all.sh`
- Parar: `./stop_all.sh`

Credenciais demo (empresa "teste"):
- Usuário: `admin`
- Senha: `admin123`
- Header obrigatório: `X-Empresa: teste`

API: http://127.0.0.1:8000 (docs em /docs)  |  Frontend: http://localhost:3000

---

## Petshop DB

Infraestrutura de banco MySQL 8.4 com migrações Flyway, procedures de negócio, views de privacidade, backups automatizados e teste E2E.

### Componentes
- `flyway.conf` configuração do Flyway.
- `db/migrations/` versões V1..V11:
  - V1: Schema baseline (tabelas, PKs/FKs, índices, views, triggers)
  - V2: Índices compostos e constraints CHECK
  - V3: Views de privacidade (PII mascarado)
  - V4: Procedures de negócio (registrar_venda, agendar_servico)
  - V5: Tuning de índices para relatórios
  - V6: registrar_venda seguro (validação de estoque)
  - V7: Seed de dados mínimos
  - V8: Auditoria de estoque (tabela estoque_movimentacoes)
  - V9: Procedure registrar_entrada_estoque
  - V10: Dashboard KPIs (6 views analíticas)
  - V11: Constraints avançados (triggers de proteção)
- `tests/` scripts de validação E2E, estoque insuficiente, entrada/KPIs/constraints.
- `scripts/` automação de testes.
- `petshop_backup.sh` backup diário gzip + checksum + retenção.

### Pré-requisitos
- MySQL 8.4 em execução (usuário root ou conta com privilégios DDL/DML).
- Flyway instalado (CLI).

### Executar Migrações
Na raiz do projeto:
```
./flyway_migrate.sh
```
Ou diretamente:
```
flyway migrate
```

### Rodar Teste E2E
Opção direta:
```
mysql -u root -p < tests/teste_e2e.sql
```
Via script (usa variáveis de ambiente opcionais):
```
export MYSQL_USER=root
export MYSQL_PASSWORD=SUASENHA
./scripts/run_e2e.sh
```

### Rodar Teste de Estoque Insuficiente
Valida que a venda acima do saldo é bloqueada:
```
mysql -u root -p < tests/teste_estoque_insuficiente.sql
```

### Procedimento registrar_venda seguro (V6 + V8)
Versão reforçada valida saldo antes de debitar e faz rollback em erro. A partir de V8, também registra cada movimentação na tabela `estoque_movimentacoes` para auditoria completa.

### Auditoria de estoque (V8 + V9)
Cada saída de produto (venda) gera registro em `estoque_movimentacoes` com:
- Tipo (Entrada/Saída/Ajuste/Devolução)
- Quantidade anterior e nova
- Lote, motivo, funcionário, venda relacionada

Use a view `vw_estoque_movimentacoes` para consultas agregadas.

Para registrar entradas de estoque:
```sql
CALL registrar_entrada_estoque(
  id_produto, 'LOTE-123', quantidade, data_vencimento,
  'Entrada', 'Compra fornecedor X', id_funcionario,
  @id_estoque_out, @qtd_nova_out
);
```

### Dashboard de KPIs (V10)
6 views prontas para relatórios gerenciais:
- `vw_vendas_por_funcionario` — performance de vendas por vendedor
- `vw_produtos_mais_vendidos` — ranking de produtos (últimos 30 dias)
- `vw_historico_rupturas` — produtos que zeraram estoque (últimos 90 dias)
- `vw_receita_diaria` — receita, ticket médio, descontos (últimos 30 dias)
- `vw_top_clientes` — clientes por receita gerada
- `vw_agendamentos_resumo` — status dos agendamentos (últimos 30 dias)

### Constraints avançados (V11)
Triggers de proteção:
- Impede deletar produtos com vendas (use soft delete: `ativo=FALSE`)
- Impede deletar clientes com vendas ou pets ativos
- Valida que data da venda não pode ser futura
- Valida que desconto não pode exceder valor total
- Valida que agendamento não pode ser no passado

View de monitoramento:
- `vw_produtos_vencidos` — produtos com estoque vencido

### Backup
Agende (cron / launchd) para rodar diariamente:
```
./petshop_backup.sh
```
Saída: `backups/backup_petshop_YYYY-MM-DD.sql.gz` + `.sha256`.

### Próximos Passos (Sugestões)
- Adicionar CI/CD local ou GitHub Actions (já incluído em `.github/workflows/ci.yml`).
- Criar testes adicionais para cenários de estoque insuficiente.
- Adicionar masking adicional se novos campos PII surgirem.
- Implementar monitoração de tamanho de tabelas.
- Adicionar procedure para registrar entradas de estoque (compras) com auditoria.

### Licença
Uso interno / educacional.
