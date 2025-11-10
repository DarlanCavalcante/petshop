#!/bin/bash

echo "=================================================="
echo "DESINSTALAÇÃO COMPLETA DO MYSQL WORKBENCH"
echo "=================================================="
echo ""

echo "Este script vai remover:"
echo "  ✓ Aplicativo MySQLWorkbench.app"
echo "  ✓ Preferências do usuário"
echo "  ✓ Arquivos de cache"
echo "  ✓ Arquivos de configuração"
echo ""

read -p "Deseja continuar? (s/n) " resposta

if [[ "$resposta" != "s" && "$resposta" != "S" ]]; then
    echo "Cancelado."
    exit 0
fi

echo ""
echo "Removendo MySQL Workbench..."
echo ""

# 1. Remover aplicativo
echo "1. Removendo aplicativo..."
sudo rm -rf /Applications/MySQLWorkbench.app
if [ $? -eq 0 ]; then
    echo "   ✅ Aplicativo removido"
else
    echo "   ⚠️  Aplicativo não encontrado ou já removido"
fi

# 2. Remover preferências do usuário
echo "2. Removendo preferências do usuário..."
rm -rf ~/Library/Preferences/com.oracle.workbench.MySQLWorkbench.plist 2>/dev/null
rm -rf ~/Library/Preferences/com.mysql.workbench.plist 2>/dev/null
rm -rf ~/Library/Application\ Support/MySQL/Workbench 2>/dev/null
echo "   ✅ Preferências removidas"

# 3. Remover cache
echo "3. Removendo cache..."
rm -rf ~/Library/Caches/com.oracle.workbench.MySQLWorkbench 2>/dev/null
rm -rf ~/Library/Caches/MySQL/Workbench 2>/dev/null
echo "   ✅ Cache removido"

# 4. Remover logs
echo "4. Removendo logs..."
rm -rf ~/Library/Logs/MySQL\ Workbench 2>/dev/null
echo "   ✅ Logs removidos"

# 5. Remover saved state
echo "5. Removendo estados salvos..."
rm -rf ~/Library/Saved\ Application\ State/com.oracle.workbench.MySQLWorkbench.savedState 2>/dev/null
echo "   ✅ Estados removidos"

# 6. Remover containers
echo "6. Removendo containers..."
rm -rf ~/Library/Containers/com.oracle.workbench.MySQLWorkbench 2>/dev/null
echo "   ✅ Containers removidos"

# 7. Verificar se foi removido
echo ""
echo "Verificando remoção..."
if [ -d "/Applications/MySQLWorkbench.app" ]; then
    echo "   ❌ MySQLWorkbench.app ainda existe"
else
    echo "   ✅ MySQLWorkbench.app removido completamente"
fi

echo ""
echo "=================================================="
echo "DESINSTALAÇÃO CONCLUÍDA!"
echo "=================================================="
echo ""
echo "MySQL Workbench foi completamente removido do sistema."
echo ""
echo "Você ainda tem:"
echo "  ✓ MySQL Server (funcionando)"
echo "  ✓ Banco de dados petshop (intacto)"
echo "  ✓ DBeaver (instalado e funcionando)"
echo ""
echo "Para acessar o banco use o DBeaver:"
echo "  open /Applications/DBeaver.app"
echo ""
echo "=================================================="
