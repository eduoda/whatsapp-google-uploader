/**
 * @whatsapp-uploader/uploader - Core Orchestrator Library
 * 
 * AIDEV-NOTE: uploader-simplified; simplified uploader using unified GoogleApis class
 * AIDEV-NOTE: sheets-integration; uses Google Sheets for all persistence
 */

import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import { createReadStream } from 'fs';
import { GoogleApis, GoogleApisConfig } from '../google-apis';
import { SheetsDatabase, FileRecord, ProgressRecord } from '../database/index';

export interface UploaderConfig extends GoogleApisConfig {
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

export class UploaderManager {
  private db!: SheetsDatabase; // Will be initialized in initialize()
  private googleApis: GoogleApis;
  private config: UploaderConfig;
  
  constructor(config: UploaderConfig) {
    this.config = config;
    this.googleApis = new GoogleApis(config);
    // Initialize with the OAuth client from GoogleApis after auth
  }
  
  async initialize(): Promise<void> {
    await this.googleApis.initialize();
    
    // Get the OAuth client from GoogleApis to use with SheetsDatabase
    // AIDEV-NOTE: auth-sharing; GoogleApis handles all authentication, sharing with database
    const authClient = (this.googleApis as any).auth; // Access private auth property
    this.db = new SheetsDatabase(authClient);
    await this.db.initialize();
  }
  
  async uploadFiles(files: FileUpload[], options: UploadOptions): Promise<void> {
    const chatId = options.chatId || 'default';
    
    // Check authentication
    if (!this.googleApis.isAuthenticated()) {
      throw new Error('Not authenticated. Please authenticate with Google APIs first.');
    }
    
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
      try {
        // Calculate file hash if not provided
        if (!file.hash) {
          file.hash = await this.calculateFileHash(file.path);
        }
        
        // Check if already uploaded
        const isUploaded = await this.db.isFileUploaded(file.hash);
        if (isUploaded) {
          processedCount++;
          continue;
        }
        
        // AIDEV-NOTE: actual-upload-implementation; real file upload using GoogleApis
        const result = await this.googleApis.uploadFile(
          file.path,
          {
            filename: file.name,
            mimeType: file.mimeType
          },
          (uploaded, total) => {
            // Individual file progress - report partial progress for this file
            const fileProgress = processedCount + (uploaded / total);
            if (options.onProgress) {
              options.onProgress(fileProgress / files.length);
            }
          }
        );
        
        // Save upload record with actual Google ID
        await this.db.saveUploadedFile({
          fileHash: file.hash,
          fileName: file.name,
          filePath: file.path,
          fileSize: file.size,
          uploadDate: new Date().toISOString(),
          googleId: result.id, // Actual Google ID from upload
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
        
      } catch (error) {
        // AIDEV-NOTE: error-handling-simplified; simple error handling for personal use
        console.error(`Failed to upload ${file.name}:`, error);
        
        // Continue with next file instead of failing entire batch
        processedCount++;
        
        await this.db.updateProgress({
          chatId,
          lastProcessedFile: `${file.name} (FAILED)`,
          totalFiles: files.length,
          processedFiles: processedCount,
          status: 'active',
          lastUpdated: new Date().toISOString()
        });
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
  
  /**
   * Calculate SHA-256 hash of file content (not path)
   * AIDEV-NOTE: file-content-hashing; proper file content hashing for deduplication
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filePath);
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        hash.update(chunk);
      });
      
      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });
      
      stream.on('error', reject);
    });
  }

  /**
   * Get authentication URL for initial setup
   * AIDEV-NOTE: auth-url-delegation; delegate to GoogleApis for auth flow
   */
  getAuthUrl(): string {
    return this.googleApis.getAuthUrl();
  }

  /**
   * Complete authentication with authorization code
   * AIDEV-NOTE: auth-completion-delegation; delegate to GoogleApis for auth completion
   */
  async authenticate(code: string): Promise<void> {
    await this.googleApis.authenticate(code);
    
    // Re-initialize database with authenticated client
    const authClient = (this.googleApis as any).auth;
    this.db = new SheetsDatabase(authClient);
    await this.db.initialize();
  }

  /**
   * Check if authenticated
   * AIDEV-NOTE: auth-status-delegation; delegate to GoogleApis for auth status
   */
  isAuthenticated(): boolean {
    return this.googleApis.isAuthenticated();
  }
}

// Factory function
export async function createUploaderManager(config: UploaderConfig): Promise<UploaderManager> {
  const manager = new UploaderManager(config);
  await manager.initialize();
  return manager;
}

// Re-export types from sheets-database
export { FileRecord, ProgressRecord } from '../database/index';