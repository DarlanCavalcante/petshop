# Petshop API

API REST construída com FastAPI para gestão completa do petshop, integrada ao banco MySQL (schema version 11).

## 🚀 Quick Start

### Demo pronta: empresa "teste"

Passos rápidos para rodar a demo completa (backend + frontend) usando o banco por empresa "teste":

1) Criar e popular o banco de demonstração

```bash
cd api
source venv/bin/activate
mysql -u root -p34461011 < scripts/create_petshop_empresa_teste.sql
```

2) Subir a API

```bash
uvicorn src.main:app --reload
```

3) Abrir o frontend

```bash
cd ../web
npm install
npm run dev
```

4) Testar

- Acesse http://localhost:3000
- Vá em Login e use: empresa "teste", usuário "admin", senha "admin123"
- Acesse Produtos para listar itens do estoque
- Acesse Venda para registrar uma venda
- Acesse Agendamentos para ver os de hoje e criar novo

Se preferir testar via script:

```bash
cd api
source venv/bin/activate
python scripts/test_empresa_teste.py
```

### 1. Instalar Dependências

```bash
cd api
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou: venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

### 2. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env` e ajuste se necessário:

```bash
cp .env.example .env
```

**Importante**: Certifique-se que o MySQL está rodando e a senha está correta em `DATABASE_URL`.

### 3. Rodar a API

```bash
# Opção 1: Via Python
python -m src.main

# Opção 2: Via Uvicorn
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

## 🏢 Múltiplos Bancos por Empresa (Bancos Separados)

Esta API suporta a abordagem "banco por empresa". Cada petshop possui seu próprio banco MySQL com o mesmo schema (migrações V1–V11). A seleção do banco ocorre via header `X-Empresa` ou pelo campo `empresa` gravado no JWT no login.

### 1. Definição dos Bancos

Arquivo `api/databases.json` (exemplo):

```json
{
  "default": "mysql+pymysql://root:34461011@localhost:3306/petshop",
  "empresa_a": "mysql+pymysql://root:34461011@localhost:3306/petshop_empresa_a",
  "empresa_b": "mysql+pymysql://root:34461011@localhost:3306/petshop_empresa_b"
}
```

Crie cada banco e aplique as migrações:

```bash
mysql -u root -p34461011 -e "CREATE DATABASE IF NOT EXISTS petshop_empresa_a;"
mysql -u root -p34461011 -e "CREATE DATABASE IF NOT EXISTS petshop_empresa_b;"

flyway -user=flyway -password='Flyway2025!' -url=jdbc:mysql://localhost:3306/petshop_empresa_a migrate
flyway -user=flyway -password='Flyway2025!' -url=jdbc:mysql://localhost:3306/petshop_empresa_b migrate
```

### 2. Login Selecionando Empresa

Envie o header `X-Empresa` no login para direcionar ao banco correto:

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "X-Empresa: empresa_a" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=senha"
```

O token retornado incluirá o campo `empresa` com o valor usado (`empresa_a`).

### 3. Requisições Subsequentes

Inclua novamente `X-Empresa` para alternar de banco. Caso omita, cai no banco `default`.

```bash
curl http://localhost:8000/clientes \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "X-Empresa: empresa_b"
```

### 4. Teste Automático Multi-Banco

Script: `scripts/test_multibanco.py` (usa `requests`).

```bash
python scripts/test_multibanco.py
```

### 5. Nova Empresa Passo a Passo

```bash
mysql -u root -p34461011 -e "CREATE DATABASE petshop_empresa_nova;"
flyway -user=flyway -password='Flyway2025!' -url=jdbc:mysql://localhost:3306/petshop_empresa_nova migrate
```

Adicionar em `databases.json`:

```json
"empresa_nova": "mysql+pymysql://root:34461011@localhost:3306/petshop_empresa_nova"
```

Reiniciar API.

### 6. Boas Práticas

- Garanta usuário (funcionário) inicial em cada banco para permitir login.
- Mantenha `databases.json` versionado fora de repositório público (se contiver credenciais sensíveis).
- Considere script de SEED para padronizar dados iniciais.

### 7. Próximos Passos

- Endpoint administrativo listando códigos de empresas.
- Health detalhado checando cada banco.
- Rotinas de backup independentes por empresa.


A API estará disponível em:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health check**: http://localhost:8000/health

## 📚 Documentação da API

### Autenticação

Todas as rotas (exceto `/auth/login`) requerem token JWT no header:

```
Authorization: Bearer <seu_token>
```

**Login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=maria&password=senha-hash-aqui"
```

**Resposta:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLC...",
  "token_type": "bearer"
}
```

### Endpoints Principais

#### Clientes
- `GET /clientes` - Lista clientes
- `POST /clientes` - Cria cliente
- `GET /clientes/{id}` - Busca cliente
- `GET /clientes/{id}/pets` - Lista pets do cliente
- `PUT /clientes/{id}` - Atualiza cliente
- `DELETE /clientes/{id}` - Soft delete

