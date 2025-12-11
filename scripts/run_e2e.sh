#!/usr/bin/env bash
set -euo pipefail

# Executa o teste E2E lendo variáveis de ambiente opcionais:
# MYSQL_USER, MYSQL_PASSWORD, MYSQL_HOST, MYSQL_PORT
# Se a senha não for informada, o mysql pedirá interativamente.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
SQL_FILE="$ROOT_DIR/tests/teste_e2e.sql"

if [[ ! -f "$SQL_FILE" ]]; then
  echo "Arquivo de teste não encontrado: $SQL_FILE" >&2
  exit 1
fi

MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"

CMD=(mysql -u "$MYSQL_USER" -h "$MYSQL_HOST" -P "$MYSQL_PORT")

if [[ -n "${MYSQL_PASSWORD:-}" ]]; then
  CMD+=(-p"$MYSQL_PASSWORD")
fi

"${CMD[@]}" < "$SQL_FILE"

echo "Teste E2E executado com sucesso."