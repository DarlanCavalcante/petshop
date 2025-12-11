# Petshop - Notas de Versão

## v1.0.1 (2025-11-16) - Correções Críticas

**Correções aplicadas para resolver problemas de produção:**

### 🐛 Bugs Corrigidos
- **Erro 500 na API de serviços:** Adicionada coluna `duracao_padrao` faltante na tabela `servicos`
- **CORS policy blocking:** Configurada URL da API para HTTPS externo (`https://api.petshop.tech10cloud.com`)
- **Acesso externo bloqueado:** Frontend agora acessa API via Cloudflare Tunnel

### 🔧 Melhorias Implementadas
- **Multi-tenant aprimorado:** Sistema de troca automática de banco por empresa
- **Autenticação reforçada:** Middleware de segurança atualizado
- **Rotas de KPIs:** Filtros por empresa implementados
- **Sistema de redefinição de senha:** Funcionalidade completa adicionada
- **Validações de segurança:** Regras de negócio aplicadas

### 📦 Deploy e Infraestrutura
- **Containers reconstruídos:** Docker images atualizadas com correções
- **GitHub atualizado:** Todas as mudanças versionadas
- **Documentação:** MELHORIAS_IMPLEMENTADAS.md atualizado com correções

### ✅ Status
- Sistema totalmente funcional para acesso externo
- API responde sem erros
- CORS configurado para domínios externos
- Pronto para produção

---

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
