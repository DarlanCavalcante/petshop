#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "[ERRO] Node.js não encontrado. Instale Node 18+ (ou use nvm)." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[ERRO] npm não encontrado." >&2
  exit 1
fi

# Instalar dependências se node_modules não existir
if [ ! -d node_modules ]; then
  echo "[INFO] Instalando dependências..."
  npm install
fi

# Iniciar dev server
echo "[INFO] Iniciando Next.js em http://localhost:3000"
npm run dev
