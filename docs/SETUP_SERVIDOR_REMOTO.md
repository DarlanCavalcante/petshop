# 🖥️ Setup Servidor Petshop em Máquina Remota (LAN)

## Cenário
- **Servidor:** Máquina Linux/Mac na rede local (ex: 192.168.1.100)
- **Desenvolvimento:** Seu Mac atual (192.168.1.50)
- **Objetivo:** MySQL + API + Frontend rodando no servidor, acessível pela rede

---

## 📋 Pré-requisitos

### No Servidor (Máquina que vai hospedar)
- Ubuntu/Debian Server (ou macOS)
- IP fixo na rede local (configurar no roteador)
- SSH habilitado
- Docker instalado (ou MySQL + Node + Python)

### No Seu Mac (Cliente)
- Acesso SSH ao servidor
- Git instalado

---

## 🚀 Opção 1: Setup com Docker (Recomendado)

### 1. Criar Docker Compose no Servidor

```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.4
    container_name: petshop-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: petshop
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./db/migrations:/docker-entrypoint-initdb.d
    networks:
      - petshop-network

  api:
    build: ./api
    container_name: petshop-api
    restart: unless-stopped
    depends_on:
      - mysql
    environment:
      DATABASE_URL: mysql+pymysql://root:${MYSQL_ROOT_PASSWORD}@mysql:3306/petshop
      SECRET_KEY: ${SECRET_KEY}
    ports:
      - "8000:8000"
    networks:
      - petshop-network

  frontend:
    build: ./web
    container_name: petshop-frontend
    restart: unless-stopped
    depends_on:
      - api
    environment:
      NEXT_PUBLIC_API_URL: http://192.168.1.100:8000
    ports:
      - "3000:3000"
    networks:
      - petshop-network

volumes:
  mysql_data:

networks:
  petshop-network:
    driver: bridge
```

### 2. Script de Deploy Remoto (Roda do Seu Mac)

```bash
#!/bin/bash
# deploy_to_server.sh

SERVER_IP="192.168.1.100"
SERVER_USER="servidor"
PROJECT_DIR="/home/servidor/petshop"

echo "📦 Fazendo deploy para $SERVER_IP..."

# 1. Sync código via rsync
rsync -avz --exclude 'venv' --exclude 'node_modules' --exclude '.pids' \
  ./ ${SERVER_USER}@${SERVER_IP}:${PROJECT_DIR}/

# 2. SSH no servidor e subir containers
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
cd /home/servidor/petshop
docker-compose down
docker-compose up -d --build
docker-compose logs -f
EOF

echo "✅ Deploy concluído!"
echo "Frontend: http://${SERVER_IP}:3000"
echo "API: http://${SERVER_IP}:8000"
```

---

## 🔧 Opção 2: Setup Manual (Sem Docker)

### No Servidor via SSH

```bash
# 1. Conectar no servidor
ssh servidor@192.168.1.100

# 2. Instalar dependências
sudo apt update
sudo apt install -y mysql-server python3-pip nodejs npm git

# 3. Configurar MySQL para aceitar conexões remotas
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# Alterar: bind-address = 0.0.0.0

sudo systemctl restart mysql

# 4. Criar usuário remoto no MySQL
sudo mysql -e "CREATE USER 'petshop'@'%' IDENTIFIED BY 'SenhaForte123';"
sudo mysql -e "GRANT ALL PRIVILEGES ON *.* TO 'petshop'@'%' WITH GRANT OPTION;"
sudo mysql -e "FLUSH PRIVILEGES;"

# 5. Clonar projeto
cd /home/servidor
git clone https://github.com/DarlanCavalcante/petshop.git
cd petshop

# 6. Setup API
cd api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configurar .env
cat > .env <<EOL
DATABASE_URL=mysql+pymysql://petshop:SenhaForte123@localhost:3306/petshop
SECRET_KEY=$(openssl rand -hex 32)
EOL

# Rodar migrações
mysql -u petshop -p < db/migrations/V1__baseline_schema.sql
# (repetir para V2..V11)

# Subir API (em background)
nohup uvicorn src.main:app --host 0.0.0.0 --port 8000 > api.log 2>&1 &

# 7. Setup Frontend
cd ../web
npm install
npm run build

# Subir frontend (em background)
nohup npm start > web.log 2>&1 &
```

---

## 🔒 Configurar MySQL para Acesso Remoto

### No Servidor (via SSH)

