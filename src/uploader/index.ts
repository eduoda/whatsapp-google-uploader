/**
 * @whatsapp-uploader/proxy - Core Orchestrator Library
 * 
 * AIDEV-NOTE: proxy-main-export; primary entry point for proxy functionality
 * AIDEV-NOTE: sheets-integration; uses Google Sheets for all persistence
 */

import { OAuth2Client } from 'google-auth-library';
import { SheetsDatabase, FileRecord, ProgressRecord } from '../database/index';
import { createHash } from 'crypto';

export interface ProxyConfig {
  auth: OAuth2Client;
  rateLimit?: {
    maxConcurrent?: number;
    requestsPerSecond?: number;
  };
}

export interface UploadOptions {
  chatId?: string;
  onProgress?: (progress: number) => void;
}

export interface FileUpload {
  path: string;
  name: string;
  size: number;
  mimeType: string;
  hash?: string;
}

export class ProxyManager {
  private db: SheetsDatabase;
  private config: ProxyConfig;
  
  constructor(config: ProxyConfig) {
    this.config = config;
    this.db = new SheetsDatabase(config.auth);
  }
  
  async initialize(): Promise<void> {
    await this.db.initialize();
  }
  
  async uploadFiles(files: FileUpload[], options: UploadOptions): Promise<void> {
    const chatId = options.chatId || 'default';
    
    // Update initial progress
    await this.db.updateProgress({
      chatId,
      lastProcessedFile: '',
      totalFiles: files.length,
      processedFiles: 0,
      status: 'active',
      lastUpdated: new Date().toISOString()
    });
    
    let processedCount = 0;
    
    for (const file of files) {
      // Calculate file hash if not provided
      if (!file.hash) {
        file.hash = this.calculateHash(file.path);
      }
      
      // Check if already uploaded
      const isUploaded = await this.db.isFileUploaded(file.hash);
      if (isUploaded) {
        processedCount++;
        continue;
      }
      
      // TODO: Actual upload logic here (integrate with google-drive/google-photos)
      
      // Save upload record
      await this.db.saveUploadedFile({
        fileHash: file.hash,
        fileName: file.name,
        filePath: file.path,
        fileSize: file.size,
        uploadDate: new Date().toISOString(),
        googleId: 'placeholder-id', // TODO: actual Google ID from upload
        mimeType: file.mimeType,
        chatId
      });
      
      processedCount++;
      
      // Update progress
      await this.db.updateProgress({
        chatId,
        lastProcessedFile: file.name,
        totalFiles: files.length,
        processedFiles: processedCount,
        status: 'active',
        lastUpdated: new Date().toISOString()
      });
      
      if (options.onProgress) {
        options.onProgress(processedCount / files.length);
      }
    }
    
    // Mark as completed
    await this.db.updateProgress({
      chatId,
      lastProcessedFile: files[files.length - 1]?.name || '',
      totalFiles: files.length,
      processedFiles: processedCount,
      status: 'completed',
      lastUpdated: new Date().toISOString()
    });
  }
  
  async getProgress(chatId: string): Promise<ProgressRecord | null> {
    return await this.db.getProgress(chatId);
  }
  
  async getUploadedFiles(chatId?: string): Promise<FileRecord[]> {
    return await this.db.getUploadedFiles(chatId);
  }
  
  async getStatistics(): Promise<{ totalFiles: number; totalChats: number }> {
    return await this.db.getStatistics();
  }
  
  getSpreadsheetUrl(): string | null {
    return this.db.getSpreadsheetUrl();
  }
  
  private calculateHash(filePath: string): string {
    // TODO: Implement actual file hashing
    const hash = createHash('sha256');
    hash.update(filePath);
    return hash.digest('hex');
  }
}

// Factory function
export async function createProxyManager(config: ProxyConfig): Promise<ProxyManager> {
  const manager = new ProxyManager(config);
  await manager.initialize();
  return manager;
}

// Re-export types from sheets-database
export { FileRecord, ProgressRecord } from '../database/index';