# TASK-027-dwarf-planning.md
## Chat-Specific Upload Command Implementation

**Agent**: dwarf
**Priority**: 1 (Critical - User Request)
**Created**: 2025-09-14
**Branch**: TASK-027-dwarf
**Estimated Time**: 2.5 hours

## Objective
Implement `npm run upload --chat="JID"` command for uploading media files from specific WhatsApp chats in chronological order with real-time Google Sheets progress tracking.

## Current State Analysis

### Infrastructure Ready ✅
- **ChatFileAnalyzer** (TASK-024): Extracts media files for specific chat JID from msgstore.db
- **Per-Chat Google Sheets** (TASK-025): Creates/manages individual sheets for each chat with upload tracking columns
- **UploaderManager**: Working file upload system with Google Photos/Drive integration
- **GoogleApis**: Authenticated Google API access
- **SheetsDatabase**: Working Google Sheets operations

### Missing Components
- **CLI upload command**: Not implemented in CLI application
- **scanchat command** (TASK-026): Incomplete but not required for TASK-027

## Architectural Decision

**SKIP TASK-026 DEPENDENCY**: Following YAGNI principle, implement upload command directly using existing ChatFileAnalyzer and per-chat sheets infrastructure. The `scanchat` command is a convenience wrapper but not essential for core upload functionality.

## Implementation Strategy

### Phase 1: CLI Command Setup (30 minutes)
1. Add `upload` command to CLI application
2. Add JID validation and error handling
3. Add `--skip-failed` option support
4. Add basic dry-run capability for testing

### Phase 2: Chat File Analysis Integration (45 minutes)
1. Use ChatFileAnalyzer to get files for specific chat
2. Sort files chronologically (oldest first)
3. Check per-chat Google Sheets for upload status
4. Filter out already-uploaded files

### Phase 3: Upload Orchestration (60 minutes)
1. Initialize UploaderManager with proper configuration
2. Implement sequential upload loop with progress tracking
3. Update per-chat Google Sheets after each upload
4. Show real-time terminal progress indicators

### Phase 4: Error Handling & Polish (30 minutes)
1. Comprehensive error handling for common scenarios
2. Failed upload retry logic (default behavior)
3. Skip failed files with --skip-failed flag
4. Upload completion summary with statistics

## Technical Implementation Plan

### Required Changes

#### 1. CLI Application Enhancement (`src/cli/cli-application.ts`)
```typescript
// Add after scan command (around line 450)
this.program
  .command('upload')
  .description('Upload media files from specific chat to Google services')
  .requiredOption('--chat <jid>', 'Chat JID to upload files from (e.g., 5511999999999@c.us)')
  .option('--skip-failed', 'Skip files that previously failed to upload')
  .option('--dry-run', 'Preview mode - show files that would be uploaded')
  .action(async (options) => {
    await this.handleUploadCommand(options);
  });
```

#### 2. Upload Command Handler Implementation
```typescript
async handleUploadCommand(options: { chat: string; skipFailed?: boolean; dryRun?: boolean }): Promise<void> {
  // 1. Validate JID format
  // 2. Initialize Google APIs and authenticate
  // 3. Get chat files using ChatFileAnalyzer
  // 4. Sort chronologically (oldest first)
  // 5. Check upload status in per-chat Google Sheets
  // 6. Filter files based on status and options
  // 7. Initialize UploaderManager
  // 8. Sequential upload with progress updates
  // 9. Show completion summary
}
```

### Integration Points

#### ChatFileAnalyzer Integration
```typescript
const { ChatFileAnalyzer } = require('../chat-metadata');
const analyzer = new ChatFileAnalyzer();
const files = await analyzer.analyzeChat(chatJid);
```

#### Per-Chat Sheets Integration
```typescript
const { SheetsDatabase } = require('../database');
const sheetsDb = new SheetsDatabase(googleApis.auth);
await sheetsDb.initializePerChatSheet(chatJid, chatName);
```

#### UploaderManager Integration
```typescript
const { UploaderManager } = require('../uploader');
const uploaderManager = new UploaderManager({ googleApis });
await uploaderManager.initialize();
```

## Expected Output

