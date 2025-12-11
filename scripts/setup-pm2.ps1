# Script de Setup Completo do PM2
# Execute este script APÓS reiniciar o terminal

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  SETUP COMPLETO - SISTEMA PETSHOP COM PM2" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""


# Verificar se Node.js está instalado
Write-Host "[1/6] Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = $null
try {
    $nodeVersion = node --version
} catch {}
if ($nodeVersion) {
    Write-Host "✓ Node.js instalado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js não encontrado! Execute:" -ForegroundColor Red
    Write-Host "  winget install OpenJS.NodeJS.LTS" -ForegroundColor Yellow
    exit 1
}

# Verificar npm
$npmVersion = $null
try {
    $npmVersion = npm --version
} catch {}
if ($npmVersion) {
    Write-Host "✓ npm instalado: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "✗ npm não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/6] Instalando PM2 globalmente..." -ForegroundColor Yellow
npm install -g pm2
$pm2Status = $LASTEXITCODE
if ($pm2Status -eq 0) {
    Write-Host "✓ PM2 instalado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "✗ Erro ao instalar PM2" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/6] Criando pasta de logs..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path ".\logs" | Out-Null
Write-Host "✓ Pasta logs\ criada" -ForegroundColor Green

Write-Host ""
Write-Host "[4/6] Instalando dependências Python (API)..." -ForegroundColor Yellow

Set-Location -Path ".\api"
$reqExists = Test-Path "requirements.txt"
if ($reqExists) {
    python -m pip install -r requirements.txt
    $pipStatus = $LASTEXITCODE
    if ($pipStatus -eq 0) {
        Write-Host "✓ Dependências Python instaladas" -ForegroundColor Green
    } else {
        Write-Host "⚠ Erro ao instalar dependências Python" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ requirements.txt não encontrado" -ForegroundColor Yellow
}
Set-Location -Path ".."

Write-Host ""
Write-Host "[5/6] Instalando dependências Node.js (Frontend)..." -ForegroundColor Yellow

Set-Location -Path ".\web"
$pkgExists = Test-Path "package.json"
if ($pkgExists) {
    npm install
    $npmInstallStatus = $LASTEXITCODE
    if ($npmInstallStatus -eq 0) {
        Write-Host "✓ Dependências Node.js instaladas" -ForegroundColor Green
    } else {
        Write-Host "⚠ Erro ao instalar dependências Node.js" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ package.json não encontrado" -ForegroundColor Yellow
}
Set-Location -Path ".."

Write-Host ""
Write-Host "[6/6] Iniciando PM2..." -ForegroundColor Yellow
pm2 start ecosystem.config.js
$pm2StartStatus = $LASTEXITCODE
if ($pm2StartStatus -eq 0) {
    Write-Host "✓ PM2 iniciado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "⚠ Erro ao iniciar PM2" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  COMANDOS ÚTEIS" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ver status:        " -NoNewline; Write-Host "pm2 status" -ForegroundColor Green
Write-Host "Ver logs:          " -NoNewline; Write-Host "pm2 logs" -ForegroundColor Green
Write-Host "Monitorar:         " -NoNewline; Write-Host "pm2 monit" -ForegroundColor Green
Write-Host "Reiniciar tudo:    " -NoNewline; Write-Host "pm2 restart all" -ForegroundColor Green
Write-Host "Parar tudo:        " -NoNewline; Write-Host "pm2 stop all" -ForegroundColor Green
Write-Host "Salvar config:     " -NoNewline; Write-Host "pm2 save" -ForegroundColor Green
Write-Host ""

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  ACESSAR O SISTEMA" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "API:      " -NoNewline; Write-Host "http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host "Docs API: " -NoNewline; Write-Host "http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""

# Exibir status do PM2
Write-Host "Status atual do PM2:" -ForegroundColor Yellow
pm2 status

Write-Host ""
Write-Host "✓ Setup concluído!" -ForegroundColor Green
Write-Host "Consulte PM2_GUIA.md para mais informações" -ForegroundColor Gray
