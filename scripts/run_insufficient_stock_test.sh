#!/usr/bin/env bash
set -euo pipefail

# Executa teste de estoque insuficiente e valida que a mensagem de erro foi capturada
# Exit code 0 = sucesso (erro foi capturado); exit code 1 = falha

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
SQL_FILE="$ROOT_DIR/tests/teste_estoque_insuficiente.sql"

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

OUTPUT=$("${CMD[@]}" < "$SQL_FILE" 2>&1 || true)

if echo "$OUTPUT" | grep -q "OK: Erro de estoque insuficiente capturado"; then
  echo "✅ Teste de estoque insuficiente PASSOU (erro capturado corretamente)"
  exit 0
elif echo "$OUTPUT" | grep -q "FALHA"; then
  echo "❌ Teste de estoque insuficiente FALHOU (venda foi concluída indevidamente)"
  echo "$OUTPUT"
  exit 1
else
  echo "⚠️  Teste de estoque insuficiente teve saída inesperada:"
  echo "$OUTPUT"
  exit 1
fi
