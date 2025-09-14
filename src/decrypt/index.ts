/**
 * WhatsApp Database Decryption Module
 * Uses wa-crypt-tools Python library to decrypt .crypt15 files
 * AIDEV-NOTE: decrypt-module; uses external Python tool for decryption (KISS)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';

const exec = promisify(execCallback);

export interface DecryptConfig {
  backupKey?: string;
  whatsappPath?: string;
  outputDir?: string;
}

export class WhatsAppDecryptor {
  private backupKey: string;
  private whatsappPath: string;
  private outputDir: string;

  constructor(config: DecryptConfig = {}) {
    // Get backup key from config or environment
    this.backupKey = config.backupKey || process.env.WHATSAPP_BACKUP_KEY || '';

    // Default paths
    this.whatsappPath = config.whatsappPath || this.detectWhatsAppPath();
    this.outputDir = config.outputDir || './decrypted';
  }

  private detectWhatsAppPath(): string {
    // Try common WhatsApp paths
    const possiblePaths = [
      '/storage/emulated/0/Android/media/com.whatsapp/WhatsApp',
      './tests/mock-whatsapp/Android/media/com.whatsapp/WhatsApp',
      process.env.WHATSAPP_PATH || ''
    ].filter(p => p);

    // Return first existing path or default
    for (const p of possiblePaths) {
      try {
        if (require('fs').existsSync(p)) {
          return p;
        }
      } catch {}
    }

    return possiblePaths[0] || '';
  }

  async checkDependencies(): Promise<boolean> {
    try {
      // Check if wa-crypt-tools is installed
      const { stdout } = await exec('wadecrypt --help');
      return stdout.includes('wadecrypt');
    } catch {
      console.error('\n❌ wa-crypt-tools not found!');
      console.log('\nPlease install it first:');
      console.log('  pip install wa-crypt-tools');
      console.log('\nOr if you prefer global installation:');
      console.log('  pip install --user wa-crypt-tools\n');
      return false;
    }
  }

  async validateKey(): Promise<boolean> {
    if (!this.backupKey) {
      console.error('\n❌ WhatsApp backup key not found!');
      console.log('\nPlease add your 64-character backup key to .env:');
      console.log('  WHATSAPP_BACKUP_KEY=your-64-character-hex-key\n');
      console.log('Get this key from WhatsApp:');
      console.log('  Settings → Chats → Chat Backup → End-to-end encrypted backup\n');
      return false;
    }

    // Validate key format (64 hex characters)
    if (!/^[0-9a-fA-F]{64}$/.test(this.backupKey)) {
      console.error('\n❌ Invalid backup key format!');
      console.log('Key must be exactly 64 hexadecimal characters.');
      console.log(`Your key has ${this.backupKey.length} characters.\n`);
      return false;
    }

    return true;
  }

  async findCryptFiles(): Promise<string[]> {
    const databasesPath = path.join(this.whatsappPath, 'Databases');

    try {
      const files = await fs.readdir(databasesPath);
      const cryptFiles = files.filter(f => f.endsWith('.crypt15') || f.endsWith('.crypt14'));

      if (cryptFiles.length === 0) {
        console.log('\n⚠️  No encrypted database files found.');
        console.log(`Searched in: ${databasesPath}\n`);
        return [];
      }

      return cryptFiles.map(f => path.join(databasesPath, f));
    } catch (error) {
      console.error(`\n❌ Cannot access WhatsApp databases directory: ${databasesPath}`);
      console.log('Make sure the path exists and you have read permissions.\n');
      return [];
    }
  }

  async decryptFile(cryptFile: string, outputFile: string): Promise<boolean> {
    return new Promise((resolve) => {
      console.log(`\n📦 Decrypting: ${path.basename(cryptFile)}`);

      // Create key file temporarily (wa-crypt-tools needs it)
      const keyFile = path.join(this.outputDir, 'backup.key');
      require('fs').writeFileSync(keyFile, this.backupKey, 'hex');

      // Run wadecrypt command
      const wadecrypt = spawn('wadecrypt', [
        keyFile,
        cryptFile,
        outputFile
      ]);

      let output = '';
      wadecrypt.stdout.on('data', (data) => {
        output += data.toString();
      });

      wadecrypt.stderr.on('data', (data) => {
        output += data.toString();
      });

      wadecrypt.on('close', async (code) => {
        // Clean up key file
        try {
          await fs.unlink(keyFile);
        } catch {}

        if (code === 0) {
          console.log(`✅ Decrypted successfully → ${path.basename(outputFile)}`);
          resolve(true);
        } else {
          console.error(`❌ Decryption failed for ${path.basename(cryptFile)}`);
          if (output.includes('Bad key')) {
            console.log('   The backup key appears to be incorrect.');
          }
          console.log(`   Error: ${output}`);
          resolve(false);
        }
      });
    });
  }

  async decrypt(): Promise<boolean> {
    console.log('🔓 WhatsApp Database Decryptor\n');
    console.log('================================\n');

    // Check dependencies
    if (!await this.checkDependencies()) {
      return false;
    }

    // Validate key
    if (!await this.validateKey()) {
      return false;
    }

    // Find encrypted files
    const cryptFiles = await this.findCryptFiles();
    if (cryptFiles.length === 0) {
      return false;
    }

    console.log(`\n📂 Found ${cryptFiles.length} encrypted database(s):`);
    cryptFiles.forEach(f => console.log(`   - ${path.basename(f)}`));

    // Create output directory
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch {}

    // Decrypt each file
    let successCount = 0;
    for (const cryptFile of cryptFiles) {
      const baseName = path.basename(cryptFile).replace(/\.crypt\d+$/, '');
      const outputFile = path.join(this.outputDir, baseName);

      if (await this.decryptFile(cryptFile, outputFile)) {
        successCount++;
      }
    }

    // Summary
    console.log('\n================================\n');
    if (successCount > 0) {
      console.log(`✅ Decryption complete! ${successCount}/${cryptFiles.length} files decrypted.`);
      console.log(`📁 Output directory: ${this.outputDir}\n`);

      // Check if msgstore.db exists
      const msgstorePath = path.join(this.outputDir, 'msgstore.db');
      try {
        await fs.access(msgstorePath);
        console.log('💡 msgstore.db is now available for chat analysis.\n');
      } catch {}

      return true;
    } else {
      console.error(`❌ Failed to decrypt any files.\n`);
      return false;
    }
  }
}

// CLI entry point
if (require.main === module) {
  // Get path from command line argument
  const args = process.argv.slice(2);
  const customPath = args[0];

  const config: DecryptConfig = {};
  if (customPath) {
    config.whatsappPath = customPath;
    console.log(`Using custom WhatsApp path: ${customPath}\n`);
  }

  const decryptor = new WhatsAppDecryptor(config);
  decryptor.decrypt().then(success => {
    process.exit(success ? 0 : 1);
  });
}