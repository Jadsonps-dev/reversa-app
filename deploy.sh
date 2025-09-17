#!/bin/bash

# Script de deploy para VPS
# Uso: ./deploy.sh [production|staging]

set -e

# Configurações
ENVIRONMENT=${1:-production}
APP_DIR="/var/www/tracking-system"
BACKUP_DIR="/var/backups/tracking-system"
DOCKER_COMPOSE_FILE="docker-compose.yml"

echo "🚀 Iniciando deploy do ambiente: $ENVIRONMENT"

# Função para fazer backup do banco
backup_database() {
    echo "📦 Fazendo backup do banco de dados..."
    if [ ! -d "$BACKUP_DIR" ]; then
        sudo mkdir -p "$BACKUP_DIR"
    fi
    
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    docker exec tracking_db pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"
    echo "✅ Backup salvo em: $BACKUP_FILE"
}

# Verificar se o .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "📝 Copie o .env.example para .env e configure as variáveis:"
    echo "cp .env.example .env"
    exit 1
fi

# Carregar variáveis de ambiente
source .env
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-tracking_system}"
APP_PORT="${APP_PORT:-3000}"

# Verificar qual versão do Docker Compose usar
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Docker Compose não está instalado!"
    exit 1
fi

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado!"
    exit 1
fi


# Fazer backup se for produção
if [ "$ENVIRONMENT" = "production" ]; then
    backup_database
fi

echo "🔄 Parando containers existentes..."
$DOCKER_COMPOSE down

echo "🏗️ Construindo nova imagem..."
$DOCKER_COMPOSE build --no-cache

echo "🎯 Executando migrações do banco..."
$DOCKER_COMPOSE up -d postgres
sleep 10

# Aguardar o banco ficar pronto
echo "⏳ Aguardando banco de dados..."
until docker exec tracking_db pg_isready -U "$DB_USER"; do
    echo "Aguardando PostgreSQL..."
    sleep 2
done

echo "🚀 Iniciando aplicação..."
$DOCKER_COMPOSE up -d

echo "⏳ Aguardando aplicação iniciar..."
sleep 15

# Verificar se a aplicação está rodando
if curl -f http://localhost:$APP_PORT/api/health > /dev/null 2>&1; then
    echo "✅ Deploy concluído com sucesso!"
    echo "🌐 Aplicação disponível em: http://localhost:$APP_PORT"
else
    echo "❌ Falha no health check da aplicação"
    echo "📋 Verificando logs..."
    $DOCKER_COMPOSE logs app
    exit 1
fi

echo "🧹 Limpando imagens não utilizadas..."
docker image prune -f

echo "🎉 Deploy finalizado!"