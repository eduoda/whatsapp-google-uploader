# TASK-028-seer-spec.md
## Upload Command Testing and Quality Assurance

**Agent**: seer
**Priority**: 2 (High - Quality Assurance)
**Created**: 2025-09-14
**Depends on**: TASK-027 (upload command implemented)

## Objective
Create comprehensive tests for the new `npm run upload --chat="JID"` command and verify that all existing CLI functionality (`scan`, `scanchat`, `auth`, etc.) continues to work properly after the upload command integration.

## Testing Requirements

### Core Upload Command Testing
1. **Command Validation**: Test JID validation and error messages
2. **File Analysis Integration**: Test integration with ChatFileAnalyzer
3. **Upload Process**: Test actual file uploads with mocked Google APIs
4. **Progress Tracking**: Test Google Sheets updates and terminal progress
5. **Error Handling**: Test various failure scenarios
6. **Dry-run Mode**: Test preview mode without actual uploads

### Regression Testing
1. **Existing Commands**: Ensure `scan`, `scanchat`, `auth`, `setup`, `check` still work
2. **Authentication Flow**: Verify OAuth integration remains functional
3. **Google APIs**: Test Drive/Photos upload routing still works
4. **Database Operations**: Test Google Sheets operations remain stable

## Test Categories

### 1. Unit Tests for Upload Command

#### CLI Command Parsing
```typescript
describe('Upload Command', () => {
  it('should require --chat parameter');
  it('should validate JID format');
  it('should support --dry-run flag');
  it('should show helpful error for invalid JID');
});
```

#### File Analysis Integration
```typescript
describe('Upload File Analysis', () => {
  it('should get files from ChatFileAnalyzer');
  it('should sort files chronologically (oldest first)');
  it('should filter already-uploaded files');
  it('should handle empty chat (no files)');
});
```

#### Upload Process Testing
```typescript
describe('Upload Process', () => {
  it('should upload files sequentially');
  it('should update Google Sheets after each upload');
  it('should show terminal progress');
  it('should handle upload failures gracefully');
  it('should skip already-uploaded files');
});
```

### 2. Integration Tests

#### End-to-End Upload Flow
```typescript
describe('Upload E2E', () => {
  it('should complete full upload flow with mock files');
  it('should work with real Google Sheets (test account)');
  it('should handle authentication requirements');
  it('should update progress tracking correctly');
});
```

#### Error Scenarios
```typescript
describe('Upload Error Handling', () => {
  it('should handle missing msgstore.db');
  it('should handle invalid chat JID');
  it('should handle authentication failures');
  it('should handle Google API failures');
  it('should handle missing WhatsApp files');
});
```

### 3. Regression Tests

#### Existing CLI Commands
```typescript
describe('CLI Regression', () => {
  it('should still run scan command');
  it('should still run scanchat command');
  it('should still run auth command');
  it('should still run setup command');
  it('should still run check command');
});
```

#### Core Functionality
```typescript
describe('Core Functionality Regression', () => {
  it('should still authenticate with Google');
  it('should still create Google Sheets');
  it('should still upload to Drive/Photos');
  it('should still extract chat metadata');
});
```

## Test Implementation Strategy

### 1. Mock Strategy
- **Google APIs**: Mock all Google service calls to avoid quota usage
- **File System**: Mock file operations for predictable testing
- **Database**: Mock msgstore.db queries with test data
- **Google Sheets**: Mock sheets operations with in-memory tracking

### 2. Test Data Setup
```typescript
// Mock msgstore.db data
const mockChatFiles = [
  {
    messageId: '1',
    chatJid: '5511999999999@c.us',
    fileName: 'IMG-20240101-WA0001.jpg',
    messageTimestamp: new Date('2024-01-01T10:00:00Z'),
    fileExists: true,
    uploadStatus: 'pending'
  },
  // ... more test files
];

// Mock upload responses
const mockUploadResult = {
  id: 'mock-google-id-123',
  url: 'https://drive.google.com/file/d/mock-google-id-123'
};
```

### 3. Test Utilities
```typescript
// Helper functions for test setup
function createMockChatFileAnalyzer();
function createMockUploaderManager();
function createMockSheetsDatabase();
function createMockGoogleApis();
```

## File Changes Required

### New Test Files
- `test/upload-command.test.js` - Core upload command tests
- `test/upload-integration.test.js` - Integration and E2E tests
- `test/cli-regression.test.js` - Regression tests for existing functionality

