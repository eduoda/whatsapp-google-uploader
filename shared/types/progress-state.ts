/**
 * Progress State Types - Progress tracking interface from architecture
 * AIDEV-NOTE: progress-state-interface; matches architecture specification exactly
 */

export interface ProgressState {
  chatId: string;
  chatName: string;
  sessionId: string;
  startTime: Date;
  lastUpdate: Date;
  totalFiles: number;
  processedFiles: number;
  successCount: number;
  errorCount: number;
  duplicateCount: number;
  currentBatch: number;
  totalBatches: number;
  status: 'running' | 'completed' | 'interrupted' | 'error';
  lastProcessedFile?: string;
  errors: ErrorRecord[];
}

export interface ErrorRecord {
  id: number;
  sessionId: string;
  filePath: string;
  errorType: string;
  errorMessage: string;
  retryCount: number;
  timestamp: Date;
}

export interface SessionSummary {
  sessionId: string;
  chatId: string;
  chatName: string;
  startTime: Date;
  endTime?: Date;
  duration: number;       // milliseconds
  totalFiles: number;
  successCount: number;
  errorCount: number;
  duplicateCount: number;
  totalSize: number;      // bytes
  averageSpeed: number;   // bytes per second
  status: 'running' | 'completed' | 'interrupted' | 'error';
}