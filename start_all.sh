#!/usr/bin/env bash
set -euo pipefail

# Script para subir API (FastAPI) + Frontend (Next.js) em background
# Uso: ./start_all.sh
# Para parar: ./stop_all.sh

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_DIR="$ROOT_DIR/api"
WEB_DIR="$ROOT_DIR/web"
PID_DIR="$ROOT_DIR/.pids"

mkdir -p "$PID_DIR"

echo "======================================"
echo "  Petshop - Subindo API + Frontend"
echo "======================================"

# 1. Checar dependências básicas
if ! command -v mysql >/dev/null 2>&1; then
  echo "[AVISO] MySQL CLI não encontrado. Seed pode falhar se você rodar manualmente." >&2
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[ERRO] Node.js não encontrado. Instale Node 18+." >&2
  exit 1
fi

# 2. API (FastAPI)
echo ""
echo "[1/2] Subindo API (FastAPI) em http://127.0.0.1:8000 ..."
cd "$API_DIR"

if [ ! -d venv ]; then
  echo "[ERRO] venv não encontrada em $API_DIR/venv" >&2
  echo "Crie com: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt" >&2
  exit 1
fi

# Matar uvicorn antigo se existir
pkill -f "uvicorn src.main" || true
sleep 1

# Ativar venv e subir API em background
bash -lc "cd '$API_DIR' && source venv/bin/activate && uvicorn src.main:app --host 127.0.0.1 --port 8000" > "$PID_DIR/api.log" 2>&1 &
API_PID=$!
echo "$API_PID" > "$PID_DIR/api.pid"
echo "   API iniciada (PID: $API_PID)"
echo "   Logs: $PID_DIR/api.log"

# Aguardar API ficar pronta
echo "   Aguardando API..."
for i in {1..15}; do
  if curl -s http://127.0.0.1:8000/health >/dev/null 2>&1; then
    echo "   ✓ API respondendo em http://127.0.0.1:8000"
    break
  fi
  sleep 1
done

# 3. Frontend (Next.js)
echo ""
echo "[2/2] Subindo Frontend (Next.js) em http://localhost:3000 ..."
cd "$WEB_DIR"

if [ ! -d node_modules ]; then
  echo "   Instalando dependências do frontend..."
  npm install --silent
fi

# Matar Next.js antigo
pkill -f "next dev" || true
sleep 1

# Subir frontend em background
bash -lc "cd '$WEB_DIR' && npm run dev" > "$PID_DIR/web.log" 2>&1 &
WEB_PID=$!
echo "$WEB_PID" > "$PID_DIR/web.pid"
echo "   Frontend iniciado (PID: $WEB_PID)"
echo "   Logs: $PID_DIR/web.log"

echo ""
echo "======================================"
echo "  ✓ Tudo pronto!"
echo "======================================"
echo ""
echo "  API:      http://127.0.0.1:8000"
echo "  Docs:     http://127.0.0.1:8000/docs"
echo "  Frontend: http://localhost:3000"
echo ""
echo "Para parar tudo: ./stop_all.sh"
echo "Para ver logs:"
echo "  tail -f .pids/api.log"
echo "  tail -f .pids/web.log"
echo ""
