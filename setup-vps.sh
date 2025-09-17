#!/bin/bash

# Script para configurar VPS do zero
# Uso: ./setup-vps.sh

set -e

echo "🔧 Configurando VPS para Tracking System..."

# Atualizar sistema
echo "📦 Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
echo "🔧 Instalando dependências básicas..."
sudo apt install -y curl wget git ufw htop nano

# Instalar Docker
echo "🐳 Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Instalar Docker Compose
echo "🐳 Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Configurar firewall
echo "🔥 Configurando firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
echo "y" | sudo ufw enable

# Criar diretórios
echo "📁 Criando diretórios..."
sudo mkdir -p /var/www/tracking-system
sudo mkdir -p /var/backups/tracking-system
sudo mkdir -p /var/log/tracking-system

# Configurar permissões
sudo chown -R $USER:$USER /var/www/tracking-system
sudo chown -R $USER:$USER /var/backups/tracking-system

# Instalar Nginx (opcional)
echo "🌐 Deseja instalar Nginx como proxy reverso? (y/n)"
read -r install_nginx
if [[ $install_nginx == "y" || $install_nginx == "Y" ]]; then
    sudo apt install -y nginx
    sudo systemctl enable nginx
    echo "✅ Nginx instalado! Configure o arquivo nginx.conf"
fi

# Configurar logrotate
echo "📝 Configurando rotação de logs..."
sudo tee /etc/logrotate.d/tracking-system > /dev/null <<EOF
/var/log/tracking-system/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        docker-compose restart app > /dev/null 2>&1 || true
    endscript
}
EOF

echo "✅ VPS configurado com sucesso!"
echo "📋 Próximos passos:"
echo "1. Clone o repositório em /var/www/tracking-system"
echo "2. Configure o arquivo .env"
echo "3. Execute ./deploy.sh"
echo ""
echo "⚠️  IMPORTANTE: Faça logout e login novamente para aplicar as permissões do Docker!"