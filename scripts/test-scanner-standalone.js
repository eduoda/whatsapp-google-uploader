#!/usr/bin/env node

/**
 * Standalone Scanner Test - No SQLite Required
 * Works on Termux without any native dependencies
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { createReadStream } = require('fs');

// Colors for terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function detectWhatsAppPath() {
  const searchPaths = [
    '/storage/emulated/0/Android/media/com.whatsapp/WhatsApp',
    '/sdcard/Android/media/com.whatsapp/WhatsApp',
    '/storage/emulated/0/WhatsApp',
    '/sdcard/WhatsApp'
  ];
  
  for (const searchPath of searchPaths) {
    try {
      const stat = await fs.stat(searchPath);
      if (stat.isDirectory()) {
        return searchPath;
      }
    } catch {
      // Path doesn't exist, continue
    }
  }
  
  return null;
}

async function calculateHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filePath);
    
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function scanDirectory(dirPath, files = [], depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return files;
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath, files, depth + 1, maxDepth);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        const supportedExts = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov', '.pdf', '.doc'];
        
        if (supportedExts.includes(ext)) {
          const stat = await fs.stat(fullPath);
          files.push({
            path: fullPath,
            name: entry.name,
            size: stat.size,
            modified: stat.mtime,
            extension: ext
          });
        }
      }
    }
  } catch (error) {
    // Ignore permission errors
  }
  
  return files;
}

async function testScanner() {
  log('\n🔍 WhatsApp Scanner Test (Standalone Version)', colors.bright + colors.cyan);
  log('=' .repeat(50), colors.cyan);
  
  try {
    // Check for command-line argument
    const customPath = process.argv[2];
    
    log('\n📁 Detectando diretório do WhatsApp...', colors.yellow);
    
    let whatsappPath;
    if (customPath) {
      log(`📍 Usando caminho fornecido: ${customPath}`, colors.blue);
      try {
        await fs.access(customPath);
        whatsappPath = customPath;
      } catch {
        log(`❌ Caminho fornecido não existe: ${customPath}`, colors.red);
        return;
      }
    } else {
      whatsappPath = await detectWhatsAppPath();
    }
    
    if (!whatsappPath) {
      log('❌ WhatsApp não encontrado!', colors.red);
      log('\n💡 Tente especificar o caminho:', colors.yellow);
      log('  node scripts/test-scanner-standalone.js "/caminho/para/WhatsApp"', colors.reset);
      return;
    }
    
    log(`✅ WhatsApp encontrado: ${whatsappPath}`, colors.green);
    
    // Scan Media directory
    const mediaPath = path.join(whatsappPath, 'Media');
    log('\n📸 Escaneando diretório de mídia...', colors.yellow);
    
    const files = await scanDirectory(mediaPath);
    
    log(`\n✅ ${files.length} arquivos encontrados`, colors.green);
    
    // Group by type
    const photos = files.filter(f => ['.jpg', '.jpeg', '.png', '.gif'].includes(f.extension));
    const videos = files.filter(f => ['.mp4', '.mov', '.avi'].includes(f.extension));
    const docs = files.filter(f => ['.pdf', '.doc', '.docx'].includes(f.extension));
    
    log(`\n📊 Estatísticas:`, colors.yellow);
    log(`   📷 Fotos: ${photos.length}`, colors.blue);
    log(`   🎥 Vídeos: ${videos.length}`, colors.blue);
    log(`   📄 Documentos: ${docs.length}`, colors.blue);
    
    // Total size
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    log(`   💾 Tamanho total: ${formatBytes(totalSize)}`, colors.blue);
    
    // Show first 5 files
    if (files.length > 0) {
      log('\n📄 Primeiros arquivos:', colors.yellow);
      for (let i = 0; i < Math.min(5, files.length); i++) {
        const file = files[i];
        log(`\n   ${i + 1}. ${file.name}`, colors.magenta);
        log(`      Tamanho: ${formatBytes(file.size)}`, colors.reset);
        log(`      Modificado: ${file.modified.toLocaleDateString()}`, colors.reset);
        
        // Calculate hash for small files
        if (file.size < 1024 * 1024) { // < 1MB
          try {
            const hash = await calculateHash(file.path);
            log(`      Hash: ${hash.substring(0, 16)}...`, colors.reset);
          } catch {
            // Ignore hash errors
          }
        }
      }
    }
    
    log('\n' + '=' .repeat(50), colors.cyan);
    log('✅ Teste concluído com sucesso!', colors.bright + colors.green);
    
  } catch (error) {
    log('\n❌ Erro durante o teste:', colors.red);
    console.error(error);
    log('\n💡 Dicas:', colors.yellow);
    log('1. Certifique-se de ter dado permissão de armazenamento', colors.reset);
    log('2. Execute: termux-setup-storage', colors.reset);
    log('3. Especifique o caminho manualmente se necessário', colors.reset);
  }
}

// Run test
console.clear();
log('🚀 Scanner Standalone - Sem SQLite!', colors.bright + colors.green);
log('Este teste funciona sem nenhuma dependência nativa', colors.yellow);
log('', colors.reset);

testScanner().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});