```bash
# 1. Criar databases para cada empresa
mysql -u root -p << 'SQL'
CREATE DATABASE IF NOT EXISTS petshop_empresa_a;
CREATE DATABASE IF NOT EXISTS petshop_empresa_teste;

-- Criar usuário para acesso remoto
CREATE USER 'petshop_remote'@'192.168.1.%' IDENTIFIED BY 'SenhaSegura123';
GRANT ALL PRIVILEGES ON petshop_*.* TO 'petshop_remote'@'192.168.1.%';
FLUSH PRIVILEGES;
SQL

# 2. Abrir porta no firewall
sudo ufw allow 3306/tcp
sudo ufw allow 8000/tcp
sudo ufw allow 3000/tcp
```

### No Seu Mac (Cliente)

```bash
# Testar conexão MySQL remota
mysql -h 192.168.1.100 -u petshop_remote -p

# Configurar databases.json no servidor (via SSH)
ssh servidor@192.168.1.100
cd /home/servidor/petshop/api
cat > databases.json <<'JSON'
{
  "default": "mysql+pymysql://petshop_remote:SenhaSegura123@localhost:3306/petshop",
  "teste": "mysql+pymysql://petshop_remote:SenhaSegura123@localhost:3306/petshop_empresa_teste",
  "empresa_a": "mysql+pymysql://petshop_remote:SenhaSegura123@localhost:3306/petshop_empresa_a"
}
JSON
```

---

## 🌐 Acessar de Qualquer Lugar da Rede

### No Roteador
1. Reservar IP fixo para o servidor (ex: 192.168.1.100)
2. Opcional: Configurar DNS local (ex: petshop.local → 192.168.1.100)

### No Seu Mac
Adicionar ao `/etc/hosts`:
```
192.168.1.100  petshop.local
192.168.1.100  api.petshop.local
```

Acessar:
- Frontend: http://petshop.local:3000
- API: http://api.petshop.local:8000
- MySQL: mysql -h petshop.local -u petshop_remote -p

---

## 📱 Acessar pelo Celular/Tablet (Mesma Rede)

```
Frontend: http://192.168.1.100:3000
API: http://192.168.1.100:8000
```

---

## 🔐 Segurança Importante

```bash
# No servidor, criar firewall restrito
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 192.168.1.0/24 to any port 3306  # MySQL só rede local
sudo ufw allow from 192.168.1.0/24 to any port 8000  # API só rede local
sudo ufw allow from 192.168.1.0/24 to any port 3000  # Frontend só rede local
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
```

---

## 📊 Monitoramento Remoto

### Ver logs do servidor (do seu Mac)

```bash
# Logs da API
ssh servidor@192.168.1.100 "tail -f /home/servidor/petshop/api.log"

# Logs do MySQL
ssh servidor@192.168.1.100 "sudo tail -f /var/log/mysql/error.log"

# Status dos containers (se usar Docker)
ssh servidor@192.168.1.100 "docker-compose -f /home/servidor/petshop/docker-compose.yml ps"
```

---

## ✅ Checklist de Setup

- [ ] Servidor com IP fixo configurado
- [ ] SSH funcionando
- [ ] MySQL instalado e aceitando conexões remotas
- [ ] Firewall configurado (portas 3306, 8000, 3000)
- [ ] Projeto clonado no servidor
- [ ] databases.json configurado
- [ ] Migrações aplicadas
- [ ] API rodando (testar: curl http://192.168.1.100:8000/health)
- [ ] Frontend rodando (abrir http://192.168.1.100:3000)
- [ ] Login funcionando (admin / admin123 na empresa "teste")

---

## 🆘 Troubleshooting

### Não consigo conectar no MySQL remoto
```bash
# No servidor, verificar se está ouvindo em 0.0.0.0
sudo netstat -tuln | grep 3306

# Deve mostrar: 0.0.0.0:3306 (não 127.0.0.1:3306)
```

### API não inicia
```bash
# Ver erro completo
ssh servidor@192.168.1.100
cd /home/servidor/petshop/api
source venv/bin/activate
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

### Frontend não carrega dados
```bash
# Verificar se API_URL está correto no .env.local do frontend
cat /home/servidor/petshop/web/.env.local
# Deve ter: NEXT_PUBLIC_API_URL=http://192.168.1.100:8000
```

---

## 🎯 Próximo Passo

Qual máquina você vai usar como servidor?
- Ubuntu/Debian Server
- Raspberry Pi
- Mac antigo
- Outro

Me diga e eu ajusto o script específico para o OS!
