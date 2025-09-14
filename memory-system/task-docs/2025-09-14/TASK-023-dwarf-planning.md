# Task Planning Document

## 📋 Task Information
- **Task ID**: TASK-023
- **Date**: 2025-09-14 14:30
- **Agent**: dwarf
- **Priority**: HIGH (1 - Critical User Request)
- **Estimated Time**: 2-3 hours
- **Related Issue/TODO**: Chat Metadata Google Sheets Integration

## 🎯 Task Description
Enhance the existing `npm run scan` command to save WhatsApp chat metadata to Google Sheets BY DEFAULT with optional --dry-run flag. Make Google Sheets saving the primary behavior (no flags needed), and add --dry-run to skip saving for testing.

## 🔍 Root Cause Analysis
- **Symptom**: User wants to track WhatsApp chat metadata in Google Sheets
- **Root Cause**: Current scan command only lists files, doesn't extract or persist chat information
- **Proper Fix**: Integrate chat metadata extraction from msgstore.db with Google Sheets persistence using existing infrastructure

## 📊 Current State Analysis
### What Currently Exists
- ✅ Working `scan` command that lists WhatsApp media files
- ✅ GoogleApis class with authentication and sheets operations
- ✅ SheetsDatabase class for Google Sheets CRUD operations
- ✅ WhatsApp decrypt command that creates msgstore.db
- ✅ Existing CLI infrastructure with Commander.js

### Dependencies
- ✅ GoogleApis authentication working
- ✅ SheetsDatabase operations working
- ✅ msgstore.db files created by decrypt command
- ❌ better-sqlite3 package (needs to be added)
- ❌ Chat metadata extraction logic (needs to be built)

## 🏗️ Detailed Plan

### Step 1: Add Dependencies and Infrastructure
**Objective**: Set up better-sqlite3 and create chat metadata types/interfaces
**Actions**:
1. Add better-sqlite3 and @types/better-sqlite3 to package.json
2. Install dependencies
3. Create ChatMetadata interface with all 14 required fields
4. Create ChatMetadataExtractor class structure

**Files to Modify/Create**:
- `package.json` - Add better-sqlite3 dependencies
- `src/chat-metadata/types.ts` - ChatMetadata interface
- `src/chat-metadata/index.ts` - ChatMetadataExtractor class skeleton

**Estimated Time**: 30 minutes

### Step 2: Implement Chat Metadata Extraction
**Objective**: Build logic to read msgstore.db and extract chat information
**Actions**:
1. Implement ChatMetadataExtractor.extractChatMetadata() method
2. Query msgstore.db for chat names, JIDs, types from chat/jid tables
3. Handle database connection errors gracefully
4. Add proper error handling for missing database

**Files to Modify/Create**:
- `src/chat-metadata/index.ts` - Complete implementation
- Handle SQLite queries for chat, jid, and message tables

**Estimated Time**: 45 minutes

### Step 3: Extend SheetsDatabase for Chat Metadata
**Objective**: Add Google Sheets operations for chat metadata persistence
**Actions**:
1. Add createChatMetadataSheet() method to SheetsDatabase
2. Add saveChatMetadata() method to SheetsDatabase
3. Create sheet at path `/WhatsApp Google Uploader/chats`
4. Add all 14 Portuguese columns as specified

**Files to Modify/Create**:
- `src/database/index.ts` - Extend SheetsDatabase class
- Add proper column headers and data formatting

**Estimated Time**: 45 minutes

### Step 4: Integrate with CLI Scan Command
**Objective**: Make Google Sheets saving the DEFAULT behavior, add --dry-run option
**Actions**:
1. Modify scan command to save to Google Sheets by default
2. Add --dry-run flag to skip Google Sheets operations
3. Preserve existing file listing functionality
4. Add proper error messages and user feedback

**Files to Modify/Create**:
- `src/cli/cli-application.ts` - Modify scan command logic
- Keep file listing in both normal and dry-run modes
- Add user-friendly output messages

**Estimated Time**: 45 minutes

### Step 5: Testing & Validation
**Tests to Run**:
- [ ] Unit tests for ChatMetadataExtractor
- [ ] Integration tests with real msgstore.db file
- [ ] CLI tests for both default and --dry-run modes
- [ ] Manual testing with decrypt → scan workflow

**Validation Criteria**:
- [ ] `npm run scan` creates Google Sheets with chat metadata
- [ ] `npm run scan --dry-run` shows preview without saving
- [ ] All 14 Portuguese columns present and populated
- [ ] Graceful handling when msgstore.db missing
- [ ] File listing functionality preserved

**Estimated Time**: 30 minutes

## ✅ Success Criteria
- [ ] `npm run scan` saves to Google Sheets BY DEFAULT (new primary behavior)
- [ ] `npm run scan --dry-run` skips Google Sheets saving (preview mode)
- [ ] Google Sheets created at path `/WhatsApp Google Uploader/chats`
- [ ] All 14 Portuguese columns present with proper labels
- [ ] Chat data extracted from msgstore.db when available
- [ ] Graceful degradation when msgstore.db missing (warning shown)
- [ ] File listing functionality preserved in both modes
- [ ] All tests passing legitimately (no workarounds)
- [ ] KISS/YAGNI principles followed - simple, focused implementation

## 🎨 Design Decisions

### Decision 1: Default vs Optional Google Sheets Saving
**Options Considered**:
- A: Add --save-to-sheets flag (original spec)
- B: Make saving default, add --dry-run flag (updated spec)
**Chosen**: Option B
**Rationale**: Simpler user experience - primary use case requires no flags. User feedback indicated this preference.

### Decision 2: Database Dependency
**Options Considered**:
- A: sqlite3 (existing project pattern)
- B: better-sqlite3 (newer, more reliable)
**Chosen**: Option B
**Rationale**: Better Termux/ARM compatibility, synchronous API simpler to work with, better performance.

### Decision 3: Error Handling Strategy
**Options Considered**:
- A: Fail entire command if msgstore.db missing
- B: Show warning and continue with file listing
**Chosen**: Option B
**Rationale**: Graceful degradation - user still gets value from file listing even without chat metadata.

## 🔄 Rollback Plan
If something goes wrong:
1. `git checkout HEAD~1` to revert to previous working state
2. Remove better-sqlite3 dependencies if they cause issues
3. Verify existing scan functionality still works
4. All changes are on TASK-023-dwarf branch, main branch unaffected

## 📝 Notes
- Following KISS principle - reusing existing GoogleApis and SheetsDatabase infrastructure
- Portuguese column labels specifically requested by user
- Making Google Sheets saving the default behavior (not optional) per user feedback
- Implementation builds on solid foundation of existing decrypt, auth, and sheets functionality

## 🔗 References
- User requirements in TASK-023-dwarf-spec.md
- Existing scan command in src/cli/cli-application.ts
- SheetsDatabase implementation in src/database/index.ts
- WhatsApp decrypt functionality for msgstore.db creation

---
**Planning Completed**: 2025-09-14 14:45
**Ready to Execute**: YES