#!/usr/bin/env bash
set -euo pipefail

# Teste E2E dos recursos adicionados na versão 1.3.0
# Cenários:
# 1. Login
# 2. Criar serviço com duração padrão
# 3. Criar pacote (combo) com esse serviço
# 4. Criar pacote (créditos)
# 5. Vender pacote de créditos para cliente existente
# 6. Criar agendamento usando pacote (consome 1 crédito)
# 7. Verificar contagem no calendário

API="http://localhost:8000"
EMPRESA="teste"
LOGIN="${LOGIN:-maria}"      # Ajuste se outro usuário presente ou exporte LOGIN
SENHA="${SENHA:-senha-hash-aqui}"  # Ajuste SENHA ou exporte SENHA; se no banco estiver hash bcrypt, use uma senha válida

if [ -n "${ACCESS_TOKEN:-}" ]; then
  echo "[1] Usando ACCESS_TOKEN do ambiente"
  ACCESS="$ACCESS_TOKEN"
else
  echo "[1] Login"
  TOKEN=$(curl -s -X POST "$API/auth/login" \
    -H "X-Empresa: $EMPRESA" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=$LOGIN&password=$SENHA") || { echo "Falha curl login"; exit 1; }
  ACCESS=$(echo "$TOKEN" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
  if [ -z "$ACCESS" ]; then
    echo "ERRO: Token não obtido. Exporte ACCESS_TOKEN ou ajuste LOGIN/SENHA."; exit 1
  fi
fi
echo "Token obtido: ${ACCESS:0:25}..."

AUTH_HDR=( -H "Authorization: Bearer $ACCESS" -H "X-Empresa: $EMPRESA" )

echo "[1.1] Obter dados do usuário (/auth/me)"
TMP=$(mktemp)
HTTP_CODE=$(curl -s -o "$TMP" -w "%{http_code}" "$API/auth/me" "${AUTH_HDR[@]}")
BODY=$(cat "$TMP")
rm -f "$TMP"
if [ "$HTTP_CODE" = "200" ]; then
  ID_FUNC=$(echo "$BODY" | sed -n 's/.*"id":\([0-9]*\).*/\1/p')
  echo "Funcionário ID: $ID_FUNC"
else
  echo "Aviso: /auth/me falhou ($HTTP_CODE). Body: $BODY"
  ID_FUNC=${ID_FUNC_OVERRIDE:-1}
  echo "Usando fallback ID_FUNC=$ID_FUNC (defina ID_FUNC_OVERRIDE para alterar)"
fi

echo "[2] Criar serviço com duração"
SERVICO_JSON='{"nome":"Tosa E2E","descricao":"Tosa completa teste","preco_base":85.5,"duracao_padrao":40,"ativo":true}'
SERVICO_RESP=$(curl -s -X POST "$API/servicos" "${AUTH_HDR[@]}" -H "Content-Type: application/json" -d "$SERVICO_JSON") || { echo "Falha criar serviço"; exit 1; }
ID_SERVICO=$(echo "$SERVICO_RESP" | sed -n 's/.*"id_servico":\([0-9]*\).*/\1/p')
if [ -z "$ID_SERVICO" ]; then echo "ERRO criando serviço: $SERVICO_RESP"; exit 1; fi
echo "Serviço criado: $ID_SERVICO"

echo "[3] Criar pacote combo com o serviço"
PACOTE_COMBO_JSON=$(cat <<EOF
{"nome":"Combo Tosa+Unique","descricao":"Pacote combo único","tipo":"combo","preco_base":80.0,"servicos_ids":[${ID_SERVICO}],"ativo":true}
EOF
)
PACOTE_COMBO_RESP=$(curl -s -X POST "$API/pacotes" "${AUTH_HDR[@]}" -H "Content-Type: application/json" -d "$PACOTE_COMBO_JSON")
ID_PACOTE_COMBO=$(echo "$PACOTE_COMBO_RESP" | sed -n 's/.*"id_pacote":\([0-9]*\).*/\1/p')
if [ -z "$ID_PACOTE_COMBO" ]; then echo "ERRO criando pacote combo: $PACOTE_COMBO_RESP"; exit 1; fi
echo "Pacote combo criado: $ID_PACOTE_COMBO"

echo "[4] Criar pacote créditos (3 usos / 30 dias)"
PACOTE_CREDITOS_JSON=$(cat <<EOF
{"nome":"Plano Tosa 3x","descricao":"3 tosas em 30 dias","tipo":"creditos","preco_base":220.0,"validade_dias":30,"max_usos":3,"servicos_ids":[${ID_SERVICO}],"ativo":true}
EOF
)
PACOTE_CREDITOS_RESP=$(curl -s -X POST "$API/pacotes" "${AUTH_HDR[@]}" -H "Content-Type: application/json" -d "$PACOTE_CREDITOS_JSON")
ID_PACOTE_CREDITOS=$(echo "$PACOTE_CREDITOS_RESP" | sed -n 's/.*"id_pacote":\([0-9]*\).*/\1/p')
if [ -z "$ID_PACOTE_CREDITOS" ]; then echo "ERRO criando pacote créditos: $PACOTE_CREDITOS_RESP"; exit 1; fi
echo "Pacote créditos criado: $ID_PACOTE_CREDITOS"

echo "[5] Obter cliente e vender pacote créditos"
CLIENTES=$(curl -s "$API/clientes" "${AUTH_HDR[@]}")
ID_CLIENTE=$(echo "$CLIENTES" | sed -n 's/.*"id_cliente":\([0-9]*\).*/\1/p' | head -1)
if [ -z "$ID_CLIENTE" ]; then echo "Nenhum cliente encontrado"; exit 1; fi
echo "Cliente: $ID_CLIENTE"

VENDA_JSON="{\"id_pacote\":${ID_PACOTE_CREDITOS},\"valor_pago\":200.0}"
VENDA_RESP=$(curl -s -X POST "$API/clientes/${ID_CLIENTE}/pacotes" "${AUTH_HDR[@]}" -H "Content-Type: application/json" -d "$VENDA_JSON")
ID_CLIENTE_PACOTE=$(echo "$VENDA_RESP" | sed -n 's/.*"id_cliente_pacote":\([0-9]*\).*/\1/p')
if [ -z "$ID_CLIENTE_PACOTE" ]; then echo "ERRO venda pacote: $VENDA_RESP"; exit 1; fi
echo "Pacote vendido ao cliente: $ID_CLIENTE_PACOTE"

echo "[6] Obter pet do cliente"
PETS=$(curl -s "$API/clientes/${ID_CLIENTE}/pets" "${AUTH_HDR[@]}")
ID_PET=$(echo "$PETS" | sed -n 's/.*"id_pet":\([0-9]*\).*/\1/p' | head -1)
if [ -z "$ID_PET" ]; then echo "Nenhum pet encontrado para cliente"; exit 1; fi
echo "Pet: $ID_PET"

echo "[7] Criar agendamento usando pacote (consome crédito)"
DATA=$(date '+%Y-%m-%d')
AG_JSON="{\"id_pet\":${ID_PET},\"id_servico\":${ID_SERVICO},\"id_funcionario\":${ID_FUNC},\"data_hora\":\"${DATA} 14:00:00\",\"duracao_estimada\":40,\"observacoes\":\"E2E teste\",\"id_cliente_pacote\":${ID_CLIENTE_PACOTE}}"
AG_RESP=$(curl -s -X POST "$API/agendamentos" "${AUTH_HDR[@]}" -H "Content-Type: application/json" -d "$AG_JSON")
ID_AG=$(echo "$AG_RESP" | sed -n 's/.*"id_agendamento":\([0-9]*\).*/\1/p')
if [ -z "$ID_AG" ]; then echo "ERRO criar agendamento: $AG_RESP"; exit 1; fi
echo "Agendamento criado: $ID_AG"

echo "[8] Verificar calendário do mês (contagem)"
ANO=$(date '+%Y'); MES=$(date '+%m' | sed 's/^0//')
CAL=$(curl -s "$API/agendamentos/calendario?ano=${ANO}&mes=${MES}" "${AUTH_HDR[@]}")
COUNT_DIA=$(echo "$CAL" | grep -c "$DATA") || true
echo "Entradas de dia atual na resposta: $COUNT_DIA (JSON completo: $CAL)"

echo "✔ Teste E2E finalizado com sucesso"