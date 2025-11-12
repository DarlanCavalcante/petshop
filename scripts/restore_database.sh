#!/bin/bash
#
# Script de restauração de backup
# Uso: ./restore_database.sh <arquivo_backup.sql.gz> [nome_banco]
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verifica parâmetros
if [ $# -lt 1 ]; then
    echo -e "${RED}❌ Uso: $0 <arquivo_backup.sql.gz> [nome_banco]${NC}"
    echo -e "${YELLOW}Exemplo: $0 backups/petshop_empresa_teste_backup_20251111_120000.sql.gz${NC}"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="${2:-petshop_empresa_teste}"

# Verifica se arquivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Arquivo não encontrado: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  ATENÇÃO: Esta operação vai SOBRESCREVER o banco '$DB_NAME'${NC}"
echo -e "${YELLOW}   Arquivo: $BACKUP_FILE${NC}"
read -p "Deseja continuar? (yes/NO): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}❌ Restauração cancelada${NC}"
    exit 0
fi

# Carrega .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    exit 1
fi

echo -e "${GREEN}🔄 Restaurando backup...${NC}"

# Descompacta e restaura
gunzip < "$BACKUP_FILE" | docker exec -i petshop-mariadb mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup restaurado com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao restaurar backup${NC}"
    exit 1
fi
