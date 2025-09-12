/**
 * Drive Type Definitions
 * AIDEV-TODO: implement-drive-types; complete Drive type definitions
 */

export interface DriveConfig {
  oauthManager: any; // Will be properly typed later
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  error?: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  mimeType: string;
}

export interface StorageInfo {
  used: number;
  total: number;
  available: number;
}