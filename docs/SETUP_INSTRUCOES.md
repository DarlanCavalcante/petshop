# INSTRUÇÕES DE SETUP - SISTEMA PETSHOP COM PM2

## ⚠️ IMPORTANTE: Node.js Instalado!

Node.js v24.11.0 foi instalado com sucesso, mas **você precisa reiniciar o terminal** para que o comando `npm` funcione.

---

## 🚀 PRÓXIMOS PASSOS

### 1️⃣ Fechar e Reabrir o Terminal

**No VS Code:**
1. Clique no ícone de lixeira 🗑️ no terminal (canto superior direito)
2. Ou pressione `Ctrl + Shift + `` (acento grave)
3. Um novo terminal será aberto

**Ou reinicie o VS Code completamente:**
- Feche e abra o VS Code

---

### 2️⃣ Executar o Script de Setup

Após reiniciar o terminal, execute:

```powershell
cd "c:\Users\Darlan\Documents\trabalhos VSCode\trabalho01\petshop"
.\setup-pm2.ps1
```

**Se der erro de execução de scripts:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup-pm2.ps1
```

---

### 3️⃣ O Script Vai Fazer Automaticamente

✅ Verificar Node.js e npm  
✅ Instalar PM2 globalmente  
✅ Criar pasta de logs  
✅ Instalar dependências Python (API)  
✅ Instalar dependências Node.js (Frontend)  
✅ Iniciar PM2 com API + Frontend  

---

## 📋 ALTERNATIVA MANUAL (Passo a Passo)

Se preferir fazer manualmente:

```powershell
# 1. Instalar PM2
npm install -g pm2

# 2. Criar pasta de logs
mkdir logs

# 3. Instalar dependências da API
cd api
pip install -r requirements.txt
cd ..

# 4. Instalar dependências do Frontend
cd web
npm install
cd ..

# 5. Iniciar PM2
pm2 start ecosystem.config.js

# 6. Ver status
pm2 status
```

---

## 🎯 Verificar se Funcionou

Após executar o script, você deve ver:

```
┌────┬─────────────────┬─────────┬─────────┬──────────┬────────┐
│ id │ name            │ mode    │ status  │ cpu      │ memory │
├────┼─────────────────┼─────────┼─────────┼──────────┼────────┤
│ 0  │ petshop-api     │ fork    │ online  │ 0%       │ 50 MB  │
│ 1  │ petshop-web     │ fork    │ online  │ 0%       │ 80 MB  │
└────┴─────────────────┴─────────┴─────────┴──────────┴────────┘
```

**Acessar:**
- Frontend: http://localhost:3000
- API: http://localhost:8000
- Docs API: http://localhost:8000/docs

---

## 📝 Comandos Úteis

```powershell
# Ver logs em tempo real
pm2 logs

# Ver apenas logs de erro
pm2 logs --err

# Reiniciar tudo
pm2 restart all

# Parar tudo
pm2 stop all

# Dashboard de monitoramento
pm2 monit
```

---

## ❓ Troubleshooting

### "npm não é reconhecido"
**Solução:** Feche e reabra o terminal

### "Erro ao executar scripts"
**Solução:** 
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "Python não encontrado"
**Solução:** Instale Python primeiro
```powershell
winget install Python.Python.3.12
```

### "PM2 não inicia"
**Solução:** Veja os logs
```powershell
pm2 logs --err
```

---

## 📚 Documentação Completa

- **PM2_GUIA.md** - Guia completo do PM2
- **docs/README.md** - Índice de toda documentação
- **docs/GUIA_ADMINISTRADOR.md** - Para administradores
- **docs/GUIA_DESENVOLVEDOR.md** - Para desenvolvedores

---

**Última Atualização:** 11/11/2025
