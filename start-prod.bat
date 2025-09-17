@echo off
echo Iniciando aplicacao em modo producao...

REM Verificar se existe o build
if not exist "dist\index.js" (
    echo Erro: Build nao encontrado! Execute: npm run build
    pause
    exit /b 1
)

REM Corrigir estrutura de arquivos
echo Corrigindo estrutura de arquivos...
node fix-build.js

REM Definir variaveis de ambiente
set NODE_ENV=production
set SESSION_SECRET=sua_chave_secreta_muito_longa_e_segura_para_sessoes_12345678901234567890
set PORT=5000

REM Iniciar aplicacao
echo Iniciando servidor na porta %PORT%...
node dist\index.js

pause