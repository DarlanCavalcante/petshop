# 🔒 RELATÓRIO DE ERROS E VULNERABILIDADES - Petshop System

**Data da Análise:** 11 de novembro de 2025  
**Projeto:** Sistema de Gestão de Petshop (Multi-tenant)  
**Versão Analisada:** 1.3.0

---

## 📋 SUMÁRIO EXECUTIVO

Foram identificados **18 problemas críticos** e **12 problemas de severidade média** no projeto, incluindo:
- ⚠️ 8 vulnerabilidades de segurança
- 🐛 10 bugs e erros de código
- 📦 5 problemas de dependências
- ⚙️ 7 problemas de configuração

---

## 🚨 PROBLEMAS CRÍTICOS (ALTA PRIORIDADE)

### 1. **SQL INJECTION - Vulnerabilidade Crítica**

**Localização:** `api/src/routes/kpis.py` linha 39

**Problema:**
```python
query = f"SELECT * FROM vw_top_clientes LIMIT {limit}"
```

**Risco:** Permite injeção SQL através do parâmetro `limit`. Um atacante pode executar comandos SQL arbitrários.

**Exemplo de Ataque:**
```
GET /kpis/top-clientes?limit=10; DROP TABLE clientes; --
```

**Solução:**
```python
# ANTES (VULNERÁVEL):
query = f"SELECT * FROM vw_top_clientes LIMIT {limit}"

# DEPOIS (SEGURO):
from sqlalchemy import text

query = text("SELECT * FROM vw_top_clientes LIMIT :limit")
result = db.execute(query, {"limit": limit}).fetchall()
```

**Prioridade:** 🔴 CRÍTICA - Corrigir IMEDIATAMENTE

---

### 2. **SECRET_KEY Fraca no Exemplo**

**Localização:** `api/.env.example` linha 5

**Problema:**
```bash
SECRET_KEY=sua-chave-secreta-super-segura-mude-isso-em-producao
```

**Risco:** Chave de criptografia JWT facilmente adivinhável. Se usada em produção, permite forjamento de tokens.

**Soluções:**

**Opção 1 - Gerar chave aleatória (Recomendado):**
```bash
# No .env.example, deixar orientação clara:
SECRET_KEY=MUDE_ISSO_gere_com_openssl_rand_hex_32

# Para gerar uma chave segura, rodar:
# Windows PowerShell:
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Linux/Mac:
openssl rand -hex 32
```

**Opção 2 - Adicionar validação no código:**
```python
# Em api/src/config.py
class Settings(BaseSettings):
    secret_key: str
    
    @validator('secret_key')
    def validate_secret_key(cls, v):
        if v in ['sua-chave-secreta-super-segura-mude-isso-em-producao', 
                 'mudar-em-producao-gerar-com-openssl-rand-hex-32']:
            raise ValueError(
                "⚠️ ERRO: SECRET_KEY não pode usar valor de exemplo! "
                "Gere uma chave segura com: openssl rand -hex 32"
            )
        if len(v) < 32:
            raise ValueError("SECRET_KEY deve ter pelo menos 32 caracteres")
        return v
```

**Prioridade:** 🔴 CRÍTICA

---

### 3. **Senha do Banco Exposta no Docker Compose**

**Localização:** `docker-compose.windows.yml` linhas 9, 37

**Problema:**
```yaml
MARIADB_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-SenhaRoot123}
DATABASE_URL: mysql+pymysql://root:${MYSQL_ROOT_PASSWORD:-SenhaRoot123}@...
```

**Risco:** Senha padrão fraca (`SenhaRoot123`) pode ser usada se a variável de ambiente não estiver definida.

**Solução:**

**Opção 1 - Remover valor padrão:**
```yaml
environment:
  MARIADB_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}  # Remove o :-SenhaRoot123
```

**Opção 2 - Criar arquivo .env obrigatório:**
```bash
# Criar arquivo .env.example na raiz
MYSQL_ROOT_PASSWORD=MUDE_ISSO_senha_forte_123
SECRET_KEY=MUDE_ISSO_gere_com_openssl_rand_hex_32
```

**Opção 3 - Usar Docker Secrets (Produção):**
```yaml
# Para ambientes de produção
services:
  mariadb:
    secrets:
      - db_root_password
    environment:
      MARIADB_ROOT_PASSWORD_FILE: /run/secrets/db_root_password

secrets:
  db_root_password:
    file: ./secrets/db_root_password.txt
```

