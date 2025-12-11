#!/bin/bash
#
# Script de backup automático do banco de dados
# Mantém os últimos 7 dias de backup
#

set -e  # Para em caso de erro

# Configurações
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
RETENTION_DAYS=7
MAX_BACKUPS=7

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Iniciando backup do banco de dados...${NC}"

# Cria diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Carrega variáveis de ambiente
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    exit 1
fi

# Verifica se MYSQL_ROOT_PASSWORD está definida
if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
    echo -e "${RED}❌ MYSQL_ROOT_PASSWORD não definida no .env${NC}"
    exit 1
fi

# Lista de bancos para backup
DATABASES=("petshop_empresa_teste")

# Adiciona outros bancos se houver
if [ -f "databases.json" ]; then
    echo -e "${YELLOW}📋 Detectado arquivo databases.json${NC}"
    # Extrai nomes de bancos do JSON (ajuste conforme estrutura)
fi

# Faz backup de cada banco
for DB_NAME in "${DATABASES[@]}"; do
    echo -e "${YELLOW}📦 Fazendo backup de: $DB_NAME${NC}"
    
    BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_$TIMESTAMP.sql.gz"
    
    # Faz dump do banco
    if docker exec petshop-mariadb mysqldump \
        -u root \
        -p"$MYSQL_ROOT_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --databases "$DB_NAME" \
        2>/dev/null | gzip > "$BACKUP_FILE"; then
        
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo -e "${GREEN}✅ Backup criado: $BACKUP_FILE ($BACKUP_SIZE)${NC}"
    else
        echo -e "${RED}❌ Erro ao fazer backup de $DB_NAME${NC}"
        rm -f "$BACKUP_FILE" 2>/dev/null
        continue
    fi
done

# Remove backups antigos
echo -e "${YELLOW}🧹 Removendo backups antigos...${NC}"

# Remove por idade (mais de X dias)
find "$BACKUP_DIR" -name "*_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# Mantém apenas os N backups mais recentes (por segurança extra)
ls -t "$BACKUP_DIR"/*_backup_*.sql.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm --

REMAINING_BACKUPS=$(ls -1 "$BACKUP_DIR"/*_backup_*.sql.gz 2>/dev/null | wc -l)
echo -e "${GREEN}✅ Backups existentes: $REMAINING_BACKUPS${NC}"

# Lista backups atuais
echo -e "\n${GREEN}📂 Backups disponíveis:${NC}"
ls -lh "$BACKUP_DIR"/*_backup_*.sql.gz 2>/dev/null | awk '{print $9, "("$5")"}'

echo -e "\n${GREEN}✨ Backup concluído com sucesso!${NC}"

# Log de backup
LOG_FILE="$BACKUP_DIR/backup.log"
echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup realizado com sucesso" >> "$LOG_FILE"
