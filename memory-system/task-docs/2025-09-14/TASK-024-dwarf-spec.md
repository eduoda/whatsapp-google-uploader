# TASK-024-dwarf-spec.md
## Per-Chat Media File Analyzer

**Agent**: dwarf
**Priority**: 1 (Critical - User Request)
**Created**: 2025-09-14
**Depends on**: TASK-023 (chat metadata working ✅), better-sqlite3 ✅

## Objective
Implement chat-specific media file analysis from msgstore.db messages table for given JID to support per-chat file tracking and upload management.

## User Requirements
1. Analyze messages for a SPECIFIC chat JID from msgstore.db
2. Extract media file information from messages.data JSON blob
3. Match extracted file names to actual WhatsApp media files on filesystem
4. Provide structured data with file metadata, timestamps, and senders
5. Support all media types (photo, video, document, audio)

## Technical Architecture (KISS Principle)

### Architecture Decision
- **Decision**: Create new `ChatFileAnalyzer` class separate from general `ChatMetadataExtractor`
- **Rationale**: Different concerns - metadata extraction vs file analysis for specific chat
- **Implementation**: Extend existing better-sqlite3 pattern from TASK-023
- **Integration**: Work with existing file system scanning from Scanner class

### WhatsApp Database Schema Understanding
Based on msgstore.db structure:
- `messages` table contains media file references in `data` column (JSON blob)
- `jid` table maps JID strings to internal IDs
- `message_media` table (if exists) may contain additional media info

### Expected JSON Structure in messages.data
```json
{
  "mediaType": "photo|video|document|audio",
  "fileName": "IMG-20240101-WA0001.jpg",
  "size": 1024000,
  "mimeType": "image/jpeg",
  "caption": "optional caption"
}
```

## Required Interface Design

### ChatFileInfo Interface
```typescript
interface ChatFileInfo {
  // Database info
  messageId: string;
  chatJid: string;
  senderJid?: string;
  messageTimestamp: Date;

  // File info from messages.data
  fileName: string;
  mediaType: 'photo' | 'video' | 'document' | 'audio';
  size?: number;
  mimeType?: string;
  caption?: string;

  // Filesystem matching
  filePath?: string;  // Full path to actual file (if found)
  fileExists: boolean;
  actualSize?: number;  // Real file size from filesystem

  // Upload tracking (for sheets)
  uploadStatus: 'pending' | 'uploaded' | 'failed' | 'skipped';
  uploadDate?: Date;
  uploadError?: string;
  uploadAttempts: number;
  fileDeletedFromPhone: boolean;
}
```

### ChatFileAnalyzer Class Interface
```typescript
export class ChatFileAnalyzer {
  constructor(dbPath?: string);

  // Main method
  async analyzeChat(chatJid: string): Promise<ChatFileInfo[]>;

  // Helper methods
  private async getMessagesForChat(chatJid: string): Promise<any[]>;
  private extractMediaFromMessage(message: any): ChatFileInfo | null;
  private async matchFileToFilesystem(fileInfo: ChatFileInfo): Promise<ChatFileInfo>;
  private getChatName(chatJid: string): Promise<string>;
}
```

## Implementation Plan

### Phase 1: Database Query Implementation
1. **Create ChatFileAnalyzer class**
   ```typescript
   // File: src/chat-metadata/chat-file-analyzer.ts
   export class ChatFileAnalyzer {
     private db: Database;
     private whatsappPath: string;
   }
   ```

2. **Implement chat-specific message queries**
   ```sql
   -- Get all messages for specific JID with media
   SELECT m.*, j.raw_string as jid_string
   FROM messages m
   JOIN jid j ON m.key_from_me = j._id OR m.key_remote_jid = j._id
   WHERE j.raw_string = ?
   AND m.data IS NOT NULL
   AND m.data LIKE '%fileName%'
   ORDER BY m.timestamp ASC;
   ```

3. **Parse JSON data from messages.data column**
   - Handle different JSON structures across WhatsApp versions
   - Extract media file information safely
   - Handle malformed JSON gracefully

### Phase 2: File System Integration
1. **Implement file matching algorithm**
   - Use existing Scanner class patterns for file discovery
   - Match by filename from messages.data to actual WhatsApp media files
   - Handle filename variations (timestamps, duplicates, etc.)

2. **File existence verification**
   - Check if extracted filename exists in WhatsApp media directories
   - Get actual file size and compare with database info
   - Mark files as missing if not found on filesystem

### Phase 3: Data Structure Assembly
1. **Create ChatFileInfo objects**
   - Combine database info with filesystem info
   - Set default upload tracking values
   - Handle edge cases (missing data, corrupted messages)

2. **Sorting and organization**
   - Sort by message timestamp (chronological order)
   - Group by media type if needed
   - Filter out invalid/corrupted entries

## File Changes Required

### New Files
- `src/chat-metadata/chat-file-analyzer.ts` - Main ChatFileAnalyzer class
- `src/chat-metadata/types.ts` - Update with ChatFileInfo interface

### Modified Files
- `src/chat-metadata/index.ts` - Export ChatFileAnalyzer

## Acceptance Criteria

### Functional Requirements
- [ ] Extract media files for specific chat JID from messages table
- [ ] Read message.data (JSON blob) to get media file information
- [ ] Match file names to actual WhatsApp media files on filesystem
- [ ] Return structured data with file info, message timestamps, senders
- [ ] Handle different media types (photo, video, document, audio)
- [ ] Return empty array for invalid/non-existent JID gracefully

### Technical Requirements
- [ ] Uses existing better-sqlite3 from TASK-023
- [ ] Integrates with existing Scanner file discovery patterns
- [ ] Handles missing database gracefully (throws descriptive error)
- [ ] Thread-safe database access
- [ ] Efficient queries (no N+1 problems)
- [ ] KISS: Focus on file listing, not complex message parsing

### Quality Requirements
- [ ] Clean, readable code with AIDEV- comments
- [ ] Proper error handling and logging
- [ ] Type safety with TypeScript interfaces
- [ ] No breaking changes to existing functionality
- [ ] Follows project conventions

## Success Metrics
1. **Can analyze any valid chat JID**: Returns array of ChatFileInfo objects
2. **File matching works**: At least 80% of files found on filesystem when they exist
3. **Performance acceptable**: Under 2 seconds for typical chat (100-500 messages)
4. **Error handling robust**: Graceful failure modes for all error cases
5. **Data quality high**: Accurate timestamps, file info, and metadata

## Dependencies and Blockers

### Dependencies Met ✅
- better-sqlite3 package (from TASK-023) ✅
- ChatMetadataExtractor patterns ✅
- Scanner file discovery patterns ✅
- msgstore.db decryption (from TASK-020) ✅

### New Dependencies
- None - reuses existing infrastructure

### No Blockers
- All required components exist and working
- Clear database schema understanding
- Well-defined scope and requirements

## Testing Approach
1. **Unit tests**: Mock database with known chat data
2. **Integration tests**: Real msgstore.db file from decryption
3. **File matching tests**: Verify filesystem matching accuracy
4. **Edge case tests**: Invalid JID, missing files, corrupted data
5. **Performance tests**: Large chats (1000+ messages)

## Notes
- Following KISS/YAGNI principles - focus only on file extraction
- Reuse existing infrastructure patterns from TASK-023
- Prepare data structure for Google Sheets integration in TASK-025
- Handle WhatsApp database schema variations gracefully
- Performance considerations for large chats (thousands of messages)