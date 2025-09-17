# Dockerfile multi-stage para aplicação Node.js + React
FROM node:20-alpine AS builder

# Instalar dependências do sistema
RUN apk add --no-cache python3 make g++

# Definir diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Stage final - imagem de produção
FROM node:20-alpine AS production

# Instalar dependências do sistema para produção
RUN apk add --no-cache dumb-init curl

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && adduser -S appuser -u 1001 -G nodejs

# Definir diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production && npm cache clean --force

# Copiar arquivos buildados do stage anterior
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/shared ./shared

# Mudar para usuário não-root
USER appuser

# Expor porta
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Comando para iniciar aplicação
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]