# Petshop - Notas de Versão

## v1.0.0 (2025-11-10)

Primeira release pública do sistema Petshop Multi-Empresa.

- Backend: FastAPI + SQLAlchemy + MySQL (multi-banco por empresa)
- Autenticação JWT com suporte a X-Empresa
- CRUDs principais: clientes, produtos, serviços, vendas, agendamentos
- Procedures e views para KPIs (produtos mais vendidos, receita diária, etc.)
- Frontend: Next.js (login, produtos, venda, agendamentos, KPIs)
- Scripts: start_all.sh / stop_all.sh, seed para base `petshop_empresa_teste`
- Documentação: README, INSTRUCOES_GITHUB, COMO_USAR_API, etc.

### Quebra de compatibilidade
- Não aplicável

### Observações
- Arquivos sensíveis ignorados por padrão (.env, databases.json)
- Requer MySQL 8+ local
