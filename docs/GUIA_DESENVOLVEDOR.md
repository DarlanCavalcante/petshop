# 💻 GUIA DO DESENVOLVEDOR - Sistema Petshop

**Nível de Acesso:** Desenvolvedor / Engenheiro de Software  
**Setor:** TI / Desenvolvimento  
**Última Atualização:** 11/11/2025

---

## 📋 ÍNDICE

1. [Arquitetura do Sistema](#arquitetura-do-sistema)
2. [Setup Ambiente de Desenvolvimento](#setup-ambiente-de-desenvolvimento)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Como Criar Novos Endpoints](#como-criar-novos-endpoints)
5. [Sistema de Validação](#sistema-de-validação)
6. [Logging e Debugging](#logging-e-debugging)
7. [Testes](#testes)
8. [Boas Práticas](#boas-práticas)
9. [Deploy](#deploy)

---

## 🏗️ ARQUITETURA DO SISTEMA

### Stack Tecnológico

**Backend:**
- FastAPI 0.115.5 (Python 3.11+)
- SQLAlchemy 2.0.35 (ORM)
- MariaDB 11.4
- JWT para autenticação
- Pydantic para validação

**Frontend:**
- Next.js 16.0.1 (React 19)
- TypeScript 5+
- TailwindCSS 4
- Framer Motion

**DevOps:**
- Docker & Docker Compose
- Flyway (Migrations)
- Bash scripts (Backup/Deploy)

### Padrão de Arquitetura

```
┌─────────────┐
│   Frontend  │  Next.js (SSR/CSR)
└──────┬──────┘
       │ HTTP/REST
┌──────▼──────┐
│     API     │  FastAPI (Python)
│ ┌─────────┐ │
│ │Middleware│ │  Rate Limit, Security, Logging
│ └────┬────┘ │
│ ┌────▼────┐ │
│ │ Routes  │ │  Endpoints organizados
│ └────┬────┘ │
│ ┌────▼────┐ │
│ │Database │ │  SQLAlchemy
│ └────┬────┘ │
└──────┬──────┘
┌──────▼──────┐
│   MariaDB   │  Multi-tenant (databases separados)
└─────────────┘
```

### Fluxo de Requisição

```
1. Cliente → Frontend (Next.js)
2. Frontend → API Client (lib/api.ts)
3. API Client → FastAPI Backend
4. FastAPI → Middlewares (Security, Logging, Rate Limit)
5. Middlewares → Route Handler
6. Route → Validators (Pydantic)
7. Validators OK → Database Query (SQLAlchemy)
8. Database → Response
9. Response → Logger
10. Response → Cliente
```

---

## 🚀 SETUP AMBIENTE DE DESENVOLVIMENTO

### Pré-requisitos

```bash
✅ Python 3.11+ (recomendado 3.12)
✅ Node.js 20+ e npm/yarn
✅ Docker Desktop
✅ Git
✅ VSCode (recomendado) com extensões:
   - Python
   - Pylance
   - Docker
   - ESLint
   - TypeScript
```

### 1. Clonar e Configurar

```bash
# Clone
git clone https://github.com/DarlanCavalcante/petshop.git
cd petshop

# Copiar .env
cp .env.example .env
cp api/.env.example api/.env

# Editar .env com configurações de dev
```

**.env (desenvolvimento):**
```bash
MYSQL_ROOT_PASSWORD=dev123
SECRET_KEY=dev-secret-key-change-in-production-32chars-minimum
DEBUG=True
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 2. Setup Backend (Python)

```bash
cd api

# Criar ambiente virtual
python -m venv venv

# Ativar
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Instalar ferramentas de desenvolvimento
pip install pytest pytest-asyncio httpx black flake8 mypy
```

### 3. Setup Frontend (Next.js)

```bash
cd web

# Instalar dependências
npm install

# OU com yarn
yarn install
```

### 4. Iniciar Banco de Dados

```bash
# Na raiz do projeto
docker-compose -f docker-compose.windows.yml up -d mariadb

# Aguardar banco ficar healthy
docker ps

# Aplicar migrations
cd db/migrations
# Executar cada arquivo V*.sql manualmente ou usar Flyway
```

### 5. Rodar em Modo Dev

**Backend (com hot reload):**
```bash
cd api
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend (com hot reload):**
```bash
cd web
npm run dev
```

**Acessar:**
- API: http://localhost:8000
- Docs: http://localhost:8000/docs (apenas em dev)
- Frontend: http://localhost:3000

---

## 📁 ESTRUTURA DO PROJETO

```
petshop/
├── api/                          # Backend FastAPI
│   ├── src/
│   │   ├── __init__.py
│   │   ├── main.py              # Aplicação principal
│   │   ├── config.py            # Configurações (Pydantic Settings)
│   │   ├── database.py          # Conexão DB e multi-tenant
│   │   ├── auth.py              # JWT e autenticação
│   │   ├── schemas.py           # Modelos Pydantic (request/response)
│   │   ├── validators.py        # ✨ NOVO: Validadores centralizados
│   │   ├── logger.py            # ✨ NOVO: Logging estruturado
│   │   ├── middleware.py        # ✨ NOVO: Middlewares de segurança
│   │   ├── tenant.py            # Multi-tenant logic
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── auth.py          # /auth/* (login)
│   │       ├── clientes.py      # /clientes/*
│   │       ├── produtos.py      # /produtos/*
│   │       ├── vendas.py        # /vendas/*
│   │       ├── agendamentos.py  # /agendamentos/*
│   │       ├── servicos.py      # /servicos/*
│   │       ├── pacotes.py       # /pacotes/*
│   │       ├── kpis.py          # /kpis/* (relatórios)
│   │       └── empresas.py      # /empresas/* (multi-tenant)
│   ├── requirements.txt         # Dependências Python
│   ├── Dockerfile
│   └── databases.json           # Mapeamento de empresas (não commitar)
│
├── web/                          # Frontend Next.js
│   ├── app/                     # App Router (Next.js 13+)
│   │   ├── layout.tsx           # Layout global
│   │   ├── page.tsx             # Home
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── clientes/
│   │   ├── produtos/
│   │   ├── vendas/
│   │   ├── agendamentos/
│   │   └── kpis/
│   ├── components/              # Componentes reutilizáveis
│   │   └── AppLayout.tsx
│   ├── lib/
│   │   ├── api.ts               # ✨ NOVO: Cliente API robusto
│   │   └── config.ts            # Configurações frontend
│   ├── package.json
│   └── Dockerfile
│
├── db/                           # Database
│   └── migrations/              # Flyway migrations
│       ├── V1__baseline_schema.sql
│       ├── V2__indices_e_constraints.sql
│       └── ...
│
├── scripts/                      # Scripts utilitários
│   ├── backup_database.sh       # ✨ NOVO: Backup automático
│   └── restore_database.sh      # ✨ NOVO: Restaurar backup
│
├── docs/                         # 📚 Documentação
│   ├── GUIA_ADMINISTRADOR.md
│   ├── GUIA_DESENVOLVEDOR.md    # Este arquivo
│   ├── GUIA_GERENTE.md
│   └── GUIA_ATENDENTE.md
│
├── docker-compose.windows.yml
├── .env.example
└── README.md
```

---

## 🛠️ COMO CRIAR NOVOS ENDPOINTS

### Exemplo Completo: Endpoint de Fornecedores

#### 1. Criar Schema (Pydantic)

**`api/src/schemas.py`:**
```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class FornecedorBase(BaseModel):
    nome: str = Field(..., min_length=3, max_length=100)
    cnpj: str = Field(..., pattern=r'^\d{14}$')
    telefone: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = None
    endereco: Optional[str] = None

class FornecedorCreate(FornecedorBase):
    pass

class FornecedorUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=3)
    telefone: Optional[str] = None
    email: Optional[str] = None
    endereco: Optional[str] = None

class FornecedorResponse(FornecedorBase):
    id_fornecedor: int
    ativo: bool
    data_cadastro: datetime
    
    class Config:
        from_attributes = True
```

#### 2. Criar Rota

**`api/src/routes/fornecedores.py`:**
```python
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from slowapi import Limiter
from slowapi.util import get_remote_address

from src.database import get_db
from src.schemas import FornecedorCreate, FornecedorUpdate, FornecedorResponse
from src.routes.auth import get_current_user_id
from src.validators import PaginationParams
from src.logger import setup_logger, log_business_event

router = APIRouter(prefix="/fornecedores", tags=["Fornecedores"])
logger = setup_logger(__name__)
limiter = Limiter(key_func=get_remote_address)

@router.post("", response_model=FornecedorResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
def criar_fornecedor(
    request: Request,
    fornecedor: FornecedorCreate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user_id)
):
    """
    Cria novo fornecedor
    
    - **nome**: Nome do fornecedor (3-100 caracteres)
    - **cnpj**: CNPJ com 14 dígitos
    - **telefone**: Telefone de contato
    """
    try:
        query = text("""
            INSERT INTO fornecedores (nome, cnpj, telefone, email, endereco, ativo)
            VALUES (:nome, :cnpj, :telefone, :email, :endereco, TRUE)
        """)
        
        result = db.execute(query, {
            "nome": fornecedor.nome,
            "cnpj": fornecedor.cnpj,
            "telefone": fornecedor.telefone,
            "email": fornecedor.email,
            "endereco": fornecedor.endereco
        })
        db.commit()
        
        # Pega ID inserido
        id_fornecedor = result.lastrowid
        
        # Log de evento de negócio
        log_business_event(
            logger=logger,
            event_type="fornecedor_criado",
            description=f"Fornecedor '{fornecedor.nome}' criado",
            metadata={"id_fornecedor": id_fornecedor, "user_id": current_user}
        )
        
        # Busca fornecedor criado
        query_select = text("SELECT * FROM fornecedores WHERE id_fornecedor = :id")
        fornecedor_db = db.execute(query_select, {"id": id_fornecedor}).fetchone()
        
        return dict(fornecedor_db._mapping)
        
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao criar fornecedor: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao criar fornecedor: {str(e)}"
        )

@router.get("", response_model=List[FornecedorResponse])
@limiter.limit("100/minute")
def listar_fornecedores(
    request: Request,
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user_id)
):
    """Lista todos os fornecedores ativos"""
    query = text("""
        SELECT * FROM fornecedores 
        WHERE ativo = TRUE 
        ORDER BY nome 
        LIMIT :limit OFFSET :skip
    """)
    
    result = db.execute(query, {
        "limit": pagination.limit,
        "skip": pagination.skip
    }).fetchall()
    
    return [dict(row._mapping) for row in result]

@router.get("/{id_fornecedor}", response_model=FornecedorResponse)
def obter_fornecedor(
    id_fornecedor: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user_id)
):
    """Busca fornecedor por ID"""
    query = text("SELECT * FROM fornecedores WHERE id_fornecedor = :id")
    fornecedor = db.execute(query, {"id": id_fornecedor}).fetchone()
    
    if not fornecedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fornecedor não encontrado"
        )
    
    return dict(fornecedor._mapping)

@router.put("/{id_fornecedor}", response_model=FornecedorResponse)
@limiter.limit("30/minute")
def atualizar_fornecedor(
    request: Request,
    id_fornecedor: int,
    fornecedor: FornecedorUpdate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user_id)
):
    """Atualiza dados do fornecedor"""
    # Verifica se existe
    check_query = text("SELECT id_fornecedor FROM fornecedores WHERE id_fornecedor = :id")
    exists = db.execute(check_query, {"id": id_fornecedor}).fetchone()
    
    if not exists:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    
    # Monta query dinâmica (apenas campos fornecidos)
    update_fields = []
    params = {"id": id_fornecedor}
    
    if fornecedor.nome:
        update_fields.append("nome = :nome")
        params["nome"] = fornecedor.nome
    if fornecedor.telefone:
        update_fields.append("telefone = :telefone")
        params["telefone"] = fornecedor.telefone
    if fornecedor.email is not None:
        update_fields.append("email = :email")
        params["email"] = fornecedor.email
    if fornecedor.endereco is not None:
        update_fields.append("endereco = :endereco")
        params["endereco"] = fornecedor.endereco
    
    if not update_fields:
        raise HTTPException(400, "Nenhum campo para atualizar")
    
    query = text(f"""
        UPDATE fornecedores 
        SET {', '.join(update_fields)} 
        WHERE id_fornecedor = :id
    """)
    
    try:
        db.execute(query, params)
        db.commit()
        
        # Retorna atualizado
        return obter_fornecedor(id_fornecedor, db, current_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(400, f"Erro ao atualizar: {str(e)}")

@router.delete("/{id_fornecedor}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
def desativar_fornecedor(
    request: Request,
    id_fornecedor: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user_id)
):
    """Desativa fornecedor (soft delete)"""
    query = text("UPDATE fornecedores SET ativo = FALSE WHERE id_fornecedor = :id")
    
    try:
        result = db.execute(query, {"id": id_fornecedor})
        db.commit()
        
        if result.rowcount == 0:
            raise HTTPException(404, "Fornecedor não encontrado")
            
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(400, f"Erro ao desativar: {str(e)}")
```

#### 3. Registrar Rota no Main

**`api/src/main.py`:**
```python
from src.routes import (
    auth, clientes, vendas, agendamentos, 
    kpis, produtos, servicos, pacotes,
    fornecedores  # ← Adicionar
)

# ...

# Rotas
app.include_router(auth.router)
app.include_router(clientes.router)
# ... outras rotas
app.include_router(fornecedores.router)  # ← Adicionar
```

#### 4. Criar Migration SQL

**`db/migrations/V15__fornecedores.sql`:**
```sql
-- Tabela de fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
    id_fornecedor INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cnpj CHAR(14) NOT NULL UNIQUE,
    telefone VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    endereco TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fornecedor_nome (nome),
    INDEX idx_fornecedor_cnpj (cnpj)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar coluna id_fornecedor em produtos
ALTER TABLE produtos 
ADD COLUMN id_fornecedor INT,
ADD CONSTRAINT fk_produto_fornecedor 
    FOREIGN KEY (id_fornecedor) 
    REFERENCES fornecedores(id_fornecedor);
```

#### 5. Testar Endpoint

```bash
# Criar fornecedor
curl -X POST http://localhost:8000/fornecedores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "nome": "Fornecedor Teste",
    "cnpj": "12345678901234",
    "telefone": "(11) 98765-4321",
    "email": "contato@fornecedor.com"
  }'

# Listar
curl http://localhost:8000/fornecedores \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## ✅ SISTEMA DE VALIDAÇÃO

### Usando Validadores Prontos

**`api/src/validators.py`** contém validadores reutilizáveis:

```python
from src.validators import (
    PaginationParams,      # skip, limit validados
    LimitParam,            # limit (1-100)
    EmailValidator,        # email válido
    CPFValidator,          # CPF válido
    PhoneNumber,           # telefone brasileiro
    PasswordStrength,      # senha forte
    PriceValidator,        # preço > 0
    PercentageValidator,   # 0-100%
    QuantityValidator,     # quantidade válida
)

# Uso em route
@router.get("/clientes")
def listar(
    pagination: PaginationParams = Depends(),  # ← Validação automática!
    db: Session = Depends(get_db)
):
    # pagination.skip e pagination.limit já estão validados
    pass
```

### Criar Validador Customizado

```python
# Em validators.py
from pydantic import BaseModel, Field, field_validator

class PlacaVeicular(BaseModel):
    placa: str = Field(..., pattern=r'^[A-Z]{3}\d{4}$')
    
    @field_validator('placa')
    @classmethod
    def validate_placa(cls, v: str) -> str:
        v = v.upper().replace('-', '')
        if not re.match(r'^[A-Z]{3}\d{4}$', v):
            raise ValueError('Placa inválida (formato: ABC1234)')
        return v

# Uso
from src.validators import PlacaVeicular

class VeiculoCreate(PlacaVeicular):
    modelo: str
    ano: int = Field(..., ge=1900, le=2025)
```

---

## 📝 LOGGING E DEBUGGING

### Logging Estruturado

```python
from src.logger import (
    setup_logger,
    log_request,
    log_database_query,
    log_security_event,
    log_business_event
)

logger = setup_logger(__name__)

# Log simples
logger.info("Operação realizada", extra={"user_id": 123, "action": "create"})

# Log de evento de segurança
log_security_event(
    logger=logger,
    event_type="unauthorized_access",
    description="Tentativa de acesso sem permissão",
    severity="WARNING",
    user_id=123,
    ip_address="192.168.1.100"
)

# Log de evento de negócio
log_business_event(
    logger=logger,
    event_type="venda_realizada",
    description="Venda de R$ 150,00",
    metadata={"valor": 150.00, "id_venda": 456}
)
```

### Debug com VSCode

**`.vscode/launch.json`:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "src.main:app",
        "--reload",
        "--host",
        "0.0.0.0",
        "--port",
        "8000"
      ],
      "jinja": true,
      "justMyCode": false,
      "env": {
        "PYTHONPATH": "${workspaceFolder}/api"
      }
    }
  ]
}
```

---

## 🧪 TESTES

### Setup de Testes

```bash
cd api
pip install pytest pytest-asyncio httpx pytest-cov
```

### Criar Teste de Endpoint

**`api/tests/test_fornecedores.py`:**
```python
import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_criar_fornecedor():
    # Login primeiro
    response = client.post("/auth/login", data={
        "username": "admin",
        "password": "admin123"
    }, headers={"X-Empresa": "teste"})
    
    token = response.json()["access_token"]
    
    # Criar fornecedor
    response = client.post(
        "/fornecedores",
        json={
            "nome": "Fornecedor Teste",
            "cnpj": "12345678901234",
            "telefone": "11987654321",
            "email": "teste@fornecedor.com"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["nome"] == "Fornecedor Teste"
    assert "id_fornecedor" in data

def test_listar_fornecedores():
    # Similar ao acima
    pass

def test_validacao_cnpj_invalido():
    response = client.post("/fornecedores", json={
        "nome": "Teste",
        "cnpj": "123",  # CNPJ inválido
        "telefone": "11987654321"
    })
    
    assert response.status_code == 422  # Validation error
```

### Rodar Testes

```bash
# Todos os testes
pytest

# Com coverage
pytest --cov=src --cov-report=html

# Teste específico
pytest tests/test_fornecedores.py::test_criar_fornecedor

# Verbose
pytest -v -s
```

---

## 📚 BOAS PRÁTICAS

### 1. Sempre Use Type Hints

```python
# ✅ BOM
def calcular_desconto(valor: float, percentual: float) -> float:
    return valor * (percentual / 100)

# ❌ RUIM
def calcular_desconto(valor, percentual):
    return valor * (percentual / 100)
```

### 2. Validação com Pydantic

```python
# ✅ BOM - Validação automática
class ProdutoCreate(BaseModel):
    nome: str = Field(..., min_length=3)
    preco: float = Field(..., gt=0)

# ❌ RUIM - Validação manual
def criar_produto(nome: str, preco: float):
    if len(nome) < 3:
        raise ValueError("Nome muito curto")
    if preco <= 0:
        raise ValueError("Preço inválido")
```

### 3. Queries Parametrizadas SEMPRE

```python
# ✅ BOM - Protegido contra SQL Injection
query = text("SELECT * FROM produtos WHERE id = :id")
result = db.execute(query, {"id": produto_id})

# ❌ RUIM - Vulnerável a SQL Injection
query = f"SELECT * FROM produtos WHERE id = {produto_id}"
result = db.execute(query)
```

### 4. Logging em Produção

```python
# ✅ BOM - Log estruturado
logger.info("Produto criado", extra={"id": 123, "nome": "Produto X"})

# ❌ RUIM - Print
print(f"Produto {nome} criado")
```

### 5. Tratamento de Erros

```python
# ✅ BOM
try:
    db.execute(query)
    db.commit()
except IntegrityError as e:
    db.rollback()
    logger.error(f"Violação de integridade: {e}")
    raise HTTPException(400, "CNPJ já cadastrado")
except Exception as e:
    db.rollback()
    logger.error(f"Erro inesperado: {e}")
    raise HTTPException(500, "Erro interno")

# ❌ RUIM - Catch genérico sem log
try:
    db.execute(query)
except:
    pass
```

### 6. Soft Delete em vez de DELETE

```python
# ✅ BOM - Dados podem ser recuperados
UPDATE clientes SET ativo = FALSE WHERE id = 123

# ❌ RUIM - Perda de dados
DELETE FROM clientes WHERE id = 123
```

---

## 🚀 DEPLOY

### Build para Produção

```bash
# Backend
cd api
docker build -t petshop-api:2.0.0 .

# Frontend
cd web
docker build -t petshop-frontend:2.0.0 .
```

### Variáveis de Ambiente - Produção

```bash
# .env.production
DEBUG=False
SECRET_KEY=chave-aleatoria-de-64-caracteres-minimo
MYSQL_ROOT_PASSWORD=senha-forte-producao
CORS_ORIGINS=https://meudominio.com
```

### Deploy com Docker Compose

```bash
# Criar .env de produção
# Fazer build das imagens
# Subir containers

docker-compose -f docker-compose.production.yml up -d
```

---

## 📞 RECURSOS ADICIONAIS

- 📘 [FastAPI Docs](https://fastapi.tiangolo.com/)
- 📘 [Pydantic Docs](https://docs.pydantic.dev/)
- 📘 [SQLAlchemy Docs](https://docs.sqlalchemy.org/)
- 📘 [Next.js Docs](https://nextjs.org/docs)
- 📄 [Guia do Administrador](./GUIA_ADMINISTRADOR.md)
- 📄 [Soluções Definitivas](../SOLUCOES_DEFINITIVAS.md)

---

**🎯 REGRA DE OURO:**
> "Código é escrito uma vez, mas lido mil vezes. Escreva pensando em quem vai ler."

---

**Última Atualização:** 11/11/2025  
**Versão:** 2.0.0
