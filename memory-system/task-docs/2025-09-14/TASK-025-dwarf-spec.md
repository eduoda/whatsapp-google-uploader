# TASK-025-dwarf-spec.md
## Per-Chat Google Sheets Integration

**Agent**: dwarf
**Priority**: 1 (Critical - User Request)
**Created**: 2025-09-14
**Depends on**: TASK-024 (chat file analyzer)

## Objective
Create per-chat Google Sheets with media file listings and upload tracking columns as requested by user for the `scanchat --chat="JID"` functionality.

## User Requirements
1. Create/update Google Sheets spreadsheet named `/WhatsApp Google Uploader/[chat_name]_[JID]`
2. List all media and files found in the specific chat
3. Include upload tracking columns for file management
4. Provide basic file metadata easily retrievable from msgstore.db
5. Support upload progress tracking and error management

## Technical Architecture (KISS Principle)

### Architecture Decision
- **Decision**: Extend existing SheetsDatabase class with per-chat methods
- **Rationale**: Reuse proven Google Sheets patterns from TASK-023, maintain consistency
- **Implementation**: Add new methods for per-chat sheets without breaking existing functionality
- **Naming**: Use format `[chat_name]_[JID]` to ensure unique sheet names

### Sheet Naming Strategy
```
/WhatsApp Google Uploader/João Silva_5511999999999@c.us
/WhatsApp Google Uploader/Family Group_120363041234567890@g.us
/WhatsApp Google Uploader/Work Team_120363041234567891@g.us
```

## Required Google Sheets Structure

### Sheet Path Format
`/WhatsApp Google Uploader/[chat_name]_[JID]`

### Required Columns (User Specified)
| Column | Portuguese Label | English Description | Data Type | Source |
|--------|-----------------|--------------------|-----------|---------|
| A | id do arquivo | File ID | String | MessageId from db |
| B | nome do arquivo | File name | String | fileName from messages.data |
| C | tipo de arquivo | File type | String | mediaType (photo/video/document/audio) |
| D | tamanho do arquivo | File size | Number | size from filesystem |
| E | data da mensagem | Message date | Date | timestamp from messages |
| F | remetente | Sender | String | senderJid |
| G | status do upload | Upload status | String | pending/uploaded/failed/skipped |
| H | data do upload | Upload date | Date | When successfully uploaded |
| I | arquivo deletado do celular | File deleted from phone | Boolean | Manual tracking flag |
| J | ultima mensagem de erro | Last error message | String | Upload error details |
| K | tentativas de upload | Upload attempt count | Number | Retry counter |
| L | nome do diretorio/album | Directory/album name | String | Target folder/album name |
| M | link para diretorio/album | Directory/album link | URL | Google Drive/Photos link |
| N | link do arquivo/midia | File/media link | URL | Direct file link after upload |

## Interface Design

### PerChatSheetsManager Interface
```typescript
interface PerChatSheetsManager {
  // Main operations
  createOrUpdateChatSheet(chatJid: string, files: ChatFileInfo[]): Promise<string>;
  getChatSheetUrl(chatJid: string): string | null;

  // File tracking
  updateUploadStatus(chatJid: string, fileId: string, status: UploadStatus): Promise<void>;
  markFileUploaded(chatJid: string, fileId: string, uploadInfo: UploadInfo): Promise<void>;
  markFileError(chatJid: string, fileId: string, error: string): Promise<void>;
}

interface UploadInfo {
  uploadDate: Date;
  directoryName: string;
  directoryLink: string;
  fileLink: string;
}

type UploadStatus = 'pending' | 'uploaded' | 'failed' | 'skipped';
```

## Implementation Plan

### Phase 1: SheetsDatabase Extension
1. **Add per-chat methods to SheetsDatabase class**
   ```typescript
   // Extend existing src/database/index.ts
   export class SheetsDatabase {
     // Existing methods...

     // New per-chat methods
     async createChatFileSheet(chatJid: string, chatName: string): Promise<string>;
     async saveChatFiles(chatJid: string, files: ChatFileInfo[]): Promise<void>;
     async updateFileUploadStatus(chatJid: string, fileId: string, status: any): Promise<void>;
     getChatFileSheetUrl(chatJid: string): string | null;
   }
   ```

2. **Sheet creation logic**
   - Generate sheet name from chat name and JID
   - Create folder structure if needed: `/WhatsApp Google Uploader/`
   - Handle special characters in chat names
   - Store sheet ID for future updates

