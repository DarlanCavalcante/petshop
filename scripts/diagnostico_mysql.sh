#!/bin/bash

echo "===================================="
echo "DIAGNÓSTICO E CORREÇÃO - MYSQL"
echo "===================================="
echo ""

# 1. Verificar se MySQL está rodando
echo "1. Verificando se MySQL está rodando..."
if brew services list | grep -q "mysql.*started"; then
    echo "   ✅ MySQL está rodando"
else
    echo "   ❌ MySQL NÃO está rodando"
    echo "   Iniciando MySQL..."
    brew services start mysql
    sleep 3
    echo "   ✅ MySQL iniciado!"
fi

echo ""

# 2. Testar conexão
echo "2. Testando conexão..."
if mysql -u root -p34461011 -e "SELECT 1;" 2>/dev/null; then
    echo "   ✅ Conexão funcionando!"
else
    echo "   ❌ Erro na conexão"
    echo "   Tentando reiniciar MySQL..."
    brew services restart mysql
    sleep 5
fi

echo ""

# 3. Verificar banco petshop
echo "3. Verificando banco petshop..."
if mysql -u root -p34461011 -e "USE petshop;" 2>/dev/null; then
    echo "   ✅ Banco petshop existe!"
else
    echo "   ❌ Banco petshop não encontrado"
fi

echo ""

# 4. Informações para o Workbench
echo "===================================="
echo "INFORMAÇÕES PARA O WORKBENCH:"
echo "===================================="
echo ""
echo "Connection Name:  Petshop"
echo "Hostname:         127.0.0.1"
echo "Port:             3306"
echo "Username:         root"
echo "Password:         34461011"
echo "Default Schema:   petshop"
echo ""
echo "===================================="
echo ""

# 5. Abrir Workbench
echo "Deseja abrir o MySQL Workbench agora? (s/n)"
read -r resposta

if [[ "$resposta" == "s" || "$resposta" == "S" ]]; then
    echo "Abrindo MySQL Workbench..."
    open -a MySQLWorkbench
    echo ""
    echo "INSTRUÇÕES NO WORKBENCH:"
    echo "1. Clique no '+' ao lado de 'MySQL Connections'"
    echo "2. Preencha com os dados acima"
    echo "3. Clique em 'Test Connection'"
    echo "4. Se aparecer aviso de versão, clique 'Continue'"
    echo "5. Clique 'OK' para salvar"
    echo "6. Clique na conexão para conectar"
fi

echo ""
echo "===================================="
echo "Diagnóstico concluído!"
echo "===================================="