### Terminal Progress Display
```
Analyzing chat: Maria Silva (5511999999999@c.us)
Found 150 media files from 2023-01-15 to 2024-08-30

Checking upload status in Google Sheets...
- 45 files already uploaded (skipping)
- 12 files previously failed
- 93 files ready for upload

Uploading files chronologically (oldest first):
[1/93] IMG-20230115-WA0001.jpg (2.3 MB) -> Google Photos... ✓ (3.2s)
[2/93] VID-20230116-WA0002.mp4 (15.7 MB) -> Google Photos... ✓ (12.4s)
[3/93] AUD-20230117-WA0003.opus (0.8 MB) -> Google Drive... ✓ (1.1s)
...

Upload Complete!
- Uploaded: 91 files (842.3 MB)
- Skipped (already uploaded): 45 files
- Failed: 2 files
- Total time: 47 minutes

View progress: https://docs.google.com/spreadsheets/d/...
```

### Google Sheets Updates
Each successful upload updates the per-chat sheet row with:
- `upload_status`: "Enviado" (Sent)
- `upload_date`: Current timestamp
- `google_photos_link` / `google_drive_link`: Direct file link
- `error_message`: Cleared on success

## Error Scenarios & Handling

### Common Errors
1. **Invalid JID format**: Clear validation message with examples
2. **Authentication required**: Guide to run `npm run auth`
3. **msgstore.db missing**: Guide to run `npm run decrypt`
4. **No files found**: Check if chat exists, maybe wrong JID
5. **Network/API errors**: Retry with exponential backoff
6. **Upload failures**: Mark in sheets, continue with next file

### Default Behavior (No --skip-failed)
- Retry files marked as "Falha" (failed)
- Skip files marked as "Enviado" (sent)
- Show clear progress for retry attempts

### With --skip-failed Flag
- Skip both "Enviado" (sent) and "Falha" (failed) files
- Only upload files with empty or "Pendente" status

## Quality Requirements

### Code Quality
- Follow existing CLI command patterns
- Add AIDEV- comments for complex logic
- Consistent error handling and user messages
- No breaking changes to existing functionality

### User Experience
- Clear progress indicators with current file and percentage
- Informative error messages with guidance
- Completion summary with statistics and links
- Works reliably with large chat archives (hundreds of files)

### Performance
- Sequential uploads (respects API rate limits)
- Memory efficient (no loading all files at once)
- Progress tracking doesn't slow down uploads significantly

## Testing Strategy

### Manual Testing
1. Test with small chat (5-10 files)
2. Test with large chat (100+ files)
3. Test retry behavior with simulated failures
4. Test --skip-failed flag functionality
5. Test dry-run mode
6. Test various error conditions

### Integration Testing
- Verify Google Sheets updates are atomic and correct
- Verify chronological upload order
- Verify proper file type routing (Photos vs Drive)
- Test authentication and configuration requirements

## Success Criteria

### Functional Requirements ✅
- [ ] Command `npm run upload --chat="JID"` works
- [ ] Files uploaded in chronological order (oldest first)
- [ ] Real-time Google Sheets progress tracking
- [ ] Terminal progress with file names and percentages
- [ ] Skips already-uploaded files with clear messages
- [ ] Retries failed uploads by default
- [ ] --skip-failed flag skips previously failed files
- [ ] Proper error handling continues with next file
- [ ] Upload completion summary with statistics

### Technical Requirements ✅
- [ ] Reuses existing ChatFileAnalyzer, SheetsDatabase, UploaderManager
- [ ] KISS principle - simple integration, no duplicate code
- [ ] Follows project patterns and conventions
- [ ] Memory and performance efficient
- [ ] No workarounds - legitimate file operations

## Implementation Notes

### Development Approach
1. **Build incrementally**: Start with basic command, add features
2. **Test frequently**: Verify each phase works before proceeding
3. **Follow KISS**: Simple, direct integration of existing components
4. **User-first**: Clear messages and progress indicators

### Key Integration Points
- ChatFileAnalyzer returns files with messageTimestamp for chronological sorting
- SheetsDatabase provides per-chat sheet operations
- UploaderManager handles actual file uploads with proper routing
- GoogleApis provides authenticated access to all Google services

**Ready to proceed with implementation using existing infrastructure. TASK-026 dependency bypassed following YAGNI principle.**