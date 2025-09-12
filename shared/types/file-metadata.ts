/**
 * File Metadata Types - Standard file metadata interface from architecture
 * AIDEV-NOTE: file-metadata-interface; matches architecture specification exactly
 */

export interface FileMetadata {
  path: string;           // Absolute file path
  name: string;           // Original filename
  size: number;           // File size in bytes
  type: 'photo' | 'video' | 'document' | 'audio';
  mimeType: string;       // MIME type
  hash: string;           // SHA-256 hash
  timestamp: Date;        // Creation timestamp
  chat: {
    id: string;           // Chat identifier
    name: string;         // Chat display name
    type: 'individual' | 'group';
  };
}

export interface FileProcessingResult {
  metadata: FileMetadata;
  success: boolean;
  error?: string;
}

export interface FileScanResult {
  files: FileMetadata[];
  totalFiles: number;
  totalSize: number;
  errors: string[];
}