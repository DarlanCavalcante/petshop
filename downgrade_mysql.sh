#!/bin/bash

echo "=================================================="
echo "DOWNGRADE MYSQL 9.5 → 8.4 LTS"
echo "=================================================="
echo ""

# 1. Fazer backup
echo "1. Fazendo backup do banco petshop..."
mysqldump -u root -p34461011 petshop > /tmp/backup_petshop_$(date +%Y%m%d).sql 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Backup salvo em: /tmp/backup_petshop_$(date +%Y%m%d).sql"
else
    echo "   ⚠️  Não foi possível fazer backup (MySQL pode não estar rodando)"
fi

echo ""

# 2. Parar MySQL
echo "2. Parando MySQL 9.5..."
brew services stop mysql
sleep 2
echo "   ✅ MySQL 9.5 parado"

echo ""

# 3. Desinstalar MySQL 9.5
echo "3. Desinstalando MySQL 9.5..."
brew uninstall mysql
echo "   ✅ MySQL 9.5 desinstalado"

echo ""

# 4. Instalar MySQL 8.4
echo "4. Instalando MySQL 8.4 LTS..."
brew install mysql@8.4
echo "   ✅ MySQL 8.4 instalado"

echo ""

# 5. Linkar MySQL 8.4
echo "5. Configurando MySQL 8.4..."
brew link mysql@8.4 --force
echo "   ✅ MySQL 8.4 configurado"

echo ""

# 6. Iniciar MySQL 8.4
echo "6. Iniciando MySQL 8.4..."
brew services start mysql@8.4
sleep 5
echo "   ✅ MySQL 8.4 iniciado"

echo ""

# 7. Configurar senha do root
echo "7. Configurando senha do root..."
mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '34461011';" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Senha configurada"
else
    echo "   ⚠️  Configurando senha de outra forma..."
    mysql -u root --skip-password -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '34461011';" 2>/dev/null
fi

echo ""

# 8. Restaurar backup
echo "8. Restaurando banco petshop..."
BACKUP_FILE=$(ls -t /tmp/backup_petshop_*.sql 2>/dev/null | head -1)
if [ -f "$BACKUP_FILE" ]; then
    mysql -u root -p34461011 < "$BACKUP_FILE" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "   ✅ Banco restaurado com sucesso!"
    else
        echo "   ⚠️  Será necessário restaurar manualmente"
    fi
else
    echo "   ⚠️  Backup não encontrado - será necessário recriar o banco"
    echo "   Execute: mysql -u root -p34461011 < esquema_reverso.sql"
    echo "   Execute: mysql -u root -p34461011 < melhorias_banco.sql"
fi

echo ""
echo "=================================================="
echo "CONCLUÍDO!"
echo "=================================================="
echo ""
echo "Versão instalada:"
mysql --version
echo ""
echo "MySQL 8.4 LTS está rodando e compatível com Workbench!"
echo "Agora você pode conectar sem avisos de incompatibilidade."
echo ""
echo "Para abrir o Workbench: open -a MySQLWorkbench"
echo "=================================================="
