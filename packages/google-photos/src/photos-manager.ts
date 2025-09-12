/**
 * Google Photos Manager - Main coordinator for Google Photos API integration
 * AIDEV-NOTE: photos-manager-implementation; handles two-phase upload process and album management
 */

import { Readable } from 'stream';
import {
  PhotosConfig,
  MediaMetadata,
  MediaItem,
  UploadResult,
  AlbumInfo,
  AlbumDetails,
  AlbumAddResult,
  BatchResult,
  BatchOptions,
  PhotosErrorType,
  PhotosApiError,
  CreateMediaItemResult,
  BatchAddToAlbumResult
} from './types/photos-types';

export class PhotosManager {
  private readonly config: Required<PhotosConfig>;
  private photos: any;

  constructor(config: PhotosConfig) {
    this.config = {
      auth: config.auth,
      maxRetries: config.maxRetries ?? 3,
      batchSize: config.batchSize ?? 50,
      uploadTimeout: config.uploadTimeout ?? 300000
    };

    // AIDEV-NOTE: photos-api-client; initialize Google Photos API client
    // This will be set by tests or can be initialized with actual googleapis
    try {
      if (config.auth) {
        const { google } = require('googleapis');
        this.photos = google.photos({ version: 'v1', auth: config.auth });
      }
    } catch (error) {
      // Allow initialization to continue for tests
      this.photos = null;
    }
  }

  /**
   * Create a new album in Google Photos
   * AIDEV-NOTE: album-creation; validates and sanitizes album names
   */
  async createAlbum(name: string): Promise<AlbumInfo> {
    this.validateAlbumName(name);
    const sanitizedName = this.sanitizeAlbumName(name);

    const response = await this.photos.albums.create({
      requestBody: {
        album: {
          title: sanitizedName
        }
      }
    });

    const album = response.data;
    return {
      id: album.id,
      title: album.title,
      url: album.productUrl,
      isWriteable: album.isWriteable
    };
  }

