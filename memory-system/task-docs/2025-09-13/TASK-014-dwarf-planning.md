# TASK-014: Code Merging and API Simplification - Planning Document

## 📋 Task Information
- **Task ID**: TASK-014
- **Date**: 2025-09-13 17:30
- **Agent**: dwarf
- **Priority**: 1 (CRITICAL)
- **Estimated Time**: 6-8 hours
- **Dependency**: TASK-013 (Package consolidation - ✅ COMPLETED)

## 🎯 Task Description
Merge over-engineered OAuth, Google Drive, and Google Photos classes into a single unified GoogleApis class. Simplify token management by removing AES-256-GCM encryption in favor of simple file storage. Consolidate type definitions and remove enterprise features for personal WhatsApp backup use case.

## 🔍 Root Cause Analysis
- **Problem**: Code is over-engineered for enterprise use case but we need simple personal backup tool
- **Root Cause**: Architecture designed for enterprise scale but actual use case is personal (thousands of files, not millions)
- **Current Issues**:
  - Three separate API classes increase complexity unnecessarily
  - AES-256-GCM encryption overkill for personal token storage  
  - Enterprise features like resumable uploads not needed for personal backups
  - Complex type hierarchies confusing for simple use case
- **Proper Fix**: Consolidate into single API class with only necessary features

## 📊 Current State Analysis
### What Currently Exists (Post TASK-013)
- **Single package structure**: All code consolidated into `/src`
- **Separate API classes**: 
  - `src/auth/token-manager.ts` - Complex AES encryption
  - `src/google-apis/drive/` - Enterprise-grade Drive uploader  
  - `src/google-apis/photos/` - Complex Photos API with albums
- **Scattered types**: Type definitions spread across multiple files
- **Over-engineered features**: Resumable uploads, complex retry logic, enterprise security

### Dependencies
- ✅ TASK-013 completed - Single package structure ready
- Google APIs npm packages already installed
- OAuth2 flow working (from previous tasks)
- Basic upload functionality exists (needs simplification)

## 🏗️ Detailed Plan

### Step 1: Analyze Current Code Structure
**Objective**: Understand what exists and what needs to be merged/simplified
**Actions**:
1. Review `src/auth/token-manager.ts` for encryption complexity
2. Analyze `src/google-apis/drive/` for enterprise features to remove
3. Study `src/google-apis/photos/` for unnecessary album management
4. Identify all scattered type definitions
5. Map dependencies between current classes

**Files to Review**:
- `src/auth/token-manager.ts` - Token encryption analysis
- `src/google-apis/drive/index.ts` - Drive API complexity  
- `src/google-apis/photos/index.ts` - Photos API features
- `src/types/` - Current type definitions
- `src/scanner/` - Integration points

**Estimated Time**: 60 minutes

### Step 2: Create Unified GoogleApis Class
**Objective**: Create single class that combines authentication and upload functionality
**Actions**:
1. Create `src/google-apis/index.ts` with GoogleApis class
2. Integrate OAuth2Client directly (no separate TokenManager)
3. Add drive and photos API clients as private properties
4. Implement unified authentication method
5. Add simple token refresh capability

**Files to Create/Modify**:
- `src/google-apis/index.ts` - NEW: Main GoogleApis class
- Remove `src/auth/token-manager.ts` - Complex encryption not needed
- Update imports in dependent files

**GoogleApis Class Structure**:
```typescript
export class GoogleApis {
  private auth: OAuth2Client;
  private drive: drive_v3.Drive;  
  private photos: any;
  private tokenPath: string;
  
  constructor(credentialsPath: string, tokenPath: string);
  async authenticate(): Promise<void>;
  async refreshTokens(): Promise<void>;
  async uploadPhoto(filePath: string): Promise<string>;
  async uploadVideo(filePath: string): Promise<string>;
  async uploadDocument(filePath: string, folderId?: string): Promise<string>;
  isAuthenticated(): boolean;
}
```

**Estimated Time**: 120 minutes

### Step 3: Implement Simple Token Storage
**Objective**: Replace AES-256-GCM encryption with simple file-based token storage
**Actions**:
1. Create simple token save/load methods within GoogleApis
2. Use JSON file storage with proper file permissions (0o600)
3. Remove all encryption/decryption logic  
4. Implement basic error handling for file operations
5. Add token validation and refresh logic

