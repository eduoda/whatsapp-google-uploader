/**
 * Upload Type Definitions
 * AIDEV-TODO: implement-upload-types; complete upload type definitions
 */

export interface UploadOptions {
  folderId?: string;
  resumable?: boolean;
}

export interface UploadProgress {
  uploaded: number;
  total: number;
  percentage: number;
}