/**
 * Database package exports
 * AIDEV-NOTE: database-exports; Main exports for database abstraction layer
 */

// Export all types
export * from './types';

// Export interfaces (to be implemented in TASK-008)
export { DatabaseManager } from './manager';
export { DatabaseMigrator } from './migrator';

// Export utilities
export { createConnection, validateConfig } from './utils';

// Export constants
export { SCHEMA_VERSION, DEFAULT_CONFIG } from './constants';