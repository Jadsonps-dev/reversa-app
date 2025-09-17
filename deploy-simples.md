# 🚀 Deploy Simples - Windows

## Passo a passo para fazer deploy local:

### 1. Fazer o build
```bash
npm run build
```

### 2. Configurar variáveis de ambiente no .env
Seu arquivo `.env` já tem a DATABASE_URL configurada. Apenas adicione estas linhas:

```env
NODE_ENV=production
SESSION_SECRET=sua_chave_secreta_muito_longa_e_segura_para_sessoes_12345678901234567890
PORT=5000
```

### 3. Iniciar a aplicação

**Opção A - Usando o script .bat (mais fácil):**
```bash
start-prod.bat
```

**Opção B - Via comando (no PowerShell):**
```powershell
$env:NODE_ENV="production"
$env:SESSION_SECRET="sua_chave_secreta_muito_longa_e_segura_para_sessoes_12345678901234567890"
$env:PORT="5000"
node dist/index.js
```

**Opção C - Via comando (no CMD):**
```cmd
set NODE_ENV=production
set SESSION_SECRET=sua_chave_secreta_muito_longa_e_segura_para_sessoes_12345678901234567890
set PORT=5000
node dist/index.js
```

### 4. Acessar a aplicação
Abra o navegador em: `http://localhost:5000`

## ✅ Pronto!
Sua aplicação estará rodando localmente em modo de produção.

## 🔧 Se der erro:
1. Verifique se o arquivo `.env` tem a `DATABASE_URL`
2. Confirme que o build foi feito: `npm run build`
3. Verifique se tem a pasta `dist/` com o arquivo `index.js`