# TASK-027-dwarf-spec.md
## Chat-Specific Upload Command Implementation

**Agent**: dwarf
**Priority**: 1 (Critical - User Request)
**Created**: 2025-09-14
**Depends on**: TASK-026 completed ✅ (scanchat working), existing UploaderManager ✅, per-chat sheets ✅

## Objective
Implement `npm run upload --chat="JID"` command that uploads media files from a specific chat in chronological order (oldest first) with real-time Google Sheets progress tracking and terminal progress indicators.

## User Requirements
1. **Command**: `npm run upload --chat="JID"`
2. **File Order**: Upload files chronologically (oldest first)
3. **Google Sheets Integration**: Update per-chat Google Sheets with upload progress in real-time
4. **Terminal Progress**: Show current file being uploaded and overall percentage
5. **Smart Skip**: Skip already-uploaded files with informative message
6. **Error Resilience**: Continue uploading remaining files if one fails

## Technical Architecture (KISS Principle)

### Architecture Decision
- **Reuse Infrastructure**: Leverage existing ChatFileAnalyzer, SheetsDatabase, and UploaderManager
- **Google Sheets as Database**: Use per-chat sheets created by TASK-025/026 for progress tracking
- **Sequential Processing**: Upload files one by one to maintain order and enable proper progress tracking
- **Smart Integration**: Combine chat analysis (TASK-024) with upload orchestration (existing UploaderManager)

### Implementation Strategy
1. **Chat Analysis**: Use ChatFileAnalyzer to get files for specific chat JID
2. **Chronological Sorting**: Sort files by messageTimestamp (oldest first)
3. **Upload Integration**: Use UploaderManager for actual file uploads to Google Photos/Drive
4. **Progress Tracking**: Update per-chat Google Sheet row-by-row as files are uploaded
5. **Terminal UI**: Real-time progress display with file names and percentages

## Required Implementation Components

### CLI Command Structure
```typescript
this.program
  .command('upload')
  .description('Upload media files from specific chat to Google services')
  .requiredOption('--chat <jid>', 'Chat JID to upload files from (e.g., 5511999999999@c.us)')
  .option('--dry-run', 'Preview mode - show files that would be uploaded without actually uploading')
  .action(async (options) => {
    await this.handleUploadCommand(options);
  });
```

### Core Upload Flow
```typescript
async handleUploadCommand(options: { chat: string; dryRun?: boolean }): Promise<void> {
  // 1. Validate JID and authenticate
  // 2. Get chat files using ChatFileAnalyzer
  // 3. Sort files chronologically (oldest first)
  // 4. Filter already-uploaded files
  // 5. Initialize UploaderManager and per-chat sheets
  // 6. Upload files sequentially with progress updates
  // 7. Update Google Sheets after each successful upload
  // 8. Show completion summary with statistics
}
```

### Progress Tracking Integration
- **Google Sheets Updates**: Update upload status, upload date, file links after each upload
- **Terminal Progress**: Show "Uploading file X of Y: filename.jpg (45% complete)"
- **Error Handling**: Mark failed uploads in sheets, continue with next file
- **Skip Logic**: Check Google Sheets upload status before attempting upload

## File Changes Required

### Modified Files
- `src/cli/cli-application.ts` - Add upload command and handler method
- `src/database/index.ts` - Add method to update individual file upload status (if needed)

### No New Files Required
- All infrastructure exists (ChatFileAnalyzer, UploaderManager, SheetsDatabase)
- Reuse existing types and interfaces

## Acceptance Criteria

### Functional Requirements
- [ ] `npm run upload --chat="JID"` command works correctly
- [ ] Validates JID format and provides helpful error messages
- [ ] Gets files for specific chat using existing ChatFileAnalyzer
- [ ] Sorts files chronologically (oldest message timestamp first)
- [ ] Skips already-uploaded files (checks Google Sheets upload status)
- [ ] Shows informative message when files are skipped
- [ ] Uploads files using existing UploaderManager (proper Google Photos/Drive routing)
- [ ] Updates per-chat Google Sheet after each successful upload
- [ ] Shows real-time terminal progress with current file and percentage
- [ ] Handles upload failures gracefully (logs error, continues with next file)
- [ ] Shows completion summary with upload statistics
- [ ] Optional `--dry-run` mode shows what would be uploaded without uploading

