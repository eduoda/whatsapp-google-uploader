# TASK-023-dwarf-spec.md
## Chat Metadata Google Sheets Integration

**Agent**: dwarf
**Priority**: 1 (Critical - User Request)
**Created**: 2025-09-14
**Depends on**: Working GoogleApis ✅, SheetsDatabase ✅, WhatsAppDecryptor ✅

## Objective
Enhance the existing `npm run scan` command to save/sync WhatsApp chat metadata to Google Sheets at path `/WhatsApp Google Uploader/chats` as requested by user.

## User Requirements (Updated Based on Feedback)
1. `npm run scan` command should save data to Google Sheets **BY DEFAULT**
2. Google Sheets path: `/WhatsApp Google Uploader/chats`
3. Read WhatsApp chats from msgstore.db
4. Extract chat metadata (names, JIDs, etc.) from msgstore.db
5. Add `--dry-run` flag to **SKIP** Google Sheets saving (for testing/preview)

## Technical Architecture (KISS Principle)

### Architecture Decision (UPDATED)
- **Decision**: Make Google Sheets saving the DEFAULT behavior for `scan` command
- **Rationale**: Even simpler - Google Sheets saving is the primary use case, no flags needed for normal operation
- **Alternative**: Add `--dry-run` flag to skip saving when testing
- **Previous decision rejected**: `--save-to-sheets` flag was unnecessarily complex

### Implementation Approach (UPDATED)
1. **Default Behavior**: Google Sheets saving is the standard behavior of scan command
2. **Optional Dry-Run**: Add `--dry-run` flag to skip Google Sheets saving
3. **Reuse Existing**: Leverage current GoogleApis and SheetsDatabase classes
4. **SQLite Integration**: Add better-sqlite3 for msgstore.db reading
5. **Graceful Degradation**: Work without msgstore.db (show warning)

## Required Google Sheets Structure

### Sheet Name
`/WhatsApp Google Uploader/chats`

### Required Columns (Portuguese as requested)
| Column | English Description | Portuguese Label | Data Type |
|--------|---------------------|------------------|-----------|
| A | Chat name | nome do chat | String |
| B | Chat JID | jid do chat | String |
| C | Chat type | tipo do chat | String (individual/group) |
| D | Database date | data do msgstore.db | Date |
| E | Last sync date | data da ultima sincronizacao | Date |
| F | Last uploaded file | ultimo arquivo enviado | String |
| G | Synced files count | quantidade de arquivos sincronizados ate o momento | Number |
| H | Failed uploads count | quantidade de arquivos que falharam no upload | Number |
| I | Google Photos album name | nome do album do google photos | String |
| J | Google Photos album link | link para album do google photos | URL |
| K | Google Drive directory name | nome do diretorio do google drive | String |
| L | Google Drive directory link | link para diretorio do google drive | URL |
| M | Sync enabled flag | flag para saber se o grupo chat deve ou nao ser sincronizado | Boolean |
| N | Max media age | idade maxima dos arquivos de midia para se manter no celular | Number (days) |

## Implementation Plan

### Phase 1: Dependencies and Database Reading
1. **Add better-sqlite3 dependency**
   ```bash
   npm install better-sqlite3
   npm install --save-dev @types/better-sqlite3
   ```

2. **Create ChatMetadata interface**
   ```typescript
   interface ChatMetadata {
     chatJid: string;
     chatName: string;
     chatType: 'individual' | 'group';
     msgstoreDate: Date;
     lastSyncDate?: Date;
     lastUploadedFile?: string;
     syncedFilesCount: number;
     failedUploadsCount: number;
     photosAlbumName?: string;
     photosAlbumLink?: string;
     driveDirectoryName?: string;
     driveDirectoryLink?: string;
     syncEnabled: boolean;
     maxMediaAgeDays: number;
   }
   ```

3. **Create ChatMetadataExtractor class**
   - Read from `./decrypted/msgstore.db` (created by decrypt command)
   - Extract from tables: `chat`, `jid`, `message` (for message counts)
   - Handle missing database gracefully

### Phase 2: Google Sheets Integration
1. **Extend SheetsDatabase class**
   - Add `createChatMetadataSheet()` method
   - Add `saveChatMetadata()` method
   - Create sheet at Google Drive path: `/WhatsApp Google Uploader/chats`

