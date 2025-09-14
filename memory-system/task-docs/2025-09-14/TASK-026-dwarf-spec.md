# TASK-026-dwarf-spec.md
## CLI `scanchat` Command Implementation

**Agent**: dwarf
**Priority**: 1 (Critical - User Request)
**Created**: 2025-09-14
**Depends on**: TASK-024 (chat analyzer), TASK-025 (per-chat sheets)

## Objective
Add `scanchat --chat="JID"` command to CLI that analyzes specific chat and creates/updates its Google Sheets spreadsheet as requested by user.

## User Requirements
1. Command: `npm run scanchat --chat="JID"`
2. Analyze messages from msgstore.db for the specified chat JID
3. Save/update a Google Sheets spreadsheet named `/WhatsApp Google Uploader/[chat_name]_[JID]`
4. List all media and files found in the chat
5. Show progress and provide spreadsheet URL upon completion

## Technical Architecture (KISS Principle)

### Architecture Decision
- **Decision**: Add new CLI command to existing CLIApplication class
- **Rationale**: Maintain consistency with existing CLI structure and patterns
- **Implementation**: Integrate ChatFileAnalyzer and PerChatSheetsManager
- **User Experience**: Simple command interface matching existing patterns

### Command Interface Design
```bash
# Required format (user specified)
npm run scanchat --chat="5511999999999@c.us"
npm run scanchat --chat="120363041234567890@g.us"

# Alternative formats for convenience
npm run scanchat --chat=5511999999999@c.us
whatsapp-uploader scanchat --chat="5511999999999@c.us"
```

## Implementation Plan

### Phase 1: CLI Command Structure
1. **Add scanchat command to CLIApplication**
   ```typescript
   // Extend src/cli/cli-application.ts
   this.program
     .command('scanchat')
     .description('Analyze specific chat and save media files to Google Sheets')
     .requiredOption('--chat <jid>', 'Chat JID to analyze (e.g., 5511999999999@c.us)')
     .action(async (options) => {
       // Implementation here
     });
   ```

2. **Input validation**
   - Validate JID format (basic pattern matching)
   - Check for required --chat parameter
   - Provide helpful error messages for invalid input

### Phase 2: Core Functionality Integration
1. **Chat analysis workflow**
   ```typescript
   async function analyzeChatCommand(chatJid: string): Promise<void> {
     // 1. Initialize components
     const analyzer = new ChatFileAnalyzer();
     const sheetsManager = new SheetsDatabase(auth);

     // 2. Analyze chat
     const files = await analyzer.analyzeChat(chatJid);

     // 3. Get chat name for display
     const chatName = await analyzer.getChatName(chatJid);

     // 4. Save to Google Sheets
     const sheetUrl = await sheetsManager.createOrUpdateChatSheet(chatJid, files);

     // 5. Display results
     displayResults(chatName, files, sheetUrl);
   }
   ```

2. **Progress reporting**
   - Show analysis progress
   - Show Google Sheets creation progress
   - Display final results with sheet URL

### Phase 3: User Experience Design
1. **Console output format**
   ```
   Analyzing chat: João Silva (5511999999999@c.us)

   📱 Extracting messages from msgstore.db...
   ✓ Found 234 messages with media files

   📁 Matching files to filesystem...
   ✓ Found 189 files (45 missing from phone)

   Media breakdown:
   📸 Photos: 156 files (123 MB)
   🎥 Videos: 28 files (456 MB)
   📄 Documents: 5 files (12 MB)
   🎵 Audio: 0 files (0 MB)

   ☁️  Updating Google Sheets...
   ✓ Spreadsheet created/updated successfully

   📊 View results: https://docs.google.com/spreadsheets/d/1ABC.../edit
   ```

2. **Error handling and user guidance**
   - Invalid JID format
   - Chat not found in database
   - Missing msgstore.db file
   - Google authentication issues
   - Google API errors

## CLI Integration Details