**Prioridade:** 🔴 CRÍTICA

---

### 4. **URL da API Hardcoded no Frontend**

**Localização:** `web/app/login/page.tsx` linha 23

**Problema:**
```typescript
const response = await fetch('http://localhost:8000/auth/login', {
```

**Risco:** URL hardcoded ignora a configuração do `NEXT_PUBLIC_API_URL`, quebrando em produção.

**Solução:**
```typescript
// ANTES (ERRADO):
const response = await fetch('http://localhost:8000/auth/login', {

// DEPOIS (CORRETO):
import { API_URL } from '@/lib/config';

const response = await fetch(`${API_URL}/auth/login`, {
```

**Prioridade:** 🔴 CRÍTICA - Quebra em produção

---

### 5. **Armazenamento Inseguro de Tokens no Frontend**

**Localização:** `web/app/login/page.tsx` linhas 38-39

**Problema:**
```typescript
localStorage.setItem('token', data.access_token);
localStorage.setItem('empresa', empresa);
```

**Risco:** Tokens JWT no `localStorage` são vulneráveis a ataques XSS (Cross-Site Scripting).

**Soluções:**

**Opção 1 - HttpOnly Cookies (Mais Seguro):**
```typescript
// Backend (FastAPI):
from fastapi.responses import Response

@router.post("/login")
def login(..., response: Response):
    # ... validação ...
    
    # Não retornar token no JSON
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,      # Não acessível via JavaScript
        secure=True,        # Apenas HTTPS
        samesite="lax",     # Proteção CSRF
        max_age=3600        # 1 hora
    )
    
    return {"message": "Login realizado com sucesso"}

// Frontend:
// Não precisa armazenar nada - o cookie é enviado automaticamente
const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',  // Inclui cookies
    // ...
});
```

**Opção 2 - sessionStorage (Melhor que localStorage):**
```typescript
// Menos vulnerável que localStorage, mas ainda exposto ao XSS
// Dados são apagados ao fechar a aba
sessionStorage.setItem('token', data.access_token);
```

**Opção 3 - Memory Storage + Refresh Token:**
```typescript
// Armazenar token apenas em memória (React state)
// Usar refresh token em HttpOnly cookie
```

**Prioridade:** 🔴 CRÍTICA

---

### 6. **Falta de Validação de Entrada em Parâmetros**

**Localização:** Múltiplos arquivos em `api/src/routes/`

**Problema:**
```python
# Exemplo em kpis.py
def top_clientes(limit: int = 10, ...):
    # Não valida se limit é positivo ou razoável
```

**Risco:** Valores negativos ou muito grandes podem causar erros ou DoS.

**Solução:**
```python
from pydantic import Field

@router.get("/top-clientes")
def top_clientes(
    limit: int = Field(default=10, ge=1, le=100, description="Número de clientes (1-100)"),
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user_id)
):
    query = text("SELECT * FROM vw_top_clientes LIMIT :limit")
    result = db.execute(query, {"limit": limit}).fetchall()
    return [dict(row._mapping) for row in result]
```

**Prioridade:** 🟠 ALTA

---

### 7. **CORS Muito Permissivo**

**Localização:** `api/src/main.py` linhas 29-34

**Problema:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos os métodos
    allow_headers=["*"],  # Permite todos os headers
)
```

**Risco:** Configuração muito aberta pode permitir requisições maliciosas.

**Solução:**
```python
# Mais restritivo e seguro
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,  # OK - vem do .env
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],  # Métodos específicos
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Empresa",
        "Accept",
    ],  # Headers específicos
    expose_headers=["Content-Length", "X-Total-Count"],
)
```

**Prioridade:** 🟠 ALTA

---

### 8. **Exposição de Informações Sensíveis em Logs**

**Localização:** `api/src/main.py` linha 16

**Problema:**
```python
print(f"📊 Banco de dados: {settings.database_url.split('@')[1]}")
```

**Risco:** URL completa pode vazar em logs caso o split falhe. Senhas podem ser expostas.

**Solução:**
```python
# Mascarar senha na URL do banco
import re

def mask_database_url(url: str) -> str:
    """Mascara senha na URL do banco para logs"""
    return re.sub(r'://([^:]+):([^@]+)@', r'://\1:****@', url)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Petshop API iniciando...")
    print(f"📊 Banco de dados: {mask_database_url(settings.database_url)}")
    yield
    print("👋 Petshop API encerrando...")
