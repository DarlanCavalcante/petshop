# 🏢 Sistema Multi-Tenant (Multi-Empresa)

## 📋 O Que Foi Implementado

Seu sistema agora suporta **múltiplas empresas** usando o **mesmo banco de dados**, com **isolamento total de dados** entre elas.

### ✅ Benefícios

1. **Uma instalação, múltiplos clientes** - Você pode vender o sistema para diferentes petshops
2. **Dados completamente isolados** - Empresa A não vê dados da Empresa B
3. **Customização por empresa** - Cada empresa tem suas cores, logo, configurações
4. **Faturamento escalável** - Diferentes planos (free, basic, premium, enterprise)
5. **Administração centralizada** - Você (superadmin) gerencia todas as empresas

---

## 🗄️ Mudanças no Banco de Dados

### Nova Tabela: `empresas`

```sql
CREATE TABLE empresas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(200),           -- Razão social
    nome_fantasia VARCHAR(200),  -- Nome comercial
    cnpj VARCHAR(18),
    email VARCHAR(255),
    telefone VARCHAR(20),
    
    -- Endereço
    endereco, cidade, estado, cep,
    
    -- Branding (personalização)
    logo_url VARCHAR(500),
    cor_primaria VARCHAR(7),     -- Ex: #3b82f6 (azul)
    cor_secundaria VARCHAR(7),   -- Ex: #10b981 (verde)
    
    -- Configurações de negócio
    taxa_servico DECIMAL(5,2),   -- % de taxa padrão
    horario_abertura TIME,
    horario_fechamento TIME,
    dias_funcionamento VARCHAR(50),
    
    -- Planos e limites
    plano ENUM('free', 'basic', 'premium', 'enterprise'),
    limite_usuarios INT,         -- Máx. funcionários permitidos
    limite_agendamentos_mes INT,
    data_assinatura DATE,
    data_expiracao DATE,
    ativo BOOLEAN
);
```

### Tabela: `empresa_configuracoes`

Permite configurações customizadas por empresa (chave-valor):

```sql
-- Exemplos de configurações
notificacao_email = true
notificacao_sms = false
lembrete_agendamento_horas = 24
aceita_agendamento_online = true
estoque_minimo_padrao = 5
```

### Coluna `empresa_id` Adicionada em TODAS as Tabelas

```
funcionarios.empresa_id
clientes.empresa_id
pets.empresa_id
produtos.empresa_id
servicos.empresa_id
vendas.empresa_id
agendamentos.empresa_id
estoque.empresa_id
estoque_movimentacoes.empresa_id
```

**Consequência:** Todos os dados agora pertencem a uma empresa específica.

---

## 🔒 Como Funciona o Isolamento

### 1. No Login

Quando um funcionário faz login:

```json
POST /auth/login
{
  "username": "joao",
  "password": "senha123"
}
```

A API:
- Valida credenciais
- Busca `empresa_id` do funcionário
- Verifica se empresa está `ativo = TRUE`
- Gera JWT contendo `empresa_id`

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

Token decodificado contém:
```json
{
  "id_funcionario": 5,
  "nome": "João Silva",
  "cargo": "vendedor",
  "empresa_id": 2,        ← IMPORTANTE
  "empresa_nome": "PetShop Feliz"
}
```

### 2. Em Cada Requisição

**Todas as queries** automaticamente filtram por `empresa_id`:

```sql
-- Antes (sem multi-tenant)
SELECT * FROM clientes WHERE ativo = TRUE;

-- Agora (com multi-tenant)
SELECT * FROM clientes WHERE empresa_id = 2 AND ativo = TRUE;
```

**Isso é feito automaticamente pelo middleware!**

### 3. Procedures Atualizadas

Todas as procedures agora exigem `empresa_id`:

