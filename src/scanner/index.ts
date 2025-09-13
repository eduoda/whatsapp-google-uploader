/**
 * WhatsApp Scanner - Simple file discovery and metadata extraction
 * AIDEV-NOTE: simplified-scanner; KISS principle - only essential functionality
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import * as os from 'os';
import { createReadStream } from 'fs';

// AIDEV-NOTE: minimal-interfaces; only what's actually needed
export interface ScannerConfig {
  whatsappPath?: string;
  maxFileSize?: number; // Skip files larger than this (default: 2GB)
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  type: 'photo' | 'video' | 'document' | 'audio';
  mimeType: string;
  hash?: string; // Optional, calculated on demand
  timestamp: Date;
}

// AIDEV-NOTE: simple-constants; minimal configuration
const FILE_EXTENSIONS = {
  photo: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  video: ['.mp4', '.avi', '.mov', '.3gp', '.mkv', '.webm'],
  audio: ['.mp3', '.ogg', '.aac', '.m4a', '.wav', '.opus'],
  document: ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx', '.xls', '.xlsx']
};

const WHATSAPP_DIRS = ['WhatsApp Images', 'WhatsApp Video', 'WhatsApp Documents', 'WhatsApp Audio', 'WhatsApp Voice Notes'];

export class WhatsAppScanner {
  private config: ScannerConfig;
  private whatsappPath: string;

  constructor(config: ScannerConfig = {}) {
    this.config = {
      maxFileSize: config.maxFileSize || 2 * 1024 * 1024 * 1024, // 2GB default
      whatsappPath: config.whatsappPath
    };
    this.whatsappPath = '';
  }

  /**
   * Find all media files in WhatsApp directories
   * AIDEV-NOTE: simple-scan; straightforward directory traversal
   */
  async findFiles(): Promise<FileInfo[]> {
    // Get WhatsApp path
    this.whatsappPath = this.config.whatsappPath || await WhatsAppScanner.detectWhatsAppPath() || '';
    if (!this.whatsappPath) {
      throw new Error('WhatsApp directory not found');
    }

    const files: FileInfo[] = [];
    const mediaPath = path.join(this.whatsappPath, 'Media');

    // Scan each WhatsApp media directory
    for (const dir of WHATSAPP_DIRS) {
      const dirPath = path.join(mediaPath, dir);
      try {
        await this.scanDirectory(dirPath, files);
      } catch {
        // Directory doesn't exist, continue
      }
    }

    return files;
  }

  /**
   * Get metadata for a single file
   */
  async getFileInfo(filePath: string): Promise<FileInfo> {
    const stat = await fs.stat(filePath);
    const name = path.basename(filePath);
    const ext = path.extname(name).toLowerCase();
    
    return {
      path: filePath,
      name,
      size: stat.size,
      type: this.getFileType(ext),
      mimeType: this.getMimeType(filePath),
      timestamp: stat.mtime
    };
  }

  /**
   * Calculate file hash (optional, on-demand)
   */
  async calculateHash(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Check if WhatsApp directory is accessible
   */
  async validateAccess(): Promise<boolean> {
    const whatsappPath = this.config.whatsappPath || await WhatsAppScanner.detectWhatsAppPath() || '';
    if (!whatsappPath) return false;

    try {
      await fs.access(whatsappPath);
      await fs.access(path.join(whatsappPath, 'Media'));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Detect WhatsApp installation path
   * AIDEV-NOTE: platform-detection; simplified path detection
   */
  static async detectWhatsAppPath(): Promise<string | null> {
    const platform = process.platform;
    const home = os.homedir();
    const isAndroid = process.env.PREFIX?.includes('com.termux');
    
    let searchPaths: string[] = [];
    
    if (platform === 'win32') {
      searchPaths = [
        path.join(home, 'Documents', 'WhatsApp'),
        path.join(process.env.LOCALAPPDATA || '', 'WhatsApp')
      ];
    } else if (platform === 'darwin') {
      searchPaths = [
        path.join(home, 'Library', 'Application Support', 'WhatsApp'),
        path.join(home, 'Documents', 'WhatsApp')
      ];
    } else if (isAndroid) {
      searchPaths = [
        '/storage/emulated/0/Android/media/com.whatsapp/WhatsApp',
        '/storage/emulated/0/WhatsApp'
      ];
    } else {
      searchPaths = [
        path.join(home, '.config', 'WhatsApp'),
        path.join(home, 'Documents', 'WhatsApp')
      ];
    }

    for (const searchPath of searchPaths) {
      try {
        const stat = await fs.stat(searchPath);
        if (stat.isDirectory()) return searchPath;
      } catch {
        // Path doesn't exist, continue
      }
    }

    return null;
  }

  // Private helper methods
  private async scanDirectory(dirPath: string, files: FileInfo[]): Promise<void> {
    try {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = await fs.stat(itemPath);
        
        if (stat.isFile() && stat.size <= this.config.maxFileSize!) {
          const ext = path.extname(item).toLowerCase();
          if (this.isSupportedFile(ext)) {
            files.push({
              path: itemPath,
              name: item,
              size: stat.size,
              type: this.getFileType(ext),
              mimeType: this.getMimeType(itemPath),
              timestamp: stat.mtime
            });
          }
        } else if (stat.isDirectory()) {
          // Recursively scan subdirectories
          await this.scanDirectory(itemPath, files);
        }
      }
    } catch {
      // Directory access error, skip
    }
  }

  private isSupportedFile(ext: string): boolean {
    return Object.values(FILE_EXTENSIONS).some(exts => exts.includes(ext));
  }

  private getFileType(ext: string): 'photo' | 'video' | 'document' | 'audio' {
    for (const [type, extensions] of Object.entries(FILE_EXTENSIONS)) {
      if (extensions.includes(ext)) {
        return type as 'photo' | 'video' | 'document' | 'audio';
      }
    }
    return 'document';
  }

  private getMimeType(filePath: string): string {
    const mimeTypes = require('mime-types');
    return mimeTypes.lookup(filePath) || 'application/octet-stream';
  }
}