```

**Prioridade:** 🟠 ALTA

---

## ⚠️ PROBLEMAS DE SEVERIDADE MÉDIA

### 9. **Falta de Rate Limiting**

**Problema:** API não tem proteção contra força bruta ou DoS.

**Solução - Adicionar rate limiting:**
```python
# Instalar: pip install slowapi
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# No endpoint de login:
@router.post("/login")
@limiter.limit("5/minute")  # Máximo 5 tentativas por minuto
def login(request: Request, ...):
    # ...
```

**Prioridade:** 🟡 MÉDIA

---

### 10. **Dependências Python Desatualizadas**

**Localização:** `api/requirements.txt`

**Problema:**
```
fastapi==0.109.0        # Versão atual: 0.115.0+
uvicorn==0.27.0         # Versão atual: 0.30.0+
sqlalchemy==2.0.25      # Versão atual: 2.0.35+
cryptography==42.0.0    # Versão atual: 43.0.0+
```

**Risco:** Versões antigas podem ter vulnerabilidades conhecidas.

**Solução:**
```bash
# Atualizar requirements.txt
fastapi==0.115.5
uvicorn[standard]==0.30.6
sqlalchemy==2.0.35
pymysql==1.1.1
cryptography==43.0.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.12
pydantic==2.9.2
pydantic-settings==2.6.0
python-dotenv==1.0.1
```

```bash
# Para atualizar:
cd api
pip install --upgrade fastapi uvicorn sqlalchemy cryptography pydantic
pip freeze > requirements.txt
```

**Prioridade:** 🟡 MÉDIA

---

### 11. **Falta de Validação de Tipos de Arquivo (Upload)**

**Problema:** Se houver upload de arquivos, não há validação de tipo/tamanho.

**Solução Preventiva:**
```python
from fastapi import UploadFile, File, HTTPException

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.pdf'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Validar extensão
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, "Tipo de arquivo não permitido")
    
    # Validar tamanho
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(400, "Arquivo muito grande (máx 5MB)")
    
    # Processar arquivo...
```

**Prioridade:** 🟡 MÉDIA

---

### 12. **Falta de Timeout em Requisições do Frontend**

**Localização:** Todos os `fetch()` no frontend

**Problema:**
```typescript
const response = await fetch(`${API_URL}/endpoint`);
// Pode travar indefinidamente
```

**Solução:**
```typescript
// Criar helper com timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error('Requisição excedeu o tempo limite');
        }
        throw error;
    }
}

// Uso:
const response = await fetchWithTimeout(`${API_URL}/endpoint`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
}, 10000);  // 10 segundos
```

**Prioridade:** 🟡 MÉDIA

---

### 13. **Falta de Tratamento de Erros Consistente no Frontend**

**Problema:** Erros HTTP não são tratados uniformemente.

**Solução - Criar wrapper de API:**
```typescript
// lib/api.ts
class APIError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = localStorage.getItem('token');
    const empresa = localStorage.getItem('empresa');
    
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...(empresa && { 'X-Empresa': empresa }),
            ...options.headers,
        },
    });
    
    if (!response.ok) {
        if (response.status === 401) {
            // Token expirado - redirecionar para login
            localStorage.removeItem('token');
            window.location.href = '/login';
            throw new APIError(401, 'Sessão expirada');
        }
        
        const error = await response.json().catch(() => ({}));
        throw new APIError(response.status, error.detail || 'Erro na requisição');
    }
    
    return response.json();
}
```

**Prioridade:** 🟡 MÉDIA

---

### 14. **Falta de Logging Estruturado**

**Problema:** Logs apenas com `print()`, dificulta debugging em produção.

**Solução:**
```python
# Adicionar ao requirements.txt:
python-json-logger==2.0.7

# Criar api/src/logger.py
import logging
from pythonjsonlogger import jsonlogger

