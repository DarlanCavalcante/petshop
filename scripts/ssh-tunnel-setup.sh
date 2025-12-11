#!/bin/bash
# Script para configurar acesso remoto seguro ao MySQL
# Uso: ./ssh-tunnel-setup.sh

echo "🔐 Configurando Acesso Remoto Seguro ao MySQL..."
echo ""
echo "Opções de acesso:"
echo "1. Acesso direto via Cloudflare Tunnel (recomendado para produção)"
echo "   - Host: mysql.petshop.tech10cloud.com:3306"
echo "   - Usuário: petshopuser"
echo "   - Senha: AppPassword456!"
echo ""
echo "2. SSH Tunnel local (para desenvolvimento)"
echo "   - Comando: ssh -L 3306:localhost:3306 -N user@your-server"
echo "   - Depois conecte em: localhost:3306"
echo ""
echo "⚠️  Segurança: O Cloudflare Tunnel é mais seguro pois não expõe"
echo "   diretamente o banco de dados na internet."
echo ""
echo "Para testar a conectividade local:"
echo "mysql -h 127.0.0.1 -P 3306 -u petshopuser -p petshoppass -D petshop_empresa_teste"