**Implementation Details**:
```typescript
// Simple file-based token storage (no encryption needed for personal use)
private async saveTokens(tokens: Tokens): Promise<void> {
  await fs.writeFile(this.tokenPath, JSON.stringify(tokens, null, 2), { mode: 0o600 });
}

private async loadTokens(): Promise<Tokens | null> {
  try {
    const data = await fs.readFile(this.tokenPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null; // No tokens exist yet
  }
}
```

**Estimated Time**: 90 minutes

### Step 4: Merge Upload Methods  
**Objective**: Consolidate Drive and Photos upload logic into unified methods
**Actions**:
1. Extract core upload logic from existing Drive/Photos uploaders
2. Remove resumable upload complexity (not needed for personal files)
3. Implement direct photo upload to Google Photos
4. Implement direct document upload to Google Drive  
5. Add basic error handling (simple try/catch, no enterprise retry logic)
6. Remove complex album management features

**Upload Method Implementations**:
```typescript
async uploadPhoto(filePath: string): Promise<string> {
  const fileStream = fs.createReadStream(filePath);
  // Direct Google Photos upload - no resumable uploads needed
  // Remove complex album/metadata management
}

async uploadDocument(filePath: string, folderId?: string): Promise<string> {
  const fileStream = fs.createReadStream(filePath);
  // Direct Drive upload - simple file upload only
  // Remove resumable upload complexity  
}
```

**Files to Remove**:
- `src/google-apis/drive/` - Entire directory (functionality moved to GoogleApis)
- `src/google-apis/photos/` - Entire directory (functionality moved to GoogleApis)

**Estimated Time**: 150 minutes

### Step 5: Consolidate Type Definitions
**Objective**: Merge scattered type definitions into coherent, simplified set
**Actions**:
1. Create `src/types/index.ts` with all necessary types
2. Remove complex enterprise-grade type hierarchies
3. Keep only types needed for personal backup use case
4. Ensure type compatibility with existing scanner and database code
5. Update all import statements to use new consolidated types

**Type Consolidation**:
```typescript
// src/types/index.ts
export interface Tokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

export interface UploadResult {
  id: string;
  name: string;
  url?: string;
}

export interface PhotoMetadata {
  description?: string;
}

// Remove complex enterprise types that aren't needed
```

**Files to Modify**:
- `src/types/index.ts` - Consolidate all type definitions
- Remove scattered type files from other directories
- Update imports across codebase

**Estimated Time**: 60 minutes

### Step 6: Update Scanner Integration
**Objective**: Simplify scanner to work with unified GoogleApis class
**Actions**:
1. Review `src/scanner/index.ts` for integration points
2. Simplify file categorization to: photo, video, document
3. Remove complex file type detection (use basic MIME types)
4. Update scanner exports to work with new GoogleApis class
5. Ensure compatibility with Google Sheets database

**Simplification**:
```typescript
export function categorizeFile(mimeType: string): 'photo' | 'video' | 'document' {
  if (mimeType.startsWith('image/')) return 'photo';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document'; // Everything else goes to Drive
}
```

**Estimated Time**: 45 minutes

### Step 7: Clean Up and Remove Over-Engineering
**Objective**: Aggressively remove enterprise features not needed for personal use
**Actions**:
1. Remove complex rate limiting logic (Google APIs handle this)
2. Remove resumable upload implementations
3. Remove enterprise error handling and retry mechanisms  
4. Remove complex progress tracking for individual files
5. Remove advanced album management features
6. Clean up unused dependencies and imports

**Features to Remove**:
- Complex exponential backoff retry logic
- Resumable upload progress tracking
- Enterprise-grade error classification
- Complex rate limiting implementations
- Advanced album/folder management
- Complex metadata handling

**Estimated Time**: 90 minutes

### Step 8: Update Existing Integrations  
**Objective**: Update any existing code that uses the old API classes
**Actions**:
1. Find all imports of old TokenManager, DriveUploader, PhotosUploader
2. Update imports to use new GoogleApis class
3. Update method calls to match new unified interface
4. Test integration points (particularly with proxy/scanner)
5. Ensure Google Sheets database integration still works

**Files Likely to Need Updates**:
- `src/proxy/` - Main uploader logic
- Any test files referencing old classes  
- Configuration or setup files

**Estimated Time**: 60 minutes

### Step 9: Testing & Validation
**Objective**: Verify simplified API works correctly
**Actions**:
1. Test OAuth authentication flow
2. Test photo uploads to Google Photos
3. Test video uploads to Google Photos  
4. Test document uploads to Google Drive
5. Test token refresh functionality
6. Verify integration with scanner categorization
7. Run existing test suite (update tests as needed)

