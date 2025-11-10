-- Script para criar novo banco para uma empresa
-- Uso: mysql -u root -p < create_company_db.sql

-- Variáveis (substitua manualmente antes de rodar)
-- SET @empresa_db = 'petshop_empresa_nova';

-- Para MySQL/mariadb use:
CREATE DATABASE IF NOT EXISTS petshop_empresa_nova
	CHARACTER SET utf8mb4
	COLLATE utf8mb4_unicode_ci;

-- Conceder privilégios (ajuste o usuário conforme sua instalação)
-- Se estiver usando root local normalmente já tem acesso.
-- Exemplo para usuário dedicado:
-- CREATE USER 'empresa_nova'@'localhost' IDENTIFIED BY 'SenhaForte!';
-- GRANT ALL PRIVILEGES ON petshop_empresa_nova.* TO 'empresa_nova'@'localhost';
-- FLUSH PRIVILEGES;

-- Aplicar migrações existentes (executar fora deste script):
-- flyway -url=jdbc:mysql://localhost:3306/petshop_empresa_nova -user=flyway -password=Flyway2025! migrate;
