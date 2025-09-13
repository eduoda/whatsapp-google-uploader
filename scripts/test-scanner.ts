#!/usr/bin/env ts-node

/**
 * Test script for WhatsApp Scanner Library
 * 
 * Este script testa a biblioteca de scanner do WhatsApp, incluindo:
 * - Detecção automática do diretório do WhatsApp
 * - Descoberta de chats
 * - Escaneamento de arquivos
 * - Extração de metadados
 * - Cálculo de hash SHA-256
 */

import { WhatsAppScanner } from '../packages/scanner/src';
import * as path from 'path';
import * as fs from 'fs/promises';

// Cores para output no terminal
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

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function testScanner() {
  log('\n🔍 WhatsApp Scanner Test Suite', colors.bright + colors.cyan);
  log('=' .repeat(50), colors.cyan);

  try {
    // 1. Detectar caminho do WhatsApp
    log('\n📁 Detectando diretório do WhatsApp...', colors.yellow);
    const detectedPath = await WhatsAppScanner.detectWhatsAppPath();
    
    if (detectedPath) {
      log(`✅ Diretório encontrado: ${detectedPath}`, colors.green);
    } else {
      log('⚠️ Diretório do WhatsApp não encontrado automaticamente', colors.yellow);
      log('Por favor, especifique o caminho manualmente no código', colors.yellow);
      
      // Tentar caminhos comuns
      const commonPaths = [
        path.join(process.env.HOME || '', 'Documents', 'WhatsApp'),
        path.join(process.env.HOME || '', 'WhatsApp'),
        '/storage/emulated/0/WhatsApp',
        '/sdcard/WhatsApp'
      ];
      
      log('\n📂 Procurando em caminhos comuns...', colors.yellow);
      for (const testPath of commonPaths) {
        try {
          await fs.access(testPath);
          log(`  ✓ Encontrado: ${testPath}`, colors.green);
          break;
        } catch {
          log(`  ✗ Não encontrado: ${testPath}`, colors.red);
        }
      }
      return;
    }

    // 2. Criar instância do scanner
    const scanner = new WhatsAppScanner({
      whatsappPath: detectedPath,
      maxDepth: 3,
      batchSize: 50,
      progressCallback: (progress) => {
        process.stdout.write(`\r${colors.cyan}Progresso: ${progress.stage} - ${progress.processedFiles}/${progress.totalFiles} arquivos${colors.reset}`);
      }
    });

    // 3. Validar acesso
    log('\n🔐 Validando acesso ao diretório...', colors.yellow);
    const validation = await scanner.validateAccess();
    
    if (validation.hasAccess) {
      log(`✅ Acesso validado`, colors.green);
      log(`   Plataforma: ${validation.platform}`, colors.blue);
      log(`   Caminho: ${validation.whatsappPath}`, colors.blue);
      log(`   Diretórios acessíveis: ${validation.readableDirectories.length}`, colors.blue);
    } else {
      log(`❌ Sem acesso: ${validation.error}`, colors.red);
      return;
    }

    // 4. Descobrir chats
    log('\n💬 Descobrindo chats...', colors.yellow);
    const chats = await scanner.findChats({
      includeEmpty: false
    });
    
    log(`\n✅ ${chats.length} chats encontrados:`, colors.green);
    
    // Mostrar resumo dos chats
    const individualChats = chats.filter(c => c.type === 'individual');
    const groupChats = chats.filter(c => c.type === 'group');
    
    log(`   👤 Chats individuais: ${individualChats.length}`, colors.blue);
    log(`   👥 Grupos: ${groupChats.length}`, colors.blue);
    
    // Listar primeiros 10 chats
    log('\n📋 Primeiros chats encontrados:', colors.yellow);
    for (let i = 0; i < Math.min(10, chats.length); i++) {
      const chat = chats[i];
      const icon = chat.type === 'group' ? '👥' : '👤';
      log(`   ${icon} ${chat.name}`, colors.magenta);
      log(`      ID: ${chat.id}`, colors.reset);
      log(`      Arquivos estimados: ${chat.estimatedFileCount}`, colors.reset);
      log(`      Última atividade: ${chat.lastActivity.toLocaleDateString()}`, colors.reset);
    }

    // 5. Escanear arquivos do primeiro chat (se existir)
    if (chats.length > 0) {
      const targetChat = chats[0];
      log(`\n📸 Escaneando arquivos do chat: ${targetChat.name}...`, colors.yellow);
      
      const files = await scanner.scanChat(targetChat.id, {
        types: ['photo', 'video'],
        maxSize: 100 * 1024 * 1024 // 100MB
      });
      
      log(`\n✅ ${files.length} arquivos encontrados`, colors.green);
      
      // Estatísticas dos arquivos
      const photoCount = files.filter(f => f.type === 'photo').length;
      const videoCount = files.filter(f => f.type === 'video').length;
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      
      log(`   📷 Fotos: ${photoCount}`, colors.blue);
      log(`   🎥 Vídeos: ${videoCount}`, colors.blue);
      log(`   💾 Tamanho total: ${formatBytes(totalSize)}`, colors.blue);
      
      // Mostrar primeiros 5 arquivos
      if (files.length > 0) {
        log('\n📄 Primeiros arquivos:', colors.yellow);
        for (let i = 0; i < Math.min(5, files.length); i++) {
          const file = files[i];
          log(`\n   ${i + 1}. ${file.name}`, colors.magenta);
          log(`      Tipo: ${file.type}`, colors.reset);
          log(`      Tamanho: ${formatBytes(file.size)}`, colors.reset);
          log(`      MIME: ${file.mimeType}`, colors.reset);
          log(`      Hash: ${file.hash.substring(0, 16)}...`, colors.reset);
          
          if (file.whatsappMeta) {
            log(`      Data WhatsApp: ${file.whatsappMeta.date || 'N/A'}`, colors.reset);
            log(`      Sequência: ${file.whatsappMeta.sequence || 'N/A'}`, colors.reset);
          }
        }
      }
    }

    // 6. Testar tipos de arquivo suportados
    log('\n📎 Tipos de arquivo suportados:', colors.yellow);
    const supportedTypes = WhatsAppScanner.getSupportedFileTypes();
    log(`   Total: ${supportedTypes.length} extensões`, colors.green);
    log(`   Extensões: ${supportedTypes.slice(0, 10).join(', ')}...`, colors.blue);

    // 7. Resumo final
    log('\n' + '=' .repeat(50), colors.cyan);
    log('✅ Teste concluído com sucesso!', colors.bright + colors.green);
    log('\n📊 Resumo:', colors.yellow);
    log(`   • Chats descobertos: ${chats.length}`, colors.blue);
    log(`   • Tipos suportados: ${supportedTypes.length}`, colors.blue);
    log(`   • Plataforma: ${validation.platform}`, colors.blue);
    log(`   • Caminho WhatsApp: ${validation.whatsappPath}`, colors.blue);

  } catch (error) {
    log('\n❌ Erro durante o teste:', colors.red);
    console.error(error);
    
    if (error instanceof Error) {
      log(`\n💡 Dica: ${error.message}`, colors.yellow);
    }
    
    log('\n🔍 Possíveis soluções:', colors.yellow);
    log('1. Verifique se o WhatsApp está instalado', colors.reset);
    log('2. Verifique as permissões de acesso aos diretórios', colors.reset);
    log('3. Para Android/Termux, certifique-se de ter acesso ao armazenamento', colors.reset);
    log('4. Tente especificar o caminho manualmente no código', colors.reset);
  }
}

// Executar teste
console.clear();
log('🚀 Iniciando teste da biblioteca Scanner...', colors.bright + colors.green);
log('Este teste vai:', colors.yellow);
log('  • Detectar o diretório do WhatsApp', colors.reset);
log('  • Descobrir todos os chats', colors.reset);
log('  • Escanear arquivos de mídia', colors.reset);
log('  • Extrair metadados e calcular hashes', colors.reset);
log('  • Mostrar estatísticas detalhadas', colors.reset);

testScanner().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});