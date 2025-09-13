/**
 * Unified Type Definitions for Google APIs Integration
 * AIDEV-NOTE: simplified-types; consolidated types from OAuth, Drive, and Photos for personal use case
 */

import { Readable } from 'stream';
import { Credentials } from 'google-auth-library';

// AIDEV-NOTE: token-types; simplified token handling for personal use
export interface Tokens extends Credentials {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
  scope?: string;
  token_type?: string | null;
}

// AIDEV-NOTE: upload-results; unified result format for both Photos and Drive
export interface UploadResult {
  id: string;
  name: string;
  url?: string;
  mimeType: string;
  size?: number;
  createdTime?: string;
}

// AIDEV-NOTE: upload-metadata; simplified metadata for uploads (renamed to avoid conflict)
export interface UploadMetadata {
  filename: string;
  mimeType: string;
  description?: string;
  parentId?: string; // For Drive uploads
}

// AIDEV-NOTE: progress-callback; simple progress reporting
export interface ProgressCallback {
  (uploaded: number, total: number): void;
}

// AIDEV-NOTE: config-interface; simplified configuration
export interface GoogleApisConfig {
  credentialsPath: string;
  tokenPath: string;
  scopes?: string[];
}

// AIDEV-NOTE: file-categorization; simple file type categories
export type FileCategory = 'photo' | 'video' | 'document';

export function categorizeFile(mimeType: string): FileCategory {
  if (mimeType.startsWith('image/')) return 'photo';
  if (mimeType.startsWith('video/')) return 'video'; 
  return 'document';
}