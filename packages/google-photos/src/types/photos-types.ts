/**
 * Google Photos API Types and Interfaces
 * AIDEV-NOTE: photos-types-definitions; comprehensive type definitions for Photos API integration
 */

import { Readable } from 'stream';

export enum PhotosErrorType {
  PERMANENT = 'permanent',        // 400, 401, 403 - no retry
  TRANSIENT = 'transient',        // 429, ≥500 - retry with backoff
  NETWORK = 'network',            // Connection errors - retry
  QUOTA = 'quota',               // Storage quota exceeded - no retry
  INVALID_MEDIA = 'invalid_media' // Unsupported format - no retry
}

export interface PhotosConfig {
  auth: any; // OAuth2 client from googleapis
  maxRetries?: number; // Default: 3
  batchSize?: number; // Default: 50 (Google Photos limit)
  uploadTimeout?: number; // Default: 300000 (5 minutes)
}

export interface MediaMetadata {
  filename: string;
  mimeType: string;
  description?: string;
  timestamp?: Date;
}

export interface MediaItem {
  stream: Readable;
  metadata: MediaMetadata;
}

export interface UploadResult {
  success: boolean;
  mediaItem?: {
    id: string;
    filename: string;
    mimeType: string;
    mediaMetadata?: any;
  };
  error?: string;
}

export interface AlbumInfo {
  id: string;
  title: string;
  url?: string;
  isWriteable?: boolean;
  mediaItemsCount?: number;
}

export interface AlbumDetails extends AlbumInfo {
  coverPhotoId?: string;
}

export interface AlbumAddResult {
  success: boolean;
  addedItems: string[];
  errors?: string[];
}

export interface BatchResult {
  totalItems: number;
  successCount: number;
  failureCount: number;
  results: UploadResult[];
}

export interface BatchOptions {
  onProgress?: (progress: { completed: number; total: number; percentage: number }) => void;
  albumId?: string; // Auto-add to album after upload
}

// AIDEV-NOTE: api-response-types; Google Photos API response structures
export interface PhotosApiMediaItem {
  id: string;
  filename: string;
  mimeType: string;
  mediaMetadata?: {
    creationTime: string;
    width?: string;
    height?: string;
    photo?: any;
    video?: any;
  };
}

export interface PhotosApiAlbum {
  id: string;
  title: string;
  productUrl?: string;
  isWriteable?: boolean;
  mediaItemsCount?: string;
  coverPhotoMediaItemId?: string;
}

export interface PhotosApiError {
  code?: number;
  message: string;
  details?: any[];
}

export interface CreateMediaItemResult {
  uploadToken: string;
  status: {
    message?: string;
    code?: number;
  };
  mediaItem?: PhotosApiMediaItem;
}

export interface BatchAddToAlbumResult {
  mediaItemId: string;
  status: {
    message?: string;
    code?: number;
  };
}