### Modified Files
- `test/test.js` - Add new test imports and overall test coordination
- `package.json` - Update test scripts if needed

## Acceptance Criteria

### Test Coverage Requirements
- [ ] **Command Validation**: All JID validation scenarios tested
- [ ] **File Processing**: Chronological sorting and filtering tested
- [ ] **Upload Flow**: Sequential upload process fully tested
- [ ] **Progress Tracking**: Google Sheets updates and terminal progress tested
- [ ] **Error Handling**: All error scenarios have corresponding tests
- [ ] **Dry-run Mode**: Preview functionality tested without side effects

### Regression Requirements
- [ ] **All Existing Commands**: scan, scanchat, auth, setup, check all pass tests
- [ ] **Core Infrastructure**: GoogleApis, SheetsDatabase, UploaderManager still work
- [ ] **Authentication**: OAuth flow remains functional
- [ ] **File Operations**: WhatsApp scanning and file detection still work

### Quality Requirements
- [ ] **No Test Workarounds**: All tests use legitimate mocking, no shortcuts
- [ ] **Comprehensive Coverage**: Edge cases and error conditions covered
- [ ] **Clear Test Names**: Each test clearly describes what it validates
- [ ] **Fast Execution**: Tests run quickly with proper mocking
- [ ] **Reliable**: Tests are deterministic and don't depend on external services

## Testing Scenarios

### Happy Path Scenarios
1. **Simple Upload**: Upload 3 files from a chat, all succeed
2. **Mixed Status**: Some files already uploaded (skipped), some new (uploaded)
3. **Large Chat**: Upload many files with progress tracking
4. **Dry-run**: Show what would be uploaded without uploading

### Error Scenarios
1. **Invalid JID**: Malformed chat JID provided
2. **Missing Database**: msgstore.db not found
3. **No Authentication**: Google authentication required
4. **Empty Chat**: Chat has no media files
5. **Upload Failures**: Some files fail to upload (network, quota, etc.)
6. **Missing Files**: Files referenced in database but deleted from phone

### Edge Cases
1. **Duplicate Files**: Same file appears multiple times in chat
2. **Large Files**: Test with files at size limits
3. **Special Characters**: Files with Unicode names
4. **Concurrent Access**: Multiple upload sessions (should be prevented)

## Success Metrics

### Test Execution
1. **All Tests Pass**: 100% test pass rate
2. **Fast Execution**: Test suite runs in under 30 seconds
3. **No Flaky Tests**: Consistent results across multiple runs
4. **Clear Failures**: Failed tests provide actionable error messages

### Coverage Metrics
1. **Command Coverage**: All CLI commands tested
2. **Error Coverage**: All error paths tested
3. **Integration Coverage**: All component integrations tested
4. **Regression Coverage**: All existing functionality verified

### Quality Assurance
1. **No Breaking Changes**: Existing functionality preserved
2. **Error Resilience**: Upload failures don't break other commands
3. **Resource Cleanup**: Tests don't leak resources or leave artifacts
4. **Documentation**: Test files are well-documented and maintainable

## Implementation Plan

### Phase 1: Test Infrastructure (45 minutes)
1. Set up mocking utilities for all major components
2. Create test data fixtures for various scenarios
3. Set up test file structure and imports

### Phase 2: Upload Command Tests (90 minutes)
1. Unit tests for command validation and parsing
2. Integration tests for file analysis and processing
3. Upload flow tests with mocked Google APIs
4. Progress tracking and error handling tests

### Phase 3: Regression Testing (60 minutes)
1. Test all existing CLI commands
2. Test core infrastructure components
3. Test authentication and Google API integration
4. Test WhatsApp scanning and file detection

### Phase 4: Edge Cases and Polish (45 minutes)
1. Test error scenarios and edge cases
2. Performance testing with large file sets
3. Test cleanup and documentation
4. Final test suite validation

**Total Estimated Time**: 4 hours

## Dependencies and Blockers

### Dependencies
- TASK-027 completed ✅ (upload command implemented)
- Existing test infrastructure ✅
- Mock utilities available ✅

### No Blockers
- Clear testing requirements
- Established testing patterns
- All components are testable

## Notes
- Follow existing test patterns and conventions
- Use comprehensive mocking to avoid external service dependencies
- Ensure tests are fast and reliable
- Focus on both positive and negative test scenarios
- Maintain test documentation for future maintenance