#!/bin/bash
# Setup Cloudflare Tunnel para expor aplicação local

set -e

echo "======================================"
echo "  Cloudflare Tunnel Setup - Petshop"
echo "======================================"
echo ""

# Verificar se cloudflared está instalado
if ! command -v cloudflared &> /dev/null; then
    echo "📦 Instalando cloudflared..."
    brew install cloudflare/cloudflare/cloudflared
else
    echo "✓ cloudflared já instalado"
fi

echo ""
echo "📋 Próximos passos manuais:"
echo ""
echo "1. Autenticar no Cloudflare:"
echo "   cloudflared tunnel login"
echo "   (Vai abrir navegador - faça login e escolha o domínio)"
echo ""
echo "2. Criar túnel:"
echo "   cloudflared tunnel create petshop"
echo "   (Anote o ID do túnel gerado)"
echo ""
echo "3. Configurar DNS:"
echo "   cloudflared tunnel route dns petshop petshop.SEUDOMINIO.com"
echo "   cloudflared tunnel route dns petshop api.SEUDOMINIO.com"
echo ""
echo "4. Criar arquivo de configuração:"
echo "   Edite ~/.cloudflared/config.yml com:"
echo ""
cat <<'EOF'
tunnel: petshop
credentials-file: /Users/darlan/.cloudflared/SEU_TUNNEL_ID.json

ingress:
  - hostname: petshop.SEUDOMINIO.com
    service: http://localhost:3000
  - hostname: api.SEUDOMINIO.com
    service: http://localhost:8000
  - service: http_status:404
EOF
echo ""
echo "5. Rodar túnel:"
echo "   cloudflared tunnel run petshop"
echo ""
echo "6. Para rodar em background (após testar):"
echo "   cloudflared service install"
echo "   sudo launchctl start com.cloudflare.cloudflared"
echo ""
echo "======================================"
echo "  Requisitos:"
echo "======================================"
echo "✓ Domínio próprio (ex: seudominio.com)"
echo "✓ Nameservers apontados para Cloudflare:"
echo "   - mila.ns.cloudflare.com"
echo "   - prince.ns.cloudflare.com"
echo ""
echo "Se não tiver domínio, use ngrok (mais simples):"
echo "  brew install ngrok"
echo "  ngrok http 3000"
echo ""
