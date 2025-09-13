/**
 * @whatsapp-uploader/scanner - WhatsApp Directory Scanning Library
 * 
 * AIDEV-NOTE: scanner-main-export; primary entry point for scanner functionality
 * Provides cross-platform WhatsApp directory scanning, file discovery, and metadata extraction
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import * as os from 'os';
import { createReadStream } from 'fs';
import mimeTypes from 'mime-types';

// AIDEV-NOTE: scanner-interfaces; comprehensive TypeScript interfaces for scanner functionality
export interface ScannerConfig {
  whatsappPath?: string;           // Override auto-detection
  supportedTypes?: string[];       // File extensions to scan
  maxDepth?: number;              // Directory traversal depth (default: 5)
  followSymlinks?: boolean;       // Follow symbolic links (default: false)
  batchSize?: number;             // File processing batch size (default: 100)
  maxFileSize?: number;           // Skip files larger than this (bytes, default: 2GB)
  progressCallback?: (progress: ScanProgress) => void;
}

export interface ChatInfo {
  id: string;                     // Unique chat identifier
  name: string;                   // Display name
  type: 'individual' | 'group';   // Chat type
  mediaPath: string;              // Path to media directory
  lastActivity: Date;             // Most recent file modification
  estimatedFileCount: number;     // Approximate file count
}

export interface FileMetadata {
  path: string;                   // Absolute file path
  name: string;                   // Original filename
  size: number;                   // File size in bytes
  type: 'photo' | 'video' | 'document' | 'audio';
  mimeType: string;               // MIME type
  hash: string;                   // SHA-256 hash
  timestamp: Date;                // File modification time
  chat: {
    id: string;                   // Chat identifier
    name: string;                 // Chat display name
    type: 'individual' | 'group';
  };
  whatsappMeta?: {               // WhatsApp-specific metadata
    date?: string;                // Date from filename (YYYY-MM-DD)
    sequence?: string;            // Sequence number from filename
    prefix?: string;              // File type prefix (IMG, VID, AUD, etc.)
  };
}

export interface FindChatsOptions {
  namePattern?: RegExp;           // Filter by chat name pattern
  minLastActivity?: Date;         // Filter by minimum activity date
  includeEmpty?: boolean;         // Include chats with no media (default: false)
  types?: string[];               // Only include chats with these file types
}

export interface ScanChatFilters {
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  types?: ('photo' | 'video' | 'document' | 'audio')[];
  minSize?: number;               // Minimum file size in bytes
  maxSize?: number;               // Maximum file size in bytes
  namePattern?: RegExp;           // Filter by filename pattern
}

export interface AccessValidation {
  hasAccess: boolean;             // Overall access status
  readableDirectories: string[];  // List of accessible directories
  error?: string;                 // Error message if no access
  platform: string;              // Detected platform
  whatsappPath: string;           // Detected or configured WhatsApp path
}

export interface ScanProgress {
  stage: 'discovering' | 'scanning' | 'hashing' | 'complete';
  currentDirectory: string;
  processedFiles: number;
  totalFiles: number;
  currentFile?: string;
  bytesProcessed: number;
  totalBytes: number;
}

// AIDEV-NOTE: scanner-constants; default configuration and platform-specific paths
export const SCANNER_CONSTANTS = {
  DEFAULT_CONFIG: {
    supportedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'mp4', 'avi', 'mov', '3gp', 'mkv', 'webm', 'pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx', 'mp3', 'ogg', 'aac', 'm4a', 'wav', 'opus'],
    maxDepth: 5,
    followSymlinks: false,
    batchSize: 100,
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
  },
  PLATFORM_PATHS: {
    win32: [
      '%USERPROFILE%\\Documents\\WhatsApp',
      '%LOCALAPPDATA%\\WhatsApp'
    ],
    darwin: [
      '~/Library/Application Support/WhatsApp',
      '~/Documents/WhatsApp'
    ],
    linux: [
      '~/.config/WhatsApp',
      '~/Documents/WhatsApp'
    ],
    android: [
      '/storage/emulated/0/WhatsApp',
      '/sdcard/WhatsApp'
    ]
  },
  FILE_TYPES: {
    photo: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
    video: ['.mp4', '.avi', '.mov', '.3gp', '.mkv', '.webm'],
    document: ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx', '.xls', '.xlsx'],
    audio: ['.mp3', '.ogg', '.aac', '.m4a', '.wav', '.opus']
  },
  WHATSAPP_DIRECTORIES: [
    'WhatsApp Images',
    'WhatsApp Video', 
    'WhatsApp Documents',
    'WhatsApp Audio',
    'WhatsApp Voice Notes'
  ],
  STREAMING_THRESHOLD: 50 * 1024 * 1024 // 50MB
};

// AIDEV-NOTE: scanner-main-class; core WhatsAppScanner implementation with cross-platform support
export class WhatsAppScanner {
  private config: ScannerConfig;
  private platform: string;
  private whatsappPath: string;
  private chatRegistry: Map<string, ChatInfo> = new Map();

  constructor(config: ScannerConfig = {}) {
    // AIDEV-NOTE: scanner-constructor; initialize configuration with platform detection
    this.config = { ...SCANNER_CONSTANTS.DEFAULT_CONFIG, ...config };
    this.platform = this.detectPlatform();
    this.whatsappPath = this.config.whatsappPath || '';
  }

  // AIDEV-NOTE: scanner-find-chats; discover all available chats across WhatsApp media directories
  async findChats(options: FindChatsOptions = {}): Promise<ChatInfo[]> {
    try {
      if (!this.whatsappPath) {
        this.whatsappPath = await WhatsAppScanner.detectWhatsAppPath() || '';
        if (!this.whatsappPath) {
          throw new Error('WhatsApp directory not found');
        }
      }

      const mediaPath = path.join(this.whatsappPath, 'Media');
      const chats: ChatInfo[] = [];

      // Scan each WhatsApp media directory type
      for (const mediaType of SCANNER_CONSTANTS.WHATSAPP_DIRECTORIES) {
        const mediaDir = path.join(mediaPath, mediaType);
        
        try {
          const chatDirs = await fs.readdir(mediaDir);
          
          for (const chatDir of chatDirs) {
            const chatPath = path.join(mediaDir, chatDir);
            const stat = await fs.stat(chatPath);
            
            if (stat.isDirectory()) {
              const chatId = this.generateChatId(chatDir, mediaType);
              
              if (!this.chatRegistry.has(chatId)) {
                const chatInfo: ChatInfo = {
                  id: chatId,
                  name: chatDir,
                  type: this.determineChatType(chatDir),
                  mediaPath: chatPath,
                  lastActivity: stat.mtime,
                  estimatedFileCount: await this.estimateFileCount(chatPath)
                };
                
                this.chatRegistry.set(chatId, chatInfo);
                chats.push(chatInfo);
              } else {
                // Update existing chat with later activity
                const existing = this.chatRegistry.get(chatId)!;
                if (stat.mtime > existing.lastActivity) {
                  existing.lastActivity = stat.mtime;
                }
              }
            }
          }
        } catch (error) {
          // Directory might not exist, continue with other directories
          continue;
        }
      }

      // Apply filters
      return this.filterChats(Array.from(this.chatRegistry.values()), options);
    } catch (error) {
      throw error;
    }
  }

  // AIDEV-NOTE: scanner-scan-chat; scan all files in a specific chat with filtering support
  async scanChat(chatId: string, filters: ScanChatFilters = {}): Promise<FileMetadata[]> {
    const chatPath = await this.getChatPath(chatId);
    if (!chatPath) {
      throw new Error(`Chat not found: ${chatId}`);
    }

    const files: FileMetadata[] = [];
    const chatInfo = this.chatRegistry.get(chatId);
    
    if (!chatInfo) {
      throw new Error(`Chat info not found for: ${chatId}`);
    }

    // Recursively scan directory
    await this.scanDirectory(chatPath, files, chatInfo, filters, 0);
    
    // Process files in batches
    return await this.processBatch(files);
  }

  // AIDEV-NOTE: scanner-file-metadata; extract complete metadata for a single file
  async getFileMetadata(filePath: string): Promise<FileMetadata> {
    const stat = await fs.stat(filePath);
    const name = path.basename(filePath);
    const ext = path.extname(name).toLowerCase();
    
    // Determine file type and MIME type
    const type = this.determineFileType(ext);
    const mimeType = this.getMimeType(ext);
    
    // Calculate hash
    const hash = await this.calculateFileHash(filePath, stat.size);
    
    // Extract WhatsApp metadata from filename
    const whatsappMeta = this.extractWhatsAppMetadata(name);
    
    // Get chat info from path
    const chatInfo = this.extractChatFromPath(filePath);

    return {
      path: filePath,
      name,
      size: stat.size,
      type,
      mimeType,
      hash,
      timestamp: stat.mtime,
      chat: chatInfo,
      whatsappMeta
    };
  }

  // AIDEV-NOTE: scanner-validate-access; check permissions and access to WhatsApp directories
  async validateAccess(): Promise<AccessValidation> {
    const result: AccessValidation = {
      hasAccess: false,
      readableDirectories: [],
      platform: this.platform,
      whatsappPath: this.whatsappPath || await WhatsAppScanner.detectWhatsAppPath() || ''
    };

    if (!result.whatsappPath) {
      result.error = 'WhatsApp directory not detected';
      return result;
    }

    try {
      // Check main WhatsApp directory access
      await fs.access(result.whatsappPath);
      
      // Check Media subdirectory access
      const mediaPath = path.join(result.whatsappPath, 'Media');
      await fs.access(mediaPath);
      
      // Check each media type directory
      for (const mediaType of SCANNER_CONSTANTS.WHATSAPP_DIRECTORIES) {
        const mediaDir = path.join(mediaPath, mediaType);
        try {
          await fs.access(mediaDir);
          result.readableDirectories.push(mediaType);
        } catch {
          // Directory might not exist or no access, skip
        }
      }
      
      result.hasAccess = result.readableDirectories.length > 0;
      
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Access denied';
    }

    return result;
  }

  // AIDEV-NOTE: scanner-static-methods; utility methods for path detection and normalization
  static async detectWhatsAppPath(): Promise<string | null> {
    const platform = process.platform;
    const home = os.homedir();
    
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
    } else {
      // Linux and Android/Termux
      // AIDEV-NOTE: android-11-paths; prioritize Android 11+ scoped storage paths
      const isAndroid = process.env.PREFIX?.includes('com.termux') || 
                        process.env.ANDROID_ROOT || 
                        process.env.ANDROID_DATA;
      
      if (isAndroid) {
        // Android 11+ uses scoped storage under Android/media
        searchPaths = [
          '/storage/emulated/0/Android/media/com.whatsapp/WhatsApp',
          '/sdcard/Android/media/com.whatsapp/WhatsApp',
          // Legacy paths for older Android versions (kept for compatibility)
          '/storage/emulated/0/WhatsApp',
          '/sdcard/WhatsApp'
        ];
      } else {
        // Desktop Linux
        searchPaths = [
          path.join(home, '.config', 'WhatsApp'),
          path.join(home, 'Documents', 'WhatsApp')
        ];
      }
    }

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

  static getSupportedFileTypes(): string[] {
    return SCANNER_CONSTANTS.DEFAULT_CONFIG.supportedTypes;
  }

  static normalizePath(inputPath: string): string {
    // AIDEV-NOTE: scanner-path-normalization; cross-platform path normalization
    return path.normalize(inputPath).replace(/\\/g, '/');
  }

  // AIDEV-NOTE: scanner-private-methods; internal implementation methods
  private detectPlatform(): string {
    const platform = process.platform;
    if (platform === 'linux' && process.env.PREFIX?.includes('com.termux')) {
      return 'android';
    }
    return platform;
  }

  private generateChatId(chatName: string, mediaType: string): string {
    return crypto.createHash('md5').update(`${chatName}:${mediaType}`).digest('hex').substring(0, 16);
  }

  private determineChatType(chatName: string): 'individual' | 'group' {
    // AIDEV-NOTE: scanner-chat-type-detection; determine individual vs group chats
    const groupKeywords = ['group', 'team', 'family', 'friends', 'work', 'class', 'project'];
    const lowerName = chatName.toLowerCase();
    
    // Check for group keywords
    if (groupKeywords.some(keyword => lowerName.includes(keyword))) {
      return 'group';
    }
    
    // Check for phone number pattern (individual)
    if (/\+\d{1,3}\s?\d+/.test(chatName)) {
      return 'individual';
    }
    
    // Check for "Chat with" pattern (individual)
    if (lowerName.startsWith('chat with')) {
      return 'individual';
    }
    
    // Default to group for ambiguous cases
    return 'group';
  }

  private async estimateFileCount(chatPath: string): Promise<number> {
    try {
      const items = await fs.readdir(chatPath);
      let count = 0;
      
      for (const item of items) {
        const itemPath = path.join(chatPath, item);
        const stat = await fs.stat(itemPath);
        
        if (stat.isFile()) {
          count++;
        } else if (stat.isDirectory()) {
          count += await this.estimateFileCount(itemPath);
        }
      }
      
      return count;
    } catch {
      return 0;
    }
  }

  private filterChats(chats: ChatInfo[], options: FindChatsOptions): ChatInfo[] {
    return chats.filter(chat => {
      if (options.namePattern && !options.namePattern.test(chat.name)) {
        return false;
      }
      
      if (options.minLastActivity && chat.lastActivity < options.minLastActivity) {
        return false;
      }
      
      if (!options.includeEmpty && chat.estimatedFileCount === 0) {
        return false;
      }
      
      return true;
    });
  }

  private async getChatPath(chatId: string): Promise<string | null> {
    const chatInfo = this.chatRegistry.get(chatId);
    return chatInfo ? chatInfo.mediaPath : null;
  }

  private async scanDirectory(
    dirPath: string, 
    files: FileMetadata[], 
    chatInfo: ChatInfo, 
    filters: ScanChatFilters,
    depth: number
  ): Promise<void> {
    if (depth > this.config.maxDepth!) {
      return;
    }

    try {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = await fs.stat(itemPath);
        
        if (stat.isFile()) {
          if (this.shouldIncludeFile(item, stat, filters)) {
            const metadata = await this.createFileMetadata(itemPath, stat, chatInfo);
            files.push(metadata);
          }
        } else if (stat.isDirectory()) {
          await this.scanDirectory(itemPath, files, chatInfo, filters, depth + 1);
        }
      }
    } catch (error) {
      // Directory access error, skip
    }
  }

  private shouldIncludeFile(fileName: string, stat: any, filters: ScanChatFilters): boolean {
    const ext = path.extname(fileName).toLowerCase();
    
    // Check supported types
    if (!this.config.supportedTypes!.includes(ext.substring(1))) {
      return false;
    }
    
    // Check file size limits
    if (filters.minSize && stat.size < filters.minSize) {
      return false;
    }
    
    if (filters.maxSize && stat.size > filters.maxSize) {
      return false;
    }
    
    // Check date range
    if (filters.dateRange) {
      if (filters.dateRange.from && stat.mtime < filters.dateRange.from) {
        return false;
      }
      if (filters.dateRange.to && stat.mtime > filters.dateRange.to) {
        return false;
      }
    }
    
    // Check name pattern
    if (filters.namePattern && !filters.namePattern.test(fileName)) {
      return false;
    }
    
    // Check file types
    if (filters.types) {
      const fileType = this.determineFileType(ext);
      if (!filters.types.includes(fileType)) {
        return false;
      }
    }
    
    return true;
  }

  private async createFileMetadata(filePath: string, stat: any, chatInfo: ChatInfo): Promise<FileMetadata> {
    const name = path.basename(filePath);
    const ext = path.extname(name).toLowerCase();
    const type = this.determineFileType(ext);
    const mimeType = this.getMimeType(ext);
    const hash = await this.calculateFileHash(filePath, stat.size);
    const whatsappMeta = this.extractWhatsAppMetadata(name);

    return {
      path: filePath,
      name,
      size: stat.size,
      type,
      mimeType,
      hash,
      timestamp: stat.mtime,
      chat: {
        id: chatInfo.id,
        name: chatInfo.name,
        type: chatInfo.type
      },
      whatsappMeta
    };
  }

  private determineFileType(extension: string): 'photo' | 'video' | 'document' | 'audio' {
    for (const [type, extensions] of Object.entries(SCANNER_CONSTANTS.FILE_TYPES)) {
      if (extensions.includes(extension)) {
        return type as 'photo' | 'video' | 'document' | 'audio';
      }
    }
    return 'document'; // Default fallback
  }

  private getMimeType(extension: string): string {
    return mimeTypes.lookup(extension) || 'application/octet-stream';
  }

  private async calculateFileHash(filePath: string, fileSize: number): Promise<string> {
    // AIDEV-NOTE: scanner-hash-calculation; use streaming for large files to maintain memory efficiency
    if (fileSize > SCANNER_CONSTANTS.STREAMING_THRESHOLD) {
      return this.calculateHashStream(filePath);
    } else {
      const content = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    }
  }

  private async calculateHashStream(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = createReadStream(filePath);
      
      stream.on('data', (chunk) => {
        hash.update(chunk);
      });
      
      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });
      
      stream.on('error', reject);
    });
  }

  private extractWhatsAppMetadata(filename: string): any {
    // AIDEV-NOTE: scanner-whatsapp-metadata; extract date and sequence from WhatsApp filename patterns
    const patterns = [
      /^(IMG|VID|AUD|DOC|PTT)-(\d{8})-WA(\d{4})\./,  // Standard pattern
      /^(IMG|VID|AUD|DOC|PTT)-(\d{4}-\d{2}-\d{2})-WA(\d{4})\./  // Alternative pattern
    ];
    
    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match && match.length >= 4) {
        const [, prefix, dateStr, sequence] = match;
        
        if (!prefix || !dateStr || !sequence) {
          continue;
        }
        
        // Normalize date format
        let normalizedDate = dateStr;
        if (dateStr.length === 8) {
          // YYYYMMDD -> YYYY-MM-DD
          normalizedDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
        }
        
        return {
          prefix,
          date: normalizedDate,
          sequence
        };
      }
    }
    
    return {};
  }

  private extractChatFromPath(filePath: string): { id: string; name: string; type: 'individual' | 'group' } {
    // Extract chat info from file path structure
    const pathParts = filePath.split(path.sep);
    
    // Find WhatsApp Media directory index
    const mediaIndex = pathParts.findIndex(part => part.startsWith('WhatsApp'));
    if (mediaIndex >= 0 && mediaIndex < pathParts.length - 1) {
      const chatName = pathParts[mediaIndex + 1] || 'Unknown';
      const mediaType = pathParts[mediaIndex] || 'WhatsApp';
      return {
        id: this.generateChatId(chatName, mediaType),
        name: chatName,
        type: this.determineChatType(chatName)
      };
    }
    
    return {
      id: 'unknown',
      name: 'Unknown Chat',
      type: 'group'
    };
  }

  private async processBatch(files: FileMetadata[]): Promise<FileMetadata[]> {
    // AIDEV-NOTE: scanner-batch-processing; process files in batches for memory efficiency
    const batchSize = this.config.batchSize!;
    const processed: FileMetadata[] = [];
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      processed.push(...batch);
      
      // Report progress if callback provided
      if (this.config.progressCallback) {
        this.config.progressCallback({
          stage: i + batchSize >= files.length ? 'complete' : 'scanning',
          currentDirectory: '',
          processedFiles: i + batch.length,
          totalFiles: files.length,
          currentFile: batch[batch.length - 1]?.name,
          bytesProcessed: 0,
          totalBytes: 0
        });
      }
    }
    
    return processed;
  }

  // AIDEV-NOTE: scanner-path-security; secure path resolution to prevent directory traversal
  private resolveSecurePath(basePath: string, relativePath: string): string {
    const resolved = path.resolve(basePath, relativePath);
    if (!resolved.startsWith(path.resolve(basePath))) {
      throw new Error('Directory traversal attempt detected');
    }
    return resolved;
  }

  // AIDEV-NOTE: scanner-path-normalization; normalize paths for cross-platform compatibility  
  private normalizePath(inputPath: string): string {
    return WhatsAppScanner.normalizePath(inputPath);
  }
}