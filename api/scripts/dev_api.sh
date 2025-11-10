#!/usr/bin/env bash
set -euo pipefail

# Sobe a API FastAPI com ambiente virtual ativado e checagens básicas
# Uso: ./scripts/dev_api.sh [--seed]

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f "venv/bin/activate" ]; then
  echo "[ERRO] venv não encontrada em: $ROOT_DIR/venv" >&2
  echo "Crie com: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt" >&2
  exit 1
fi

# Ativar venv
# Usar bash -lc fora deste script; aqui já estamos em bash
source venv/bin/activate

# Garantir uvicorn instalado
if ! command -v uvicorn >/dev/null 2>&1; then
  echo "[INFO] uvicorn não encontrado na venv. Instalando requirements..."
  pip install -r requirements.txt
fi

# Porta livre?
if lsof -nP -iTCP:8000 | grep LISTEN >/dev/null 2>&1; then
  echo "[INFO] Porta 8000 ocupada. Matando processos antigos de uvicorn..."
  pkill -f "uvicorn src.main" || true
  sleep 1
fi

# Opcional: seed de demo
if [[ "${1:-}" == "--seed" ]]; then
  echo "[INFO] Rodando seed da empresa 'teste'..."
  mysql -u root -p34461011 < scripts/create_petshop_empresa_teste.sql || true
fi

# Subir API
echo "[INFO] Subindo API em http://127.0.0.1:8000"
exec uvicorn src.main:app --reload --host 127.0.0.1 --port 8000
