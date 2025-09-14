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
import { config } from 'dotenv';

// Load environment variables
config();

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
      // Check if wa-crypt-tools is installed (try both methods)
      try {
        const { stdout } = await exec('wadecrypt --help');
        return stdout.includes('wadecrypt');
      } catch {
        // Try via python module
        const { stdout } = await exec('python3 -m wa_crypt_tools.wadecrypt --help');
        return stdout.includes('wadecrypt');
      }
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

  private extractDateFromFilename(filename: string): string | null {
    // Extract date from filenames like msgstore-2024-01-15.1.db.crypt15
    const match = filename.match(/msgstore-(\d{4}-\d{2}-\d{2})/);
    return match && match[1] ? match[1] : null;
  }

  async findMostRecentCryptFile(): Promise<{ path: string; date: string } | null> {
    const databasesPath = path.join(this.whatsappPath, 'Databases');

    try {
      const files = await fs.readdir(databasesPath);
      const cryptFiles = files.filter(f => f.endsWith('.crypt15') || f.endsWith('.crypt14'));

      if (cryptFiles.length === 0) {
        console.log('\n⚠️  No encrypted database files found.');
        console.log(`Searched in: ${databasesPath}\n`);
        return null;
      }

      // Sort files by name (they contain dates) and get the most recent
      cryptFiles.sort().reverse();
      const mostRecent = cryptFiles[0];

      console.log(`\n📂 Found ${cryptFiles.length} encrypted database(s)`);
      console.log(`   Selecting most recent: ${mostRecent}`);

      // Extract date from filename
      const date = this.extractDateFromFilename(mostRecent!) || 'unknown';

      return {
        path: path.join(databasesPath, mostRecent!),
        date: date
      };
    } catch (error) {
      console.error(`\n❌ Cannot access WhatsApp databases directory: ${databasesPath}`);
      console.log('Make sure the path exists and you have read permissions.\n');
      return null;
    }
  }

  async decryptFile(cryptFile: string, outputFile: string): Promise<boolean> {
    console.log(`\n📦 Decrypting: ${path.basename(cryptFile)}`);

    // Get file size
    try {
      const stats = await fs.stat(cryptFile);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
      console.log(`   File size: ${sizeMB} MB`);
      console.log('   This may take a while for large files...');
    } catch {}

    try {
      const { spawn } = require('child_process');

      // Use python module method
      const args = ['-m', 'wa_crypt_tools.wadecrypt', this.backupKey, cryptFile, outputFile];

      console.log('   Starting decryption process...');

      return new Promise<boolean>((resolve) => {
        const proc = spawn('python3', args, {
          stdio: ['ignore', 'pipe', 'pipe']
        });

        let lastOutput = '';
        proc.stderr.on('data', (data: Buffer) => {
          const output = data.toString();
          // Only show meaningful output
          if (output.includes('[I]') || output.includes('[C]')) {
            lastOutput = output;
            process.stdout.write(`   ${output.trim()}\n`);
          }
        });

        proc.on('close', async (code: number) => {
          if (code === 0 || lastOutput.includes('[I] Done')) {
            try {
              await fs.access(outputFile);
              const stats = await fs.stat(outputFile);
              const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
              console.log(`✅ Decrypted successfully → ${path.basename(outputFile)} (${sizeMB} MB)`);
              resolve(true);
            } catch {
              console.error(`❌ Process completed but output file not found`);
              resolve(false);
            }
          } else {
            console.error(`❌ Decryption failed with code ${code}`);
            resolve(false);
          }
        });

        proc.on('error', (error: Error) => {
          console.error(`❌ Failed to start decryption: ${error.message}`);
          resolve(false);
        });
      });
    } catch (error: any) {
      console.error(`❌ Failed to decrypt: ${error.message}`);
      return false;
    }
  }

  async isAlreadyDecrypted(date: string, outputFile: string): Promise<boolean> {
    // Check if output file exists with the same date
    try {
      await fs.stat(outputFile);

      // Extract date from the output filename
      const outputBasename = path.basename(outputFile);
      const dateMatch = outputBasename.match(/msgstore-(\d{4}-\d{2}-\d{2})/);
      const outputDate = dateMatch ? dateMatch[1] : null;

      if (outputDate === date) {
        const stats = await fs.stat(outputFile);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
        console.log(`\n✅ Database from ${date} already decrypted!`);
        console.log(`   File: ${outputBasename} (${sizeMB} MB)`);
        console.log(`   No need to decrypt again.\n`);
        return true;
      }
    } catch {
      // Output file doesn't exist
    }
    return false;
  }

  async cleanOldDecryptedFiles(keepDate: string): Promise<void> {
    try {
      const files = await fs.readdir(this.outputDir);
      // Find all msgstore*.db files except the one we want to keep
      const dbFiles = files.filter(f => {
        if (!f.endsWith('.db')) return false;
        if (!f.startsWith('msgstore')) return false;
        // Don't delete the file with the current date
        if (f.includes(keepDate)) return false;
        return true;
      });

      if (dbFiles.length > 0) {
        console.log(`\n🧹 Cleaning up ${dbFiles.length} old decrypted database(s)...`);
        for (const file of dbFiles) {
          const filePath = path.join(this.outputDir, file);
          try {
            await fs.unlink(filePath);
            console.log(`   Removed: ${file}`);
          } catch (error) {
            console.error(`   Failed to remove: ${file}`);
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be accessed
    }
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

    // Find most recent encrypted file
    const cryptInfo = await this.findMostRecentCryptFile();
    if (!cryptInfo) {
      return false;
    }

    // Create output directory
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch {}

    // Build output filename with date
    const outputFile = path.join(this.outputDir, `msgstore-${cryptInfo.date}.db`);

    // Check if already decrypted from the same backup
    if (await this.isAlreadyDecrypted(cryptInfo.date, outputFile)) {
      // Create a symlink to msgstore.db for compatibility
      const symlinkPath = path.join(this.outputDir, 'msgstore.db');
      try {
        await fs.unlink(symlinkPath);
      } catch {}
      try {
        await fs.symlink(path.basename(outputFile), symlinkPath);
      } catch {}
      return true;
    }

    // Clean old decrypted files (keep the one we're about to create)
    await this.cleanOldDecryptedFiles(cryptInfo.date);

    // Check if any older decrypted file exists
    try {
      const files = await fs.readdir(this.outputDir);
      const existingDb = files.find(f => f.startsWith('msgstore-') && f.endsWith('.db'));

      if (existingDb) {
        const existingPath = path.join(this.outputDir, existingDb);
        const stats = await fs.stat(existingPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
        const existingDate = this.extractDateFromFilename(existingDb);

        console.log(`\n⚠️  Found older decrypted database from ${existingDate}: ${existingDb} (${sizeMB} MB)`);
        console.log(`   A newer backup from ${cryptInfo.date} is available for decryption.\n`);

        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise<string>((resolve) => {
          rl.question('Do you want to decrypt the newer backup? (Y/n): ', resolve);
        });
        rl.close();

        if (answer.toLowerCase() === 'n') {
          console.log(`Using existing database from ${existingDate}.\n`);
          // Create symlink to the existing file
          const symlinkPath = path.join(this.outputDir, 'msgstore.db');
          try {
            await fs.unlink(symlinkPath);
          } catch {}
          try {
            await fs.symlink(existingDb, symlinkPath);
          } catch {}
          return true;
        }
      }
    } catch {
      // Directory doesn't exist or can't be accessed
    }

    // Decrypt the file
    const success = await this.decryptFile(cryptInfo.path, outputFile);

    if (success) {
      // Create a symlink to msgstore.db for compatibility
      const symlinkPath = path.join(this.outputDir, 'msgstore.db');
      try {
        await fs.unlink(symlinkPath);
      } catch {}
      try {
        await fs.symlink(path.basename(outputFile), symlinkPath);
        console.log(`\n📎 Created symlink: msgstore.db → ${path.basename(outputFile)}`);
      } catch {
        // Symlink creation failed (might be on Windows), no problem
      }
    }

    // Summary
    console.log('\n================================\n');
    if (success) {
      console.log(`✅ Decryption complete!`);
      console.log(`📁 Output: ${outputFile}`);
      console.log(`📅 Database date: ${cryptInfo.date}\n`);
      console.log('💡 Database is now available for chat analysis.\n');
      return true;
    } else {
      console.error(`❌ Failed to decrypt the backup.\n`);
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