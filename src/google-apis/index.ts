/**
 * Unified Google APIs Class - OAuth, Drive, and Photos Integration
 * AIDEV-NOTE: simplified-google-apis; consolidated authentication and upload functionality for personal use
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { OAuth2Client } from 'google-auth-library';
import { google, drive_v3 } from 'googleapis';
import axios from 'axios';
import {
  Tokens,
  UploadResult,
  UploadMetadata,
  ProgressCallback,
  GoogleApisConfig,
  categorizeFile
} from '../types';

// AIDEV-NOTE: google-apis-main-class; unified class replacing TokenManager, DriveManager, PhotosManager
export class GoogleApis {
  private auth: OAuth2Client;
  public drive: drive_v3.Drive; // Made public for testing
  private readonly config: GoogleApisConfig;
  private readonly tokenPath: string;

  constructor(config: GoogleApisConfig) {
    this.config = config;
    this.tokenPath = config.tokenPath;
    this.auth = new OAuth2Client();
    this.drive = google.drive({ version: 'v3' });
  }

  /**
   * Get the OAuth2 client for use with other Google APIs
   * AIDEV-NOTE: auth-getter; provides access to authenticated OAuth2Client for SheetsDatabase
   */
  get authClient(): OAuth2Client {
    return this.auth;
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
      }

      // Always initialize API clients after auth is configured
      this.drive = google.drive({ version: 'v3', auth: this.auth });
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
      // Photos API will be initialized when needed (not part of standard googleapis)
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

    // Check if token is expired (with 1-minute buffer for tests)
    if (tokens.expiry_date) {
      const bufferTime = 1 * 60 * 1000; // 1 minute
      return Date.now() < (tokens.expiry_date - bufferTime);
    }

    return true;
  }

  /**
   * Ensure user is authenticated and tokens are fresh
   * AIDEV-NOTE: centralized-auth; DRY principle - single auth check
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    
    // Refresh if needed
    const tokens = this.auth.credentials;
    if (tokens.expiry_date && Date.now() > (tokens.expiry_date - 1 * 60 * 1000)) {
      const response = await this.auth.refreshAccessToken();
      this.auth.setCredentials(response.credentials);
      await this.saveTokens(response.credentials as Tokens);
      // Reinitialize Drive with new credentials
      this.drive = google.drive({ version: 'v3', auth: this.auth });
    }
  }

  /**
   * Upload photo or video to Google Photos
   * AIDEV-NOTE: photos-upload; uses REST API directly with axios
   */
  async uploadToPhotos(filePath: string, metadata?: UploadMetadata, onProgress?: ProgressCallback): Promise<UploadResult> {
    await this.ensureAuthenticated();

    const fileBuffer = await fs.readFile(filePath);
    const fileName = metadata?.filename || path.basename(filePath);

    if (onProgress) {
      onProgress(0, fileBuffer.length);
    }

    // Phase 1: Upload bytes to get upload token
    const uploadResponse = await axios.post(
      'https://photoslibrary.googleapis.com/v1/uploads',
      fileBuffer,
      {
        headers: {
          'Authorization': `Bearer ${this.auth.credentials.access_token}`,
          'Content-Type': 'application/octet-stream',
          'X-Goog-Upload-Content-Type': metadata?.mimeType || 'image/jpeg',
          'X-Goog-Upload-Protocol': 'raw'
        }
      }
    );

    const uploadToken = uploadResponse.data;

    // Phase 2: Create media item with upload token
    const createResponse = await axios.post(
      'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate',
      {
        newMediaItems: [{
          description: metadata?.description || 'Uploaded from WhatsApp',
          simpleMediaItem: {
            uploadToken: uploadToken,
            fileName: fileName
          }
        }]
      },
      {
        headers: {
          'Authorization': `Bearer ${this.auth.credentials.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = createResponse.data.newMediaItemResults[0];
    if (!result.mediaItem) {
      throw new Error(result.status?.message || 'Upload failed');
    }

    if (onProgress) {
      onProgress(fileBuffer.length, fileBuffer.length);
    }

    return {
      id: result.mediaItem.id,
      name: result.mediaItem.filename || fileName,
      mimeType: result.mediaItem.mimeType || metadata?.mimeType || 'image/jpeg',
      url: result.mediaItem.productUrl || result.mediaItem.baseUrl
    };
  }


  /**
   * Upload document to Google Drive
   * AIDEV-NOTE: drive-upload; simplified Drive upload without resumable complexity
   */
  async uploadToDrive(filePath: string, metadata?: UploadMetadata, onProgress?: ProgressCallback): Promise<UploadResult> {
    await this.ensureAuthenticated();
    
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

    return category === 'photo' || category === 'video'
      ? this.uploadToPhotos(filePath, fileMetadata, onProgress)
      : this.uploadToDrive(filePath, fileMetadata, onProgress);
  }

  /**
   * Create folder in Google Drive
   * AIDEV-NOTE: drive-folder-creation; simplified folder creation
   */
  async createFolder(name: string, parentId?: string): Promise<string> {
    await this.ensureAuthenticated();

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
  }

  /**
   * Create album in Google Photos
   * AIDEV-NOTE: photos-album-creation; KISS implementation for album creation
   */
  async createAlbum(title: string): Promise<string> {
    await this.ensureAuthenticated();

    const response = await axios.post(
      'https://photoslibrary.googleapis.com/v1/albums',
      {
        album: { title }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.auth.credentials.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.id;
  }

  /**
   * Add media items to album
   * AIDEV-NOTE: photos-album-add; KISS implementation for adding items to album
   */
  async addToAlbum(albumId: string, mediaItemIds: string[]): Promise<void> {
    await this.ensureAuthenticated();

    await axios.post(
      `https://photoslibrary.googleapis.com/v1/albums/${albumId}:batchAddMediaItems`,
      {
        mediaItemIds
      },
      {
        headers: {
          'Authorization': `Bearer ${this.auth.credentials.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  /**
   * Delete file from Google Drive
   * AIDEV-NOTE: drive-delete; KISS implementation for file deletion
   */
  async deleteFromDrive(fileId: string): Promise<void> {
    await this.ensureAuthenticated();
    await this.drive.files.delete({ fileId });
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
    const mimeTypes = require('mime-types');
    return mimeTypes.lookup(filePath) || 'application/octet-stream';
  }
}

// Re-export types for convenience
export * from '../types';