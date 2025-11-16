Coloque aqui o arquivo de credenciais do seu tunnel Cloudflare (ex: 1234567890abcdef.json).

1. Baixe o arquivo de credenciais no painel Cloudflare (Zero Trust > Tunnels > Seu Tunnel > Baixar credenciais).
2. Renomeie o arquivo para o mesmo nome usado no campo 'credentials-file' do config.yml.
3. Não compartilhe este arquivo publicamente!

Exemplo de config.yml:

  tunnel: SEU_ID_DO_TUNNEL
  credentials-file: /etc/cloudflared/SEU_ARQUIVO_CREDENCIAL.json

Substitua os valores acima pelos do seu painel Cloudflare.