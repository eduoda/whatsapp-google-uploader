# Task Planning Document

## 📋 Task Information
- **Task ID**: TASK-029
- **Date**: 2025-09-14 15:35
- **Agent**: Dwarf
- **Priority**: HIGH (Priority 1 - Critical)
- **Estimated Time**: 2 hours
- **Related Issue/TODO**: Fix Upload Organization Structure

## 🎯 Task Description
Fix the upload organization structure to use correct folder/album naming conventions:
- Photos/videos should go to Google Photos album: `WA_[chat_name]_[JID]`
- Documents/audio should go to Google Drive folder: `/WhatsApp Google Uploader/[chat_name]_[JID]/`
- Update Google Sheets to track correct album/folder names

## 🔍 Root Cause Analysis
- **Symptom**: Current upload implementation doesn't use the requested naming convention
- **Root Cause**: Upload logic uses generic/incorrect folder/album naming structure
- **Proper Fix**: Update GoogleApis upload methods to use chat-specific naming format

## 📊 Current State Analysis
### What Currently Exists
- Working upload command (`npm run upload --chat="JID"`)
- GoogleApis class with uploadFile method
- Chat metadata extraction from msgstore.db
- Google Sheets per-chat tracking
- Smart file routing (photos→Photos, documents→Drive)

### Dependencies
- TASK-027 (upload command) ✅ COMPLETED
- Working GoogleApis class ✅ EXISTS
- Chat metadata system ✅ EXISTS
- Google Photos and Drive APIs ✅ WORKING

## 🏗️ Detailed Plan

### Step 1: Analyze Current Upload Implementation
**Objective**: Understand current folder/album creation logic
**Actions**:
1. Review src/google-apis/index.ts uploadFile method
2. Identify current album/folder naming logic
3. Locate where chat metadata is passed to upload
**Files to Review**:
- `src/google-apis/index.ts` - GoogleApis.uploadFile method
- `src/cli/cli-application.ts` - upload command implementation
- `src/chat-metadata/index.ts` - chat metadata structure
**Estimated Time**: 30 minutes

### Step 2: Update Album/Folder Naming Logic
**Objective**: Implement correct naming convention
**Actions**:
1. Modify GoogleApis.uploadFile to accept chat metadata
2. Update album naming: `WA_[chat_name]_[JID]` for photos/videos
3. Update folder naming: `/WhatsApp Google Uploader/[chat_name]_[JID]/` for documents/audio
4. Ensure backward compatibility with existing uploads
**Files to Modify/Create**:
- `src/google-apis/index.ts` - Update uploadFile method signature and logic
- `src/cli/cli-application.ts` - Pass chat metadata to upload calls
**Estimated Time**: 60 minutes

### Step 3: Update Google Sheets Integration
**Objective**: Track correct album/folder names in sheets
**Actions**:
1. Update per-chat sheets columns to reflect new naming
2. Ensure album/folder links are correctly stored
3. Update existing sheet creation logic if needed
**Files to Modify**:
- `src/chat-metadata/index.ts` - Update sheet column definitions
**Estimated Time**: 20 minutes

### Step 4: Testing & Validation
**Tests to Run**:
- [ ] Unit tests for GoogleApis.uploadFile
- [ ] Manual test with real photos (Google Photos album creation)
- [ ] Manual test with real documents (Google Drive folder creation)
- [ ] Verify Google Sheets tracks correct names
**Validation Criteria**:
- [ ] Photos uploaded to album `WA_[chat_name]_[JID]`
- [ ] Documents uploaded to folder `/WhatsApp Google Uploader/[chat_name]_[JID]/`
- [ ] Google Sheets shows correct album/folder names
- [ ] Existing functionality preserved

## ✅ Success Criteria
- [ ] Photos/videos go to Google Photos album with format: `WA_[chat_name]_[JID]`
- [ ] Documents/audio go to Google Drive folder with format: `/WhatsApp Google Uploader/[chat_name]_[JID]/`
- [ ] Google Sheets updated with correct album/folder names
- [ ] Existing tests still pass
- [ ] REAL upload test successful (photos and documents)
- [ ] No breaking changes to existing upload functionality

## 🎨 Design Decisions
### Decision 1: Modify GoogleApis.uploadFile Signature
**Options Considered**:
- A) Add chat metadata parameter to uploadFile
- B) Create separate methods for chat-specific uploads
**Chosen**: Option A
**Rationale**: Minimal changes, maintains existing interface, follows KISS principle

### Decision 2: Album/Folder Name Format
**Options Considered**:
- A) `WA_[chat_name]_[JID]` format as requested
- B) Alternative naming schemes
**Chosen**: Option A (user requirement)
**Rationale**: Explicit user requirement, clear and identifiable format

## 🔄 Rollback Plan
If something goes wrong:
1. `git checkout TASK-023-dwarf` (previous working state)
2. Verify upload functionality still works
3. Re-analyze requirements and create new approach

## 📝 Notes
- MUST follow KISS, YAGNI, DRY principles
- MUST test with REAL uploads (not mocks)
- MUST preserve all existing functionality
- MUST update tests legitimately (no workarounds)

## 🔗 References
- TASK-027 report: Previous upload implementation
- TASK-025 report: Google Sheets per-chat integration
- User requirements: Organization structure specification

---
**Planning Completed**: 2025-09-14 15:40
**Ready to Execute**: YES