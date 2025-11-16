# Script para converter migrações MySQL para SQL Server
param(
    [string]$Path = "db/migrations"
)

Write-Host "Convertendo migrações MySQL para SQL Server..." -ForegroundColor Green

Get-ChildItem "$Path/*.sql" | ForEach-Object {
    $file = $_.FullName
    Write-Host "Processando: $($_.Name)" -ForegroundColor Yellow

    $content = Get-Content $file -Raw

    # Substituições básicas
    $content = $content -replace 'CREATE TABLE IF NOT EXISTS', 'CREATE TABLE'
    $content = $content -replace 'AUTO_INCREMENT', 'IDENTITY(1,1)'
    $content = $content -replace 'BOOLEAN', 'BIT'
    $content = $content -replace 'TRUE', '1'
    $content = $content -replace 'FALSE', '0'
    $content = $content -replace 'TIMESTAMP', 'DATETIME2'
    $content = $content -replace 'CURRENT_TIMESTAMP', 'GETDATE()'
    $content = $content -replace 'ON UPDATE CURRENT_TIMESTAMP', ''
    $content = $content -replace 'INSERT IGNORE INTO', 'INSERT INTO'
    $content = $content -replace 'ADD COLUMN', 'ADD'
    $content = $content -replace 'ADD INDEX ([^)]+)\s*\(([^)]+)\)', 'CREATE INDEX $1 ON $2'
    $content = $content -replace 'CREATE INDEX IF NOT EXISTS', 'CREATE INDEX'
    $content = $content -replace 'USE petshop;', ''
    $content = $content -replace 'DELIMITER \$\$', ''
    $content = $content -replace '\$\$', ''
    $content = $content -replace 'DROP PROCEDURE IF EXISTS', 'DROP PROCEDURE IF EXISTS'

    # Corrigir sintaxe de procedures
    $content = $content -replace 'CREATE PROCEDURE\s+([^\s(]+)', 'CREATE PROCEDURE $1'

    Set-Content $file $content -Encoding UTF8
}

Write-Host "Conversão concluída!" -ForegroundColor Green