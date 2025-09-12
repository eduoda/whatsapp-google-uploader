/**
 * Mock Database for testing
 * AIDEV-NOTE: database-mocks; in-memory SQLite-compatible database for testing
 */

export interface MockTable {
  name: string;
  rows: Map<string, any>;
  schema: Record<string, string>;
  indexes: Map<string, Set<string>>;
}

export interface MockTransaction {
  id: string;
  operations: Array<{ type: 'insert' | 'update' | 'delete'; table: string; data: any }>;
  isActive: boolean;
}

export class MockDatabase {
  private tables: Map<string, MockTable> = new Map();
  private transactions: Map<string, MockTransaction> = new Map();
  private queryLog: string[] = [];
  private shouldFail: boolean = false;
  private failureMessage: string = 'Mock database error';

  constructor() {
    this.createDefaultSchema();
  }

  reset(): void {
    this.tables.clear();
    this.transactions.clear();
    this.queryLog = [];
    this.shouldFail = false;
    this.failureMessage = 'Mock database error';
    this.createDefaultSchema();
  }

  configureFailing(shouldFail: boolean, message: string = 'Mock database error'): void {
    this.shouldFail = shouldFail;
    this.failureMessage = message;
  }

  private createDefaultSchema(): void {
    // Upload sessions table
    this.tables.set('upload_sessions', {
      name: 'upload_sessions',
      rows: new Map(),
      schema: {
        id: 'TEXT PRIMARY KEY',
        chat_id: 'TEXT NOT NULL',
        chat_name: 'TEXT NOT NULL',
        start_time: 'TIMESTAMP NOT NULL',
        last_update: 'TIMESTAMP NOT NULL',
        total_files: 'INTEGER NOT NULL',
        processed_files: 'INTEGER DEFAULT 0',
        success_count: 'INTEGER DEFAULT 0',
        error_count: 'INTEGER DEFAULT 0',
        duplicate_count: 'INTEGER DEFAULT 0',
        status: 'TEXT DEFAULT "running"',
        last_processed_file: 'TEXT',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
      },
      indexes: new Map()
    });

    // File hashes table
    this.tables.set('file_hashes', {
      name: 'file_hashes',
      rows: new Map(),
      schema: {
        hash: 'TEXT PRIMARY KEY',
        file_path: 'TEXT NOT NULL',
        file_name: 'TEXT NOT NULL',
        file_size: 'INTEGER NOT NULL',
        mime_type: 'TEXT NOT NULL',
        upload_service: 'TEXT NOT NULL',
        upload_id: 'TEXT',
        chat_id: 'TEXT NOT NULL',
        uploaded_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
      },
      indexes: new Map()
    });

    // Upload errors table
    this.tables.set('upload_errors', {
      name: 'upload_errors',
      rows: new Map(),
      schema: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        session_id: 'TEXT NOT NULL',
        file_path: 'TEXT NOT NULL',
        error_type: 'TEXT NOT NULL',
        error_message: 'TEXT NOT NULL',
        retry_count: 'INTEGER DEFAULT 0',
        timestamp: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
      },
      indexes: new Map()
    });

