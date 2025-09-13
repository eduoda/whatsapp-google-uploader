# TASK-014: Code Merging and API Simplification

## Overview
**Agent**: Dwarf  
**Priority**: 1 (Critical)  
**Phase**: Phase 2 - CODE SIMPLIFICATION  
**Estimated Effort**: 6-8 hours  
**Branch**: TASK-014-dwarf  

## Context
After TASK-013 consolidates the package structure, the code still maintains the over-engineered separation between OAuth, Google Drive, and Google Photos. For a personal WhatsApp backup tool, these separate APIs should be merged into a single, simple GoogleApis class.

### Current Over-Engineered Approach:
```typescript
// Three separate classes with complex interfaces
TokenManager (AES-256-GCM encryption, complex refresh logic)
DriveUploader (enterprise-grade resumable uploads)
PhotosUploader (complex album management)
```

### Target Simplified Approach:
```typescript
// Single unified API class
GoogleApis {
  authenticate()           // Simple OAuth flow
  uploadToPhotos(file)     // Direct photo/video upload
  uploadToDrive(file)      // Direct document upload
  refreshTokens()          // Simple token refresh
}
```

## Objectives
1. **Merge Google APIs**: Combine OAuth + Drive + Photos into single GoogleApis class
2. **Simplify Token Management**: Replace AES-256-GCM with simple file-based storage
3. **Consolidate Types**: Merge all type definitions into coherent set
4. **Remove Over-Engineering**: Strip enterprise features for personal use case
5. **Maintain Core Functionality**: Preserve actual upload capabilities

## Detailed Requirements

### 1. Create Unified GoogleApis Class

**File**: `src/google-apis/index.ts`
```typescript
export class GoogleApis {
  private auth: OAuth2Client;
  private drive: drive_v3.Drive;
  private photos: any; // Google Photos API client
  
  constructor(credentialsPath: string, tokenPath: string) {}
  
  // Authentication
  async authenticate(): Promise<void> {}
  async refreshTokens(): Promise<void> {}
  
  // Upload methods
  async uploadPhoto(filePath: string, metadata?: PhotoMetadata): Promise<string> {}
  async uploadVideo(filePath: string, metadata?: VideoMetadata): Promise<string> {}
  async uploadDocument(filePath: string, folderId?: string): Promise<string> {}
  
  // Utility methods
  async createFolder(name: string): Promise<string> {}
  async listFolders(): Promise<Folder[]> {}
  isAuthenticated(): boolean {}
}
```

### 2. Simplify Token Management

**Replace Complex TokenManager** (src/auth/token-manager.ts):
```typescript
// REMOVE: AES-256-GCM encryption (overkill for personal tool)
// REMOVE: Complex key derivation
// REMOVE: Enterprise-grade security measures

// ADD: Simple file-based token storage
export class SimpleTokenManager {
  constructor(private tokenPath: string) {}
  
  async saveTokens(tokens: Tokens): Promise<void> {
    // Simple JSON file storage with basic file permissions
    await fs.writeFile(this.tokenPath, JSON.stringify(tokens, null, 2), { mode: 0o600 });
  }
  
  async loadTokens(): Promise<Tokens | null> {
    // Simple JSON file reading
  }
  
  async deleteTokens(): Promise<void> {
    // Simple file deletion
  }
}
```

### 3. Merge Upload Logic

**Combine Drive and Photos uploaders**:
```typescript
// REMOVE: Separate DriveUploader class (src/google-apis/drive/)
// REMOVE: Separate PhotosUploader class (src/google-apis/photos/)

// ADD: Integrated upload methods in GoogleApis
async uploadPhoto(filePath: string): Promise<string> {
  const fileStream = fs.createReadStream(filePath);
  const media = { body: fileStream };
  const metadata = { name: path.basename(filePath) };
  
  // Direct Google Photos upload (simple, no enterprise features)
  const response = await this.photos.mediaItems.batchCreate({
    requestBody: { newMediaItems: [{ simpleMediaItem: { uploadToken: 'token' } }] }
  });
  
  return response.data.newMediaItemResults[0].mediaItem.id;
}

async uploadDocument(filePath: string, folderId?: string): Promise<string> {
  const fileStream = fs.createReadStream(filePath);
  const media = { body: fileStream };
  const metadata = {
    name: path.basename(filePath),
    parents: folderId ? [folderId] : undefined
  };
  
  // Direct Drive upload (simple, no resumable uploads for personal use)
  const response = await this.drive.files.create({ requestBody: metadata, media });
  return response.data.id!;
}
```

### 4. Consolidate Type Definitions

