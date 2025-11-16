# Script para validar sintaxe das migrações SQL Server
param(
    [string]$Path = "db/migrations"
)

Write-Host "Validando sintaxe das migrações SQL Server..." -ForegroundColor Green

Get-ChildItem "$Path/*.sql" | ForEach-Object {
    $file = $_.FullName
    $fileName = $_.Name
    Write-Host "Validando: $fileName" -ForegroundColor Yellow

    $content = Get-Content $file -Raw

    # Verificações básicas de sintaxe SQL Server
    $errors = @()

    # Verificar se não há sintaxe MySQL
    if ($content -match "AUTO_INCREMENT") {
        $errors += "AUTO_INCREMENT encontrado (use IDENTITY)"
    }
    if ($content -match "BOOLEAN") {
        $errors += "BOOLEAN encontrado (use BIT)"
    }
    if ($content -match "TIMESTAMP") {
        $errors += "TIMESTAMP encontrado (use DATETIME2)"
    }
    if ($content -match "CURRENT_TIMESTAMP") {
        $errors += "CURRENT_TIMESTAMP encontrado (use GETDATE())"
    }
    if ($content -match "CREATE TABLE IF NOT EXISTS") {
        $errors += "CREATE TABLE IF NOT EXISTS encontrado (remova IF NOT EXISTS)"
    }
    if ($content -match "INSERT IGNORE") {
        $errors += "INSERT IGNORE encontrado (use IF NOT EXISTS)"
    }
    if ($content -match "ENUM") {
        $errors += "ENUM encontrado (use CHECK constraint)"
    }
    if ($content -match "ENGINE=") {
        $errors += "ENGINE= encontrado (remova)"
    }
    if ($content -match "DEFAULT CHARSET") {
        $errors += "DEFAULT CHARSET encontrado (remova)"
    }
    if ($content -match "COMMENT") {
        $errors += "COMMENT encontrado (use comentários SQL)"
    }
    if ($content -match "ADD COLUMN") {
        $errors += "ADD COLUMN encontrado (use ADD)"
    }
    if ($content -match "CREATE INDEX.*\(") {
        $errors += "CREATE INDEX sem NONCLUSTERED encontrado"
    }

    if ($errors.Count -gt 0) {
        Write-Host "  ❌ Erros encontrados:" -ForegroundColor Red
        $errors | ForEach-Object { Write-Host "     $_" -ForegroundColor Red }
    } else {
        Write-Host "  ✅ Sintaxe válida" -ForegroundColor Green
    }
}

Write-Host "Validação concluída!" -ForegroundColor Green