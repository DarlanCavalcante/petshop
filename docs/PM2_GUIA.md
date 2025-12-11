# 🚀 GUIA DE USO DO PM2

## Instalação

### 1. Instalar Node.js
```powershell
winget install OpenJS.NodeJS.LTS
```

### 2. Instalar PM2
```powershell
npm install -g pm2
npm install -g pm2-windows-startup
```

### 3. Configurar startup automático (Windows)
```powershell
pm2-startup install
```

---

## Comandos Principais

### Iniciar Tudo
```powershell
# Desenvolvimento
pm2 start ecosystem.config.js

# Produção
pm2 start ecosystem.config.js --env production
```

### Gerenciar Processos
```powershell
# Ver status de tudo
pm2 status

# Ver logs em tempo real
pm2 logs

# Ver logs de um app específico
pm2 logs petshop-api
pm2 logs petshop-web

# Monitoramento (dashboard)
pm2 monit

# Reiniciar tudo
pm2 restart all

# Reiniciar apenas um
pm2 restart petshop-api

# Parar tudo
pm2 stop all

# Parar apenas um
pm2 stop petshop-api

# Deletar processos
pm2 delete all
pm2 delete petshop-api
```

### Logs
```powershell
# Ver últimos logs
pm2 logs --lines 100

# Limpar logs antigos
pm2 flush

# Ver logs de erro apenas
pm2 logs --err
```

### Informações Detalhadas
```powershell
# Info completa de um processo
pm2 describe petshop-api

# Listar processos
pm2 list
pm2 ls
```

### Salvar Configuração
```powershell
# Salvar lista atual de processos
pm2 save

# Restaurar processos salvos
pm2 resurrect

# Iniciar automaticamente no boot
pm2 startup
```

---

## Workflow Recomendado

### Setup Inicial (Primeira Vez)
```powershell
# 1. Instalar dependências
cd api
pip install -r requirements.txt
cd ..

cd web
npm install
cd ..

# 2. Criar pasta de logs
mkdir logs

# 3. Iniciar com PM2
pm2 start ecosystem.config.js

# 4. Salvar configuração
pm2 save

# 5. Configurar startup automático
pm2 startup
```

### Uso Diário
```powershell
# Ver se está rodando
pm2 status

# Ver logs
pm2 logs

# Reiniciar após alterações
pm2 restart all
```

### Troubleshooting
```powershell
# Se algo der errado, ver logs de erro
pm2 logs --err

# Reiniciar processo problemático
pm2 restart petshop-api

# Parar tudo e começar de novo
pm2 delete all
pm2 start ecosystem.config.js
```

---

## Monitoramento Avançado

### PM2 Plus (Opcional - Cloud Monitoring)
```powershell
# Criar conta grátis em: https://app.pm2.io

# Conectar PM2 ao dashboard cloud
pm2 link <secret_key> <public_key>

# Agora pode monitorar de qualquer lugar via web!
```

### Métricas Disponíveis
- CPU usage
- Memory usage
- Request rate
- Error rate
- Logs em tempo real
- Alertas automáticos

---

## Configurações Avançadas

### Cluster Mode (Múltiplos Cores)
```javascript
// No ecosystem.config.js
{
  name: 'petshop-api',
  instances: 'max', // Usa todos os cores disponíveis
  exec_mode: 'cluster',
}
```

### Auto Restart em Caso de Falha
```javascript
{
  autorestart: true,
  max_restarts: 10,
  min_uptime: '10s',
  max_memory_restart: '500M',
}
```

### Watch Mode (Reinicia ao Detectar Mudanças)
```javascript
{
  watch: true,
  ignore_watch: ['node_modules', 'logs'],
}
```

---

## Comparação com Alternativas

| Recurso | PM2 | Supervisor | Forever | Docker |
|---------|-----|------------|---------|--------|
| Múltiplas instâncias | ✅ | ✅ | ❌ | ✅ |
| Auto restart | ✅ | ✅ | ✅ | ✅ |
| Logs centralizados | ✅ | ✅ | ❌ | ✅ |
| Cluster mode | ✅ | ❌ | ❌ | ✅ |
| Fácil no Windows | ✅ | ⚠️ | ✅ | ⚠️ |
| Monitoramento web | ✅ | ❌ | ❌ | ⚠️ |
| Startup automático | ✅ | ✅ | ❌ | ✅ |

---

## FAQ

**P: PM2 funciona no Windows?**  
R: Sim! Perfeitamente. Use `pm2-windows-startup` para startup automático.

**P: Posso rodar Python com PM2?**  
R: Sim! Defina `interpreter: 'python'` no config.

**P: E o banco de dados?**  
R: Recomendamos rodar MariaDB como serviço Windows ou via Docker separadamente.

**P: PM2 ou Docker?**  
R: PM2 é mais leve e fácil para desenvolvimento. Docker é melhor para produção com múltiplos ambientes.

**P: Consumo de recursos?**  
R: PM2 usa ~50MB RAM. Muito leve!

---

## Estrutura de Logs

```
logs/
├── api-error.log      # Erros da API
├── api-out.log        # Output normal da API
├── web-error.log      # Erros do frontend
└── web-out.log        # Output normal do frontend
```

---

## Migrar de PM2 para Docker (Futuro)

Quando estiver pronto para produção:

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: ./api
    restart: always
    ports:
      - "8000:8000"
    
  web:
    build: ./web
    restart: always
    ports:
      - "3000:3000"
```

---

## Suporte

**Documentação oficial:** https://pm2.keymetrics.io/  
**GitHub:** https://github.com/Unitech/pm2  
**Discord:** https://discord.gg/pm2

---

**Desenvolvido para o projeto Petshop**  
**Última Atualização:** 11/11/2025
