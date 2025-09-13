/**
 * Drive Type Definitions
 * AIDEV-NOTE: drive-types-complete; complete Drive type definitions matching test expectations
 */

import { TokenManager } from '../../../auth/token-manager';

export interface DriveConfig {
  auth?: any; // Mock auth client for testing
  oauthManager?: TokenManager; // Real OAuth integration
  maxRetries?: number;        // Default: 3
  retryDelay?: number;       // Default: 1000ms
  resumableThreshold?: number; // Default: 5MB
}

export interface FileMetadata {
  name: string;
  mimeType: string;
  parents?: string[];
  description?: string;
  properties?: Record<string, string>;
}

export interface UploadOptions {
  onProgress?: (progress: ProgressInfo) => void;
  timeout?: number;
  retryOptions?: RetryOptions;
}

export interface UploadResult {
  id: string;
  name: string;
  size?: number;
  mimeType: string;
  createdTime: string;
  webViewLink?: string;
}

export interface ExistenceResult {
  exists: boolean;
  file: DriveFile | null;
}

export interface DriveFile {
  id: string;
  name: string;
  parents?: string[];
  createdTime?: string;
  size?: string;
  mimeType?: string;
}

export interface StorageInfo {
  totalSpace: number;      // In bytes
  usedSpace: number;       // In bytes  
  driveUsage: number;      // Drive-specific usage
  availableSpace: number;  // Remaining space
}

export interface ProgressInfo {
  uploaded: number;        // Bytes uploaded
  total: number;           // Total file size
  percentage?: number;     // 0-100 (calculated)
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

export enum ErrorType {
  PERMANENT = 'permanent',    // 400, 401, 403 - no retry
  TRANSIENT = 'transient',    // 429, ≥500 - retry with backoff
  NETWORK = 'network',        // Connection errors - retry
  QUOTA = 'quota'            // Storage quota exceeded - no retry
}