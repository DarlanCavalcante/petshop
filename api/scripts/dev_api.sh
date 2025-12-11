#!/usr/bin/env bash

set -euo pipefail#!/usr/bin/env bash

set -euo pipefail

# Sobe a API FastAPI com ambiente virtual ativado e checagens básicas

# Uso: ./scripts/dev_api.sh [--seed]# Sobe a API FastAPI com ambiente virtual ativado e checagens básicas

# Uso: ./scripts/dev_api.sh [--seed]

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT_DIR"ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT_DIR"

echo "🚀 Iniciando Petshop API em modo desenvolvimento..."

if [ ! -f "venv/bin/activate" ]; then

# Verificar se Python está instalado  echo "[ERRO] venv não encontrada em: $ROOT_DIR/venv" >&2

if ! command -v python3 &> /dev/null; then  echo "Crie com: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt" >&2

    echo "❌ Python3 não encontrado. Instale o Python 3.8+ primeiro."  exit 1

    exit 1fi

fi

# Ativar venv

# Verificar se virtualenv existe# Usar bash -lc fora deste script; aqui já estamos em bash

if [ ! -d "venv" ]; thensource venv/bin/activate

    echo "📦 Criando ambiente virtual..."

    python3 -m venv venv# Garantir uvicorn instalado

fiif ! command -v uvicorn >/dev/null 2>&1; then

  echo "[INFO] uvicorn não encontrado na venv. Instalando requirements..."

# Ativar ambiente virtual  pip install -r requirements.txt

echo "🔧 Ativando ambiente virtual..."fi

source venv/bin/activate

# Porta livre?

# Instalar dependências se necessárioif lsof -nP -iTCP:8000 | grep LISTEN >/dev/null 2>&1; then

if [ ! -f "venv/installed" ] || [ "requirements.txt" -nt "venv/installed" ]; then  echo "[INFO] Porta 8000 ocupada. Matando processos antigos de uvicorn..."

    echo "📦 Instalando dependências..."  pkill -f "uvicorn src.main" || true

    pip install -r requirements.txt  sleep 1

    touch venv/installedfi

fi

# Opcional: seed de demo

# Executar seed se solicitadoif [[ "${1:-}" == "--seed" ]]; then

if [ "${1:-}" = "--seed" ]; then  echo "[INFO] Rodando seed da empresa 'teste'..."

    echo "🌱 Executando seed do banco..."  mysql -u root -p34461011 < scripts/create_petshop_empresa_teste.sql || true

    python -c "fi

import sys

sys.path.append('.')# Subir API

from scripts.seed import seed_databaseecho "[INFO] Subindo API em http://127.0.0.1:8000"

seed_database()exec uvicorn src.main:app --reload --host 127.0.0.1 --port 8000

"
fi

# Verificar se o banco está acessível
echo "🔍 Verificando conexão com banco de dados..."
python -c "
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
db_url = os.getenv('DATABASE_URL')
if not db_url:
    print('❌ DATABASE_URL não definida')
    sys.exit(1)

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        result = conn.execute(text('SELECT 1'))
        print('✅ Banco de dados OK')
except Exception as e:
    print(f'❌ Erro no banco: {e}')
    sys.exit(1)
"

echo "🎯 Iniciando servidor FastAPI..."
echo "📖 Documentação: http://localhost:8000/docs"
echo "🔄 Recarregamento automático ativado"

# Executar servidor
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload