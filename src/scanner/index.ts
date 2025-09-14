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

// AIDEV-NOTE: whatsapp-media-dirs; complete list of WhatsApp Media subdirectories
const WHATSAPP_DIRS = [
  'WhatsApp Images',
  'WhatsApp Video',
  'WhatsApp Documents',
  'WhatsApp Audio',
  'WhatsApp Voice Notes',
  'WhatsApp Animated Gifs',
  'WhatsApp Video Notes',
  'WhatsApp Stickers',
  'WhatsApp Profile Photos',
  'AI Media',
  'WhatsApp AI Media',
  'WallPaper'
  // Excluding: 'WhatsApp Backup Excluded Stickers', 'WhatsApp Bug Report Attachments', 'WhatsApp Sticker Packs'
];

export class WhatsAppScanner {
  private config: ScannerConfig;
  public whatsappPath: string;

  constructor(config: ScannerConfig = {}) {
    this.config = {
      maxFileSize: config.maxFileSize || 2 * 1024 * 1024 * 1024, // 2GB default
      whatsappPath: config.whatsappPath
    };
    this.whatsappPath = config.whatsappPath || '';
  }

  /**
   * Find all media files in WhatsApp directories
   * AIDEV-NOTE: simple-scan; straightforward directory traversal
   */
  async findFiles(): Promise<FileInfo[]> {
    // Get WhatsApp path if not already set
    if (!this.whatsappPath) {
      this.whatsappPath = this.config.whatsappPath || await WhatsAppScanner.detectWhatsAppPath() || '';
      if (!this.whatsappPath) {
        throw new Error('WhatsApp directory not found');
      }
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
   * Scan a specific directory (for compatibility)
   * AIDEV-NOTE: scan-method; added for API compatibility
   */
  async scan(directory?: string): Promise<FileInfo[]> {
    if (directory) {
      // Check if directory exists
      try {
        const stat = await fs.stat(directory);
        if (!stat.isDirectory()) {
          throw new Error(`Not a directory: ${directory}`);
        }
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          throw new Error(`WhatsApp directory not found: ${directory}`);
        }
        throw error;
      }

      // Temporarily set the path to scan specific directory
      const originalPath = this.whatsappPath;
      this.whatsappPath = directory;
      const files = await this.findFiles();
      this.whatsappPath = originalPath;
      return files;
    }
    return this.findFiles();
  }

  /**
   * Scan all files (alias for findFiles for compatibility)
   */
  async scanAll(): Promise<FileInfo[]> {
    return this.findFiles();
  }

  /**
   * Detect WhatsApp path (instance method for compatibility)
   */
  async detectWhatsAppPath(): Promise<string | null> {
    const detected = await WhatsAppScanner.detectWhatsAppPath();
    if (detected) {
      this.whatsappPath = detected;
    }
    return detected;
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

// AIDEV-NOTE: scanner-exports; export Scanner alias for backward compatibility
export { WhatsAppScanner as Scanner };