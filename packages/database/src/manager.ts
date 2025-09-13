/**
 * Database Manager Interface
 * AIDEV-NOTE: database-manager-interface; Abstract interface for TASK-008 implementation
 */

import type {
  DatabaseConnection,
  DatabaseConfig,
  UploadSession,
  FileHash,
  UploadError,
  ConfigRecord,
} from './types';

/**
 * Main database manager interface
 * To be implemented in TASK-008 using better-sqlite3
 */
export abstract class DatabaseManager {
  protected connection?: DatabaseConnection;
  protected config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  // Connection management
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract isConnected(): boolean;
  
  // Schema management
  abstract initializeSchema(): Promise<void>;
  abstract getSchemaVersion(): Promise<number>;
  
  // Upload session methods
  abstract createSession(session: Omit<UploadSession, 'id' | 'created_at'>): Promise<string>;
  abstract getSession(sessionId: string): Promise<UploadSession | undefined>;
  abstract updateSession(sessionId: string, updates: Partial<UploadSession>): Promise<void>;
  abstract listSessions(status?: UploadSession['status']): Promise<UploadSession[]>;
  abstract deleteSession(sessionId: string): Promise<void>;
  
  // File hash methods (for deduplication)
  abstract addFileHash(fileHash: FileHash): Promise<void>;
  abstract getFileHash(hash: string): Promise<FileHash | undefined>;
  abstract findFileHashes(chatId: string): Promise<FileHash[]>;
  abstract deleteFileHash(hash: string): Promise<void>;
  abstract isFileUploaded(hash: string): Promise<boolean>;
  
  // Error tracking methods
  abstract logError(error: Omit<UploadError, 'id' | 'timestamp'>): Promise<number>;
  abstract getErrors(sessionId: string): Promise<UploadError[]>;
  abstract incrementRetryCount(errorId: number): Promise<void>;
  abstract clearErrors(sessionId: string): Promise<void>;
  
  // Configuration methods
  abstract setConfig(key: string, value: any): Promise<void>;
  abstract getConfig<T = any>(key: string): Promise<T | undefined>;
  abstract deleteConfig(key: string): Promise<void>;
  abstract listConfig(): Promise<ConfigRecord[]>;
  
  // Transaction support
  abstract transaction<T>(fn: () => Promise<T>): Promise<T>;
  
  // Database maintenance
  abstract vacuum(): Promise<void>;
  abstract analyze(): Promise<void>;
  abstract getStats(): Promise<DatabaseStats>;
}

/**
 * Database statistics interface
 */
export interface DatabaseStats {
  totalSessions: number;
  activeSessions: number;
  totalFiles: number;
  successfulUploads: number;
  failedUploads: number;
  duplicatesFound: number;
  databaseSize: number; // in bytes
  lastVacuum?: string; // ISO timestamp
}