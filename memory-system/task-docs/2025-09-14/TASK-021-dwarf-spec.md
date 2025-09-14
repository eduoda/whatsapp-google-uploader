# TASK-021-dwarf-spec.md - WhatsApp Database Chat Scanner Enhancement

**Agent**: Dwarf
**Task**: TASK-021 - WhatsApp Database Chat Scanner Enhancement (Phase 2)
**Phase**: Chat-Aware Scanning
**Priority**: 2 (High - Core Feature)
**Depends On**: TASK-020 (Decryption working)

## Objective

Enhance the existing WhatsApp scanner to read chat information from decrypted msgstore.db and associate media files with specific chats/groups, enabling chat-specific organization and uploads.

## Requirements

### Functional Requirements
1. **Backward Compatibility**: Existing scan functionality must continue to work
2. **Chat Detection**: Automatically detect and read msgstore.db when available
3. **File Association**: Map media files to specific chats/groups
4. **Enhanced Output**: Show chat information alongside file listings
5. **Chat Filtering**: Support --chat option to filter by specific chat
6. **Graceful Fallback**: Work normally when msgstore.db is not available

### Non-Functional Requirements
- **Performance**: No significant impact on existing scan speed
- **KISS**: Simple SQLite queries, no complex joins
- **YAGNI**: Only essential chat features, no advanced analysis
- **Reliability**: Handle missing/corrupted database gracefully

## Technical Specifications

### Database Schema Analysis
WhatsApp msgstore.db key tables:
```sql
-- Main message table
messages (
  key_remote_jid TEXT,    -- Chat identifier
  media_name TEXT,        -- Media file name (matches filesystem)
  timestamp INTEGER,
  -- ... other fields
)

-- Media metadata table
message_media (
  file_path TEXT,         -- Relative path to media file
  media_name TEXT,        -- File name
  media_size INTEGER,
  mime_type TEXT,
  -- ... other fields
)

-- Chat information table
chat (
  jid TEXT PRIMARY KEY,   -- Chat identifier
  display_name TEXT,      -- Human-readable chat/group name
  archived INTEGER,
  -- ... other fields
)

-- JID parsing table (for contact resolution)
jid (
  user TEXT,
  server TEXT,
  agent INTEGER,
  device INTEGER,
  type INTEGER,
  -- ... other fields
)
```

### Enhanced Scanner Interface

#### New Types
```typescript
// src/scanner/types.ts
export interface ChatInfo {
  chatId: string;           // jid from database
  displayName: string;      // Human-readable name
  isGroup: boolean;         // Group vs individual chat
  mediaCount: number;       // Number of media files
  lastActivity?: Date;      // Latest message timestamp
}

export interface EnhancedFileInfo extends FileInfo {
  chatId?: string;          // Associated chat ID
  chatName?: string;        // Human-readable chat name
  messageTimestamp?: Date;  // When message was sent
}

export interface ChatScanResult {
  files: EnhancedFileInfo[];
  chats: ChatInfo[];
  hasChatData: boolean;     // Whether msgstore.db was found
  totalFiles: number;
  totalChats: number;
}
```

#### Enhanced Scanner Methods
```typescript
// src/scanner/index.ts - Enhanced WhatsAppScanner
export class WhatsAppScanner {
  // ... existing methods

  /**
   * Scan with chat information (new primary method)
   */
  async scanWithChats(directory?: string): Promise<ChatScanResult> {
    // 1. Run existing file scan
    // 2. Try to find and read msgstore.db
    // 3. Associate files with chats if possible
    // 4. Return enhanced results
  }

  /**
   * Get available chats from database
   */
  async getChats(): Promise<ChatInfo[]> {
    // Read chat information from msgstore.db
  }

  /**
   * Filter files by specific chat
   */
  async scanChatFiles(chatId: string): Promise<EnhancedFileInfo[]> {
    // Get files associated with specific chat
  }
}
```

### Implementation Architecture

#### 1. ChatReader Class
```typescript
// src/scanner/chat-reader.ts
export class ChatReader {
  constructor(private dbPath: string) {}

  async isAvailable(): Promise<boolean> {
    // Check if msgstore.db exists and is readable
  }

  async getChats(): Promise<ChatInfo[]> {
    // Query chat table for all chats with media
  }

  async getFileToChatMapping(): Promise<Map<string, string>> {
    // Create mapping of media file names to chat IDs
    // Join messages and message_media tables
  }

  async getChatInfo(chatId: string): Promise<ChatInfo | null> {
    // Get detailed info for specific chat
  }
}
```

#### 2. ChatMapper Class
```typescript
// src/scanner/chat-mapper.ts
export class ChatMapper {
  constructor(
    private chatReader: ChatReader,
    private fileList: FileInfo[]
  ) {}

  async enhanceFiles(): Promise<EnhancedFileInfo[]> {
    // Add chat information to file listings
  }

  async groupByChat(): Promise<Map<string, EnhancedFileInfo[]>> {
    // Group files by chat ID
  }
}
```

