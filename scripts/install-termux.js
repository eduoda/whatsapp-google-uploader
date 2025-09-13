#!/usr/bin/env node

/**
 * Termux-specific installation script
 * Handles installation without problematic native dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 WhatsApp Google Uploader - Instalação Termux');
console.log('================================================\n');

// Check if running in Termux
const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');

if (!isTermux) {
    console.log('⚠️  Este script é específico para Termux');
    console.log('   Use "npm install" no ambiente normal\n');
    process.exit(0);
}

try {
    // Step 1: Backup original package.json
    console.log('📦 Preparando instalação para Termux...');
    const originalPackageJson = path.join(__dirname, '..', 'package.json');
    const backupPackageJson = path.join(__dirname, '..', 'package.original.json');
    const termuxPackageJson = path.join(__dirname, '..', 'package.termux.json');
    
    // Backup original if not already done
    if (!fs.existsSync(backupPackageJson)) {
        fs.copyFileSync(originalPackageJson, backupPackageJson);
        console.log('✅ Backup do package.json original criado');
    }
    
    // Step 2: Use Termux-specific package.json
    fs.copyFileSync(termuxPackageJson, originalPackageJson);
    console.log('✅ Usando package.json otimizado para Termux');
    
    // Step 3: Clean install
    console.log('\n🧹 Limpando instalação anterior...');
    try {
        execSync('rm -rf node_modules package-lock.json', { stdio: 'inherit' });
    } catch (e) {
        // Ignore errors if files don't exist
    }
    
    // Step 4: Install dependencies
    console.log('\n📦 Instalando dependências...');
    console.log('   (Isso pode demorar alguns minutos)\n');
    
    execSync('npm install --no-optional --no-save', { stdio: 'inherit' });
    
    // Step 5: Copy scanner source files for direct use
    const scannerSrcPath = path.join(__dirname, '..', 'packages', 'scanner', 'src');
    const scannerDistPath = path.join(__dirname, '..', 'packages', 'scanner', 'dist');
    
    // Create dist directory if it doesn't exist
    if (!fs.existsSync(scannerDistPath)) {
        fs.mkdirSync(scannerDistPath, { recursive: true });
    }
    
    // Copy index.ts as index.js (simple copy for now)
    const scannerSource = path.join(scannerSrcPath, 'index.ts');
    const scannerDest = path.join(scannerDistPath, 'index.js');
    
    if (fs.existsSync(scannerSource)) {
        // Read the TypeScript file and do a basic conversion
        let content = fs.readFileSync(scannerSource, 'utf8');
        
        // Remove TypeScript-specific syntax (basic conversion)
        content = content.replace(/: string/g, '');
        content = content.replace(/: number/g, '');
        content = content.replace(/: boolean/g, '');
        content = content.replace(/: any/g, '');
        content = content.replace(/: void/g, '');
        content = content.replace(/: Promise<[^>]+>/g, '');
        content = content.replace(/interface \w+ \{[^}]+\}/g, '');
        content = content.replace(/export interface/g, '// interface');
        content = content.replace(/implements \w+/g, '');
        content = content.replace(/private /g, '');
        content = content.replace(/public /g, '');
        content = content.replace(/readonly /g, '');
        content = content.replace(/\?:/g, ':');
        
        // Write the converted file
        fs.writeFileSync(scannerDest, content);
        console.log('✅ Scanner copiado para uso direto');
    }
    
    // Step 6: Create minimal SQLite mock if needed
    const sqliteMockPath = path.join(__dirname, '..', 'packages', 'database', 'src', 'sqlite-mock.js');
    const sqliteMockContent = `
// SQLite mock for Termux environment
module.exports = {
    Database: class Database {
        constructor() {
            console.warn('SQLite not available in Termux - using mock');
            this.data = new Map();
        }
        
        run(query, params, callback) {
            if (callback) callback(null);
            return this;
        }
        
        get(query, params, callback) {
            if (callback) callback(null, null);
            return this;
        }
        
        all(query, params, callback) {
            if (callback) callback(null, []);
            return this;
        }
        
        close(callback) {
            if (callback) callback(null);
            return this;
        }
    }
};
`;
    
    // Create directory if it doesn't exist
    const sqliteMockDir = path.dirname(sqliteMockPath);
    if (!fs.existsSync(sqliteMockDir)) {
        fs.mkdirSync(sqliteMockDir, { recursive: true });
    }
    fs.writeFileSync(sqliteMockPath, sqliteMockContent);
    console.log('✅ Mock do SQLite criado para Termux');
    
    // Step 6: Restore original package.json
    fs.copyFileSync(backupPackageJson, originalPackageJson);
    console.log('✅ package.json original restaurado');
    
    // Step 7: Setup storage access
    console.log('\n📱 Verificando acesso ao armazenamento...');
    const storageDir = path.join(process.env.HOME, 'storage');
    if (!fs.existsSync(storageDir)) {
        console.log('\n⚠️  Acesso ao armazenamento não configurado!');
        console.log('   Execute: termux-setup-storage');
        console.log('   E aceite a permissão de armazenamento\n');
    } else {
        console.log('✅ Acesso ao armazenamento configurado');
        
        // Check for WhatsApp directory
        const whatsappPaths = [
            '/storage/emulated/0/WhatsApp',
            '/sdcard/WhatsApp',
            path.join(storageDir, 'shared', 'WhatsApp')
        ];
        
        let whatsappFound = false;
        for (const wpPath of whatsappPaths) {
            if (fs.existsSync(wpPath)) {
                console.log(`✅ WhatsApp encontrado em: ${wpPath}`);
                whatsappFound = true;
                break;
            }
        }
        
        if (!whatsappFound) {
            console.log('\n⚠️  Diretório do WhatsApp não encontrado');
            console.log('   Certifique-se de ter o WhatsApp instalado');
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Instalação concluída com sucesso!');
    console.log('='.repeat(50));
    console.log('\n📖 Próximos passos:');
    console.log('   1. Configure o OAuth: npm run test:oauth');
    console.log('   2. Teste o scanner: npm run test:scanner');
    console.log('   3. Faça upload: npm run upload\n');
    
} catch (error) {
    console.error('\n❌ Erro durante a instalação:');
    console.error(error.message);
    console.log('\n💡 Tente executar:');
    console.log('   1. pkg install nodejs python git build-essential');
    console.log('   2. export PYTHON=python3');
    console.log('   3. Execute este script novamente\n');
    process.exit(1);
}