### Technical Requirements
- [ ] Reuses existing infrastructure (no duplicate code)
- [ ] Follows KISS principle - simple integration of existing components
- [ ] Proper error handling with user-friendly messages
- [ ] No workarounds - legitimate file uploads and progress tracking
- [ ] Thread-safe operations (sequential processing)
- [ ] Memory efficient (doesn't load all files into memory at once)
- [ ] Respects Google API rate limits (sequential uploads)

### Quality Requirements
- [ ] Clean, readable code with AIDEV- comments
- [ ] Consistent with existing CLI command patterns
- [ ] Comprehensive error messages for common scenarios
- [ ] No breaking changes to existing functionality
- [ ] Follows project conventions and patterns

## Success Metrics
1. **User can run**: `npm run upload --chat="JID"` successfully
2. **Chronological order**: Files uploaded oldest-to-newest based on message timestamp
3. **Progress tracking**: Real-time Google Sheets updates and terminal progress
4. **Smart skipping**: Already-uploaded files are detected and skipped
5. **Error resilience**: Failed uploads don't stop the entire process
6. **Statistics**: Final summary shows uploaded/skipped/failed counts
7. **Integration quality**: Seamlessly works with existing scanchat command

## Implementation Plan

### Phase 1: CLI Command Setup (30 minutes)
1. Add upload command to CLI with proper validation
2. Implement basic command handler with JID validation
3. Add dry-run support for testing

### Phase 2: File Analysis and Sorting (45 minutes)
1. Integrate with ChatFileAnalyzer to get chat files
2. Implement chronological sorting (oldest first)
3. Add upload status checking against Google Sheets

### Phase 3: Upload Integration (60 minutes)
1. Initialize UploaderManager with proper configuration
2. Implement sequential file upload loop
3. Add Google Sheets progress updates after each upload
4. Add terminal progress indicators

### Phase 4: Error Handling and Polish (30 minutes)
1. Comprehensive error handling for common scenarios
2. User-friendly error messages and guidance
3. Upload statistics and completion summary
4. Testing with various edge cases

**Total Estimated Time**: 2.5 hours

## Dependencies and Blockers

### Dependencies Met ✅
- ChatFileAnalyzer (TASK-024) ✅
- Per-chat Google Sheets (TASK-025) ✅
- scanchat command (TASK-026) ✅
- UploaderManager class ✅
- GoogleApis authentication ✅

### No Blockers
- All required infrastructure exists and is tested
- Clear integration points defined
- User requirements are specific and achievable

## Testing Approach
1. **Unit testing**: Mock ChatFileAnalyzer and UploaderManager responses
2. **Integration testing**: Test with small set of actual files
3. **Error testing**: Simulate authentication failures, missing files, upload failures
4. **Progress testing**: Verify Google Sheets updates and terminal output
5. **Dry-run testing**: Ensure no actual uploads occur in dry-run mode

## Expected Integration Points

### With ChatFileAnalyzer (TASK-024)
```typescript
const analyzer = new ChatFileAnalyzer();
const files = await analyzer.analyzeChat(chatJid);
// Sort chronologically: files.sort((a, b) => a.messageTimestamp.getTime() - b.messageTimestamp.getTime())
```

### With UploaderManager (existing)
```typescript
const uploaderManager = new UploaderManager({...});
await uploaderManager.initialize();
const result = await uploaderManager.uploadFiles([fileUpload], {chatId: chatJid});
```

### With Per-Chat Sheets (TASK-025)
```typescript
const sheetsDb = new SheetsDatabase(googleApis.auth);
await sheetsDb.updateChatFileUploadStatus(chatJid, chatName, fileId, 'uploaded', uploadResult);
```

## Notes
- Following KISS/YAGNI principles - reuse all existing infrastructure
- User specifically requested oldest-first chronological order
- Google Sheets are the single source of truth for upload progress
- Terminal progress provides immediate feedback during long upload sessions
- Error resilience ensures partial uploads can be resumed later
- Dry-run mode enables safe testing without actual uploads