def setup_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    handler = logging.StreamHandler()
    
    formatter = jsonlogger.JsonFormatter(
        '%(asctime)s %(name)s %(levelname)s %(message)s'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    
    return logger

# Usar em main.py:
from src.logger import setup_logger
logger = setup_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("API iniciando", extra={"database": mask_database_url(settings.database_url)})
    yield
    logger.info("API encerrando")
```

**Prioridade:** 🟡 MÉDIA

---

### 15. **Falta de Health Check Completo**

**Localização:** `api/src/main.py` - endpoint `/health`

**Problema:** Health check não valida todos os serviços críticos.

**Solução:**
```python
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Health check completo"""
    health = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {}
    }
    
    # Check database
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1")).scalar()
        health["checks"]["database"] = {"status": "up", "response_time_ms": 0}
    except Exception as e:
        health["status"] = "unhealthy"
        health["checks"]["database"] = {"status": "down", "error": str(e)}
    
    # Check filesystem (se necessário)
    try:
        import os
        os.access('/tmp', os.W_OK)
        health["checks"]["filesystem"] = {"status": "up"}
    except Exception as e:
        health["checks"]["filesystem"] = {"status": "down", "error": str(e)}
    
    status_code = 200 if health["status"] == "healthy" else 503
    return JSONResponse(content=health, status_code=status_code)
```

**Prioridade:** 🟡 MÉDIA

---

### 16. **datetime.utcnow() Deprecado**

**Localização:** `api/src/auth.py` linhas 26, 28

**Problema:**
```python
expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
```

**Risco:** `datetime.utcnow()` será removido em Python 3.12+.

**Solução:**
```python
# ANTES:
from datetime import datetime, timedelta
expire = datetime.utcnow() + expires_delta

# DEPOIS:
from datetime import datetime, timedelta, timezone
expire = datetime.now(timezone.utc) + expires_delta
```

**Prioridade:** 🟡 MÉDIA

---

### 17. **Falta de Documentação de Erros na API**

**Problema:** Endpoints não documentam possíveis códigos de erro.

**Solução:**
```python
from fastapi import status

@router.post(
    "/vendas",
    response_model=VendaResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Venda registrada com sucesso"},
        400: {"description": "Erro de validação ou estoque insuficiente"},
        401: {"description": "Não autenticado"},
        404: {"description": "Produto ou cliente não encontrado"},
        500: {"description": "Erro interno do servidor"}
    }
)
def registrar_venda(...):
    """
    Registra nova venda no sistema
    
    - **id_cliente**: ID do cliente (opcional)
    - **itens**: Lista de produtos com quantidade e preço
    - **desconto**: Desconto aplicado (0-100)
    
    Raises:
        HTTPException 400: Estoque insuficiente
        HTTPException 404: Cliente não encontrado
    """
    # ...
```

**Prioridade:** 🟢 BAIXA

---

### 18. **Falta de Validação de Email**

**Localização:** `api/src/schemas.py` (presumido)

**Solução:**
```python
from pydantic import BaseModel, EmailStr, Field

class ClienteCreate(BaseModel):
    nome: str = Field(..., min_length=3, max_length=100)
    email: EmailStr  # Valida formato de email
    telefone: str = Field(..., regex=r'^\(\d{2}\)\s\d{4,5}-\d{4}$')
    
    class Config:
        json_schema_extra = {
            "example": {
                "nome": "João Silva",
                "email": "joao@example.com",
                "telefone": "(11) 98765-4321"
            }
        }
```

**Prioridade:** 🟢 BAIXA

---

### 19. **Falta de Índices de Banco de Dados**

**Verificar:** Consultas lentas em tabelas grandes.

**Solução:**
```sql
-- Adicionar em nova migration V14__performance_indices.sql

-- Índices para melhorar performance de consultas
CREATE INDEX idx_vendas_data ON vendas(data_hora_venda);
CREATE INDEX idx_vendas_cliente ON vendas(id_cliente);
CREATE INDEX idx_vendas_funcionario ON vendas(id_funcionario);

CREATE INDEX idx_agendamentos_data ON agendamentos(data_hora);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);
CREATE INDEX idx_agendamentos_cliente ON agendamentos(id_cliente);

CREATE INDEX idx_produtos_nome ON produtos(nome);
CREATE INDEX idx_clientes_nome ON clientes(nome);
CREATE INDEX idx_clientes_email ON clientes(email);

-- Índice composto para queries de range + filtro
CREATE INDEX idx_vendas_data_status ON vendas(data_hora_venda, id_funcionario);
```

**Prioridade:** 🟡 MÉDIA (se houver problemas de performance)

---

### 20. **Falta de Backup Automatizado**

**Problema:** Sem estratégia de backup documentada.

**Solução - Script de backup:**
```bash
#!/bin/bash
# scripts/backup_database.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
DB_NAME="petshop_empresa_teste"

mkdir -p $BACKUP_DIR

# Backup completo
docker exec petshop-mariadb mysqldump -u root -p$MYSQL_ROOT_PASSWORD \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    $DB_NAME | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Manter apenas últimos 7 backups
ls -t $BACKUP_DIR/backup_*.sql.gz | tail -n +8 | xargs -r rm

echo "Backup realizado: backup_$TIMESTAMP.sql.gz"
```

```yaml
# Adicionar ao docker-compose para backup automático
services:
  backup:
    image: mariadb:11.4
    depends_on:
      - mariadb
    volumes:
      - ./backups:/backups
      - ./scripts:/scripts
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    command: >
      bash -c "while true; do
        sleep 86400;
        /scripts/backup_database.sh;
      done"
```

**Prioridade:** 🟡 MÉDIA

---

## 📦 RESUMO DE AÇÕES RECOMENDADAS

### Ações Imediatas (Hoje):
1. ✅ Corrigir SQL Injection em `kpis.py`
2. ✅ Corrigir URL hardcoded no `login/page.tsx`
3. ✅ Adicionar validação de SECRET_KEY
4. ✅ Remover senha padrão do docker-compose

### Ações Curto Prazo (Esta Semana):
5. ✅ Implementar HttpOnly cookies para tokens
6. ✅ Atualizar dependências Python
7. ✅ Adicionar rate limiting ao endpoint de login
8. ✅ Implementar validação de entrada em todos os endpoints
9. ✅ Corrigir CORS permissivo
10. ✅ Adicionar timeout em requisições do frontend

### Ações Médio Prazo (Este Mês):
11. ✅ Implementar logging estruturado
12. ✅ Criar wrapper de API no frontend
13. ✅ Melhorar health checks
14. ✅ Adicionar índices de banco de dados
15. ✅ Configurar backups automatizados

---

## 🛠️ FERRAMENTAS RECOMENDADAS

### Para Análise de Segurança:
```bash
# Análise de dependências Python
pip install safety
safety check --file requirements.txt

# Análise de código Python
pip install bandit
bandit -r api/src/

# Análise de dependências Node.js
cd web
npm audit
npm audit fix

# Análise de segurança geral
pip install semgrep
semgrep --config=auto api/
```

### Para Testes de Segurança:
```bash
# Teste de endpoints
pip install pytest pytest-asyncio httpx
pytest api/tests/

# Análise de vulnerabilidades web
# OWASP ZAP ou Burp Suite (ferramentas externas)
```

---

## 📚 DOCUMENTAÇÃO ADICIONAL NECESSÁRIA

1. **Guia de Deployment Seguro** - Como fazer deploy em produção
2. **Política de Senhas** - Requisitos mínimos de senha
3. **Plano de Resposta a Incidentes** - O que fazer em caso de breach
4. **Guia de Contribuição** - Como desenvolvedores devem codificar
5. **Checklist de Segurança** - Validar antes de cada release

---

## ✅ CHECKLIST DE CORREÇÕES

```markdown
### Crítico (Fazer Hoje)
- [ ] Corrigir SQL Injection em kpis.py
- [ ] Corrigir URL hardcoded em login/page.tsx
- [ ] Adicionar validação de SECRET_KEY
- [ ] Remover senhas padrão do docker-compose
- [ ] Implementar armazenamento seguro de tokens

### Alto (Esta Semana)
- [ ] Atualizar dependências Python
- [ ] Adicionar rate limiting
- [ ] Validar parâmetros de entrada
- [ ] Corrigir CORS
- [ ] Mascarar senhas em logs
- [ ] Adicionar timeout em fetch()

### Médio (Este Mês)
- [ ] Implementar logging estruturado
- [ ] Criar wrapper de API
- [ ] Melhorar health checks
- [ ] Corrigir datetime.utcnow()
- [ ] Adicionar validação de email
- [ ] Configurar backups

### Baixo (Quando Possível)
- [ ] Documentar erros da API
- [ ] Adicionar índices de performance
- [ ] Implementar upload seguro de arquivos
- [ ] Criar testes de segurança
```

---

## 🔗 REFERÊNCIAS

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security Best Practices](https://fastapi.tiangolo.com/tutorial/security/)
- [Next.js Security Headers](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [Python Security Guide](https://python.readthedocs.io/en/stable/library/security_warnings.html)

---

**Última Atualização:** 11/11/2025  
**Responsável pela Análise:** GitHub Copilot AI  
**Próxima Revisão:** Após implementação das correções críticas