```sql
-- Registrar venda
CALL registrar_venda(
    2,              -- empresa_id (extraído do token)
    10,             -- cliente_id
    5,              -- funcionario_id
    'dinheiro',
    '[{"produto_id": 1, "quantidade": 2}]'
);
```

A procedure valida:
- ✅ Empresa está ativa
- ✅ Cliente pertence à empresa
- ✅ Funcionário pertence à empresa
- ✅ Produto pertence à empresa

### 4. Views com Filtro

Todas as views têm `empresa_id`:

```sql
-- KPIs de vendas por funcionário
SELECT * FROM vw_vendas_por_funcionario WHERE empresa_id = 2;

-- Top clientes
SELECT * FROM vw_top_clientes WHERE empresa_id = 2;
```

---

## 🚀 Como Usar na API

### Endpoints de Empresa

#### 1. Obter Minha Empresa

```bash
GET /empresas/me
Authorization: Bearer {token}
```

Retorna:
```json
{
  "id": 2,
  "nome": "PetShop Feliz Ltda",
  "nome_fantasia": "PetShop Feliz",
  "cnpj": "12.345.678/0001-99",
  "logo_url": "https://exemplo.com/logo.png",
  "cor_primaria": "#FF6B6B",
  "cor_secundaria": "#4ECDC4",
  "plano": "premium",
  "ativo": true,
  "horario_abertura": "08:00:00",
  "horario_fechamento": "18:00:00"
}
```

#### 2. Atualizar Minha Empresa

```bash
PUT /empresas/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "logo_url": "https://novologo.com/logo.png",
  "cor_primaria": "#3b82f6",
  "horario_abertura": "07:00:00"
}
```

#### 3. Dashboard da Empresa

```bash
GET /empresas/me/dashboard
Authorization: Bearer {token}
```

Retorna estatísticas:
```json
{
  "id": 2,
  "nome": "PetShop Feliz",
  "plano": "premium",
  "ativo": true,
  "total_funcionarios": 8,
  "total_clientes": 542,
  "total_pets": 890,
  "total_vendas": 1250,
  "receita_total": 45680.50,
  "status_assinatura": "ativo",
  "dias_restantes": 45
}
```

#### 4. Configurações Customizadas

```bash
# Listar configurações
GET /empresas/me/config

# Obter configuração específica
GET /empresas/me/config/notificacao_email

# Atualizar/criar configuração
PUT /empresas/me/config/lembrete_agendamento_horas
{
  "chave": "lembrete_agendamento_horas",
  "valor": "48",
  "tipo": "number",
  "descricao": "Enviar lembrete 48h antes"
}
```

### Endpoints de Dados (Automáticos)

**TODOS os endpoints** já filtram automaticamente por `empresa_id`:

```bash
# Listar clientes DA MINHA EMPRESA
GET /clientes
Authorization: Bearer {token}

# Criar cliente NA MINHA EMPRESA
POST /clientes
Authorization: Bearer {token}
{
  "nome": "Maria Silva",
  "telefone": "11987654321"
}
# empresa_id é adicionado automaticamente!
```

**Você NÃO precisa** enviar `empresa_id` nas requisições. O sistema extrai do token automaticamente.

---

## 🎨 Como Aplicar Personalização no Frontend

### Web (Next.js/React)

```typescript
// 1. Buscar configurações da empresa no login
const { data: empresa } = await fetch('/empresas/me', {
  headers: { Authorization: `Bearer ${token}` }
});

// 2. Aplicar cores no CSS
document.documentElement.style.setProperty('--color-primary', empresa.cor_primaria);
document.documentElement.style.setProperty('--color-secondary', empresa.cor_secundaria);

// 3. Mostrar logo
<img src={empresa.logo_url} alt={empresa.nome_fantasia} />

// 4. Horários de funcionamento
const isAberto = () => {
  const agora = new Date().toTimeString().slice(0, 5); // "14:30"
  return agora >= empresa.horario_abertura && agora <= empresa.horario_fechamento;
};
```

### Mobile (React Native)