#### 3. Database Query Patterns
```sql
-- Get all chats with media counts
SELECT
  c.jid,
  c.display_name,
  COUNT(m.media_name) as media_count,
  MAX(m.timestamp) as last_activity
FROM chat c
LEFT JOIN messages m ON c.jid = m.key_remote_jid
WHERE m.media_name IS NOT NULL
GROUP BY c.jid, c.display_name;

-- Map media files to chats
SELECT
  m.media_name,
  m.key_remote_jid,
  c.display_name,
  m.timestamp
FROM messages m
JOIN chat c ON m.key_remote_jid = c.jid
WHERE m.media_name IS NOT NULL;
```

### CLI Enhancement

#### Updated Scan Command
```bash
# Basic scan (enhanced with chat info when available)
whatsapp-uploader scan

# Filter by specific chat
whatsapp-uploader scan --chat "Family Group"
whatsapp-uploader scan --chat-id "120363012345678901@g.us"

# List available chats
whatsapp-uploader scan --list-chats

# Show detailed chat information
whatsapp-uploader scan --chat-details
```

#### CLI Implementation
```typescript
// src/cli/cli-application.ts - Enhanced scan command
this.program
  .command('scan')
  .description('Scan WhatsApp directory for media files')
  .argument('[path]', 'Custom WhatsApp path (optional)')
  .option('--chat <name>', 'Filter by chat name')
  .option('--chat-id <id>', 'Filter by specific chat ID')
  .option('--list-chats', 'List available chats')
  .option('--chat-details', 'Show detailed chat information')
  .action(async (customPath, options) => {
    // Enhanced implementation with chat support
  });
```

### Output Format Enhancement

#### Basic Output (with chat info)
```
WhatsApp Media Files:

PHOTOS: 245 files (892.3 MB)
├── Family Group: 89 files (312.1 MB)
├── Work Chat: 67 files (234.5 MB)
├── John Doe: 45 files (156.2 MB)
└── Other/Unknown: 44 files (189.5 MB)

VIDEOS: 67 files (1.2 GB)
├── Family Group: 23 files (456.7 MB)
├── Travel Squad: 18 files (398.2 MB)
└── Other/Unknown: 26 files (345.1 MB)

Total: 312 files across 8 chats (2.1 GB)
```

#### Chat List Output
```
Available Chats:

GROUPS:
├── Family Group (128 media files)
├── Work Team (67 media files)
├── Travel Squad (45 media files)
└── College Friends (23 media files)

INDIVIDUAL CHATS:
├── John Doe (34 media files)
├── Jane Smith (12 media files)
└── Mom (8 media files)

Total: 8 chats, 317 media files
```

#### Chat Details Output
```
Chat Details: Family Group

Type: Group Chat
Participants: 12 members
Media Files: 128 total
├── Photos: 89 files (312.1 MB)
├── Videos: 23 files (456.7 MB)
├── Documents: 12 files (23.4 MB)
└── Audio: 4 files (2.1 MB)

Recent Activity: 2025-09-14 10:30
First Message: 2024-01-15 14:22
```

## Implementation Details

### 1. Database Path Detection
```typescript
// src/scanner/database-finder.ts
export class DatabaseFinder {
  static async findMsgStore(whatsappPath: string): Promise<string | null> {
    const possiblePaths = [
      path.join(whatsappPath, 'Databases', 'msgstore.db'),
      path.join(whatsappPath, '../decrypted/msgstore.db'),
      './decrypted/msgstore.db'
    ];

    for (const dbPath of possiblePaths) {
      try {
        await fs.access(dbPath);
        return dbPath;
      } catch {
        continue;
      }
    }

    return null;
  }
}
```

### 2. SQLite Integration
```typescript
// Use better-sqlite3 for synchronous queries
import Database from 'better-sqlite3';

export class ChatReader {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath, { readonly: true });
  }

  getChats(): ChatInfo[] {
    const stmt = this.db.prepare(`
      SELECT
        c.jid as chatId,
        c.display_name as displayName,
        (c.jid LIKE '%@g.us') as isGroup,
        COUNT(m.media_name) as mediaCount,
        MAX(m.timestamp) as lastActivity
      FROM chat c
      LEFT JOIN messages m ON c.jid = m.key_remote_jid
      WHERE m.media_name IS NOT NULL
      GROUP BY c.jid, c.display_name
      ORDER BY mediaCount DESC
    `);

    return stmt.all() as ChatInfo[];
  }
}
```

### 3. File Association Logic
```typescript
// src/scanner/chat-mapper.ts
export class ChatMapper {
  async enhanceFiles(): Promise<EnhancedFileInfo[]> {
    const fileToChat = await this.chatReader.getFileToChatMapping();

    return this.fileList.map(file => {
      const chatId = fileToChat.get(file.name);
      const chatInfo = chatId ? this.chatReader.getChatInfo(chatId) : null;

      return {
        ...file,
        chatId: chatId || undefined,
        chatName: chatInfo?.displayName || undefined,
        messageTimestamp: chatInfo?.lastActivity || undefined
      } as EnhancedFileInfo;
    });
  }
}
```

