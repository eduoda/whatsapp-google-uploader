# TASK-025-dwarf-planning.md
## Per-Chat Google Sheets Integration - Implementation Plan

**Agent**: dwarf
**Date**: 2025-09-14
**Status**: IN PROGRESS
**Branch**: TASK-025-dwarf

## Objective
Implement per-chat Google Sheets creation with media file listings and upload tracking columns as specified in TASK-025-dwarf-spec.md.

## Dependencies Analysis
✅ **Met Dependencies**:
- TASK-024 (ChatFileAnalyzer) - COMPLETED, provides `ChatFileInfo` interface
- SheetsDatabase class - Working from TASK-023
- GoogleApis authentication - Working
- Google Sheets API integration - Working

❌ **Missing Dependencies**: None

## Implementation Strategy

### Phase 1: Extend SheetsDatabase Class
**Target**: Add per-chat methods to existing `src/database/index.ts`

**New Methods Required**:
```typescript
// Add to SheetsDatabase class
async createChatFileSheet(chatJid: string, chatName: string): Promise<string>
async saveChatFiles(chatJid: string, files: ChatFileInfo[]): Promise<void>
async updateFileUploadStatus(chatJid: string, fileId: string, status: any): Promise<void>
getChatFileSheetUrl(chatJid: string): string | null
```

**Column Structure**:
- 14 columns with Portuguese labels as specified
- Standard data types: String, Number, Date, Boolean, URL
- Default values for upload tracking columns

### Phase 2: Sheet Naming and Creation Logic
**Strategy**:
- Format: `/WhatsApp Google Uploader/[chat_name]_[JID]`
- Sanitize chat names for Google Sheets compatibility
- Handle special characters and length limits
- Create folder structure if needed

**Examples**:
```
/WhatsApp Google Uploader/João Silva_5511999999999@c.us
/WhatsApp Google Uploader/Family Group_120363041234567890@g.us
```

### Phase 3: Data Transformation and Population
**Data Flow**:
```
ChatFileInfo[] → Google Sheets Rows[]
```

**Transformation Logic**:
- Map ChatFileInfo fields to 14 column structure
- Handle missing or null values gracefully
- Convert timestamps to ISO strings
- Set default upload status as 'pending'

### Phase 4: Update Logic
**Strategy**: Update existing sheets without data loss
- Check if sheet exists by name pattern
- Update existing rows by file ID (column A)
- Append new files to end
- Preserve any manual edits in upload tracking columns

## File Changes Required

### Files to Modify
1. **`src/database/index.ts`** - Extend SheetsDatabase class
   - Add per-chat sheet methods
   - Implement 14-column structure
   - Add sheet naming logic

2. **`src/chat-metadata/types.ts`** - Add interfaces
   - PerChatSheetsManager interface
   - UploadInfo interface
   - UploadStatus type

### Files to Read for Context
- `src/chat-metadata/index.ts` - ChatFileAnalyzer interface
- Existing SheetsDatabase implementation patterns

## Implementation Details

### Portuguese Column Headers (Exact)
```typescript
const CHAT_FILE_COLUMNS = [
  'id do arquivo',         // File ID
  'nome do arquivo',       // File name
  'tipo de arquivo',       // File type
  'tamanho do arquivo',    // File size
  'data da mensagem',      // Message date
  'remetente',            // Sender
  'status do upload',     // Upload status
  'data do upload',       // Upload date
  'arquivo deletado do celular', // File deleted from phone
  'ultima mensagem de erro',     // Last error message
  'tentativas de upload',        // Upload attempt count
  'nome do diretorio/album',     // Directory/album name
  'link para diretorio/album',   // Directory/album link
  'link do arquivo/midia'        // File/media link
];
```

### Data Mapping Strategy
```typescript
function transformChatFileToRow(file: ChatFileInfo): any[] {
  return [
    file.messageId,                        // A: id do arquivo
    file.fileName,                         // B: nome do arquivo
    file.mediaType,                        // C: tipo de arquivo
    file.actualSize || file.size || 0,    // D: tamanho do arquivo
    file.messageTimestamp.toISOString(),   // E: data da mensagem
    file.senderJid || 'unknown',          // F: remetente
    'pending',                             // G: status do upload
    '',                                    // H: data do upload
    false,                                 // I: arquivo deletado do celular
    '',                                    // J: ultima mensagem de erro
    0,                                     // K: tentativas de upload
    '',                                    // L: nome do diretorio/album
    '',                                    // M: link para diretorio/album
    ''                                     // N: link do arquivo/midia
  ];
}
```

## Error Handling Strategy
- Graceful Google API error handling
- Rate limit management
- Invalid chat name sanitization
- Missing file data handling
- Network connectivity issues

## Testing Plan
1. **Unit Tests**: Mock ChatFileInfo data transformation
2. **Integration Tests**: Real Google Sheets creation
3. **Update Tests**: Existing sheet modification
4. **Edge Cases**: Special characters, long names, large file lists

## Performance Considerations
- Batch operations for Google Sheets API efficiency
- Rate limit compliance (100 requests/100 seconds per user)
- Memory efficient processing for large chats
- Caching sheet IDs to avoid repeated lookups

## Success Criteria
✅ **Functional**:
- [ ] Creates sheet with correct name format
- [ ] All 14 columns present with Portuguese labels
- [ ] File data correctly populated
- [ ] Update existing sheets without data loss
- [ ] Returns sheet URL

✅ **Technical**:
- [ ] No breaking changes to existing SheetsDatabase
- [ ] Proper error handling
- [ ] TypeScript type safety
- [ ] KISS principle followed

## Risk Assessment
🟢 **Low Risk**:
- Well-defined requirements
- Proven SheetsDatabase patterns to follow
- TASK-024 dependency completed

⚠️ **Medium Risk**:
- Google API rate limits with large chats
- Sheet name sanitization edge cases

## Implementation Notes
- Follow KISS/YAGNI/DRY principles
- Reuse existing GoogleApis authentication
- No complex formatting - simple table structure
- Designed for future upload system integration
- Portuguese labels exactly as specified by user

**Next Steps**:
1. Create branch TASK-025-dwarf
2. Read existing SheetsDatabase implementation
3. Implement per-chat methods
4. Test with real ChatFileInfo data
5. Update session log and complete task