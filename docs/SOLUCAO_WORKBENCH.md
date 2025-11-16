# ❌ PROBLEMAS COMUNS NO MYSQL WORKBENCH - SOLUÇÕES

## 🔴 PROBLEMA: Não consegue abrir/conectar no Workbench

---

## ✅ SOLUÇÃO PASSO A PASSO:

### **PASSO 1: Abrir um NOVO Terminal**
1. Pressione `Cmd + N` ou abra um novo terminal
2. Vá até a pasta do projeto:
   ```bash
   cd "/Users/darlan/novo projeto"
   ```

### **PASSO 2: Executar o diagnóstico**
```bash
chmod +x diagnostico_mysql.sh
./diagnostico_mysql.sh
```

---

## 🛠️ SOLUÇÕES MANUAIS (se o script não funcionar)

### **1. Verificar se MySQL está rodando:**
```bash
brew services list | grep mysql
```

**Deve aparecer:** `mysql started`

**Se NÃO aparecer "started", inicie:**
```bash
brew services start mysql
```

---

### **2. Testar conexão no terminal:**
```bash
mysql -u root -p34461011 -e "SELECT 'Funcionando!' as Status;"
```

**Deve mostrar:** "Funcionando!"

**Se der erro:** Reinicie o MySQL:
```bash
brew services restart mysql
sleep 5
mysql -u root -p34461011 -e "SELECT 'Funcionando!' as Status;"
```

---

### **3. Abrir MySQL Workbench manualmente:**

#### Via Terminal:
```bash
open -a MySQLWorkbench
```

#### Ou manualmente:
- Finder → Applications → MySQLWorkbench.app (duplo clique)

---

### **4. Criar conexão no Workbench:**

**Quando o Workbench abrir:**

1. **Na tela inicial**, clique no botão **"+"** (mais) ao lado de "MySQL Connections"

2. **Preencha EXATAMENTE assim:**
   ```
   Connection Name:     Petshop
   Connection Method:   Standard (TCP/IP)
   
   Hostname:   127.0.0.1
   Port:       3306
   Username:   root
   
   Password: [Clique em "Store in Keychain..."]
            Digite: 34461011
            Clique: OK
   
   Default Schema: petshop
   ```

3. **Clique em "Test Connection"**

4. **Se aparecer erro:**
   - Verifique se o MySQL está rodando (Passo 1)
   - Verifique a senha (deve ser: 34461011)

5. **Se aparecer aviso "Incompatible/nonstandard server version":**
   - É NORMAL! Clique em **"Continue"** ou **"OK"**
   - O Workbench vai funcionar normalmente

6. **Se der "Successfully made the MySQL connection":**
   - ✅ Perfeito! Clique em **"OK"** para salvar

7. **Na tela inicial, clique na conexão "Petshop" para conectar**

---

## 🚨 ERROS COMUNS E SOLUÇÕES

### ❌ "Can't connect to MySQL server"
**Causa:** MySQL não está rodando

**Solução:**
```bash
brew services start mysql
sleep 3
```

---

### ❌ "Access denied for user 'root'"
**Causa:** Senha errada

**Solução:** A senha correta é: `34461011`

---

### ❌ "Unknown database 'petshop'"
**Causa:** Banco não existe

**Solução:**
```bash
mysql -u root -p34461011 -e "SHOW DATABASES;" | grep petshop
```

Se não aparecer "petshop", recrie:
```bash
mysql -u root -p34461011 < esquema_reverso.sql
mysql -u root -p34461011 < melhorias_banco.sql
```

---

### ❌ "Lost connection to MySQL server"
**Causa:** Timeout ou MySQL travou

**Solução:**
```bash
brew services restart mysql
sleep 5
```

---

### ⚠️ "Incompatible/nonstandard server version"
**Causa:** MySQL 9.5 é muito novo para o Workbench

**Solução:** 
- Clique em **"Continue"**
- Use normalmente
- Funciona perfeitamente para 95% das tarefas

---

## 🎯 CHECKLIST COMPLETO

Marque cada item conforme testar:

- [ ] MySQL está rodando: `brew services list | grep mysql`
- [ ] Conexão funciona no terminal: `mysql -u root -p34461011`
- [ ] Banco petshop existe: `mysql -u root -p34461011 -e "USE petshop;"`
- [ ] Workbench abre: `open -a MySQLWorkbench`
- [ ] Conexão criada no Workbench
- [ ] Test Connection funciona
- [ ] Conectado com sucesso

---

## 💡 ALTERNATIVA: Usar DBeaver

Se o Workbench continuar com problemas, instale o DBeaver (suporta MySQL 9.5):

```bash
brew install --cask dbeaver-community
```

Depois de instalar:
1. Abrir DBeaver
2. Nova Conexão → MySQL
3. Preencher:
   - Host: localhost
   - Port: 3306
   - Database: petshop
   - Username: root
   - Password: 34461011
4. Testar conexão
5. Finish!

---

## 📞 AINDA COM PROBLEMA?

Me informe qual erro EXATO está aparecendo:
1. Qual mensagem de erro aparece?
2. Em qual passo está travando?
3. O MySQL está rodando? (`brew services list`)

---

**Criado em:** 09/11/2025  
**Banco:** petshop  
**MySQL:** 9.5.0  
**Workbench:** 8.0.44
