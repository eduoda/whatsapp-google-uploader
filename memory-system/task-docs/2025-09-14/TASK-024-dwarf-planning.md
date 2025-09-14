# TASK-024-dwarf-planning.md
## Per-Chat Media File Analyzer - Planning Document

**Task**: TASK-024 - Per-Chat Media File Analyzer
**Agent**: dwarf
**Started**: 2025-09-14 18:45
**Priority**: 1 (Critical - User Request)

## Context Analysis

### Existing Infrastructure (From TASK-023)
✅ **Available Components**:
- better-sqlite3 package already added
- ChatMetadataExtractor patterns from `src/chat-metadata/`
- Working msgstore.db database access
- Scanner class for file system integration
- Type system established in `src/chat-metadata/types.ts`

### Requirements Understanding
**User wants**: `npm run scanchat --chat="JID"` command that:
1. Analyzes specific chat media files from msgstore.db
2. Extracts file info from messages.data JSON blobs
3. Matches to actual files on filesystem
4. Creates per-chat Google Sheets with upload tracking

### Task Breakdown
- **TASK-024** (this): Chat-specific file analyzer
- **TASK-025**: Per-chat Google Sheets integration
- **TASK-026**: CLI `scanchat` command

## Implementation Strategy

### Phase 1: Database Schema Analysis
**Goal**: Understand msgstore.db structure for media extraction

**Actions**:
1. Examine existing ChatMetadataExtractor database queries
2. Understand messages table schema and data column JSON structure
3. Design SQL queries for chat-specific media message extraction
4. Test with real msgstore.db file

**Expected Outcome**: Clear understanding of data structure and extraction SQL

### Phase 2: ChatFileAnalyzer Class Implementation
**Goal**: Create core analyzer class following established patterns

**Location**: `src/chat-metadata/chat-file-analyzer.ts`

**Architecture Decision**: Separate from ChatMetadataExtractor
- **Why**: Different concern - metadata vs file analysis
- **How**: Follow same patterns (better-sqlite3, error handling)
- **Integration**: Reuse existing database connection approach

**Interface Design** (from spec):
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
  filePath?: string;
  fileExists: boolean;
  actualSize?: number;

  // Upload tracking (for sheets)
  uploadStatus: 'pending' | 'uploaded' | 'failed' | 'skipped';
  uploadDate?: Date;
  uploadError?: string;
  uploadAttempts: number;
  fileDeletedFromPhone: boolean;
}
```

### Phase 3: File System Integration
**Goal**: Match extracted file names to actual WhatsApp files

**Strategy**:
1. Leverage existing Scanner class file discovery patterns
2. Match by filename from messages.data to actual files
3. Handle filename variations and missing files
4. Verify file existence and get actual metadata

### Phase 4: Integration Testing
**Goal**: Verify end-to-end functionality with real data

**Testing Approach**:
1. Use existing decrypted msgstore.db from development
2. Test with known chat JIDs from TASK-023 results
3. Verify file matching accuracy
4. Test error handling (invalid JID, missing files)

## Database Query Strategy

### Core Query Design
Based on TASK-023 patterns, need to:
1. JOIN messages with jid table to get JID strings
2. Filter messages for specific chat JID
3. Extract messages where data contains media information
4. Parse JSON data column for file information

**Expected SQL**:
```sql
SELECT
  m._id as messageId,
  m.timestamp,
  m.data,
  sender.raw_string as senderJid,
  chat.raw_string as chatJid
FROM messages m
JOIN jid chat ON m.key_remote_jid = chat._id
LEFT JOIN jid sender ON m.key_from_me = 0 AND m.remote_resource = sender._id
WHERE chat.raw_string = ?
  AND m.data IS NOT NULL
  AND (m.data LIKE '%fileName%' OR m.data LIKE '%mediaType%')
ORDER BY m.timestamp ASC;
```

## File Changes Plan

### New Files
1. **`src/chat-metadata/chat-file-analyzer.ts`** - Main analyzer class
2. **Update `src/chat-metadata/types.ts`** - Add ChatFileInfo interface

### Modified Files
1. **`src/chat-metadata/index.ts`** - Export ChatFileAnalyzer

### No Changes Needed
- Existing database integration patterns work
- Scanner class already handles file system operations
- better-sqlite3 already configured

## Risk Mitigation

### Technical Risks
1. **msgstore.db Schema Variations**: Handle different WhatsApp versions
   - **Mitigation**: Flexible JSON parsing, graceful error handling
2. **Large Chat Performance**: Thousands of messages could be slow
   - **Mitigation**: Efficient SQL queries, pagination if needed
3. **File Matching Accuracy**: File names might not match exactly
   - **Mitigation**: Use Scanner patterns, handle variations

### Integration Risks
1. **Breaking Changes**: Don't affect existing TASK-023 functionality
   - **Mitigation**: Separate class, careful testing
2. **Database Locking**: Multiple database accesses
   - **Mitigation**: Use readonly connections like TASK-023

## Success Criteria Validation

### Functional Requirements ✅
- [ ] Extract media files for specific chat JID from messages table
- [ ] Read message.data (JSON blob) to get media file information
- [ ] Match file names to actual WhatsApp media files on filesystem
- [ ] Return structured data with file info, message timestamps, senders
- [ ] Handle different media types (photo, video, document, audio)
- [ ] Return empty array for invalid/non-existent JID gracefully

### Technical Requirements ✅
- [ ] Uses existing better-sqlite3 from TASK-023
- [ ] Integrates with existing Scanner file discovery patterns
- [ ] Handles missing database gracefully (throws descriptive error)
- [ ] Thread-safe database access
- [ ] Efficient queries (no N+1 problems)
- [ ] KISS: Focus on file listing, not complex message parsing

### Quality Requirements ✅
- [ ] Clean, readable code with AIDEV- comments
- [ ] Proper error handling and logging
- [ ] Type safety with TypeScript interfaces
- [ ] No breaking changes to existing functionality
- [ ] Follows project conventions

## Time Estimation
- **Phase 1** (Schema Analysis): 30 minutes
- **Phase 2** (ChatFileAnalyzer): 90 minutes
- **Phase 3** (File System Integration): 60 minutes
- **Phase 4** (Testing & Refinement): 45 minutes
- **Total**: ~3.5 hours

## Next Steps
1. Examine existing database access patterns from TASK-023
2. Design and test SQL queries against real msgstore.db
3. Implement ChatFileAnalyzer class following established patterns
4. Test file matching with real WhatsApp media files
5. Prepare for TASK-025 integration (Google Sheets creation)

---
**Planning completed**: 2025-09-14 18:50
**Ready to begin implementation**: Phase 1 - Database Schema Analysis