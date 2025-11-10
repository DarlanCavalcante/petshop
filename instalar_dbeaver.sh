#!/bin/bash

echo "=================================================="
echo "INSTALANDO DBEAVER - Cliente MySQL Moderno"
echo "=================================================="
echo ""

echo "DBeaver é um cliente de banco de dados gratuito que:"
echo "✅ Suporta MySQL 9.5 perfeitamente"
echo "✅ Interface moderna e bonita"
echo "✅ Sem avisos de incompatibilidade"
echo "✅ Suporta múltiplos bancos de dados"
echo ""

echo "Instalando DBeaver Community..."
brew install --cask dbeaver-community

echo ""
echo "=================================================="
echo "INSTALAÇÃO CONCLUÍDA!"
echo "=================================================="
echo ""

echo "Para abrir o DBeaver:"
echo "  open -a DBeaver"
echo ""
echo "Ou encontre em: Applications → DBeaver.app"
echo ""

echo "CONFIGURAÇÃO NO DBEAVER:"
echo "1. Abrir DBeaver"
echo "2. Database → New Database Connection"
echo "3. Selecionar: MySQL"
echo "4. Preencher:"
echo "   Host: localhost"
echo "   Port: 3306"
echo "   Database: petshop"
echo "   Username: root"
echo "   Password: 34461011"
echo "5. Test Connection"
echo "6. Finish!"
echo ""
echo "=================================================="

read -p "Deseja abrir o DBeaver agora? (s/n) " resposta

if [[ "$resposta" == "s" || "$resposta" == "S" ]]; then
    echo "Abrindo DBeaver..."
    open -a DBeaver
fi