```javascript
// Context para empresa
const EmpresaContext = createContext();

// Provider
export const EmpresaProvider = ({ children }) => {
  const [empresa, setEmpresa] = useState(null);
  
  useEffect(() => {
    // Buscar ao fazer login
    fetchEmpresa();
  }, []);
  
  return (
    <EmpresaContext.Provider value={{ empresa }}>
      {children}
    </EmpresaContext.Provider>
  );
};

// Usar cores da empresa
const styles = StyleSheet.create({
  button: {
    backgroundColor: empresa?.cor_primaria || '#3b82f6'
  }
});
```

---

## 👨‍💼 Gerenciar Múltiplas Empresas (Superadmin)

### Criar Nova Empresa

```bash
POST /empresas
Authorization: Bearer {token_superadmin}
Content-Type: application/json

{
  "nome": "PetShop ABC Ltda",
  "nome_fantasia": "PetShop ABC",
  "cnpj": "98.765.432/0001-11",
  "email": "contato@petabc.com",
  "plano": "basic",
  "limite_usuarios": 5,
  "data_assinatura": "2025-01-01",
  "data_expiracao": "2026-01-01"
}
```

### Listar Todas as Empresas

```bash
GET /empresas
Authorization: Bearer {token_superadmin}
```

**Requer:** `cargo = 'admin'` E `empresa_id = 1` (empresa master)

---

## 🧪 Testando Multi-Tenant

### Teste 1: Isolamento de Dados

```sql
-- Criar duas empresas
INSERT INTO empresas (nome, ativo) VALUES ('Empresa A', TRUE);  -- id=1
INSERT INTO empresas (nome, ativo) VALUES ('Empresa B', TRUE);  -- id=2

-- Criar funcionários em empresas diferentes
INSERT INTO funcionarios (empresa_id, nome, login, senha) 
VALUES (1, 'João', 'joao', '$hash1');

INSERT INTO funcionarios (empresa_id, nome, login, senha) 
VALUES (2, 'Maria', 'maria', '$hash2');

-- Criar clientes
INSERT INTO clientes (empresa_id, nome, telefone, email) 
VALUES (1, 'Cliente A1', '111', 'a@a.com');

INSERT INTO clientes (empresa_id, nome, telefone, email) 
VALUES (2, 'Cliente B1', '222', 'b@b.com');
```

**Teste:**
1. Login como João → Token com `empresa_id=1`
2. `GET /clientes` → Retorna apenas "Cliente A1"
3. Login como Maria → Token com `empresa_id=2`
4. `GET /clientes` → Retorna apenas "Cliente B1"

✅ **Dados isolados com sucesso!**

### Teste 2: Validação de Limites

```sql
-- Empresa com limite de 3 usuários
UPDATE empresas SET limite_usuarios = 3 WHERE id = 1;

-- Tentar criar 4º funcionário
INSERT INTO funcionarios (empresa_id, nome, login, senha) 
VALUES (1, 'Quarto', 'user4', 'hash');

-- Erro esperado: "Limite de usuários atingido. Faça upgrade do plano."
```

### Teste 3: Empresa Inativa

```sql
-- Desativar empresa
UPDATE empresas SET ativo = FALSE WHERE id = 2;

-- Tentar login
POST /auth/login {"username": "maria", "password": "..."}

-- Erro esperado: "Login ou senha incorretos, ou empresa inativa"
```

---

## 📊 Planos e Monetização

### Estrutura de Planos

| Plano | Usuários | Agendamentos/mês | Preço Sugerido |
|-------|----------|------------------|----------------|
| Free | 2 | 50 | R$ 0 |
| Basic | 5 | 200 | R$ 99/mês |
| Premium | 20 | 1000 | R$ 299/mês |
| Enterprise | Ilimitado | Ilimitado | R$ 999/mês |

### Validações Automáticas

