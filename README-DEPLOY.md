# 🚀 Guia de Deploy - Sistema de Tracking

Este guia contém todas as instruções para fazer deploy da aplicação em uma VPS.

## 📋 Pré-requisitos

- VPS com Ubuntu 20.04+ ou Debian 11+
- Acesso root/sudo na VPS
- Domínio configurado (opcional)
- Pelo menos 2GB RAM e 20GB de armazenamento

## 🔧 Configuração Inicial da VPS

### 1. Configurar o ambiente

```bash
# Conectar na VPS
ssh usuario@seu-servidor.com

# Executar o script de configuração
./setup-vps.sh

# Fazer logout e login novamente para aplicar permissões do Docker
exit
ssh usuario@seu-servidor.com
```

### 2. Clonar o projeto

```bash
# Ir para o diretório de aplicações
cd /var/www/tracking-system

# Clonar ou fazer upload dos arquivos do projeto
# (substitua pela forma como você vai transferir os arquivos)
git clone seu-repositorio.git .
# ou
# scp -r ./tracking-system/* usuario@servidor:/var/www/tracking-system/
```

## ⚙️ Configuração da Aplicação

### 1. Configurar variáveis de ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar o arquivo .env
nano .env
```

**Configurações obrigatórias no .env:**

```bash
# Banco de Dados
DB_NAME=tracking_system
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_SUPER_SEGURA_AQUI
DB_PORT=5432

# URL do banco (ajuste a senha)
DATABASE_URL=postgresql://postgres:SUA_SENHA_SUPER_SEGURA_AQUI@postgres:5432/tracking_system

# Aplicação
NODE_ENV=production
APP_PORT=3000
PORT=5000

# Segurança (gere uma chave aleatória longa)
SESSION_SECRET=sua_chave_secreta_muito_longa_e_segura_minimo_32_caracteres

# Domínio (opcional)
DOMAIN=seudominio.com.br
```

### 2. Gerar SESSION_SECRET segura

```bash
# Gerar uma chave aleatória
openssl rand -base64 32
```

## 🚀 Deploy

### Deploy simples (primeira vez)

```bash
# Executar o script de deploy
./deploy.sh production
```

### Deploy com backup (atualizações)

O script já faz backup automaticamente em produção. Os backups ficam em `/var/backups/tracking-system/`.

## 🌐 Configuração do Nginx (Opcional)

Se você instalou o Nginx durante a configuração:

### 1. Configurar o Nginx

```bash
# Copiar configuração
sudo cp nginx.conf /etc/nginx/nginx.conf

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 2. Configurar SSL com Certbot (Recomendado)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seudominio.com.br

# Configurar renovação automática
sudo crontab -e
# Adicionar linha: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔍 Verificação e Monitoramento

### 1. Verificar se está funcionando

```bash
# Verificar containers
docker-compose ps

# Verificar logs
docker-compose logs app
docker-compose logs postgres

# Testar aplicação
curl http://localhost:3000/api/health
```

### 2. Comandos úteis

```bash
# Ver logs em tempo real
docker-compose logs -f app

# Reiniciar aplicação
docker-compose restart app

# Reiniciar tudo
docker-compose restart

# Fazer backup manual do banco
./backup-db.sh

# Verificar uso de recursos
docker stats
```

## 📊 Estrutura de Diretórios

```
/var/www/tracking-system/
├── client/                 # Frontend React
├── server/                 # Backend Express
├── shared/                 # Esquemas compartilhados
├── docker-compose.yml      # Orquestração dos containers
├── Dockerfile             # Imagem da aplicação
├── .env                   # Variáveis de ambiente (NÃO commitar)
├── deploy.sh              # Script de deploy
├── setup-vps.sh           # Script de configuração da VPS
└── nginx.conf             # Configuração do Nginx

/var/backups/tracking-system/
└── backup_YYYYMMDD_HHMMSS.sql  # Backups do banco

/var/log/tracking-system/
└── *.log                  # Logs da aplicação
```

## 🆘 Solução de Problemas

### Aplicação não inicia

```bash
# Verificar logs
docker-compose logs app

# Verificar se as variáveis de ambiente estão corretas
docker-compose config

# Verificar se o banco está rodando
docker-compose logs postgres
```

### Erro de conexão com banco

```bash
# Verificar se o banco está saudável
docker exec tracking_db pg_isready -U postgres

# Verificar URL de conexão
echo $DATABASE_URL
```

### Problemas de permissão

```bash
# Corrigir permissões
sudo chown -R $USER:$USER /var/www/tracking-system
```

### Aplicação lenta

```bash
# Verificar recursos
docker stats
htop

# Limpar logs antigos
docker-compose exec app find /app/logs -name "*.log" -mtime +7 -delete
```

## 🔄 Atualizações

Para atualizar a aplicação:

1. Fazer backup: `./deploy.sh production` (backup automático)
2. Atualizar código fonte
3. Executar deploy: `./deploy.sh production`

## 🛡️ Segurança

### Configurações implementadas:

- ✅ Cookies seguros (HTTPS)
- ✅ Headers de segurança
- ✅ Rate limiting
- ✅ Firewall configurado
- ✅ Usuário não-root nos containers
- ✅ Health checks
- ✅ Logs estruturados

### Recomendações adicionais:

- Configure backup automático do banco
- Monitore logs regularmente
- Mantenha o sistema atualizado
- Use SSL/HTTPS em produção
- Configure alertas de monitoramento

## 📞 Suporte

Em caso de problemas:

1. Verifique os logs: `docker-compose logs app`
2. Teste o health check: `curl http://localhost:3000/api/health`
3. Verifique o status dos containers: `docker-compose ps`
4. Consulte a documentação do erro específico

---

**✅ Sua aplicação está pronta para produção!**