    // Config table
    this.tables.set('config', {
      name: 'config',
      rows: new Map(),
      schema: {
        key: 'TEXT PRIMARY KEY',
        value: 'TEXT NOT NULL',
        updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
      },
      indexes: new Map()
    });
  }

  // Execute SQL query
  async run(sql: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> {
    this.queryLog.push(sql);
    
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    const normalizedSql = sql.trim().toLowerCase();

    if (normalizedSql.startsWith('insert')) {
      return this.handleInsert(sql, params);
    } else if (normalizedSql.startsWith('update')) {
      return this.handleUpdate(sql, params);
    } else if (normalizedSql.startsWith('delete')) {
      return this.handleDelete(sql, params);
    } else if (normalizedSql.startsWith('create')) {
      return this.handleCreate(sql, params);
    }

    return { changes: 0 };
  }

  // Get single row
  async get(sql: string, params: any[] = []): Promise<any | undefined> {
    this.queryLog.push(sql);
    
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    const results = await this.all(sql, params);
    return results.length > 0 ? results[0] : undefined;
  }

  // Get all rows
  async all(sql: string, params: any[] = []): Promise<any[]> {
    this.queryLog.push(sql);
    
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    const normalizedSql = sql.trim().toLowerCase();
    
    if (normalizedSql.startsWith('select')) {
      return this.handleSelect(sql, params);
    }

    return [];
  }

  private handleInsert(sql: string, params: any[]): { lastID: number; changes: number } {
    const match = sql.match(/insert\s+into\s+(\w+)/i);
    if (!match) throw new Error('Invalid INSERT statement');

    const tableName = match[1];
    const table = this.tables.get(tableName);
    if (!table) throw new Error(`Table ${tableName} does not exist`);

    // Generate a simple ID for the row
    const id = `${tableName}_${table.rows.size + 1}`;
    
    // For this mock, we'll store the params as the row data
    // In a real implementation, we'd parse the INSERT statement properly
    const rowData: any = { id };
    
    if (params.length > 0) {
      const keys = Object.keys(table.schema);
      params.forEach((param, index) => {
        if (keys[index]) {
          rowData[keys[index]] = param;
        }
      });
    }

    table.rows.set(id, rowData);
    return { lastID: table.rows.size, changes: 1 };
  }

  private handleUpdate(sql: string, params: any[]): { changes: number } {
    const match = sql.match(/update\s+(\w+)/i);
    if (!match) throw new Error('Invalid UPDATE statement');

    const tableName = match[1];
    const table = this.tables.get(tableName);
    if (!table) throw new Error(`Table ${tableName} does not exist`);

    // Simple mock implementation - just update one row
    const keys = Array.from(table.rows.keys());
    if (keys.length > 0) {
      const firstKey = keys[0];
      const row = table.rows.get(firstKey)!;
      
      // Update with new values from params
      if (params.length > 0) {
        const schemaKeys = Object.keys(table.schema);
        params.forEach((param, index) => {
          if (schemaKeys[index]) {
            row[schemaKeys[index]] = param;
          }
        });
      }
      
      return { changes: 1 };
    }

    return { changes: 0 };
  }

  private handleDelete(sql: string, params: any[]): { changes: number } {
    const match = sql.match(/delete\s+from\s+(\w+)/i);
    if (!match) throw new Error('Invalid DELETE statement');

    const tableName = match[1];
    const table = this.tables.get(tableName);
    if (!table) throw new Error(`Table ${tableName} does not exist`);

    const initialSize = table.rows.size;
    
    // For this mock, we'll clear all rows
    // In a real implementation, we'd parse the WHERE clause
    table.rows.clear();

    return { changes: initialSize };
  }

  private handleSelect(sql: string, params: any[]): any[] {
    const match = sql.match(/select\s+.*\s+from\s+(\w+)/i);
    if (!match) throw new Error('Invalid SELECT statement');

    const tableName = match[1];
    const table = this.tables.get(tableName);
    if (!table) throw new Error(`Table ${tableName} does not exist`);

    return Array.from(table.rows.values());
  }

  private handleCreate(sql: string, params: any[]): { changes: number } {
    // For CREATE TABLE statements, we'll just return success
    // The schema is already set up in createDefaultSchema()
    return { changes: 0 };
  }

  // Transaction support
  async beginTransaction(): Promise<string> {
    const transactionId = `tx_${Date.now()}_${Math.random()}`;
    this.transactions.set(transactionId, {
      id: transactionId,
      operations: [],
      isActive: true
    });
    return transactionId;
  }

  async commitTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction || !transaction.isActive) {
      throw new Error('Invalid or inactive transaction');
    }

    // Apply all operations (in this mock, they're already applied)
    transaction.isActive = false;
    this.transactions.delete(transactionId);
  }

  async rollbackTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error('Invalid transaction');
    }

    // For this mock, we don't actually rollback changes
    // In a real implementation, we'd reverse all operations
    transaction.isActive = false;
    this.transactions.delete(transactionId);
  }

  // Utility methods for testing
  getQueryLog(): string[] {
    return [...this.queryLog];
  }

  clearQueryLog(): void {
    this.queryLog = [];
  }

  getTableData(tableName: string): any[] {
    const table = this.tables.get(tableName);
    return table ? Array.from(table.rows.values()) : [];
  }

  insertTestData(tableName: string, data: any[]): void {
    const table = this.tables.get(tableName);
    if (!table) throw new Error(`Table ${tableName} does not exist`);

    data.forEach((row, index) => {
      const id = `${tableName}_${table.rows.size + index + 1}`;
      table.rows.set(id, { ...row, id });
    });
  }

  close(): Promise<void> {
    // Mock database close
    return Promise.resolve();
  }
}

// Export singleton instance
export const mockDatabase = new MockDatabase();

// Factory function for tests
export function createMockDatabase(): MockDatabase {
  return new MockDatabase();
}