/**
 * Unified Google APIs Class - OAuth, Drive, and Photos Integration
 * AIDEV-NOTE: simplified-google-apis; consolidated authentication and upload functionality for personal use
 */

import { Readable } from 'stream';
import * as fs from 'fs/promises';
import * as path from 'path';
import { OAuth2Client } from 'google-auth-library';
import { google, drive_v3 } from 'googleapis';
import { 
  Tokens, 
  UploadResult, 
  UploadMetadata, 
  ProgressCallback, 
  GoogleApisConfig,
  categorizeFile 
} from '../types';
import { config, loadCredentials } from '../config';

// AIDEV-NOTE: google-apis-main-class; unified class replacing TokenManager, DriveManager, PhotosManager
export class GoogleApis {
  private auth: OAuth2Client;
  private drive: drive_v3.Drive;
  private photos: any;
  private readonly config: GoogleApisConfig;
  private readonly tokenPath: string;

  constructor(config: GoogleApisConfig) {
    this.config = config;
    this.tokenPath = config.tokenPath;
    
    // Default scopes for personal WhatsApp backup
    const scopes = config.scopes || [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/photoslibrary.appendonly'
    ];

    // Initialize OAuth2 client
    this.auth = new OAuth2Client();
    
    // Will be initialized after authentication
    this.drive = google.drive({ version: 'v3' });
    this.photos = null;
  }

  /**
   * Initialize authentication with credentials file
   * AIDEV-NOTE: auth-initialization; simplified authentication setup
   */
  async initialize(): Promise<void> {
    try {
      // Load OAuth2 credentials from file
      const credentials = JSON.parse(await fs.readFile(this.config.credentialsPath, 'utf-8'));
      
      if (credentials.installed) {
        // Desktop application credentials
        this.auth = new OAuth2Client(
          credentials.installed.client_id,
          credentials.installed.client_secret,
          credentials.installed.redirect_uris[0]
        );
      } else if (credentials.web) {
        // Web application credentials
        this.auth = new OAuth2Client(
          credentials.web.client_id,
          credentials.web.client_secret,
          credentials.web.redirect_uris[0]
        );
      } else {
        throw new Error('Invalid credentials format');
      }

      // Try to load existing tokens
      const tokens = await this.loadTokens();
      if (tokens) {
        this.auth.setCredentials(tokens);
        
        // Initialize API clients
        this.drive = google.drive({ version: 'v3', auth: this.auth });
        this.photos = (google as any).photos({ version: 'v1', auth: this.auth });
      }
    } catch (error) {
      throw new Error(`Failed to initialize: ${(error as Error).message}`);
    }
  }

  /**
   * Get OAuth2 authorization URL for user consent
   * AIDEV-NOTE: auth-url-generation; simplified OAuth flow for personal use
   */
  getAuthUrl(): string {
    const scopes = this.config.scopes || [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/photoslibrary.appendonly'
    ];
    
    return this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
  }

  /**
   * Complete OAuth flow with authorization code
   * AIDEV-NOTE: oauth-completion; exchange code for tokens and save
   */
  async authenticate(code: string): Promise<void> {
    try {
      const { tokens } = await this.auth.getToken(code);
      this.auth.setCredentials(tokens);
      
      // Save tokens to file
      await this.saveTokens(tokens as Tokens);
      
      // Initialize API clients
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      this.photos = (google as any).photos({ version: 'v1', auth: this.auth });
    } catch (error) {
      throw new Error(`Authentication failed: ${(error as Error).message}`);
    }
  }

  /**
   * Check if user is authenticated and tokens are valid
   * AIDEV-NOTE: auth-status-check; simple authentication validation
   */
  isAuthenticated(): boolean {
    const tokens = this.auth.credentials;
    if (!tokens.access_token) return false;
    
    // Check if token is expired (with 5-minute buffer)
    if (tokens.expiry_date) {
      const bufferTime = 5 * 60 * 1000; // 5 minutes
      return Date.now() < (tokens.expiry_date - bufferTime);
    }
    
    return true;
  }

  /**
   * Refresh access token if needed
   * AIDEV-NOTE: token-refresh; automatic token refresh
   */
  async refreshTokens(): Promise<void> {
    try {
      const response = await this.auth.refreshAccessToken();
      const tokens = response.credentials;
      this.auth.setCredentials(tokens);
      await this.saveTokens(tokens as Tokens);
    } catch (error) {
      throw new Error(`Token refresh failed: ${(error as Error).message}`);
    }
  }

  /**
   * Upload photo or video to Google Photos
   * AIDEV-NOTE: photos-upload; simplified two-phase Photos upload
   */
  async uploadPhoto(filePath: string, metadata?: UploadMetadata, onProgress?: ProgressCallback): Promise<UploadResult> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      // Ensure token is fresh
      await this.refreshTokens();
      
      const stream = require('fs').createReadStream(filePath);
      const fileName = metadata?.filename || path.basename(filePath);
      
      if (onProgress) {
        const stat = await fs.stat(filePath);
        onProgress(0, stat.size);
      }

      // Phase 1: Upload bytes
      const uploadResponse = await this.photos.mediaItems.upload({
        media: { body: stream }
      });
      
      const uploadToken = uploadResponse.data;
      
      if (onProgress) {
        const stat = await fs.stat(filePath);
        onProgress(stat.size * 0.7, stat.size);
      }

