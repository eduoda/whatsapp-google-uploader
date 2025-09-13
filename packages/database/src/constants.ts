/**
 * Database constants
 * AIDEV-NOTE: database-constants; Configuration and schema constants
 */

import type { DatabaseConfig } from './types';

/** Current database schema version */
export const SCHEMA_VERSION = 1;

/** Default database configuration */
export const DEFAULT_CONFIG: Required<DatabaseConfig> = {
  path: ':memory:', // Will be overridden with actual path
  enableWAL: true,
  enableForeignKeys: true,
  timeout: 5000,
  readonly: false,
  create: true,
};

/** Database file extension */
export const DB_EXTENSION = '.db';

/** Default database name */
export const DEFAULT_DB_NAME = 'whatsapp-uploader.db';

/** SQL pragmas for performance and reliability */
export const PRAGMAS = {
  WAL_MODE: 'PRAGMA journal_mode = WAL;',
  FOREIGN_KEYS: 'PRAGMA foreign_keys = ON;',
  SYNCHRONOUS_NORMAL: 'PRAGMA synchronous = NORMAL;',
  TEMP_STORE_MEMORY: 'PRAGMA temp_store = MEMORY;',
  MMAP_SIZE: 'PRAGMA mmap_size = 268435456;', // 256MB
  CACHE_SIZE: 'PRAGMA cache_size = -64000;', // 64MB
} as const;