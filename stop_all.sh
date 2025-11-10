#!/usr/bin/env bash
set -euo pipefail

# Para API e Frontend iniciados por start_all.sh
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_DIR="$ROOT_DIR/.pids"

echo "======================================"
echo "  Parando API + Frontend"
echo "======================================"

if [ -f "$PID_DIR/api.pid" ]; then
  API_PID=$(cat "$PID_DIR/api.pid")
  echo "Parando API (PID: $API_PID)..."
  kill "$API_PID" 2>/dev/null || echo "  (já parado)"
  rm -f "$PID_DIR/api.pid"
fi

if [ -f "$PID_DIR/web.pid" ]; then
  WEB_PID=$(cat "$PID_DIR/web.pid")
  echo "Parando Frontend (PID: $WEB_PID)..."
  kill "$WEB_PID" 2>/dev/null || echo "  (já parado)"
  rm -f "$PID_DIR/web.pid"
fi

# Garantir que processos foram mortos
pkill -f "uvicorn src.main" || true
pkill -f "next dev" || true

echo ""
echo "✓ Tudo parado."
