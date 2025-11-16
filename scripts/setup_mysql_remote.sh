#!/bin/bash
# Configurar MySQL no servidor para aceitar conexões remotas

SERVER_USER="servidor"
SERVER_IP="192.168.1.100"

echo "======================================"
echo "  MySQL Remote Setup"
echo "======================================"
echo ""

ssh ${SERVER_USER}@${SERVER_IP} bash <<'REMOTE_SCRIPT'
set -e

echo "1. Configurando MySQL para aceitar conexões remotas..."

# Backup da configuração original
sudo cp /etc/mysql/mysql.conf.d/mysqld.cnf /etc/mysql/mysql.conf.d/mysqld.cnf.bak

# Alterar bind-address para 0.0.0.0
sudo sed -i 's/bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf

# Reiniciar MySQL
sudo systemctl restart mysql

echo "✓ MySQL configurado"

echo ""
echo "2. Criando usuário remoto..."

# Criar usuário que aceita conexões da rede local
sudo mysql <<SQL
-- Criar usuário para rede local
CREATE USER IF NOT EXISTS 'petshop'@'192.168.1.%' IDENTIFIED BY 'SenhaForte123';
GRANT ALL PRIVILEGES ON *.* TO 'petshop'@'192.168.1.%' WITH GRANT OPTION;

-- Criar databases
CREATE DATABASE IF NOT EXISTS petshop;
CREATE DATABASE IF NOT EXISTS petshop_empresa_teste;
CREATE DATABASE IF NOT EXISTS petshop_empresa_a;
CREATE DATABASE IF NOT EXISTS petshop_empresa_b;

FLUSH PRIVILEGES;
SQL

echo "✓ Usuário 'petshop' criado com acesso da rede 192.168.1.*"

echo ""
echo "3. Configurando firewall..."

# Permitir MySQL apenas da rede local
sudo ufw allow from 192.168.1.0/24 to any port 3306
sudo ufw allow from 192.168.1.0/24 to any port 8000
sudo ufw allow from 192.168.1.0/24 to any port 3000
sudo ufw allow 22/tcp  # SSH

# Habilitar firewall se não estiver
sudo ufw --force enable

echo "✓ Firewall configurado"

echo ""
echo "4. Testando conexão..."

if mysql -u petshop -pSenhaForte123 -e "SELECT 1" > /dev/null 2>&1; then
    echo "✓ MySQL aceita login local"
else
    echo "❌ Erro ao testar login"
    exit 1
fi

echo ""
echo "======================================"
echo "  Setup Concluído!"
echo "======================================"
echo ""
echo "Credenciais MySQL:"
echo "  Host: 192.168.1.100"
echo "  Usuário: petshop"
echo "  Senha: SenhaForte123"
echo "  Databases: petshop, petshop_empresa_teste, petshop_empresa_a, petshop_empresa_b"
echo ""
echo "Testar do seu Mac:"
echo "  mysql -h 192.168.1.100 -u petshop -pSenhaForte123 -e 'SHOW DATABASES;'"
echo ""
REMOTE_SCRIPT

echo ""
echo "Testando conexão do Mac..."
if mysql -h ${SERVER_IP} -u petshop -pSenhaForte123 -e "SHOW DATABASES;" 2>/dev/null; then
    echo "✅ Conexão remota funcionando!"
else
    echo "⚠️  Não consegui conectar. Verifique se MySQL client está instalado:"
    echo "    brew install mysql-client"
fi
