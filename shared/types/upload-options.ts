/**
 * Upload Options Types - Upload configuration interface from architecture
 * AIDEV-NOTE: upload-options-interface; matches architecture specification exactly
 */

export interface UploadOptions {
  chatId: string;
  batchSize?: number;     // Default: 10
  concurrent?: number;    // Default: 3
  dryRun?: boolean;       // Default: false
  fullSync?: boolean;     // Default: false
  noResume?: boolean;     // Default: false
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  typeFilters?: string[]; // ['photos', 'videos', 'documents', 'audio']
  excludeTypes?: string[];
}

export interface UploadResult {
  fileId: string;
  fileName: string;
  success: boolean;
  uploadTime: number;     // milliseconds
  size: number;           // bytes
  error?: string;
}

export interface BatchUploadResult {
  batchId: number;
  results: UploadResult[];
  totalFiles: number;
  successCount: number;
  errorCount: number;
  totalSize: number;
  totalTime: number;
}