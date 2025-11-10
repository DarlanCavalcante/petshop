# 🐳 Guia Docker para Windows Server

## Pré-requisitos

1. **Windows 10/11 Pro ou Windows Server 2019+**
2. **WSL 2 habilitado**
3. **Docker Desktop instalado**

---

## 📥 Instalação (No Servidor Windows)

### 1. Habilitar WSL 2
Abra PowerShell como Administrador:

```powershell
wsl --install
```

Reinicie o computador.

### 2. Instalar Docker Desktop
1. Download: https://www.docker.com/products/docker-desktop
2. Execute o instalador
3. Marque: "Use WSL 2 instead of Hyper-V"
4. Após instalar, abra Docker Desktop e aguarde iniciar

### 3. Verificar Instalação
No PowerShell:

```powershell
docker --version
docker-compose --version
```

---

## 🚀 Deploy do Projeto

### 1. Clonar Repositório
No PowerShell (no diretório desejado, ex: C:\Projects):

```powershell
git clone https://github.com/DarlanCavalcante/petshop.git
cd petshop
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo:

```powershell
copy .env.docker .env
```

Edite `.env` com suas senhas:
- MYSQL_ROOT_PASSWORD=SuaSenhaForte123
- SECRET_KEY=(gere uma chave com: openssl rand -hex 32)

### 3. Subir Containers

```powershell
docker-compose -f docker-compose.windows.yml up -d
```

Primeira vez demora ~5 minutos (baixa imagens, instala deps).

### 4. Verificar Status

```powershell
docker-compose -f docker-compose.windows.yml ps
```

Deve mostrar 3 containers rodando:
- petshop-mariadb
- petshop-api
- petshop-frontend

### 5. Acessar

- **Frontend:** http://192.168.0.254:3000
- **API Docs:** http://192.168.0.254:8000/docs
- **MariaDB:** Porta 3306 (acessível via MySQL Workbench)

---

## 🔧 Comandos Úteis

### Ver Logs
```powershell
# Todos os containers
docker-compose -f docker-compose.windows.yml logs -f

# Apenas API
docker-compose -f docker-compose.windows.yml logs -f api

# Apenas Frontend
docker-compose -f docker-compose.windows.yml logs -f frontend
```

### Parar Tudo
```powershell
docker-compose -f docker-compose.windows.yml down
```

### Reiniciar
```powershell
docker-compose -f docker-compose.windows.yml restart
```

### Rebuild (após mudar código)
```powershell
docker-compose -f docker-compose.windows.yml up -d --build
```

### Executar SQL Direto no MariaDB
```powershell
docker exec -it petshop-mariadb mysql -u root -pSenhaRoot123
```

Dentro do MySQL:
```sql
SHOW DATABASES;
USE petshop_empresa_teste;
SHOW TABLES;
```

---

## 📊 Importar Dados (Seed)

### Copiar script para dentro do container
```powershell
docker cp api/scripts/create_petshop_empresa_teste.sql petshop-mariadb:/tmp/
```

### Executar
```powershell
docker exec -it petshop-mariadb mysql -u root -pSenhaRoot123 petshop_empresa_teste < /tmp/create_petshop_empresa_teste.sql
```

Ou via PowerShell direto:
```powershell
Get-Content api\scripts\create_petshop_empresa_teste.sql | docker exec -i petshop-mariadb mysql -u root -pSenhaRoot123 petshop_empresa_teste
```

---

## 🔒 Firewall Windows

Liberar portas (PowerShell como Admin):

```powershell
New-NetFirewallRule -DisplayName "Petshop Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Petshop API" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Petshop MariaDB" -Direction Inbound -LocalPort 3306 -Protocol TCP -Action Allow
```

---

## 🔄 Atualizar Código

Quando fizer pull do GitHub:

```powershell
cd C:\Projects\petshop
git pull origin main
docker-compose -f docker-compose.windows.yml up -d --build
```

---

## 🆘 Troubleshooting

### Container não sobe
```powershell
# Ver erro detalhado
docker-compose -f docker-compose.windows.yml logs api
docker-compose -f docker-compose.windows.yml logs frontend
```

### Porta já em uso
```powershell
# Descobrir o que está usando a porta 3000
netstat -ano | findstr :3000

# Matar processo (substitua PID)
taskkill /PID <número> /F
```

### MariaDB não aceita conexão
```powershell
# Entrar no container
docker exec -it petshop-mariadb bash

# Dentro do container
mysql -u root -p
# Senha: aquela do .env

# Criar usuário remoto
CREATE USER 'petshop'@'%' IDENTIFIED BY 'SenhaForte123';
GRANT ALL PRIVILEGES ON *.* TO 'petshop'@'%';
FLUSH PRIVILEGES;
```

### Limpar tudo e recomeçar
```powershell
docker-compose -f docker-compose.windows.yml down -v
docker-compose -f docker-compose.windows.yml up -d --build
```

---

## 💾 Backup

### Backup automático do MariaDB
```powershell
docker exec petshop-mariadb mysqldump -u root -pSenhaRoot123 --all-databases > backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql
```

### Restaurar
```powershell
Get-Content backup_20251110_120000.sql | docker exec -i petshop-mariadb mysql -u root -pSenhaRoot123
```

---

## 🌐 Acessar de Outros Computadores na Rede

Basta usar o IP do servidor:
- http://192.168.0.254:3000 (de qualquer PC/celular na mesma rede)

---

## 🎯 Checklist de Sucesso

- [ ] Docker Desktop rodando
- [ ] Arquivo `.env` configurado
- [ ] `docker-compose up` sem erros
- [ ] Frontend abre em http://localhost:3000
- [ ] API responde em http://localhost:8000/health
- [ ] Login funciona (admin / admin123 na empresa "teste")
- [ ] Firewall liberado
- [ ] Acessível de outro PC na rede
