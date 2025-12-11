# 🎯 GUIA VISUAL - CONECTAR PETSHOP NO DBEAVER

## ✅ MySQL está rodando e funcionando!
## ✅ DBeaver está aberto!

---

## 📋 PASSO A PASSO COM IMAGENS MENTAIS:

### **TELA INICIAL DO DBEAVER**

Quando o DBeaver abrir, você verá:
```
┌─────────────────────────────────────────────────┐
│  DBeaver                                        │
├─────────────────────────────────────────────────┤
│  Barra Menu: Database | Edit | View | ...      │
│  ─────────────────────────────────────────      │
│  [🔌] [💾] [▶️] ... (ícones da toolbar)        │
│  ─────────────────────────────────────────      │
│                                                 │
│  ┌─────────────┐  ┌────────────────────────┐  │
│  │ Database    │  │                         │  │
│  │ Navigator   │  │   (Área de trabalho)    │  │
│  │             │  │                         │  │
│  │ (vazio ou   │  │                         │  │
│  │  conexões   │  │                         │  │
│  │  antigas)   │  │                         │  │
│  └─────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 🔌 CRIAR CONEXÃO - 3 FORMAS:

### **FORMA 1: Pelo Menu**
1. Clique em **"Database"** (menu superior)
2. Clique em **"New Database Connection"**

### **FORMA 2: Pelo Ícone** (MAIS FÁCIL)
1. Procure o ícone de **plug** 🔌 na barra de ferramentas
2. Clique nele

### **FORMA 3: Pelo Atalho**
1. Pressione: **Cmd + Shift + N**

---

## 📝 JANELA DE CONEXÃO:

Depois de clicar, vai abrir:

```
┌──────────────────────────────────────────┐
│  Connect to a database                   │
├──────────────────────────────────────────┤
│                                          │
│  🔍 [Search...]                          │
│                                          │
│  Popular:                                │
│    [MySQL]  [PostgreSQL]  [SQLite]       │
│    [Oracle] [SQL Server]  [MongoDB]      │
│                                          │
│  All:                                    │
│    Apache Hive                           │
│    ClickHouse                            │
│    MariaDB                               │
│  → MySQL     ← CLIQUE AQUI!              │
│    Oracle                                │
│    ...                                   │
│                                          │
│         [Back]  [Next >]  [Cancel]       │
└──────────────────────────────────────────┘
```

**AÇÃO:** Clique em **MySQL** e depois em **[Next >]**

---

## 🔧 CONFIGURAÇÃO DA CONEXÃO:

Agora você verá:

```
┌──────────────────────────────────────────┐
│  Connection Settings - MySQL             │
├──────────────────────────────────────────┤
│                                          │
│  Connection type: [MySQL]                │
│                                          │
│  Main  |  SSL  |  SSH  |  Proxy         │
│  ──────────────────────────────────      │
│                                          │
│  Server Host: [localhost          ]     │ ← DIGITE: localhost
│  Port:        [3306               ]     │ ← OK (já vem preenchido)
│  Database:    [                   ]     │ ← DIGITE: petshop
│  Username:    [root               ]     │ ← DIGITE: root
│  Password:    [                   ]     │ ← DIGITE: 34461011
│                                          │
│  ☐ Save password                        │ ← MARQUE esta caixinha!
│                                          │
│  [Test Connection...] [Driver settings] │
│                                          │
│      [< Back]  [Finish]  [Cancel]       │
└──────────────────────────────────────────┘
```

### **PREENCHA:**
1. **Server Host:** localhost
2. **Port:** 3306 (já vem assim)
3. **Database:** petshop
4. **Username:** root
5. **Password:** 34461011
6. **☑ Save password** (marcar!)

---

## ⚠️ SE APARECER AVISO DE DRIVER:

```
┌──────────────────────────────────────────┐
│  Driver files are not loaded             │
│                                          │
│  Do you want to download driver files?  │
│                                          │
│     [Download]  [Cancel]                 │
└──────────────────────────────────────────┘
```

**AÇÃO:** Clique em **[Download]** e aguarde

---

## ✅ TESTAR CONEXÃO:

1. Clique em **[Test Connection...]** (canto inferior esquerdo)

2. Deve aparecer:
```
┌──────────────────────────────────────────┐
│  Connection test                         │
├──────────────────────────────────────────┤
│                                          │
│  ✅ Connected                            │
│                                          │
│  Host: localhost:3306                    │
│  Database: petshop                       │
│  Server version: 9.5.0                   │
│  Driver version: ...                     │
│                                          │
│            [OK]                          │
└──────────────────────────────────────────┘
```

**SE DER ERRO, COPIE A MENSAGEM E ME ENVIE!**

---

## 🎉 FINALIZAR:

1. Clique em **[Finish]**

2. Agora no **Database Navigator** (painel esquerdo) você verá:

```
Database Navigator
└─ 📁 petshop - localhost
    ├─ 📊 Tables (13)
    │   ├─ agendamentos
    │   ├─ clientes
    │   ├─ consultas
    │   ├─ estoque
    │   ├─ fornecedores
    │   ├─ funcionarios
    │   ├─ itens_da_venda
    │   ├─ Pagamentos
    │   ├─ pets
    │   ├─ produtos
    │   ├─ prontuario
    │   ├─ servicos
    │   └─ vendas
    └─ 📋 Views (5)
        ├─ vw_agendamentos_hoje
        ├─ vw_clientes_pets
        ├─ vw_pets_historico
        ├─ vw_produtos_estoque_baixo
        └─ vw_vendas_completas
```

---

## 🎨 EXPLORAR O BANCO:

### Ver dados de uma tabela:
1. Expanda **Tables**
2. **Duplo clique** em qualquer tabela (ex: clientes)
3. Ou **botão direito** → **View Data**

### Executar SQL:
1. Clique no ícone **SQL Editor** (📝) ou **F3**
2. Digite suas queries
3. Execute com **Ctrl + Enter**

---

## 🚨 PROBLEMAS COMUNS:

### "Can't connect to MySQL server"
```bash
# No terminal, execute:
brew services restart mysql
```

### "Access denied for user 'root'"
- Verifique a senha: deve ser exatamente `34461011`

### "Unknown database 'petshop'"
```bash
# No terminal, execute:
mysql -u root -p34461011 -e "SHOW DATABASES;" | grep petshop
```

---

## 📞 AINDA COM PROBLEMA?

Me diga:
1. **Qual tela você está vendo agora?**
2. **Consegue ver o menu "Database" no topo?**
3. **Aparece algum erro? Qual mensagem exata?**

---

**DADOS DE CONEXÃO (para copiar/colar):**
```
localhost
3306
petshop
root
34461011
```

---

**Criado:** 09/11/2025  
**MySQL:** 9.5.0 ✅ Rodando  
**Banco:** petshop ✅ Criado  
**DBeaver:** Instalado ✅