## Acceptance Criteria

### Must Pass Tests
- [ ] **Backward Compatibility**: All existing scan tests continue to pass
- [ ] **Chat Detection**: Correctly detects and reads msgstore.db when present
- [ ] **File Association**: Successfully maps media files to correct chats
- [ ] **Chat Listing**: `--list-chats` shows all chats with media counts
- [ ] **Chat Filtering**: `--chat` and `--chat-id` options work correctly
- [ ] **Graceful Fallback**: Works normally when msgstore.db is missing
- [ ] **Performance**: No significant slowdown compared to basic scan
- [ ] **Error Handling**: Clear messages for database issues

### Integration Requirements
- [ ] Enhanced output is properly formatted and readable
- [ ] Works with existing CLI command structure
- [ ] Maintains compatibility with existing scanner API
- [ ] SQLite dependency properly managed

## Testing Strategy

### Unit Tests
```typescript
// tests/chat-reader.test.js
describe('ChatReader', () => {
  it('detects msgstore.db availability correctly');
  it('reads chat information from database');
  it('maps media files to chats correctly');
  it('handles corrupted database gracefully');
});

// tests/enhanced-scanner.test.js
describe('Enhanced Scanner', () => {
  it('maintains backward compatibility');
  it('enhances files with chat information');
  it('filters files by chat correctly');
  it('handles missing database gracefully');
});
```

### Integration Tests
```typescript
describe('CLI scan with chats', () => {
  it('shows enhanced output when database available');
  it('lists chats with --list-chats option');
  it('filters by chat name correctly');
  it('falls back gracefully when no database');
});
```

### Test Data Requirements
- Sample msgstore.db with known chat structure
- Corresponding media files in filesystem
- Mock WhatsApp directory with both encrypted and decrypted databases

## Dependencies

### New Dependencies
```json
{
  "dependencies": {
    "better-sqlite3": "^8.7.0"
  }
}
```

### File Structure
```
src/scanner/
├── index.ts              // Enhanced WhatsAppScanner
├── chat-reader.ts        // SQLite database reader
├── chat-mapper.ts        // File-to-chat association
├── database-finder.ts    // Find msgstore.db path
└── types.ts             // Enhanced type definitions
```

## Performance Considerations

### Database Queries
- Use prepared statements for repeated queries
- Index on frequently queried columns (if possible)
- Limit result sets for large databases
- Cache chat information during scan

### Memory Usage
- Stream large result sets
- Don't load entire database into memory
- Use efficient data structures for mappings

### Caching Strategy
```typescript
// Cache chat information during scan session
private chatCache = new Map<string, ChatInfo>();
private fileMappingCache: Map<string, string> | null = null;

// Invalidate cache if database timestamp changes
```

## Error Handling

### Database Issues
```typescript
interface DatabaseError {
  type: 'MISSING_DB' | 'CORRUPT_DB' | 'READ_ERROR' | 'SCHEMA_MISMATCH';
  message: string;
  fallback: 'FILE_ONLY_MODE' | 'RETRY' | 'ABORT';
}

// Example error handling:
try {
  const chatReader = new ChatReader(dbPath);
  return await this.scanWithChats(chatReader);
} catch (error) {
  console.warn('Chat database unavailable, falling back to file-only mode');
  return this.scanFilesOnly();
}
```

### Common Scenarios
1. **Database missing**: Fall back to existing file-only scanning
2. **Database corrupted**: Show warning, use file-only mode
3. **Schema version mismatch**: Attempt compatibility, warn if features limited
4. **Permission issues**: Clear error message with suggested fix

## Migration Strategy

### Phased Enhancement
1. **Phase 1**: Add chat detection without breaking existing functionality
2. **Phase 2**: Enhance output format while maintaining CLI compatibility
3. **Phase 3**: Add new CLI options for chat-specific features

### Backward Compatibility
- Existing `scan()` method returns same interface
- New `scanWithChats()` method returns enhanced interface
- CLI output enhanced but not breaking for scripts

## Documentation Updates

### README.md Enhancement
```markdown
## Chat-Aware Scanning

After decrypting your WhatsApp backups, the scanner can associate media files with specific chats:

```bash
# Enhanced scan with chat information
whatsapp-uploader scan

# List all chats with media
whatsapp-uploader scan --list-chats

# Scan files from specific chat
whatsapp-uploader scan --chat "Family Group"
```

### CLI Help Updates
Update command help text to include new options and explain chat functionality.

## Success Metrics

- ✅ **Compatibility**: All existing functionality works unchanged
- ✅ **Enhancement**: Chat information correctly displayed when available
- ✅ **Accuracy**: File-to-chat mappings are correct and complete
- ✅ **Usability**: New CLI options are intuitive and helpful
- ✅ **Performance**: No significant impact on scan speed
- ✅ **Reliability**: Graceful handling of various database states

---

**Next Steps**: After completing this enhancement, proceed to TASK-022 for chat-specific upload functionality.