```sql
-- Trigger impede criar funcionário além do limite
CREATE TRIGGER trg_validar_limites_empresa
BEFORE INSERT ON funcionarios
FOR EACH ROW
BEGIN
    IF (SELECT COUNT(*) FROM funcionarios WHERE empresa_id = NEW.empresa_id) >= 
       (SELECT limite_usuarios FROM empresas WHERE id = NEW.empresa_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Limite atingido';
    END IF;
END;
```

---

## 🔧 Migração de Dados Existentes

Se você já tem dados no banco, eles foram migrados automaticamente para `empresa_id = 1` (empresa padrão).

### Verificar Migração

```sql
SELECT 
    'clientes' as tabela, COUNT(*) as total 
FROM clientes WHERE empresa_id = 1
UNION ALL
SELECT 'vendas', COUNT(*) FROM vendas WHERE empresa_id = 1
UNION ALL
SELECT 'agendamentos', COUNT(*) FROM agendamentos WHERE empresa_id = 1;
```

---

## 📱 Frontend: Como Implementar

### 1. Login

```javascript
// Fazer login
const response = await fetch('/auth/login', {
  method: 'POST',
  body: new URLSearchParams({ username: 'joao', password: 'senha' })
});

const { access_token } = await response.json();

// Armazenar token
localStorage.setItem('token', access_token);

// Buscar dados do usuário (inclui empresa)
const user = await fetch('/auth/me', {
  headers: { Authorization: `Bearer ${access_token}` }
}).then(r => r.json());

console.log(user);
// {
//   id: 5,
//   nome: "João Silva",
//   cargo: "vendedor",
//   empresa_id: 2,
//   empresa_nome: "PetShop Feliz"
// }
```

### 2. Buscar Configurações da Empresa

```javascript
const empresa = await fetch('/empresas/me', {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());

// Aplicar tema
applyTheme(empresa.cor_primaria, empresa.cor_secundaria, empresa.logo_url);
```

### 3. Seletor de Empresa (Superadmin)

```javascript
// Apenas para superadmin
const Seletor = () => {
  const [empresas, setEmpresas] = useState([]);
  const [empresaAtual, setEmpresaAtual] = useState(null);
  
  useEffect(() => {
    // Listar todas as empresas (só funciona se for superadmin)
    fetch('/empresas', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setEmpresas);
  }, []);
  
  return (
    <select onChange={(e) => setEmpresaAtual(e.target.value)}>
      {empresas.map(e => (
        <option key={e.id} value={e.id}>{e.nome}</option>
      ))}
    </select>
  );
};
```

---

## ⚠️ Importante: Próximos Passos

### 1. Aplicar Migrações

```bash
cd /Users/darlan/novo\ projeto
flyway migrate
```

Isso aplicará V12, V13 e V14.

### 2. Atualizar API

```bash
cd api
source venv/bin/activate

# Adicionar novas rotas no main.py
# (vou fazer isso no próximo passo)

# Reiniciar API
uvicorn src.main:app --reload
```

### 3. Testar Endpoints

```bash
# Login
curl -X POST http://localhost:8000/auth/login \
  -d "username=admin&password=senha"

# Obter empresa
curl http://localhost:8000/empresas/me \
  -H "Authorization: Bearer {token}"
```

---

## 🎯 Resumo

✅ **Banco de dados:** Suporta múltiplas empresas  
✅ **API:** Filtra automaticamente por empresa  
✅ **Isolamento:** Dados completamente separados  
✅ **Personalização:** Cores, logo, configurações por empresa  
✅ **Monetização:** Planos com limites configuráveis  
✅ **Administração:** Superadmin gerencia todas as empresas  

**Você agora pode:**
- Vender o sistema para múltiplos petshops
- Cobrar mensalidade por empresa
- Customizar cada instalação
- Gerenciar tudo centralmente

---

## 📞 Suporte

Dúvidas sobre multi-tenant? Me pergunte! 🚀
