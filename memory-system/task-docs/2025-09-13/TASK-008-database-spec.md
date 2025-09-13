# TASK-008-database-spec.md

## Task: Database Schema and Migrations (Updated for better-sqlite3)

### Overview
Design and implement a complete database layer using better-sqlite3 for progress tracking, deduplication, and error handling in the WhatsApp Google Uploader system.

### Dependencies
- **TASK-011**: SQLite3 to better-sqlite3 migration (completed) ✓
- **TASK-001**: Architecture approval (completed) ✓
- **TASK-010**: Project structure (completed) ✓

### Technology Stack
- **Database Engine**: better-sqlite3 v9.0.0+
- **Language**: TypeScript with strict typing
- **Package**: `@whatsapp-uploader/database`
- **Location**: `/packages/database/`

### Architecture Requirements

#### Core Components
1. **DatabaseManager**: Main database interface implementation
2. **DatabaseMigrator**: Schema migration system
3. **Connection Management**: better-sqlite3 connection wrapper
4. **Type Safety**: Full TypeScript integration

#### Database Schema (Version 1)

##### Tables:
1. **upload_sessions**
   ```sql
   CREATE TABLE upload_sessions (
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
   ```

2. **file_hashes** (deduplication)
   ```sql
   CREATE TABLE file_hashes (
     hash TEXT PRIMARY KEY, -- SHA-256
     file_path TEXT NOT NULL,
     file_name TEXT NOT NULL,
     file_size INTEGER NOT NULL,
     mime_type TEXT NOT NULL,
     upload_service TEXT NOT NULL CHECK (upload_service IN ('photos', 'drive')),
     upload_id TEXT, -- Service-specific ID
     chat_id TEXT NOT NULL,
     uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

3. **upload_errors** (retry logic)
   ```sql
   CREATE TABLE upload_errors (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     session_id TEXT NOT NULL,
     file_path TEXT NOT NULL,
     error_type TEXT NOT NULL,
     error_message TEXT NOT NULL,
     retry_count INTEGER DEFAULT 0,
     timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (session_id) REFERENCES upload_sessions(id) ON DELETE CASCADE
   );
   ```

4. **config** (application settings)
   ```sql
   CREATE TABLE config (
     key TEXT PRIMARY KEY,
     value TEXT NOT NULL, -- JSON string
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

5. **schema_migrations** (version tracking)
   ```sql
   CREATE TABLE schema_migrations (
     version INTEGER PRIMARY KEY,
     applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     description TEXT
   );
   ```

##### Indexes (for performance):
```sql
CREATE INDEX idx_upload_sessions_status ON upload_sessions(status);
CREATE INDEX idx_upload_sessions_chat_id ON upload_sessions(chat_id);
CREATE INDEX idx_file_hashes_chat_id ON file_hashes(chat_id);
CREATE INDEX idx_file_hashes_service ON file_hashes(upload_service);
CREATE INDEX idx_upload_errors_session_id ON upload_errors(session_id);
CREATE INDEX idx_upload_errors_timestamp ON upload_errors(timestamp);
CREATE INDEX idx_config_updated_at ON config(updated_at);
```

### Implementation Requirements

#### 1. DatabaseConnection Implementation
Create a wrapper around better-sqlite3 that implements the `DatabaseConnection` interface:

```typescript
// packages/database/src/connection.ts
export class SqliteConnection implements DatabaseConnection {
  private db: Database.Database;
  
  constructor(config: DatabaseConfig);
  
  // Implement all interface methods
  run(sql: string, params?: any[]): RunResult;
  get<T = any>(sql: string, params?: any[]): T | undefined;
  all<T = any>(sql: string, params?: any[]): T[];
  prepare(sql: string): PreparedStatement;
  transaction<T>(fn: () => T): T;
  close(): void;
  getDatabase(): Database.Database;
}
```

#### 2. DatabaseManager Implementation
Implement the abstract `DatabaseManager` class with all required methods:

- **Connection management**: connect(), disconnect(), isConnected()
- **Schema management**: initializeSchema(), getSchemaVersion()
- **Session operations**: CRUD operations for upload sessions
- **File hash operations**: Deduplication through SHA-256 hashes
- **Error tracking**: Log and track upload errors with retry counts
- **Configuration**: Key-value configuration storage
- **Transactions**: Safe multi-operation transactions
- **Maintenance**: vacuum(), analyze(), getStats()

#### 3. DatabaseMigrator Implementation
Create a migration system that:
- Tracks schema versions
- Applies migrations in order
- Supports rollbacks (optional)
- Creates initial schema on first run

#### 4. Performance Optimizations
- **WAL Mode**: Enable WAL (Write-Ahead Logging) for better concurrency
- **Pragmas**: Set optimal SQLite pragmas for performance
- **Connection Pooling**: Single connection with synchronous operations
- **Prepared Statements**: Reuse prepared statements for common operations

### Configuration

#### Database Configuration Options:
```typescript
interface DatabaseConfig {
  path: string;                    // Database file path
  enableWAL?: boolean;            // Enable WAL mode (default: true)
  enableForeignKeys?: boolean;    // Enable FK constraints (default: true) 
  timeout?: number;               // Operation timeout (default: 5000ms)
  readonly?: boolean;             // Read-only mode (default: false)
  create?: boolean;               // Create if missing (default: true)
}
```

#### Default Pragmas:
```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;
PRAGMA temp_store = MEMORY;
PRAGMA mmap_size = 268435456; -- 256MB
PRAGMA cache_size = -64000;   -- 64MB
```

### Usage Examples

#### Basic Usage:
```typescript
import { DatabaseManager, validateConfig } from '@whatsapp-uploader/database';

const config = validateConfig({
  path: './data/whatsapp-uploader.db'
});

const db = new DatabaseManager(config);
await db.connect();
await db.initializeSchema();

// Create upload session
const sessionId = await db.createSession({
  chat_id: 'chat123',
  chat_name: 'Family Photos',
  start_time: new Date().toISOString(),
  last_update: new Date().toISOString(),
  total_files: 100,
});

// Check for duplicates
const isDuplicate = await db.isFileUploaded('sha256-hash');

// Track errors
await db.logError({
  session_id: sessionId,
  file_path: '/path/to/file.jpg',
  error_type: 'UPLOAD_FAILED',
  error_message: 'Network timeout',
  retry_count: 0,
});
```

#### Transaction Example:
```typescript
await db.transaction(async () => {
  await db.addFileHash({
    hash: 'sha256-hash',
    file_path: '/path/to/file.jpg',
    file_name: 'photo.jpg',
    file_size: 1024000,
    mime_type: 'image/jpeg',
    upload_service: 'photos',
    upload_id: 'photos-id-123',
    chat_id: 'chat123',
    uploaded_at: new Date().toISOString(),
  });
  
  await db.updateSession(sessionId, {
    processed_files: 1,
    success_count: 1,
    last_update: new Date().toISOString(),
  });
});
```

### Testing Requirements

#### Unit Tests:
- [ ] DatabaseConnection wrapper functionality
- [ ] DatabaseManager all operations
- [ ] DatabaseMigrator schema management
- [ ] Utility functions
- [ ] Error handling
- [ ] Transaction rollback

#### Integration Tests:
- [ ] Full database lifecycle (create, migrate, use, close)
- [ ] Concurrent operation handling
- [ ] Large dataset performance
- [ ] Cross-platform compatibility (Windows, macOS, Linux, Termux)

#### Performance Tests:
- [ ] Insert performance (1000+ records)
- [ ] Query performance with indexes
- [ ] Transaction performance
- [ ] Database size optimization

### Cross-Platform Considerations

#### Termux/Android:
- better-sqlite3 compiles correctly on ARM
- Database path should be in app data directory
- Handle filesystem permissions

#### Windows:
- Handle path separators correctly
- Test with Windows Defender real-time scanning

#### macOS/Linux:
- Standard Unix filesystem behavior
- Handle case-sensitive filesystems

### Error Handling

#### Database Errors:
- Connection failures
- Disk space issues
- Corruption detection
- Migration failures

#### Recovery Strategies:
- Automatic reconnection
- Database repair options
- Backup/restore functionality

### Success Criteria

1. **Full Implementation**: All abstract methods implemented
2. **Type Safety**: Complete TypeScript coverage
3. **Cross-Platform**: Works on all target platforms
4. **Performance**: Sub-10ms queries for typical operations
5. **Reliability**: Handles edge cases and errors gracefully
6. **Test Coverage**: >90% test coverage
7. **Documentation**: Complete API documentation

### Deliverables

1. **Core Implementation**:
   - `connection.ts` - better-sqlite3 wrapper
   - `manager.ts` - DatabaseManager implementation
   - `migrator.ts` - Migration system

2. **Tests**:
   - Unit tests for all components
   - Integration tests
   - Performance benchmarks

3. **Documentation**:
   - API reference
   - Usage examples
   - Migration guide

4. **Configuration**:
   - Default configurations
   - Environment-specific settings

### Integration Points

#### Proxy Library (TASK-006):
The proxy library will use this database layer for:
- Upload session management
- File deduplication
- Error tracking and retry logic
- Progress persistence

#### CLI Application (TASK-007):
The CLI will use database for:
- Session status reporting
- Error log display
- Configuration management

---

*Created: 2025-09-13*  
*Updated for better-sqlite3 migration*  
*Ready for implementation*