  /**
   * Upload a single media item using two-phase process
   * AIDEV-NOTE: two-phase-upload; upload bytes first, then create media item
   */
  async uploadMedia(stream: Readable, metadata: MediaMetadata): Promise<UploadResult> {
    let uploadToken: string;
    
    try {
      // Phase 1: Upload bytes to get upload token - errors here should be thrown
      uploadToken = await this.uploadBytes(stream);
    } catch (error: any) {
      // Network errors, quota errors from upload phase should be thrown
      throw error;
    }
    
    try {
      // Phase 2: Create media item using upload token - errors here should be returned
      const mediaItem = await this.createMediaItem(uploadToken, metadata);
      
      return {
        success: true,
        mediaItem
      };
    } catch (error: any) {
      // Media item creation failures should be returned as failure results
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add media items to an album with batch processing
   * AIDEV-NOTE: album-batch-add; handles 50-item batch limits
   */
  async addToAlbum(mediaItemIds: string[], albumId: string): Promise<AlbumAddResult> {
    if (mediaItemIds.length === 0) {
      throw new Error('No media items provided');
    }
    if (!albumId) {
      throw new Error('Album ID is required');
    }

    const addedItems: string[] = [];
    const errors: string[] = [];
    let hasErrors = false;

    // Process in batches of 50 (Google Photos limit)
    for (let i = 0; i < mediaItemIds.length; i += this.config.batchSize) {
      const batch = mediaItemIds.slice(i, i + this.config.batchSize);
      
      const response = await this.photos.albums.batchAddMediaItems({
        albumId,
        requestBody: {
          mediaItemIds: batch
        }
      });

      // Process batch results
      const results: BatchAddToAlbumResult[] = response.data.results || [];
      for (const result of results) {
        if (result.status.message === 'Success') {
          addedItems.push(result.mediaItemId);
        } else {
          hasErrors = true;
          errors.push(`${result.mediaItemId}: ${result.status.message || 'Unknown error'}`);
        }
      }
    }

    return {
      success: !hasErrors,
      addedItems,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Upload multiple media items in batches with progress reporting
   * AIDEV-NOTE: batch-upload; handles >50 item batches with progress tracking
   */
  async batchUpload(mediaItems: MediaItem[], options?: BatchOptions): Promise<BatchResult> {
    const results: UploadResult[] = [];
    let successCount = 0;
    let failureCount = 0;
    const totalItems = mediaItems.length;

    // Phase 1: Upload all bytes and collect tokens
    const uploadTokens: string[] = [];
    for (let i = 0; i < mediaItems.length; i++) {
      try {
        const item = mediaItems[i];
        if (!item?.stream) {
          throw new Error('Invalid media item');
        }
        const token = await this.uploadBytes(item.stream);
        uploadTokens.push(token);
      } catch (error: any) {
        results.push({
          success: false,
          error: error.message
        });
        failureCount++;
        continue;
      }

      // Report progress for upload phase
      if (options?.onProgress) {
        options.onProgress({
          completed: i + 1,
          total: totalItems,
          percentage: Math.round(((i + 1) / totalItems) * 50) // Upload is first 50%
        });
      }
    }

    // Phase 2: Create media items in batches
    for (let i = 0; i < uploadTokens.length; i += this.config.batchSize) {
      const tokenBatch = uploadTokens.slice(i, i + this.config.batchSize);
      const metadataBatch = mediaItems.slice(i, i + this.config.batchSize)
        .filter((_, idx) => uploadTokens[i + idx]) // Only items that uploaded successfully
        .map(item => item.metadata);

      if (tokenBatch.length === 0) continue;

      try {
        const newMediaItems = tokenBatch.map((token, idx) => ({
          description: metadataBatch[idx]?.description,
          simpleMediaItem: {
            uploadToken: token,
            fileName: metadataBatch[idx]?.filename
          }
        }));

        const response = await this.photos.mediaItems.batchCreate({
          requestBody: {
            newMediaItems
          }
        });

        // Process batch results
        const batchResults: CreateMediaItemResult[] = response.data.newMediaItemResults || [];
        for (const result of batchResults) {
          if (result.status.message === 'Success' && result.mediaItem) {
            results.push({
              success: true,
              mediaItem: {
                id: result.mediaItem.id,
                filename: result.mediaItem.filename,
                mimeType: result.mediaItem.mimeType,
                mediaMetadata: result.mediaItem.mediaMetadata
              }
            });
            successCount++;
          } else {
            results.push({
              success: false,
              error: result.status.message || `Code: ${result.status.code}`
            });
            failureCount++;
          }
        }

        // Report progress for creation phase
        if (options?.onProgress) {
          const createdSoFar = Math.min(i + this.config.batchSize, uploadTokens.length);
          options.onProgress({
            completed: createdSoFar,
            total: totalItems,
            percentage: Math.round(50 + ((createdSoFar / totalItems) * 50)) // Creation is second 50%
          });
        }
      } catch (error: any) {
        // Mark entire batch as failed
        for (let j = 0; j < tokenBatch.length; j++) {
          results.push({
            success: false,
            error: error.message
          });
          failureCount++;
        }
      }
    }

    // Final progress report
    if (options?.onProgress) {
      options.onProgress({
        completed: totalItems,
        total: totalItems,
        percentage: 100
      });
    }

    return {
      totalItems,
      successCount,
      failureCount,
      results
    };
  }

  /**
   * List all albums in Google Photos
   * AIDEV-NOTE: album-listing; converts API response to standardized format
   */
  async listAlbums(): Promise<AlbumInfo[]> {
    const response = await this.photos.albums.list();
    const albums = response.data.albums || [];
    
    return albums.map((album: any) => ({
      id: album.id,
      title: album.title,
      mediaItemsCount: album.mediaItemsCount ? parseInt(album.mediaItemsCount, 10) : undefined,
      url: album.productUrl,
      isWriteable: album.isWriteable
    }));
  }

  /**
   * Find albums matching a regular expression pattern
   * AIDEV-NOTE: album-search; uses regex filtering on album titles
   */
  async findAlbums(pattern: RegExp): Promise<AlbumInfo[]> {
    const allAlbums = await this.listAlbums();
    return allAlbums.filter(album => pattern.test(album.title));
  }

  /**
   * Get detailed information about a specific album
   * AIDEV-NOTE: album-details; retrieves comprehensive album information
   */
  async getAlbumDetails(albumId: string): Promise<AlbumDetails> {
    const response = await this.photos.albums.get({
      albumId
    });

    const album = response.data;
    return {
      id: album.id,
      title: album.title,
      url: album.productUrl,
      mediaItemsCount: album.mediaItemsCount ? parseInt(album.mediaItemsCount, 10) : undefined,
      isWriteable: album.isWriteable,
      coverPhotoId: album.coverPhotoMediaItemId
    };
  }

  /**
   * Phase 1 of upload: Upload bytes to get upload token
   * AIDEV-NOTE: upload-token-creation; first phase of two-phase upload process
   */
  private async uploadBytes(stream: Readable): Promise<string> {
    return this.withRetry(async () => {
      const response = await this.photos.uploads.create({
        media: {
          body: stream
        }
      });

      return response.data;
    });
  }

  /**
   * Phase 2 of upload: Create media item using upload token
   * AIDEV-NOTE: media-item-creation; second phase of two-phase upload process
   */
  private async createMediaItem(uploadToken: string, metadata: MediaMetadata): Promise<any> {
    const response = await this.photos.mediaItems.create({
      requestBody: {
        newMediaItems: [{
          description: metadata.description,
          simpleMediaItem: {
            uploadToken,
            fileName: metadata.filename
          }
        }]
      }
    });

    const results: CreateMediaItemResult[] = response.data.newMediaItemResults || [];
    const result = results[0];

    if (!result || result.status?.message !== 'Success' || !result.mediaItem) {
      throw new Error(result?.status?.message || `Code: ${result?.status?.code || 'Unknown'}`);
    }

    return {
      id: result.mediaItem.id,
      filename: result.mediaItem.filename,
      mimeType: result.mediaItem.mimeType,
      mediaMetadata: result.mediaItem.mediaMetadata
    };
  }

  /**
   * Validate album name according to Google Photos requirements
   * AIDEV-NOTE: album-validation; ensures album name meets requirements
   */
  private validateAlbumName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Album name cannot be empty');
    }
    if (name.length > 500) {
      throw new Error('Album name too long');
    }
  }

  /**
   * Sanitize album name to remove potentially dangerous content
   * AIDEV-NOTE: album-sanitization; removes HTML/script tags for security
   */
  private sanitizeAlbumName(name: string): string {
    return name
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>]/g, '')    // Remove < and > characters
      .trim();
  }

  /**
   * Execute operation with retry logic for transient errors
   * AIDEV-NOTE: retry-logic; exponential backoff for transient failures
   */
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on permanent errors
        if (this.isPermanentError(error)) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === this.config.maxRetries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Determine if an error is permanent and should not be retried
   * AIDEV-NOTE: error-classification; categorizes errors for retry logic
   */
  private isPermanentError(error: any): boolean {
    if (error.code >= 400 && error.code < 500) {
      return true; // Client errors are permanent
    }
    return false;
  }

}