**Tests to Run**:
- [ ] Authentication completes successfully
- [ ] Tokens are saved/loaded from file correctly
- [ ] Photo uploads work without enterprise features
- [ ] Video uploads work without enterprise features
- [ ] Document uploads work without enterprise features  
- [ ] Token refresh handles expired tokens
- [ ] Scanner integration works with simplified types
- [ ] All unit tests pass
- [ ] Integration with Google Sheets database works

**Validation Criteria**:
- [ ] Single GoogleApis class replaces 3+ separate classes
- [ ] 40-60% reduction in total lines of code achieved
- [ ] Simple file-based token storage works (no encryption)
- [ ] All core upload functionality preserved
- [ ] Code is significantly easier to understand
- [ ] No enterprise bloat remaining

**Estimated Time**: 120 minutes

## ✅ Success Criteria
- [ ] **Code Consolidation Complete**: GoogleApis class replaces OAuth/Drive/Photos classes
- [ ] **Simplification Successful**: 40-60% code reduction achieved  
- [ ] **Token Management Simplified**: File-based storage replaces AES encryption
- [ ] **Upload Functionality Preserved**: Photo, video, document uploads working
- [ ] **Type Definitions Consolidated**: All types in single coherent file
- [ ] **Scanner Integration Working**: Simplified file categorization works
- [ ] **No Enterprise Bloat**: Resumable uploads, complex retry logic removed
- [ ] **All Tests Pass**: Updated test suite validates new simplified APIs
- [ ] **Integration Ready**: Prepared for TASK-015 proxy completion
- [ ] **Code Quality**: Clean, maintainable, understandable code structure

## 🎨 Design Decisions
### Decision 1: Single Class vs Multiple Simple Classes
**Options Considered**: 
- A) One GoogleApis class with all functionality
- B) Separate but simplified Auth, Drive, Photos classes
**Chosen**: Option A - Single GoogleApis class
**Rationale**: Personal backup use case doesn't need separation of concerns. Single class is simpler to use and understand.

### Decision 2: Token Storage Method
**Options Considered**:
- A) Keep AES-256-GCM encryption  
- B) Simple file-based JSON storage with file permissions
- C) Environment variables only
**Chosen**: Option B - Simple file-based JSON storage
**Rationale**: File permissions (0o600) provide adequate security for personal use. Environment variables not persistent. AES encryption is overkill.

### Decision 3: Upload Method Complexity
**Options Considered**:
- A) Keep resumable uploads for reliability
- B) Direct uploads with simple retry
- C) Direct uploads with no retry (let Google APIs handle)
**Chosen**: Option C - Direct uploads, let Google APIs handle failures  
**Rationale**: Personal backup files are typically small. Google APIs have built-in reliability. Simpler is better for personal use case.

## 🔄 Rollback Plan
If GoogleApis consolidation breaks functionality:
1. **Revert branch**: `git reset --hard HEAD~1` to restore working state
2. **Restore old classes**: Temporarily restore auth/drive/photos separate classes
3. **Debug issues**: Identify specific integration failures  
4. **Fix incrementally**: Address problems one by one rather than big-bang approach
5. **Test frequently**: Validate each component before proceeding

## 📝 Notes
- **Focus on simplification**: Aggressively remove enterprise features 
- **Personal use case**: Optimize for thousands of files, not millions
- **Test frequently**: Ensure uploads work after each major change
- **Document removals**: Note what enterprise features were removed and why
- **Maintain functionality**: Core upload capabilities must be preserved
- **Integration focus**: Ensure scanner and database integration continues to work

## 🔗 References
- **TASK-014 Spec**: `/memory-system/task-docs/2025-09-13/TASK-014-dwarf-spec.md`
- **Google Photos API**: https://developers.google.com/photos/library/reference/rest
- **Google Drive API**: https://developers.google.com/drive/api/reference/rest/v3
- **OAuth2 Flow**: https://developers.google.com/identity/protocols/oauth2

---
**Planning Completed**: 2025-09-13 17:30  
**Ready to Execute**: YES

**Total Estimated Time**: 6-8 hours (390-480 minutes)
**Critical Path**: Steps 2-4 (GoogleApis creation, token simplification, upload consolidation)
**Risk Mitigation**: Test authentication and uploads frequently during development