# 🎉 API Pronta! Guia Rápido de Uso

## ✅ API Rodando

A API está rodando em: **http://localhost:8000**

- **Documentação interativa**: http://localhost:8000/docs
- **Health check**: http://localhost:8000/health

## 🔐 Como Autenticar

### 1. Primeiro, crie uma senha hash para um funcionário

```bash
cd api
source venv/bin/activate
python3 -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('senha123'))"
```

Copie o hash gerado e atualize no banco:

```sql
UPDATE funcionarios 
SET senha = '$2b$12$...(seu hash aqui)...' 
WHERE login = 'maria';
```

### 2. Faça login via API

**Via curl:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=maria&password=senha123"
```

**Resposta:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJh...",
  "token_type": "bearer"
}
```

**Salve o token** para usar nas próximas chamadas!

### 3. Use o token nas requisições

```bash
TOKEN="seu_token_aqui"

# Listar clientes
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/clientes

# Ver KPIs
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/kpis/produtos-mais-vendidos
```

## 📱 Teste no Navegador

1. Abra: http://localhost:8000/docs
2. Clique em "Authorize" (cadeado verde)
3. Faça login:
   - username: `maria`
   - password: `senha123`
4. Explore os endpoints clicando em "Try it out"

## 🚀 Próximos Passos

### Opção A: Criar Frontend Web (React/Next.js)
Você disse que quer móvel e web integrados. Posso criar:
- Dashboard web para desktop
- Telas de CRUD
- Gráficos de KPIs
- Integração com essa API

### Opção B: Criar App Mobile (React Native)
- App iOS/Android
- Telas para funcionários ou clientes
- Scanner de código de barras
- Notificações push
- Integração com essa API

### Opção C: Ambos (Stack Completa)
- API ✅ (pronta)
- Web (React/Next.js)
- Mobile (React Native)
- Docker Compose (orquestra tudo)

## 📊 Endpoints Disponíveis

### Autenticação
- POST `/auth/login` - Login
- GET `/auth/me` - Dados do usuário logado

### Clientes
- GET `/clientes` - Lista clientes
- POST `/clientes` - Cria cliente
- GET `/clientes/{id}` - Busca cliente
- GET `/clientes/{id}/pets` - Pets do cliente
- PUT `/clientes/{id}` - Atualiza cliente
- DELETE `/clientes/{id}` - Soft delete

### Vendas
- POST `/vendas` - Registra venda (procedure)
- GET `/vendas` - Lista vendas
- GET `/vendas/{id}` - Detalhes

### Agendamentos
- POST `/agendamentos` - Cria (procedure)
- GET `/agendamentos` - Lista (filtros: ?data=2025-11-10&status=Agendado)
- GET `/agendamentos/hoje` - View de hoje
- PATCH `/agendamentos/{id}/status` - Atualiza status

### KPIs
- GET `/kpis/vendas-por-funcionario`
- GET `/kpis/produtos-mais-vendidos`
- GET `/kpis/receita-diaria`
- GET `/kpis/top-clientes`
- GET `/kpis/agendamentos-resumo`
- GET `/kpis/estoque-baixo`
- GET `/kpis/produtos-vencidos`
- GET `/kpis/historico-rupturas`

## 🛑 Parar a API

```bash
# Encontrar processo
lsof -ti:8000

# Matar processo
lsof -ti:8000 | xargs kill -9
```

## 🔄 Reiniciar a API

```bash
cd "/Users/darlan/novo projeto/api"
source venv/bin/activate
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

## ❓ O Que Quer Fazer Agora?

**Digite:**
- **"web"** → Crio frontend web completo
- **"mobile"** → Crio app React Native
- **"ambos"** → Stack completa integrada
- **"testar"** → Te ajudo a testar mais endpoints