2. **Integration with existing GoogleApis**
   - Reuse authentication
   - Create folder structure if needed

### Phase 3: CLI Integration (UPDATED)
1. **Enhance scan command with default Google Sheets saving**
   - Make Google Sheets saving the DEFAULT behavior
   - Add `--dry-run` flag to SKIP Google Sheets saving (for testing)
   - Keep existing file listing functionality
   - Usage: `npm run scan` (saves to sheets) or `npm run scan --dry-run` (preview only)

2. **Error handling**
   - Graceful failure when msgstore.db missing
   - Clear user messages for missing dependencies
   - Preserve file listing functionality even if sheets save fails

## File Changes Required

### New Files
- `src/chat-metadata/index.ts` - ChatMetadataExtractor class
- `src/chat-metadata/types.ts` - ChatMetadata interface

### Modified Files (UPDATED)
- `package.json` - Add better-sqlite3 dependency
- `src/cli/cli-application.ts` - Make Google Sheets saving default, add --dry-run flag
- `src/database/index.ts` - Extend SheetsDatabase with chat metadata methods

## Acceptance Criteria

### Functional Requirements (UPDATED)
- [ ] `npm run scan` saves to Google Sheets BY DEFAULT (new primary behavior)
- [ ] `npm run scan --dry-run` skips Google Sheets saving (preview/testing mode)
- [ ] Extracts chat names, JIDs, types from msgstore.db
- [ ] Creates sheet at path `/WhatsApp Google Uploader/chats`
- [ ] All 14 required columns present with Portuguese labels
- [ ] Handles missing msgstore.db gracefully (shows warning, continues)
- [ ] Populates basic chat data from database
- [ ] Sets default values for upload tracking columns (zeros/nulls)
- [ ] Sets reasonable defaults: syncEnabled=true, maxMediaAgeDays=90
- [ ] Preserves file listing functionality in both modes

### Technical Requirements (UPDATED)
- [ ] Uses better-sqlite3 for msgstore.db reading
- [ ] Reuses existing GoogleApis authentication
- [ ] Follows KISS principle - simpler with default behavior
- [ ] Error handling doesn't break file listing functionality
- [ ] No workarounds - legitimate SQLite database reading
- [ ] Thread-safe database access
- [ ] `--dry-run` flag cleanly skips only the Google Sheets operations

### Quality Requirements
- [ ] Clean, readable code with AIDEV- comments
- [ ] Proper error messages for users
- [ ] No breaking changes to existing functionality
- [ ] Follows project conventions and patterns

## Success Metrics (UPDATED)
1. **User can run**: `npm run scan` (saves to Google Sheets by default)
2. **User can test**: `npm run scan --dry-run` (preview without saving)
3. **Google Sheets created**: At specified path with all columns
4. **Data populated**: From msgstore.db when available
5. **File listing preserved**: Shows WhatsApp media files in both modes
6. **Graceful degradation**: Works without msgstore.db

## Dependencies and Blockers

### Dependencies Met ✅
- GoogleApis class (authentication) ✅
- SheetsDatabase class (sheets operations) ✅
- WhatsAppDecryptor (creates msgstore.db) ✅
- Existing scan command ✅

### New Dependencies
- better-sqlite3 package (will be added)
- @types/better-sqlite3 (will be added)

### No Blockers
- All infrastructure exists
- Clear requirements
- Well-defined scope

## Testing Approach (UPDATED)
1. **Unit tests**: ChatMetadataExtractor with mock database
2. **Integration tests**: End-to-end with real msgstore.db file
3. **CLI tests**: Verify both default behavior and --dry-run flag
4. **Default behavior**: Test Google Sheets creation and population
5. **Dry-run mode**: Test that Google Sheets operations are skipped

## Notes (UPDATED)
- Following KISS/YAGNI principles - even simpler with default behavior
- Google Sheets saving as primary use case (no flags needed for normal operation)
- `--dry-run` flag for testing/preview scenarios
- Portuguese column labels as specifically requested by user
- Graceful degradation ensures robustness
- Reuse existing infrastructure minimizes complexity