#### Vendas
- `POST /vendas` - Registra venda (usa procedure `registrar_venda`)
- `GET /vendas` - Lista vendas
- `GET /vendas/{id}` - Detalhes da venda

**Exemplo POST /vendas:**
```json
{
  "id_cliente": 1,
  "id_funcionario": 1,
  "itens": [
    {"id_produto": 15, "qtd": 2, "preco": 120.00},
    {"id_produto": 16, "qtd": 1, "preco": 25.00}
  ],
  "desconto": 10.00
}
```

#### Agendamentos
- `POST /agendamentos` - Cria agendamento (usa procedure `agendar_servico`)
- `GET /agendamentos` - Lista agendamentos (filtros: `?data=2025-11-10&status=Agendado`)
- `GET /agendamentos/hoje` - Agendamentos de hoje (view)
- `PATCH /agendamentos/{id}/status` - Atualiza status

#### KPIs
- `GET /kpis/vendas-por-funcionario`
- `GET /kpis/produtos-mais-vendidos`
- `GET /kpis/receita-diaria`
- `GET /kpis/top-clientes`
- `GET /kpis/agendamentos-resumo`
- `GET /kpis/estoque-baixo`
- `GET /kpis/produtos-vencidos`
- `GET /kpis/historico-rupturas`

## 🔐 Segurança

### Senhas

**IMPORTANTE**: No momento, a API espera senhas em **bcrypt hash** no banco. 

Se suas senhas estão em plain text, você tem duas opções:

**Opção 1 - Gerar hashes** (recomendado):
```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hash = pwd_context.hash("sua_senha_aqui")
# UPDATE funcionarios SET senha = '<hash>' WHERE login = 'maria'
```

**Opção 2 - Desabilitar temporariamente** (desenvolvimento apenas):
Edite `src/routes/auth.py` linha ~25, substitua:
```python
if not verify_password(form_data.password, result.senha):
```
por:
```python
if form_data.password != result.senha:  # APENAS PARA TESTES
```

### JWT

Token expira em 60 minutos (configurável em `.env`).

## 🐳 Docker

```bash
# Build
docker build -t petshop-api .

# Run
docker run -p 8000:8000 --env-file .env petshop-api
```

## 🧪 Testes

```bash
# Testar health check
curl http://localhost:8000/health

# Testar login (ajuste credenciais)
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=maria&password=senha-hash-aqui"
```

## 📂 Estrutura

```
api/
├── src/
│   ├── main.py           # Aplicação FastAPI principal
│   ├── config.py         # Configurações e .env
│   ├── database.py       # Conexão SQLAlchemy
│   ├── auth.py           # JWT e bcrypt
│   ├── schemas.py        # Modelos Pydantic (validação)
│   └── routes/
│       ├── auth.py       # Login e autenticação
│       ├── clientes.py   # CRUD clientes
│       ├── vendas.py     # Vendas (procedure)
│       ├── agendamentos.py
│       └── kpis.py       # Views de relatórios
├── tests/                # Testes (futuro)
├── requirements.txt
├── Dockerfile
└── .env
```

## 🔗 Integração com Frontend

### React/Next.js exemplo:

```typescript
const API_URL = 'http://localhost:8000';

// Login
const login = async (username: string, password: string) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  localStorage.setItem('token', data.access_token);
};

// Listar clientes
const getClientes = async () => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/clientes`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await res.json();
};
```

### React Native exemplo:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://SEU_IP_LOCAL:8000'; // Ex: 192.168.1.10:8000

export const api = {
  login: async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    await AsyncStorage.setItem('token', data.access_token);
    return data;
  },
  
  getClientes: async () => {
    const token = await AsyncStorage.getItem('token');
    const res = await fetch(`${API_URL}/clientes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  }
};
```

## 🐛 Troubleshooting

### Erro "Can't connect to MySQL"
- Verifique se o MySQL está rodando: `mysql -u root -p`
- Confira o `DATABASE_URL` no `.env`
- Teste conexão: `curl http://localhost:8000/health`

### Erro "401 Unauthorized"
- Verifique se o token está sendo enviado no header
- Token pode ter expirado (faça login novamente)

### Erro "Procedure does not exist"
- Certifique-se que as migrações V1-V11 foram aplicadas
- Rode: `cd ../database && ./flyway_info.sh`

## 📈 Próximos Passos

- [ ] Adicionar endpoint de estoque (entrada via procedure V9)
- [ ] Implementar paginação nas listagens
- [ ] Adicionar filtros avançados
- [ ] Testes automatizados (pytest)
- [ ] Rate limiting
- [ ] Logs estruturados
- [ ] Deploy em produção (Heroku/Railway/DigitalOcean)

## 📝 Licença

Uso interno / educacional.
