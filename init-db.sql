-- Script de inicialização do banco de dados
-- Este arquivo é executado automaticamente quando o container do PostgreSQL é criado

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar se o banco já existe, caso contrário será criado pelo docker-compose
-- As tabelas serão criadas automaticamente pelo Drizzle ORM quando a aplicação iniciar