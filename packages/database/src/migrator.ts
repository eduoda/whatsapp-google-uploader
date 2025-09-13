/**
 * Database Migration Interface
 * AIDEV-NOTE: database-migrator-interface; Schema migration system for TASK-008
 */

import type { DatabaseConnection } from './types';

/**
 * Database migration interface
 * To be implemented in TASK-008
 */
export abstract class DatabaseMigrator {
  protected connection: DatabaseConnection;

  constructor(connection: DatabaseConnection) {
    this.connection = connection;
  }

  // Migration management
  abstract getCurrentVersion(): Promise<number>;
  abstract getTargetVersion(): number;
  abstract needsMigration(): Promise<boolean>;
  abstract migrate(): Promise<void>;
  
  // Individual migration steps
  abstract createInitialSchema(): Promise<void>;
  abstract createMigrationTable(): Promise<void>;
  abstract recordMigration(version: number, description: string): Promise<void>;
}

/**
 * Migration definition interface
 */
export interface Migration {
  version: number;
  description: string;
  up: (connection: DatabaseConnection) => Promise<void>;
  down?: (connection: DatabaseConnection) => Promise<void>;
}

/**
 * Schema definitions for better-sqlite3 implementation
 * These will be used in TASK-008
 */
export const SCHEMA_DEFINITIONS = {
  UPLOAD_SESSIONS: `
    CREATE TABLE IF NOT EXISTS upload_sessions (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      chat_name TEXT NOT NULL,
      start_time TIMESTAMP NOT NULL,
      last_update TIMESTAMP NOT NULL,
      total_files INTEGER NOT NULL,
      processed_files INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      error_count INTEGER DEFAULT 0,
      duplicate_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'paused', 'failed')),
      last_processed_file TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  FILE_HASHES: `
    CREATE TABLE IF NOT EXISTS file_hashes (
      hash TEXT PRIMARY KEY,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      upload_service TEXT NOT NULL CHECK (upload_service IN ('photos', 'drive')),
      upload_id TEXT,
      chat_id TEXT NOT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  UPLOAD_ERRORS: `
    CREATE TABLE IF NOT EXISTS upload_errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      error_type TEXT NOT NULL,
      error_message TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES upload_sessions(id) ON DELETE CASCADE
    );
  `,
  
  CONFIG: `
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  SCHEMA_MIGRATIONS: `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      description TEXT
    );
  `,
} as const;

/**
 * Index definitions for performance
 */
export const INDEX_DEFINITIONS = {
  UPLOAD_SESSIONS_STATUS: 'CREATE INDEX IF NOT EXISTS idx_upload_sessions_status ON upload_sessions(status);',
  UPLOAD_SESSIONS_CHAT_ID: 'CREATE INDEX IF NOT EXISTS idx_upload_sessions_chat_id ON upload_sessions(chat_id);',
  FILE_HASHES_CHAT_ID: 'CREATE INDEX IF NOT EXISTS idx_file_hashes_chat_id ON file_hashes(chat_id);',
  FILE_HASHES_SERVICE: 'CREATE INDEX IF NOT EXISTS idx_file_hashes_service ON file_hashes(upload_service);',
  UPLOAD_ERRORS_SESSION_ID: 'CREATE INDEX IF NOT EXISTS idx_upload_errors_session_id ON upload_errors(session_id);',
  UPLOAD_ERRORS_TIMESTAMP: 'CREATE INDEX IF NOT EXISTS idx_upload_errors_timestamp ON upload_errors(timestamp);',
  CONFIG_UPDATED_AT: 'CREATE INDEX IF NOT EXISTS idx_config_updated_at ON config(updated_at);',
} as const;