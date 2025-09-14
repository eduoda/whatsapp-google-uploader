# MVP Action Plan - WhatsApp Google Uploader

**Status**: Post-Major-Refactoring (2025-09-13)
**Goal**: Complete Minimal Viable Product (MVP)
**Principle**: KISS, YAGNI, DRY

## Current State ✅

### Working Components (100% Complete)
- **GoogleApis Class**: Unified OAuth, Drive, Photos integration ✅
- **Scanner Class**: WhatsApp directory scanning and file discovery ✅
- **SheetsDatabase Class**: Google Sheets persistence for progress/deduplication ✅
- **UploaderManager Class**: Complete upload orchestration with real API calls ✅
- **CLI Commands**: `auth`, `setup`, `check` ✅
- **Functional Tests**: Real API integration tests ✅

### Architecture Quality ✅
- 10 TypeScript files (~1,913 lines, reduced from ~11K)
- KISS: Single unified GoogleApis class (no separate Auth/Drive/Photos)
- DRY: Shared authentication across all components
- YAGNI: Simple Google Sheets persistence (no complex database)

## Missing for MVP ❌

Only 2 CLI commands need implementation:

1. **`scan` command** - List WhatsApp media files
2. **`upload` command** - Execute uploads using existing components

## Action Plan

### Phase 1: API Agent - Implement CLI Commands (TASK-016, TASK-017)

**TASK-016: Implement CLI `scan` Command** (Priority 1)
```bash
# Expected outcome
$ whatsapp-uploader scan
Found 1,234 WhatsApp media files:
- Photos: 892 files (2.3GB)
- Videos: 156 files (8.1GB)
- Documents: 98 files (245MB)
- Audio: 88 files (123MB)

# Implementation: Just wire existing Scanner to CLI
```

**TASK-017: Implement CLI `upload` Command** (Priority 2)
```bash
# Expected outcome
$ whatsapp-uploader upload --chat-id "family"
Authenticating... ✓
Scanning files... ✓ Found 1,234 files
Uploading... ▓▓▓▓▓▓▓░░░ 70% (864/1,234)
Completed! View progress: https://docs.google.com/spreadsheets/d/abc123/edit

# Implementation: Just wire existing UploaderManager to CLI
```

### Phase 2: Seer Agent - Update Tests (TASK-018)

**TASK-018: Update Tests for CLI Commands** (Priority 3)
- Extend existing tests/test.js
- Test CLI commands with mock data
- No workarounds, legitimate testing only

## Implementation Strategy

### For API Agent:
1. **Use existing components** - No new functionality needed
2. **Add CLI command handlers** to src/cli/cli-application.ts:
   - `scan` command → call Scanner.findFiles()
   - `upload` command → call UploaderManager.uploadFiles()
3. **Simple output** - Basic console logging, no fancy UI
4. **Follow INTEGRITY-RULES.md** - No workarounds or shortcuts

### Success Criteria:
- [ ] `whatsapp-uploader scan` works and shows file counts
- [ ] `whatsapp-uploader upload` works and uploads to Google
- [ ] Tests pass with new CLI commands
- [ ] No technical debt introduced
- [ ] Real API calls work (no mocking upload functionality)

## What We're NOT Doing (YAGNI)

These features were deferred as unnecessary for personal WhatsApp backup use:
- ❌ `status` command (Google Sheets provides UI)
- ❌ `logs` command (console output + Sheets audit log sufficient)
- ❌ Rate limiting enforcement (Google APIs handle this)
- ❌ Concurrent uploads (sequential works fine for personal use)
- ❌ Complex progress UI (simple percentage sufficient)
- ❌ Resume capability (retry from beginning is acceptable)

## Timeline Estimate

- **TASK-016 (scan)**: 1-2 hours (just CLI wrapper)
- **TASK-017 (upload)**: 2-3 hours (CLI wrapper + progress display)
- **TASK-018 (tests)**: 1 hour (extend existing test)

**Total**: 4-6 hours to complete MVP

## Quality Gates

Before marking any task complete, verify:
- Tests pass legitimately (no workarounds)
- Uses existing components (no duplication)
- Follows KISS principle (simple, readable code)
- Actual functionality works (real uploads, not mocked)

---

**Remember**: The foundation is solid. Only CLI command wrappers are missing.