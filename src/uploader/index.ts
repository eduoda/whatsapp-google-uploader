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
import { UploadResult } from '../types';

export interface UploaderConfig extends GoogleApisConfig {
  rateLimit?: {
    maxConcurrent?: number;
    requestsPerSecond?: number;
    adaptiveDelay?: boolean; // Enable adaptive delay for quota management
    initialDelayMs?: number; // Initial delay between uploads (default: 1000ms)
    maxDelayMs?: number; // Maximum delay when backing off (default: 30000ms)
  };
}

export interface UploadOptions {
  chatId?: string;
  chatName?: string; // TASK-029: chat display name for organization
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
  private currentDelayMs: number = 1000; // Current adaptive delay
  private quotaErrorCount: number = 0; // Track consecutive quota errors

  constructor(config: UploaderConfig) {
    this.config = config;
    this.googleApis = new GoogleApis(config);
    // Initialize adaptive delay settings
    this.currentDelayMs = config.rateLimit?.initialDelayMs || 1000;
    // Initialize with the OAuth client from GoogleApis after auth
  }
  
  async initialize(): Promise<void> {
    await this.googleApis.initialize();
    
    // Get the OAuth client from GoogleApis to use with SheetsDatabase
    // AIDEV-NOTE: auth-sharing; GoogleApis handles all authentication, sharing with database
    const authClient = this.googleApis.authClient; // Use proper getter method
    this.db = new SheetsDatabase(authClient);
    await this.db.initialize();
  }
  
