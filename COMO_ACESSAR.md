# 🔌 GUIA RÁPIDO DE ACESSO AO BANCO PETSHOP

## 📊 DADOS DA CONEXÃO

```
Host:     127.0.0.1 (ou localhost)
Porta:    3306
Usuário:  root
Senha:    34461011
Banco:    petshop
```

---

## 🖥️ OPÇÃO 1: MySQL Workbench (Interface Gráfica)

### Passo a Passo:

1. **Abrir o MySQL Workbench**
   - Applications → MySQLWorkbench

2. **Criar Nova Conexão**
   - Clique no botão **"+"** ao lado de "MySQL Connections"

3. **Preencher Dados:**
   ```
   Connection Name: Petshop Local
   Connection Method: Standard (TCP/IP)
   
   Hostname: 127.0.0.1
   Port: 3306
   Username: root
   Password: [Clique em "Store in Keychain" e digite: 34461011]
   Default Schema: petshop
   ```

4. **Testar Conexão**
   - Clique em **"Test Connection"**
   - Se aparecer aviso de versão incompatível, clique **"Continue"**
   - Deve aparecer: "Successfully made the MySQL connection"

5. **Salvar e Conectar**
   - Clique **"OK"**
   - Na tela inicial, clique na conexão "Petshop Local"
   - Pronto! Você está conectado!

---

## 💻 OPÇÃO 2: Terminal (Linha de Comando)

### Conectar ao banco:

```bash
# Abrir terminal e digitar:
mysql -u root -p34461011 petshop
```

### Comandos úteis depois de conectado:

```sql
-- Ver todas as tabelas
SHOW TABLES;

-- Ver estrutura de uma tabela
DESCRIBE clientes;

-- Buscar dados
SELECT * FROM clientes;

-- Ver agendamentos de hoje
SELECT * FROM vw_agendamentos_hoje;

-- Ver produtos com estoque baixo
SELECT * FROM vw_produtos_estoque_baixo;

-- Sair
EXIT;
```

---

## 🎨 OPÇÃO 3: Abrir pelo Terminal (mais rápido)

```bash
# Abrir MySQL Workbench
open -a MySQLWorkbench

# OU acessar via terminal
mysql -u root -p34461011 petshop
```

---

## ⚡ QUERIES PRONTAS PARA TESTAR

Depois de conectar, teste estas queries:

### Ver todas as tabelas:
```sql
SHOW TABLES;
```

### Ver estrutura completa:
```sql
SHOW FULL TABLES;
```

### Contar registros de cada tabela:
```sql
SELECT 'clientes' as tabela, COUNT(*) as total FROM clientes
UNION ALL
SELECT 'pets', COUNT(*) FROM pets
UNION ALL
SELECT 'produtos', COUNT(*) FROM produtos
UNION ALL
SELECT 'agendamentos', COUNT(*) FROM agendamentos;
```

### Ver as 5 views criadas:
```sql
SHOW FULL TABLES WHERE Table_type = 'VIEW';
```

### Testar uma view:
```sql
SELECT * FROM vw_clientes_pets;
```

---

## 🔍 VERIFICAR SE ESTÁ TUDO FUNCIONANDO

```sql
-- Mostrar informações do servidor
SELECT VERSION() as Versao_MySQL;

-- Mostrar banco atual
SELECT DATABASE() as Banco_Atual;

-- Contar tabelas
SELECT COUNT(*) as Total_Tabelas 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'petshop';

-- Contar foreign keys
SELECT COUNT(*) as Total_ForeignKeys
FROM information_schema.REFERENTIAL_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = 'petshop';
```

---

## 🚨 PROBLEMAS COMUNS

### "Access denied for user 'root'"
- Senha está errada. Use: `34461011`

### "Can't connect to MySQL server"
- MySQL não está rodando. Execute:
  ```bash
  brew services start mysql
  ```

### "Unknown database 'petshop'"
- Banco não existe. Execute:
  ```bash
  mysql -u root -p34461011 < esquema_reverso.sql
  ```

### Aviso de incompatibilidade no Workbench
- É normal! Clique em "Continue" e use normalmente

---

## ✅ TUDO PRONTO!

Escolha a opção que preferir e comece a usar seu banco de dados! 🎉

**Dica:** Use o Workbench para visualizar e o Terminal para queries rápidas.
