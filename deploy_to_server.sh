#!/bin/bash
# Deploy automático para servidor remoto na LAN

set -e

# ====================================
# CONFIGURAÇÕES - EDITE AQUI
# ====================================
SERVER_IP="192.168.1.100"          # IP do servidor na rede
SERVER_USER="servidor"              # Usuário SSH
SERVER_DIR="/home/servidor/petshop" # Diretório no servidor
MYSQL_PASSWORD="SenhaForte123"      # Senha do MySQL

# ====================================
# FUNÇÕES
# ====================================

print_step() {
    echo ""
    echo "======================================"
    echo "  $1"
    echo "======================================"
}

# ====================================
# DEPLOY
# ====================================

print_step "1/5 Verificando conexão SSH"
if ! ssh -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_IP} "echo 'OK'" > /dev/null 2>&1; then
    echo "❌ Não consegui conectar em ${SERVER_USER}@${SERVER_IP}"
    echo "Verifique:"
    echo "  - IP está correto?"
    echo "  - SSH está habilitado no servidor?"
    echo "  - Servidor está na mesma rede?"
    exit 1
fi
echo "✓ Conexão SSH OK"

print_step "2/5 Sincronizando arquivos"
rsync -avz --progress \
    --exclude 'venv' \
    --exclude 'node_modules' \
    --exclude '.pids' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    ./ ${SERVER_USER}@${SERVER_IP}:${SERVER_DIR}/

echo "✓ Arquivos sincronizados"

print_step "3/5 Configurando ambiente no servidor"
ssh ${SERVER_USER}@${SERVER_IP} bash <<EOF
set -e

cd ${SERVER_DIR}

# Criar .env para API
cat > api/.env <<EOL
DATABASE_URL=mysql+pymysql://root:${MYSQL_PASSWORD}@localhost:3306/petshop
SECRET_KEY=\$(openssl rand -hex 32)
EOL

# Criar .env.local para Frontend
cat > web/.env.local <<EOL
NEXT_PUBLIC_API_URL=http://${SERVER_IP}:8000
EOL

echo "✓ Arquivos .env criados"
EOF

print_step "4/5 Instalando dependências"
ssh ${SERVER_USER}@${SERVER_IP} bash <<'EOF'
set -e

cd ${SERVER_DIR}

# Backend
cd api
python3 -m venv venv
source venv/bin/activate
pip install -q -r requirements.txt
deactivate

# Frontend
cd ../web
npm install --silent

echo "✓ Dependências instaladas"
EOF

print_step "5/5 Iniciando serviços"
ssh ${SERVER_USER}@${SERVER_IP} bash <<EOF
set -e

cd ${SERVER_DIR}

# Parar processos antigos
pkill -f "uvicorn src.main" || true
pkill -f "next" || true

# Criar diretório de logs
mkdir -p logs

# Iniciar API
cd api
source venv/bin/activate
nohup uvicorn src.main:app --host 0.0.0.0 --port 8000 > ../logs/api.log 2>&1 &
echo "✓ API iniciada (PID: \$!)"

# Aguardar API subir
sleep 3

# Iniciar Frontend
cd ../web
nohup npm run dev > ../logs/web.log 2>&1 &
echo "✓ Frontend iniciado (PID: \$!)"

echo ""
echo "======================================"
echo "  Deploy Concluído!"
echo "======================================"
echo ""
echo "  Frontend: http://${SERVER_IP}:3000"
echo "  API:      http://${SERVER_IP}:8000"
echo "  Docs:     http://${SERVER_IP}:8000/docs"
echo ""
echo "Logs:"
echo "  tail -f ${SERVER_DIR}/logs/api.log"
echo "  tail -f ${SERVER_DIR}/logs/web.log"
echo ""
EOF

# Testar se API respondeu
echo ""
echo "Testando API..."
sleep 2
if curl -s -f http://${SERVER_IP}:8000/health > /dev/null 2>&1; then
    echo "✅ API respondendo!"
else
    echo "⚠️  API não respondeu ainda. Aguarde alguns segundos e teste:"
    echo "   curl http://${SERVER_IP}:8000/health"
fi

echo ""
echo "🎉 Deploy finalizado!"
echo ""
echo "Para ver logs em tempo real:"
echo "  ssh ${SERVER_USER}@${SERVER_IP} 'tail -f ${SERVER_DIR}/logs/api.log'"
echo ""
