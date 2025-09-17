import fs from 'fs';
import path from 'path';

// Script para mover os arquivos HTML para o local correto
const sourceDir = path.resolve('dist/public/client');
const targetDir = path.resolve('dist/public');

console.log('🔧 Corrigindo estrutura de arquivos...');

try {
  // Verificar se a pasta client existe
  if (fs.existsSync(sourceDir)) {
    // Mover index.html
    if (fs.existsSync(path.join(sourceDir, 'index.html'))) {
      fs.copyFileSync(
        path.join(sourceDir, 'index.html'),
        path.join(targetDir, 'index.html')
      );
      console.log('✅ index.html movido');
    }
    
    // Mover admin.html
    if (fs.existsSync(path.join(sourceDir, 'admin.html'))) {
      fs.copyFileSync(
        path.join(sourceDir, 'admin.html'),
        path.join(targetDir, 'admin.html')
      );
      console.log('✅ admin.html movido');
    }
    
    console.log('✅ Arquivos corrigidos com sucesso!');
  } else {
    console.log('❌ Pasta client não encontrada');
  }
} catch (error) {
  console.error('❌ Erro ao corrigir arquivos:', error.message);
  process.exit(1);
}