### Phase 2: Column Structure Implementation
1. **Define column headers (Portuguese)**
   ```typescript
   const CHAT_FILE_COLUMNS = [
     'id do arquivo',
     'nome do arquivo',
     'tipo de arquivo',
     'tamanho do arquivo',
     'data da mensagem',
     'remetente',
     'status do upload',
     'data do upload',
     'arquivo deletado do celular',
     'ultima mensagem de erro',
     'tentativas de upload',
     'nome do diretorio/album',
     'link para diretorio/album',
     'link do arquivo/midia'
   ];
   ```

2. **Data transformation logic**
   ```typescript
   function transformChatFileToRow(file: ChatFileInfo): any[] {
     return [
       file.messageId,
       file.fileName,
       file.mediaType,
       file.actualSize || file.size || 0,
       file.messageTimestamp.toISOString(),
       file.senderJid || 'unknown',
       file.uploadStatus,
       file.uploadDate?.toISOString() || '',
       file.fileDeletedFromPhone,
       file.uploadError || '',
       file.uploadAttempts,
       '', // directory name - populated during upload
       '', // directory link - populated during upload
       ''  // file link - populated during upload
     ];
   }
   ```

### Phase 3: Update and Management Logic
1. **Sheet update strategy**
   - Check if sheet exists, create if not
   - Update existing rows by file ID (column A)
   - Add new files to end of sheet
   - Preserve manual edits where possible

2. **Upload tracking integration**
   - Provide methods to update upload status
   - Track upload attempts and errors
   - Link to actual Google Drive/Photos locations

## File Changes Required

### Modified Files
- `src/database/index.ts` - Extend SheetsDatabase with per-chat methods
- `src/chat-metadata/types.ts` - Add PerChatSheetsManager interface

### No New Files Required
- Reuse existing SheetsDatabase infrastructure

## Acceptance Criteria

### Functional Requirements
- [ ] Create sheet at `/WhatsApp Google Uploader/[chat_name]_[JID]`
- [ ] All 14 required columns present with Portuguese labels
- [ ] Populate file data from ChatFileInfo array (from TASK-024)
- [ ] Handle special characters in chat names (sanitize for sheet names)
- [ ] Set default values for upload tracking columns
- [ ] Update existing sheets (don't recreate if exists)
- [ ] Return sheet URL for user feedback

### Technical Requirements
- [ ] Extend existing SheetsDatabase class (no breaking changes)
- [ ] Reuse GoogleApis authentication from existing system
- [ ] Handle Google API rate limits gracefully
- [ ] Efficient batch operations (not one-by-one)
- [ ] Thread-safe operations
- [ ] KISS: Simple sheet structure, no complex formatting

### Quality Requirements
- [ ] Clean, readable code with AIDEV- comments
- [ ] Proper error handling with descriptive messages
- [ ] Type safety with TypeScript interfaces
- [ ] Follows existing project patterns
- [ ] No breaking changes to existing functionality

## Success Metrics
1. **Sheet creation works**: Creates properly named sheet with all columns
2. **Data population accurate**: All file info correctly transferred to sheet
3. **Update functionality**: Can update existing sheets without data loss
4. **Performance acceptable**: Under 5 seconds for typical chat (50-200 files)
5. **Error handling robust**: Graceful failures with helpful error messages

## Dependencies and Blockers

### Dependencies Required
- TASK-024 (ChatFileAnalyzer) - Must be completed first
- ChatFileInfo interface from TASK-024

### Dependencies Met ✅
- SheetsDatabase class (from TASK-023) ✅
- GoogleApis authentication ✅
- Google Sheets API integration ✅

### No Blockers
- All Google Sheets infrastructure exists and working
- Clear requirements and data structure
- Proven patterns from TASK-023 to follow

## Testing Approach
1. **Unit tests**: Mock ChatFileInfo data for sheet creation
2. **Integration tests**: End-to-end with real Google Sheets API
3. **Update tests**: Verify existing sheet updates work correctly
4. **Edge case tests**: Long chat names, special characters, large file lists
5. **Performance tests**: Large chats (500+ files)

## Integration with Future Upload System
This sheet structure is designed to support future upload functionality:
- Upload status tracking ready for integration
- Error message tracking for debugging
- Directory/album linking for organization
- Attempt counting for retry logic

The sheets created by this task will serve as the database for the future upload command implementation.

## Notes
- Following KISS/YAGNI principles - simple sheet structure
- Portuguese column names as specifically requested by user
- Designed for future upload integration but focused on current requirements
- Reuse existing SheetsDatabase patterns for consistency and reliability
- Handle Google API quotas and rate limits gracefully