      // Phase 2: Create media item
      const createResponse = await this.photos.mediaItems.batchCreate({
        requestBody: {
          newMediaItems: [{
            description: metadata?.description,
            simpleMediaItem: {
              uploadToken,
              fileName
            }
          }]
        }
      });

      const result = createResponse.data.newMediaItemResults[0];
      if (result.status.message !== 'Success') {
        throw new Error(result.status.message);
      }

      if (onProgress) {
        const stat = await fs.stat(filePath);
        onProgress(stat.size, stat.size);
      }

      return {
        id: result.mediaItem.id,
        name: result.mediaItem.filename,
        mimeType: result.mediaItem.mimeType,
        url: result.mediaItem.productUrl
      };
    } catch (error) {
      throw new Error(`Photo upload failed: ${(error as Error).message}`);
    }
  }

  /**
   * Upload video to Google Photos (same as photo)
   * AIDEV-NOTE: video-upload; alias for photo upload method
   */
  async uploadVideo(filePath: string, metadata?: UploadMetadata, onProgress?: ProgressCallback): Promise<UploadResult> {
    return this.uploadPhoto(filePath, metadata, onProgress);
  }

  /**
   * Upload document to Google Drive
   * AIDEV-NOTE: drive-upload; simplified Drive upload without resumable complexity
   */
  async uploadDocument(filePath: string, metadata?: UploadMetadata, onProgress?: ProgressCallback): Promise<UploadResult> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      // Ensure token is fresh
      await this.refreshTokens();
      
      const stream = require('fs').createReadStream(filePath);
      const fileName = metadata?.filename || path.basename(filePath);
      
      if (onProgress) {
        const stat = await fs.stat(filePath);
        onProgress(0, stat.size);
      }

      const requestBody: any = {
        name: fileName,
        mimeType: metadata?.mimeType || 'application/octet-stream'
      };
      
      if (metadata?.parentId) {
        requestBody.parents = [metadata.parentId];
      }

      const response = await this.drive.files.create({
        requestBody,
        media: {
          mimeType: requestBody.mimeType,
          body: stream
        },
        fields: 'id,name,size,mimeType,createdTime,webViewLink'
      });

      if (onProgress) {
        const stat = await fs.stat(filePath);
        onProgress(stat.size, stat.size);
      }

      return {
        id: response.data.id!,
        name: response.data.name!,
        size: response.data.size ? parseInt(response.data.size) : undefined,
        mimeType: response.data.mimeType!,
        createdTime: response.data.createdTime!,
        url: response.data.webViewLink!
      };
    } catch (error) {
      throw new Error(`Document upload failed: ${(error as Error).message}`);
    }
  }

  /**
   * Smart upload based on file MIME type
   * AIDEV-NOTE: smart-upload; automatic routing to Photos or Drive based on file type
   */
  async uploadFile(filePath: string, metadata?: UploadMetadata, onProgress?: ProgressCallback): Promise<UploadResult> {
    const mimeType = metadata?.mimeType || this.getMimeType(filePath);
    const category = categorizeFile(mimeType);
    
    const fileMetadata = {
      ...metadata,
      mimeType,
      filename: metadata?.filename || path.basename(filePath)
    };
    
    switch (category) {
      case 'photo':
      case 'video':
        return this.uploadPhoto(filePath, fileMetadata, onProgress);
      case 'document':
      default:
        return this.uploadDocument(filePath, fileMetadata, onProgress);
    }
  }

  /**
   * Create folder in Google Drive
   * AIDEV-NOTE: drive-folder-creation; simplified folder creation
   */
  async createFolder(name: string, parentId?: string): Promise<string> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      await this.refreshTokens();
      
      const requestBody: any = {
        name,
        mimeType: 'application/vnd.google-apps.folder'
      };
      
      if (parentId) {
        requestBody.parents = [parentId];
      }

      const response = await this.drive.files.create({
        requestBody,
        fields: 'id'
      });

      return response.data.id!;
    } catch (error) {
      throw new Error(`Folder creation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Save tokens to file with basic security (file permissions only)
   * AIDEV-NOTE: token-storage-simple; simple file storage without encryption for personal use
   */
  private async saveTokens(tokens: Tokens): Promise<void> {
    try {
      const dir = path.dirname(this.tokenPath);
      await fs.mkdir(dir, { recursive: true });
      
      // Save tokens as JSON with secure file permissions
      await fs.writeFile(
        this.tokenPath,
        JSON.stringify(tokens, null, 2),
        { mode: 0o600 } // Owner read/write only
      );
    } catch (error) {
      throw new Error(`Failed to save tokens: ${(error as Error).message}`);
    }
  }

  /**
   * Load tokens from file
   * AIDEV-NOTE: token-loading-simple; simple file loading without decryption
   */
  private async loadTokens(): Promise<Tokens | null> {
    try {
      const data = await fs.readFile(this.tokenPath, 'utf-8');
      return JSON.parse(data) as Tokens;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null; // No tokens exist yet
      }
      throw new Error(`Failed to load tokens: ${error.message}`);
    }
  }

  /**
   * Get MIME type from file extension
   * AIDEV-NOTE: mime-type-detection; simple MIME type detection
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg', 
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/avi',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

// AIDEV-NOTE: factory-function; simple factory for GoogleApis initialization
export async function createGoogleApis(config: GoogleApisConfig): Promise<GoogleApis> {
  const apis = new GoogleApis(config);
  await apis.initialize();
  return apis;
}

// Re-export types for convenience
export * from '../types';