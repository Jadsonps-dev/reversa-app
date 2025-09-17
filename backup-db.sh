#!/bin/bash

# Script para backup manual do banco de dados
# Uso: ./backup-db.sh [filename]

set -e

BACKUP_DIR="/var/backups/tracking-system"
CONTAINER_NAME="tracking_db"

# Ler variáveis do .env se existir
if [ -f ".env" ]; then
    source .env
fi

DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-tracking_system}"

# Criar diretório de backup se não existir
if [ ! -d "$BACKUP_DIR" ]; then
    sudo mkdir -p "$BACKUP_DIR"
    sudo chown $USER:$USER "$BACKUP_DIR"
fi

# Nome do arquivo de backup
if [ -n "$1" ]; then
    BACKUP_FILE="$BACKUP_DIR/$1.sql"
else
    BACKUP_FILE="$BACKUP_DIR/manual_backup_$(date +%Y%m%d_%H%M%S).sql"
fi

echo "📦 Fazendo backup do banco de dados..."

# Verificar se o container está rodando
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "❌ Container $CONTAINER_NAME não está rodando!"
    echo "Execute: docker-compose up -d postgres"
    exit 1
fi

# Fazer backup
docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup criado com sucesso: $BACKUP_FILE"
    echo "📊 Tamanho do arquivo: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo "❌ Erro ao criar backup!"
    exit 1
fi

# Listar backups existentes
echo ""
echo "📁 Backups existentes:"
ls -lh "$BACKUP_DIR"/*.sql 2>/dev/null || echo "Nenhum backup encontrado."

echo ""
echo "🧹 Para limpar backups antigos (mais de 30 dias):"
echo "find $BACKUP_DIR -name '*.sql' -mtime +30 -delete"