  async uploadFiles(files: FileUpload[], options: UploadOptions): Promise<UploadResult[]> {
    const chatId = options.chatId || 'default';

    // Check authentication
    if (!this.googleApis.isAuthenticated()) {
      throw new Error('Not authenticated. Please authenticate with Google APIs first.');
    }

    // Update initial progress ONLY ONCE at the start
    await this.db.updateProgress({
      chatId,
      lastProcessedFile: '',
      totalFiles: files.length,
      processedFiles: 0,
      status: 'active',
      lastUpdated: new Date().toISOString()
    });

    let processedCount = 0;
    const results: UploadResult[] = [];
    let lastProgressUpdate = Date.now();
    const PROGRESS_UPDATE_INTERVAL = 5000; // Update progress at most every 5 seconds

    for (const file of files) {
      try {
        // Calculate file hash if not provided
        if (!file.hash) {
          file.hash = await this.calculateFileHash(file.path);
        }
        
        // AIDEV-NOTE: Duplicate check disabled - CLI handles this with chat-specific sheets (TASK-023)
        // The CLI checks duplicates in the correct chat-specific sheet before calling upload
        // const isUploaded = await this.db.isFileUploaded(file.hash);
        // if (isUploaded) {
        //   processedCount++;
        //   continue;
        // }
        
        // AIDEV-NOTE: actual-upload-implementation; real file upload using GoogleApis with chat organization (TASK-029)
        const result = await this.googleApis.uploadFile(
          file.path,
          {
            filename: file.name,
            mimeType: file.mimeType,
            chatName: options.chatName, // TASK-029: pass chat name for album/folder creation
            chatJid: chatId, // TASK-029: pass chat JID for album/folder creation
            existingAlbumId: (options as any).existingAlbumId, // Pass existing album ID if available
            existingFolderId: (options as any).existingFolderId // Pass existing folder ID if available
          },
          (uploaded, total) => {
            // Individual file progress - report partial progress for this file
            const fileProgress = processedCount + (uploaded / total);
            if (options.onProgress) {
              options.onProgress(fileProgress / files.length);
            }
          }
        );

        // Add result to array
        results.push(result);

        // Cache album/folder IDs for next uploads in this batch
        if (result.albumId && !(options as any).existingAlbumId) {
          (options as any).existingAlbumId = result.albumId;
        }
        if (result.folderId && !(options as any).existingFolderId) {
          (options as any).existingFolderId = result.folderId;
        }

        // AIDEV-NOTE: File tracking moved to chat-specific sheets (TASK-023)
        // The CLI handles saving upload status to the correct chat-specific sheet
        // await this.db.saveUploadedFile({
        //   fileHash: file.hash,
        //   fileName: file.name,
        //   filePath: file.path,
        //   fileSize: file.size,
        //   uploadDate: new Date().toISOString(),
        //   googleId: result.id, // Actual Google ID from upload
        //   mimeType: file.mimeType,
        //   chatId
        // });

        processedCount++;

        // CRITICAL: For the LAST file, always update immediately to ensure final state is saved
        // For other files, batch updates to reduce API calls
        const now = Date.now();
        const isLastFile = processedCount === files.length;
        const shouldUpdateProgress = isLastFile || (now - lastProgressUpdate > PROGRESS_UPDATE_INTERVAL);

        if (shouldUpdateProgress) {
          await this.db.updateProgress({
            chatId,
            lastProcessedFile: file.name,
            totalFiles: files.length,
            processedFiles: processedCount,
            status: isLastFile ? 'completed' : 'active',
            lastUpdated: new Date().toISOString()
          });
          lastProgressUpdate = now;
        }

        if (options.onProgress) {
          options.onProgress(processedCount / files.length);
        }

        // Reset quota error count on successful upload
        this.quotaErrorCount = 0;

        // Apply adaptive delay after successful upload
        if (this.config.rateLimit?.adaptiveDelay !== false && processedCount < files.length) {
          await this.applyAdaptiveDelay();
        }
        
      } catch (error: any) {
        // AIDEV-NOTE: quota-error-handling; handle quota errors with adaptive backoff
        const errorMessage = error?.message || error?.response?.data?.error?.message || 'Unknown error';
        const isQuotaError = errorMessage.includes('Quota exceeded') ||
                            errorMessage.includes('quota') ||
                            error?.response?.status === 429 ||
                            errorMessage.includes('RESOURCE_EXHAUSTED');

        if (isQuotaError) {
          console.error(`❌ Quota exceeded for ${file.name}: ${errorMessage}`);
          this.quotaErrorCount++;

          // Increase delay exponentially on quota errors
          await this.handleQuotaError();

          // Retry the same file after backing off
          console.log(`⏳ Retrying ${file.name} after quota backoff...`);
          continue; // Don't increment processedCount, retry the same file
        } else {
          // Non-quota error - log and continue
          console.error(`Failed to upload ${file.name}:`, errorMessage);
          processedCount++;

          // Update progress only if enough time has passed
          const now = Date.now();
          if (now - lastProgressUpdate > PROGRESS_UPDATE_INTERVAL) {
            await this.db.updateProgress({
              chatId,
              lastProcessedFile: `${file.name} (FAILED)`,
              totalFiles: files.length,
              processedFiles: processedCount,
              status: 'active',
              lastUpdated: new Date().toISOString()
            });
            lastProgressUpdate = now;
          }
        }
      }
    }

    // Final status is already updated when processing the last file
    // No need for duplicate update here (KISS principle)

    return results;
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

  /**
   * Apply adaptive delay between uploads to avoid quota issues
   * AIDEV-NOTE: adaptive-delay; smart delay that adjusts based on quota errors
   */
  private async applyAdaptiveDelay(): Promise<void> {
    const minDelay = this.config.rateLimit?.initialDelayMs || 1000;
    const maxDelay = this.config.rateLimit?.maxDelayMs || 30000;

    // Gradually decrease delay if no quota errors
    if (this.quotaErrorCount === 0 && this.currentDelayMs > minDelay) {
      this.currentDelayMs = Math.max(minDelay, this.currentDelayMs * 0.9);
    }

    if (this.currentDelayMs > 0) {
      console.log(`⏱️  Waiting ${(this.currentDelayMs / 1000).toFixed(1)}s before next upload...`);
      await new Promise(resolve => setTimeout(resolve, this.currentDelayMs));
    }
  }

  /**
   * Handle quota errors with exponential backoff
   * AIDEV-NOTE: quota-backoff; exponential backoff for quota errors
   */
  private async handleQuotaError(): Promise<void> {
    const minDelay = this.config.rateLimit?.initialDelayMs || 1000;
    const maxDelay = this.config.rateLimit?.maxDelayMs || 30000;

    // Exponential backoff: double the delay for each consecutive error
    this.currentDelayMs = Math.min(maxDelay, Math.max(minDelay * 2, this.currentDelayMs * 2));

    // For quota errors, wait longer (at least 10 seconds)
    const quotaWaitTime = Math.max(10000, this.currentDelayMs);

    console.log(`⚠️  Quota limit reached. Backing off for ${(quotaWaitTime / 1000).toFixed(0)}s...`);
    console.log(`💡 Tip: The delay will automatically adjust based on API response.`);

    await new Promise(resolve => setTimeout(resolve, quotaWaitTime));
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