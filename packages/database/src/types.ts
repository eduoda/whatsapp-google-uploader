/**
 * Database types and interfaces for WhatsApp Google Uploader
 * AIDEV-NOTE: database-types; Core database interface definitions using better-sqlite3
 */

// Re-export better-sqlite3 types for convenience
import type Database from 'better-sqlite3';

export type { Database };

/**
 * Core database connection interface
 * Wraps better-sqlite3 with our domain-specific methods
 */
export interface DatabaseConnection {
  /** Execute SQL with parameters, returns run result */
  run(sql: string, params?: any[]): RunResult;
  
  /** Get single row from database */
  get<T = any>(sql: string, params?: any[]): T | undefined;
  
  /** Get all matching rows from database */
  all<T = any>(sql: string, params?: any[]): T[];
  
  /** Prepare a statement for reuse */
  prepare(sql: string): PreparedStatement;
  
  /** Execute multiple statements in a transaction */
  transaction<T>(fn: () => T): T;
  
  /** Close database connection */
  close(): void;
  
  /** Get underlying better-sqlite3 database instance */
  getDatabase(): Database.Database;
}

/**
 * Result of a run() operation
 */
export interface RunResult {
  /** ID of last inserted row */
  lastInsertRowid: number;
  
  /** Number of rows affected by the statement */
  changes: number;
}

/**
 * Prepared statement interface
 */
export interface PreparedStatement {
  /** Execute prepared statement, returns run result */
  run(params?: any[]): RunResult;
  
  /** Get single row using prepared statement */
  get<T = any>(params?: any[]): T | undefined;
  
  /** Get all rows using prepared statement */
  all<T = any>(params?: any[]): T[];
  
  /** Finalize prepared statement */
  finalize(): void;
}

/**
 * Database configuration options
 */
export interface DatabaseConfig {
  /** Path to database file */
  path: string;
  
  /** Whether to enable WAL mode (default: true) */
  enableWAL?: boolean;
  
  /** Whether to enable foreign keys (default: true) */
  enableForeignKeys?: boolean;
  
  /** Timeout for database operations in milliseconds (default: 5000) */
  timeout?: number;
  
  /** Whether database is read-only (default: false) */
  readonly?: boolean;
  
  /** Whether to create database if it doesn't exist (default: true) */
  create?: boolean;
}

/**
 * Upload session record
 */
export interface UploadSession {
  id: string;
  chat_id: string;
  chat_name: string;
  start_time: string; // ISO timestamp
  last_update: string; // ISO timestamp
  total_files: number;
  processed_files: number;
  success_count: number;
  error_count: number;
  duplicate_count: number;
  status: 'running' | 'completed' | 'paused' | 'failed';
  last_processed_file?: string;
  created_at: string; // ISO timestamp
}

/**
 * File hash record for deduplication
 */
export interface FileHash {
  hash: string; // SHA-256 hash (primary key)
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  upload_service: 'photos' | 'drive';
  upload_id?: string; // Service-specific upload ID
  chat_id: string;
  uploaded_at: string; // ISO timestamp
}

/**
 * Upload error record
 */
export interface UploadError {
  id: number; // Auto-increment primary key
  session_id: string;
  file_path: string;
  error_type: string;
  error_message: string;
  retry_count: number;
  timestamp: string; // ISO timestamp
}

/**
 * Configuration record
 */
export interface ConfigRecord {
  key: string; // Primary key
  value: string; // JSON string
  updated_at: string; // ISO timestamp
}

/**
 * Database schema version info
 */
export interface SchemaVersion {
  version: number;
  applied_at: string; // ISO timestamp
  description?: string;
}