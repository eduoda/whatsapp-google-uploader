/**
 * Database utility functions
 * AIDEV-NOTE: database-utils; Helper functions for database operations
 */

import type { DatabaseConfig, DatabaseConnection } from './types';
import { DEFAULT_CONFIG } from './constants';

/**
 * Validate database configuration
 */
export function validateConfig(config: Partial<DatabaseConfig>): DatabaseConfig {
  const validated: DatabaseConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Validate path
  if (!validated.path || validated.path.trim() === '') {
    throw new Error('Database path is required');
  }

  // Validate timeout
  if (validated.timeout && validated.timeout < 1000) {
    throw new Error('Database timeout must be at least 1000ms');
  }

  return validated;
}

/**
 * Create database connection (to be implemented in TASK-008)
 */
export function createConnection(config: DatabaseConfig): DatabaseConnection {
  // This will be implemented in TASK-008 using better-sqlite3
  throw new Error('createConnection not yet implemented - see TASK-008');
}

/**
 * Generate UUID for session IDs
 */
export function generateSessionId(): string {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Escape SQL identifier (table/column names)
 */
export function escapeIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

/**
 * Build WHERE clause from object
 */
export function buildWhereClause(conditions: Record<string, any>): { where: string; params: any[] } {
  const entries = Object.entries(conditions).filter(([_, value]) => value !== undefined);
  
  if (entries.length === 0) {
    return { where: '', params: [] };
  }

  const whereParts = entries.map(([key]) => `${escapeIdentifier(key)} = ?`);
  const params = entries.map(([_, value]) => value);

  return {
    where: `WHERE ${whereParts.join(' AND ')}`,
    params,
  };
}

/**
 * Build UPDATE SET clause from object
 */
export function buildUpdateClause(updates: Record<string, any>): { set: string; params: any[] } {
  const entries = Object.entries(updates).filter(([_, value]) => value !== undefined);
  
  if (entries.length === 0) {
    throw new Error('No valid update fields provided');
  }

  const setParts = entries.map(([key]) => `${escapeIdentifier(key)} = ?`);
  const params = entries.map(([_, value]) => value);

  return {
    set: setParts.join(', '),
    params,
  };
}

/**
 * Build INSERT clause from object
 */
export function buildInsertClause(data: Record<string, any>): { 
  columns: string; 
  placeholders: string; 
  params: any[] 
} {
  const entries = Object.entries(data).filter(([_, value]) => value !== undefined);
  
  if (entries.length === 0) {
    throw new Error('No valid insert fields provided');
  }

  const columns = entries.map(([key]) => escapeIdentifier(key)).join(', ');
  const placeholders = entries.map(() => '?').join(', ');
  const params = entries.map(([_, value]) => value);

  return {
    columns,
    placeholders,
    params,
  };
}

/**
 * Convert database row to typed object with proper date handling
 */
export function mapDatabaseRow<T>(row: any): T {
  if (!row) return row;

  const mapped = { ...row };
  
  // Convert timestamp strings to Date objects if needed
  for (const [key, value] of Object.entries(mapped)) {
    if (typeof value === 'string' && 
        (key.includes('time') || key.includes('at') || key === 'timestamp') &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      // Keep as ISO string for consistency
      mapped[key] = value;
    }
  }

  return mapped as T;
}