**File**: `src/types/index.ts`
```typescript
// Merge all scattered type definitions
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
  albumId?: string;
}

export interface VideoMetadata extends PhotoMetadata {}

export interface Folder {
  id: string;
  name: string;
}

// Remove unnecessary enterprise-grade type definitions
// Keep only what's needed for personal backup tool
```

### 5. Update Scanner Integration

**File**: `src/scanner/index.ts`
- Remove complex file categorization logic
- Simplify to basic photo/video vs document detection
- Use simple MIME type checking

```typescript
export interface ScannedFile {
  path: string;
  name: string;
  size: number;
  mimeType: string;
  category: 'photo' | 'video' | 'document'; // Simplified from complex categorization
}

export function categorizeFile(mimeType: string): 'photo' | 'video' | 'document' {
  if (mimeType.startsWith('image/')) return 'photo';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
}
```

### 6. Remove Over-Engineered Features

**Features to Remove**:
- [ ] Complex rate limiting (Google APIs handle this)
- [ ] Resumable uploads (unnecessary for personal files)
- [ ] Enterprise-grade error handling
- [ ] Complex retry mechanisms with exponential backoff
- [ ] AES encryption for token storage
- [ ] Complex progress tracking for individual files
- [ ] Advanced album management features

**Features to Keep (Simplified)**:
- [ ] Basic authentication flow
- [ ] Simple file uploads to Photos/Drive
- [ ] Basic error handling (try/catch with simple retry)
- [ ] File deduplication via Google Sheets
- [ ] Simple progress tracking at batch level

## Acceptance Criteria

### ✅ Code Consolidation
- [ ] **Single GoogleApis class**: Replaces separate OAuth/Drive/Photos classes
- [ ] **Simplified token management**: File-based storage replaces AES encryption
- [ ] **Consolidated types**: All type definitions in single file
- [ ] **Clean imports**: All internal imports use new simplified structure

### ✅ Functionality Preservation
- [ ] **Authentication works**: OAuth flow completes successfully  
- [ ] **Photo uploads work**: Can upload images to Google Photos
- [ ] **Video uploads work**: Can upload videos to Google Photos
- [ ] **Document uploads work**: Can upload documents to Google Drive
- [ ] **Token refresh works**: Handles expired tokens correctly

### ✅ Simplification Success  
- [ ] **Reduced complexity**: 50%+ reduction in lines of code
- [ ] **Easier to understand**: Single API class vs multiple classes
- [ ] **No enterprise bloat**: Removed unnecessary features for personal use
- [ ] **Maintainable**: Clear, simple code structure

### ✅ Integration Ready
- [ ] **Scanner integration**: Works with simplified file categorization
- [ ] **Database integration**: Compatible with Google Sheets persistence
- [ ] **Uploader ready**: Prepared for TASK-015 proxy completion
- [ ] **All tests pass**: Updated tests validate new simplified APIs

## Risk Mitigation

### **High Risk**: Authentication Breakage
- **Mitigation**: Test authentication first, ensure OAuth flow works
- **Validation**: Successful token acquisition and refresh
- **Rollback**: Keep backup of working auth code until validated

### **Medium Risk**: Upload Method Failures
- **Mitigation**: Test each upload method individually
- **Validation**: Successful file uploads to both Photos and Drive  
- **Fix Strategy**: Debug API calls, check permissions and scopes

### **Low Risk**: Type Definition Issues
- **Mitigation**: TypeScript compilation catches type errors
- **Validation**: Clean compilation with proper type checking
- **Fix**: Update types to match simplified API structure

## Definition of Done
1. ✅ GoogleApis class created with unified authentication and upload methods
2. ✅ Simple file-based token storage replaces AES encryption
3. ✅ All type definitions consolidated in src/types/
4. ✅ Scanner updated to use simplified file categorization  
5. ✅ All over-engineered features removed
6. ✅ Authentication and upload functionality verified working
7. ✅ All tests updated and passing
8. ✅ Code structure prepared for TASK-015 proxy completion

## Success Metrics
- **Code Reduction**: 40-60% reduction in total lines of code
- **Class Consolidation**: 3+ classes merged into 1 unified API
- **Complexity**: Simple, understandable code for personal use case
- **Maintainability**: Easy to debug and extend upload functionality

## Dependencies
- **Depends on**: TASK-013 (Package consolidation must be completed)
- **Blocks**: TASK-015 (Proxy implementation needs simplified APIs)

## Notes for Dwarf Agent
- **Focus on simplification** - remove enterprise features aggressively
- **Test frequently** - ensure uploads work after each major change
- **Keep it simple** - prefer direct API calls over complex abstractions
- **Personal use case** - optimize for backup thousands of files, not millions
- **Document decisions** - note what was removed and why

The goal is a **simple, working Google API integration** that handles basic authentication and file uploads without enterprise complexity.