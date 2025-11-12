# 🔐 GUIA DO ADMINISTRADOR - Sistema Petshop

**Nível de Acesso:** Administrador  
**Setor:** TI / Infraestrutura  
**Última Atualização:** 11/11/2025

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Instalação e Configuração](#instalação-e-configuração)
3. [Gerenciamento de Segurança](#gerenciamento-de-segurança)
4. [Backups e Recuperação](#backups-e-recuperação)
5. [Monitoramento](#monitoramento)
6. [Troubleshooting](#troubleshooting)
7. [Manutenção](#manutenção)
8. [Checklist Diário/Semanal/Mensal](#checklist)

---

## 🎯 VISÃO GERAL

### O que você gerencia:
- ✅ Infraestrutura (servidores, banco de dados, containers)
- ✅ Segurança (autenticação, autorização, firewalls)
- ✅ Backups e disaster recovery
- ✅ Monitoramento e logs
- ✅ Configurações multi-empresa

### Suas Responsabilidades:
1. Garantir disponibilidade do sistema (uptime)
2. Proteger dados sensíveis (LGPD)
3. Realizar backups diários
4. Monitorar ameaças de segurança
5. Gerenciar acessos de usuários

---

## 🚀 INSTALAÇÃO E CONFIGURAÇÃO

### Pré-requisitos

```
✅ Docker e Docker Compose instalados
✅ Git configurado
✅ PowerShell ou terminal com permissões administrativas
✅ Portas 3306, 8000 e 3000 disponíveis
```

### Passo 1: Clonar Repositório

```powershell
# Clone o projeto
git clone https://github.com/DarlanCavalcante/petshop.git
cd petshop
```

### Passo 2: Configurar Variáveis de Ambiente

```powershell
# Copiar arquivo de exemplo
copy .env.example .env
```

**Editar `.env` com valores seguros:**

```bash
# CRÍTICO: Alterar estes valores!
MYSQL_ROOT_PASSWORD=Sua$3nh4Fort3!2025
SECRET_KEY=sua_chave_aleatoria_de_64_caracteres_aqui

# Opcional: Ajustar conforme ambiente
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=False  # SEMPRE False em produção!
CORS_ORIGINS=https://seudominio.com
```

### Passo 3: Gerar SECRET_KEY Segura

**Windows PowerShell:**
```powershell
# Gera chave aleatória de 64 caracteres
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# OU usando .NET
[Convert]::ToBase64String([byte[]](1..64|%{Get-Random -Max 256}))
```

**Linux/Mac:**
```bash
openssl rand -hex 64
```

**⚠️ IMPORTANTE:** Cole a chave gerada no `.env` na variável `SECRET_KEY`

### Passo 4: Iniciar Serviços

```powershell
# Iniciar containers
docker-compose -f docker-compose.windows.yml up -d

# Verificar status
docker-compose -f docker-compose.windows.yml ps
```

**Saída esperada:**
```
NAME                   STATUS
petshop-mariadb       Up (healthy)
petshop-api           Up
petshop-frontend      Up
```

### Passo 5: Verificar Health Check

```powershell
# Testar API
curl http://localhost:8000/health

# Resposta esperada:
# {"status":"healthy","timestamp":"...","checks":{"database":{"status":"up"}}}
```

### Passo 6: Criar Usuário Administrador

```sql
-- Conectar ao banco
docker exec -it petshop-mariadb mysql -u root -p

USE petshop_empresa_teste;

-- Criar usuário admin (senha: admin123 - MUDAR EM PRODUÇÃO!)
INSERT INTO funcionarios (nome, login, senha, cargo, salario, ativo) 
VALUES (
    'Administrador', 
    'admin', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyMcBs5nE.Wu',  -- senha: admin123
    'admin', 
    0.00, 
    TRUE
);
```

**⚠️ SEGURANÇA:** Mude a senha padrão imediatamente após primeiro login!

---

## 🔐 GERENCIAMENTO DE SEGURANÇA

### 1. Gerenciar Usuários e Permissões

#### Criar Novo Funcionário

```sql
USE petshop_empresa_teste;

-- Gerar hash de senha (use Python ou online: bcrypt-generator.com)
-- Para senha "SenhaForte123": gere o hash bcrypt

INSERT INTO funcionarios (nome, login, senha, cargo, salario, ativo)
VALUES (
    'João Silva',
    'joao.silva',
    '$2b$12$HASH_GERADO_AQUI',  -- Substituir pelo hash real
    'atendente',  -- ou 'gerente', 'admin'
    2500.00,
    TRUE
);
```

#### Desativar Usuário (não deletar!)

```sql
UPDATE funcionarios 
SET ativo = FALSE 
WHERE login = 'joao.silva';
```

#### Listar Usuários Ativos

```sql
SELECT id_funcionario, nome, login, cargo, ativo 
FROM funcionarios 
WHERE ativo = TRUE 
ORDER BY cargo, nome;
```

### 2. Configurar Multi-Empresa

#### Estrutura de Databases

```
petshop/
├── petshop_empresa_teste (padrão)
├── petshop_empresa_a
└── petshop_empresa_b
```

#### Criar Nova Empresa

```bash
# 1. Criar banco de dados
docker exec -it petshop-mariadb mysql -u root -p -e "CREATE DATABASE petshop_empresa_nova CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Aplicar schema (migrations)
docker exec -i petshop-mariadb mysql -u root -p petshop_empresa_nova < db/migrations/V1__baseline_schema.sql

# 3. Criar arquivo databases.json na raiz do projeto api/
```

**api/databases.json:**
```json
{
  "default": "mysql+pymysql://root:SENHA@mariadb:3306/petshop_empresa_teste",
  "teste": "mysql+pymysql://root:SENHA@mariadb:3306/petshop_empresa_teste",
  "empresa_a": "mysql+pymysql://root:SENHA@mariadb:3306/petshop_empresa_a",
  "empresa_nova": "mysql+pymysql://root:SENHA@mariadb:3306/petshop_empresa_nova"
}
```

#### Testar Conexão da Nova Empresa

```powershell
# Login especificando empresa no header
curl -X POST http://localhost:8000/auth/login `
  -H "Content-Type: application/x-www-form-urlencoded" `
  -H "X-Empresa: empresa_nova" `
  -d "username=admin&password=admin123"
```

### 3. Monitorar Eventos de Segurança

#### Ver Logs de Segurança

```powershell
# Logs da API (formato JSON)
docker logs petshop-api --tail 100 -f | Select-String "security"

# Filtrar apenas falhas de login
docker logs petshop-api --tail 1000 | Select-String "login_failed"
```

#### Analisar Tentativas de Login

```sql
-- Se houver tabela de auditoria (implementar futuramente)
SELECT 
    DATE(data_hora) as data,
    COUNT(*) as tentativas,
    login,
    ip_address
FROM logs_seguranca
WHERE evento = 'login_failed'
GROUP BY DATE(data_hora), login
HAVING tentativas > 5
ORDER BY data DESC, tentativas DESC;
```

### 4. Rate Limiting

**Configuração atual:**
- Login: 5 tentativas/minuto por IP
- Endpoints gerais: 200 requisições/minuto

**Ajustar limites:**

Editar `api/src/main.py`:
```python
# Alterar limite global
limiter = Limiter(key_func=get_remote_address, default_limits=["500/minute"])

# Alterar limite de login em api/src/routes/auth.py
@limiter.limit("10/minute")  # Era 5/minute
```

### 5. Firewall e Acesso

#### Bloquear IPs Suspeitos

**Docker:**
```bash
# Bloquear IP no nível do container
docker network inspect petshop-network
# Configurar regras de firewall no host
```

**Aplicação (em middleware.py):**
```python
# Ativar whitelist de IPs
app.add_middleware(
    IPWhitelistMiddleware, 
    allowed_ips=["192.168.1.100", "10.0.0.50"]
)
```

---

## 💾 BACKUPS E RECUPERAÇÃO

### Backup Automático

#### Configurar Backup Diário

**Linux/Mac (cron):**
```bash
# Editar crontab
crontab -e

# Adicionar linha (backup às 2h da manhã)
0 2 * * * /caminho/completo/petshop/scripts/backup_database.sh
```

**Windows (Task Scheduler):**
```powershell
# Criar tarefa agendada
$action = New-ScheduledTaskAction -Execute "bash.exe" -Argument "C:\caminho\petshop\scripts\backup_database.sh"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "Petshop Backup" -Description "Backup diário do banco de dados"
```

#### Backup Manual

```bash
# Executar script de backup
./scripts/backup_database.sh

# Backup será salvo em: backups/petshop_backup_YYYYMMDD_HHMMSS.sql.gz
```

### Restaurar Backup

#### Listar Backups Disponíveis

```powershell
ls backups/*.sql.gz | Sort-Object LastWriteTime -Descending
```

#### Restaurar Backup Específico

```bash
# ATENÇÃO: Isto SOBRESCREVE o banco atual!
./scripts/restore_database.sh backups/petshop_backup_20251111_020000.sql.gz
```

#### Restaurar para Banco de Teste (Não Sobrescrever Produção)

```bash
# 1. Criar banco temporário
docker exec -it petshop-mariadb mysql -u root -p -e "CREATE DATABASE petshop_restore_test;"

# 2. Restaurar backup no banco de teste
gunzip < backups/petshop_backup_20251111_020000.sql.gz | \
docker exec -i petshop-mariadb mysql -u root -p petshop_restore_test

# 3. Validar dados
docker exec -it petshop-mariadb mysql -u root -p petshop_restore_test -e "SELECT COUNT(*) FROM vendas;"
```

### Backup Remoto (Segurança Extra)

```bash
# Enviar backups para storage externo (exemplo: AWS S3)
aws s3 cp backups/ s3://meu-bucket-petshop/backups/ --recursive

# Ou para servidor remoto via SCP
scp backups/*.sql.gz usuario@servidor-backup:/backups/petshop/
```

---

## 📊 MONITORAMENTO

### 1. Health Checks

#### Verificar Status dos Serviços

```powershell
# Health check da API
curl http://localhost:8000/health | ConvertFrom-Json

# Verificar containers
docker-compose -f docker-compose.windows.yml ps

# Status detalhado
docker stats petshop-api petshop-mariadb petshop-frontend
```

### 2. Logs

#### Visualizar Logs em Tempo Real

```powershell
# API
docker logs petshop-api -f

# Banco de dados
docker logs petshop-mariadb -f

# Todos os serviços
docker-compose -f docker-compose.windows.yml logs -f
```

#### Exportar Logs para Análise

```powershell
# Últimas 1000 linhas para arquivo
docker logs petshop-api --tail 1000 > logs/api_$(Get-Date -Format "yyyyMMdd_HHmmss").log
```

### 3. Métricas de Performance

#### Queries Lentas no MySQL

```sql
-- Habilitar slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;  -- queries > 2 segundos

-- Ver queries lentas
SELECT * FROM mysql.slow_log 
ORDER BY start_time DESC 
LIMIT 20;
```

#### Uso de Disco

```powershell
# Tamanho dos volumes Docker
docker system df -v

# Espaço usado pelo banco
docker exec petshop-mariadb du -sh /var/lib/mysql
```

### 4. Alertas (Configuração Futura)

**Recomendações para produção:**
- ✅ Configurar alertas de email/SMS para:
  - Disco > 80% cheio
  - API offline por > 5 minutos
  - Backup falhou
  - > 10 tentativas de login falhadas

---

## 🔧 TROUBLESHOOTING

### Problema: API não inicia

**Erro:** `ValueError: SECRET_KEY inválida`

**Solução:**
```powershell
# 1. Verificar .env
cat .env | Select-String "SECRET_KEY"

# 2. Gerar nova chave
[Convert]::ToBase64String([byte[]](1..64|%{Get-Random -Max 256}))

# 3. Atualizar .env
# 4. Reiniciar
docker-compose -f docker-compose.windows.yml restart api
```

### Problema: Banco de dados não conecta

**Sintomas:** `{"status":"unhealthy","checks":{"database":{"status":"down"}}}`

**Diagnóstico:**
```powershell
# 1. Verificar se container está rodando
docker ps | Select-String "mariadb"

# 2. Verificar logs do banco
docker logs petshop-mariadb --tail 50

# 3. Testar conexão direta
docker exec -it petshop-mariadb mysql -u root -p -e "SELECT 1;"
```

**Soluções:**
```powershell
# Se senha incorreta
# 1. Editar .env com senha correta
# 2. Recriar containers
docker-compose -f docker-compose.windows.yml down
docker-compose -f docker-compose.windows.yml up -d

# Se volume corrompido
docker volume rm petshop_mariadb_data
# ATENÇÃO: Isto apaga todos os dados! Restaurar de backup depois
```

### Problema: Rate limit bloqueando usuários legítimos

**Sintomas:** `429 Too Many Requests`

**Solução temporária:**
```powershell
# Reiniciar API (limpa contador de rate limit)
docker restart petshop-api
```

**Solução permanente:**
Editar `api/src/main.py` e `api/src/routes/auth.py` para aumentar limites.

### Problema: Logs muito grandes

```powershell
# Rotacionar logs Docker
docker-compose -f docker-compose.windows.yml down
docker system prune -a --volumes  # CUIDADO: Remove tudo não usado!

# OU configurar log rotation no docker-compose
```

Adicionar em `docker-compose.windows.yml`:
```yaml
services:
  api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 🛠️ MANUTENÇÃO

### Atualização do Sistema

#### 1. Atualizar Código

```powershell
# 1. Fazer backup ANTES
./scripts/backup_database.sh

# 2. Parar serviços
docker-compose -f docker-compose.windows.yml down

# 3. Atualizar código
git pull origin main

# 4. Atualizar dependências
docker-compose -f docker-compose.windows.yml build --no-cache

# 5. Iniciar novamente
docker-compose -f docker-compose.windows.yml up -d

# 6. Verificar health
curl http://localhost:8000/health
```

#### 2. Aplicar Migrations

```bash
# Aplicar novas migrations do Flyway
./flyway_migrate.sh

# OU manualmente
docker exec -i petshop-mariadb mysql -u root -p petshop_empresa_teste < db/migrations/V14__nova_migration.sql
```

### Limpeza de Dados Antigos

```sql
-- Arquivar vendas antigas (> 2 anos)
CREATE TABLE vendas_arquivo AS 
SELECT * FROM vendas 
WHERE data_hora_venda < DATE_SUB(NOW(), INTERVAL 2 YEAR);

DELETE FROM vendas 
WHERE data_hora_venda < DATE_SUB(NOW(), INTERVAL 2 YEAR);

-- Limpar logs de auditoria antigos
DELETE FROM auditoria_estoque 
WHERE data_hora < DATE_SUB(NOW(), INTERVAL 6 MONTH);
```

### Otimização de Performance

```sql
-- Analisar e otimizar tabelas
ANALYZE TABLE vendas, produtos, clientes, agendamentos;

-- Rebuild índices
OPTIMIZE TABLE vendas, itens_da_venda;

-- Ver estatísticas
SHOW TABLE STATUS WHERE Name LIKE 'vendas%';
```

---

## ✅ CHECKLIST

### Diário
- [ ] Verificar health check da API
- [ ] Verificar se backup foi executado
- [ ] Revisar logs de segurança (tentativas de login falhadas)
- [ ] Verificar uso de disco (`docker system df`)

### Semanal
- [ ] Testar restauração de um backup
- [ ] Analisar queries lentas
- [ ] Revisar logs de erros da API
- [ ] Verificar atualizações de segurança

### Mensal
- [ ] Atualizar dependências (se houver patches de segurança)
- [ ] Revisar permissões de usuários
- [ ] Arquivar dados antigos
- [ ] Otimizar tabelas do banco (`OPTIMIZE TABLE`)
- [ ] Testar disaster recovery completo
- [ ] Renovar certificados SSL (se aplicável)

### Trimestral
- [ ] Revisão completa de segurança
- [ ] Atualização de versões (FastAPI, MariaDB, Next.js)
- [ ] Auditoria de compliance (LGPD)
- [ ] Treinamento de equipe

---

## 📞 SUPORTE

### Informações de Contato

**Desenvolvedor:**
- GitHub: DarlanCavalcante/petshop
- Email: (adicionar email de suporte)

### Documentação Adicional

- 📄 [Guia do Desenvolvedor](./GUIA_DESENVOLVEDOR.md)
- 📄 [Guia do Gerente](./GUIA_GERENTE.md)
- 📄 [Guia do Atendente](./GUIA_ATENDENTE.md)
- 📄 [Segurança e Compliance](./GUIA_SEGURANCA_COMPLIANCE.md)

### Recursos Externos

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [MariaDB Docs](https://mariadb.org/documentation/)
- [Docker Docs](https://docs.docker.com/)

---

**⚠️ LEMBRE-SE:**
- SEMPRE fazer backup antes de atualizações
- NUNCA compartilhar credenciais
- NUNCA commitar `.env` no Git
- Manter logs de todas as mudanças críticas

---

**Última Atualização:** 11/11/2025  
**Versão do Sistema:** 2.0.0  
**Próxima Revisão:** 11/02/2026