### Command Registration
```typescript
// Add to src/cli/cli-application.ts setupProgram()
this.program
  .command('scanchat')
  .description('Analyze specific chat and save media files to Google Sheets')
  .requiredOption('--chat <jid>', 'Chat JID to analyze')
  .option('--dry-run', 'Preview mode - show results without creating sheets')
  .action(async (options) => {
    await this.handleScanchatCommand(options);
  });
```

### Error Handling Strategy
```typescript
try {
  await this.analyzeChatCommand(options.chat);
} catch (error) {
  if (error.message.includes('not found')) {
    console.error(`Chat ${options.chat} not found in database`);
    console.log('Tip: Use "npm run scan" to see all available chats');
  } else if (error.message.includes('msgstore')) {
    console.error('msgstore.db not found. Run "npm run decrypt" first');
  } else {
    console.error('Analysis failed:', error.message);
  }
  process.exit(1);
}
```

## File Changes Required

### Modified Files
- `src/cli/cli-application.ts` - Add scanchat command implementation
- `package.json` - Update scripts section if needed

### No New Files Required
- All functionality provided by TASK-024 and TASK-025

## Acceptance Criteria

### Functional Requirements
- [ ] `npm run scanchat --chat="JID"` command works
- [ ] Accepts chat JID parameter (required)
- [ ] Lists all media files found in that chat with metadata
- [ ] Creates/updates per-chat Google Sheets automatically
- [ ] Shows progress and completion with spreadsheet URL
- [ ] Error handling for invalid JID or missing msgstore.db

### Technical Requirements
- [ ] Integrates ChatFileAnalyzer from TASK-024
- [ ] Integrates per-chat sheets from TASK-025
- [ ] Uses existing GoogleApis authentication
- [ ] Follows existing CLI command patterns
- [ ] Thread-safe operations
- [ ] KISS: Simple command interface, no complex options

### User Experience Requirements
- [ ] Clear progress indicators during analysis
- [ ] Helpful error messages with guidance
- [ ] Final results display with sheet URL
- [ ] Consistent with existing CLI command style
- [ ] Response time under 10 seconds for typical chat

### Quality Requirements
- [ ] Clean, readable code with AIDEV- comments
- [ ] Proper error handling and logging
- [ ] Type safety with TypeScript interfaces
- [ ] No breaking changes to existing CLI commands
- [ ] Follows project conventions

## Success Metrics
1. **Command works end-to-end**: From JID input to Google Sheets creation
2. **User experience smooth**: Clear progress, helpful errors, useful output
3. **Integration seamless**: Works with existing auth and config system
4. **Performance acceptable**: Reasonable response time for various chat sizes
5. **Error handling robust**: Graceful failures with actionable guidance

## Dependencies and Blockers

### Dependencies Required
- TASK-024 (ChatFileAnalyzer) - Must be completed first
- TASK-025 (Per-chat sheets) - Must be completed first

### Dependencies Met ✅
- CLIApplication structure ✅
- GoogleApis authentication ✅
- Commander.js CLI framework ✅
- Existing CLI command patterns ✅

### No Blockers
- All infrastructure components exist
- Clear integration points defined
- Proven patterns to follow

## Testing Approach
1. **Unit tests**: Mock ChatFileAnalyzer and SheetsDatabase for CLI testing
2. **Integration tests**: End-to-end with real msgstore.db and Google Sheets
3. **CLI tests**: Command parsing, option validation, error handling
4. **User scenario tests**: Common use cases and error scenarios
5. **Performance tests**: Various chat sizes and file counts

## User Documentation
The command will be self-documenting through:
- `--help` flag showing usage and options
- Clear error messages with guidance
- Progress indicators showing what's happening
- Final output with actionable results (sheet URL)

## Future Extension Points
This command is designed to be easily extended:
- Optional `--dry-run` flag (already planned)
- Optional filters (by date, file type, etc.)
- Batch processing (multiple chats)
- Integration with future upload commands

## Notes
- Following KISS/YAGNI principles - minimal viable implementation
- Focus on single chat analysis as specifically requested by user
- Designed for future integration with upload functionality
- Maintains consistency with existing CLI architecture
- Portuguese sheet columns as requested in dependencies