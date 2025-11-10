# 🚀 Enviar Projeto ao GitHub - Guia Rápido

## Método 1: Criar Repositório Manualmente (Mais Simples)

1. **Acesse:** https://github.com/new

2. **Configure:**
   - Repository name: `petshop`
   - Description: `Sistema Petshop Multi-Empresa com FastAPI + Next.js + MySQL`
   - Visibilidade: **Public** ✅
   - **NÃO** marque: Initialize with README

3. **Clique:** "Create repository"

4. **No terminal, execute:**
   ```bash
   cd "/Users/darlan/novo projeto"
   git remote add origin https://github.com/SEU_USUARIO/petshop.git
   git branch -M main
   git push -u origin main
   ```
   
   Substitua `SEU_USUARIO` pelo seu username do GitHub.

---

## Método 2: Via GitHub CLI

1. **Autenticar:**
   ```bash
   gh auth login
   ```
   - Escolha: **GitHub.com**
   - Protocol: **HTTPS**
   - Authenticate: **Yes**
   - Método: **Login with a web browser**
   - Copie o código e cole no navegador

2. **Criar e enviar:**
   ```bash
   cd "/Users/darlan/novo projeto"
   gh repo create petshop --public --source=. --remote=origin --push
   ```

---

## ✅ Verificar Upload

Após o push, acesse: `https://github.com/SEU_USUARIO/petshop`

Você deverá ver todos os arquivos do projeto online!
