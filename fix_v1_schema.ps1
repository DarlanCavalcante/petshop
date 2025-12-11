# Script abrangente para converter V1__baseline_schema.sql para SQL Server
param(
    [string]$FilePath = "db/migrations/V1__baseline_schema.sql"
)

Write-Host "Convertendo V1__baseline_schema.sql para SQL Server..." -ForegroundColor Green

$content = Get-Content $FilePath -Raw

# Correções específicas para SQL Server
$content = $content -replace 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;', ''
$content = $content -replace 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4', ''
$content = $content -replace 'CURRENT_DATETIME2', 'GETDATE()'
$content = $content -replace 'ON UPDATE CURRENT_DATETIME2', ''
$content = $content -replace 'UNIQUE KEY ([^)]+)\s*\(([^)]+)\)', 'CONSTRAINT $1 UNIQUE ($2)'
$content = $content -replace 'KEY ([^)]+)\s*\(([^)]+)\)', 'INDEX $1 NONCLUSTERED ($2)'
$content = $content -replace 'PRIMARY KEY \(([^)]+)\)', 'CONSTRAINT PK_$1 PRIMARY KEY ($1)'
$content = $content -replace 'ENUM\([^)]+\)', 'VARCHAR(50)'
$content = $content -replace 'TEXT', 'NVARCHAR(MAX)'
$content = $content -replace 'CURDATE\(\)', 'CAST(GETDATE() AS DATE)'
$content = $content -replace 'CREATE OR REPLACE VIEW', 'CREATE VIEW'
$content = $content -replace 'DATE\(([^)]+)\)', 'CAST($1 AS DATE)'

# Corrigir constraints específicas
$content = $content -replace 'CONSTRAINT chk_clientes_email CHECK \(email LIKE ''%@%''\);', 'CONSTRAINT chk_clientes_email CHECK (email LIKE ''%@%'');'
$content = $content -replace 'CONSTRAINT chk_pets_sexo CHECK \(sexo IN \(''Macho'',''FÃªmea'',''NÃ£o informado''\)\);', 'CONSTRAINT chk_pets_sexo CHECK (sexo IN (''Macho'',''Fêmea'',''Não informado''));'

# Corrigir nomes de tabelas inconsistentes
$content = $content -replace 'Pagamentos', 'pagamentos'
$content = $content -replace 'id_Pagamentos', 'id_pagamento'

# Corrigir índices sem NONCLUSTERED
$content = $content -replace 'CREATE INDEX ([^ ]+) ON ([^(]+)\(([^)]+)\);', 'CREATE NONCLUSTERED INDEX $1 ON $2($3);'

Set-Content $FilePath $content -Encoding UTF8

Write-Host "Conversão concluída!" -ForegroundColor Green