@echo off
REM SETUP AUTOMÁTICO - SISTEMA PETSHOP (Windows .bat)
REM Execute este arquivo como administrador se possível

chcp 65001 >nul

REM 1. Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [ERRO] Node.js nao encontrado! Instale com: winget install OpenJS.NodeJS.LTS
  pause
  exit /b 1
) else (
  node --version
)

REM 2. Verificar npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
  echo [ERRO] npm nao encontrado! Reinicie o terminal apos instalar Node.js.
  pause
  exit /b 1
) else (
  npm --version
)

REM 3. Instalar PM2 global
call npm install -g pm2
if %errorlevel% neq 0 (
  echo [ERRO] Falha ao instalar PM2.
  pause
  exit /b 1
)

REM 4. Criar pasta de logs
if not exist logs mkdir logs

REM 5. Instalar dependencias Python (API)
cd api
if exist requirements.txt (
  python -m pip install -r requirements.txt
  if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias Python.
    pause
    exit /b 1
  )
) else (
  echo [AVISO] requirements.txt nao encontrado na pasta api
)
cd ..

REM 6. Instalar dependencias Node (web)
cd web
if exist package.json (
  call npm install
  if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias Node.js.
    pause
    exit /b 1
  )
) else (
  echo [AVISO] package.json nao encontrado na pasta web
)
cd ..

REM 7. Iniciar PM2
call pm2 start ecosystem.config.js
if %errorlevel% neq 0 (
  echo [ERRO] Falha ao iniciar PM2.
  pause
  exit /b 1
)

REM 8. Status final
call pm2 status

echo.
echo [OK] Setup concluido! Veja os comandos uteis no arquivo PM2_GUIA.md
pause
