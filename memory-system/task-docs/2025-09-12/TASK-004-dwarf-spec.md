# TASK-004: Google Photos Library Development Specification

**Agent:** dwarf  
**Priority:** 2  
**Created:** 2025-09-12  
**Dependencies:** TASK-001 (architecture), TASK-002 (OAuth), TASK-010 (project structure)

---

## Overview

Implement the Google Photos API integration library for photo and video uploads with album management, batch processing, and comprehensive error handling. This library will integrate with the existing OAuth TokenManager for authentication and support the WhatsApp media backup workflow.

## Architecture Context

From the system architecture, the Google Photos Library is responsible for:
- Google Photos API integration for photos and videos
- Album creation and management
- Two-phase upload process (upload bytes → create media items)
- Batch upload operations (max 50 items per batch)
- Media organization in albums (max 20,000 items per album)
- Progress tracking for large batch operations
- Comprehensive error handling with retry logic

## Requirements

### Core Functionality
1. **Media Upload**: Two-phase upload process for photos and videos
2. **Album Management**: Create albums and organize media items
3. **Batch Processing**: Efficient batch uploads with size limits
4. **Progress Tracking**: Real-time progress reporting for UI integration
5. **Error Recovery**: Comprehensive retry logic with exponential backoff
6. **Media Validation**: Validate file types and formats before upload

### Google Photos API Considerations
- **Two-phase Upload**: 
  1. Upload bytes to get upload token
  2. Create media item using upload token
- **Batch Limits**: Max 50 items per batch operation
- **Album Limits**: Max 20,000 items per album
- **Rate Limiting**: Different quotas than Drive API
- **Supported Formats**: JPEG, PNG, HEIC, WebP, GIF, MP4, MOV, AVI, WMV, FLV, ogg

### Integration Requirements
1. **OAuth Integration**: Use existing `TokenManager` from `@whatsapp-uploader/oauth`
2. **TypeScript**: Full type safety with comprehensive interfaces
3. **Stream-Based**: Memory-efficient processing using Node.js streams
4. **Cross-Platform**: Compatible with Android/Termux and Desktop platforms

## Technical Specifications

### API Integration
- **Google Photos Library API v1**: Use latest stable version
- **OAuth Scopes**: `https://www.googleapis.com/auth/photoslibrary.appendonly` (append-only access)
- **Rate Limiting**: Handle 429 responses with exponential backoff
- **Retry Logic**: Maximum 3 retries for transient errors

### Upload Process Flow
```
1. Validate media file format and size
2. Create upload token by uploading bytes
3. Create media item using upload token
4. Optional: Add to album
5. Report progress/completion
```

### Error Classification
```typescript
enum PhotosErrorType {
  PERMANENT = 'permanent',        // 400, 401, 403 - no retry
  TRANSIENT = 'transient',        // 429, ≥500 - retry with backoff
  NETWORK = 'network',            // Connection errors - retry
  QUOTA = 'quota',               // Storage quota exceeded - no retry
  INVALID_MEDIA = 'invalid_media' // Unsupported format - no retry
}
```

## Implementation Files

### Core Library Files (packages/google-photos/src/)

1. **photos-manager.ts** - Main coordinator class ✅ (skeleton exists)
2. **api-client.ts** - Google Photos API wrapper
3. **album-manager.ts** - Album creation and management
4. **media-uploader.ts** - Media upload with two-phase process
5. **batch-uploader.ts** - Efficient batch processing
6. **types/photos-types.ts** - TypeScript interfaces

### Expected Exports (packages/google-photos/src/index.ts)
```typescript
export { PhotosManager } from './photos-manager';
export * from './types/photos-types';
```

## Interface Contracts

### PhotosManager Public Interface
```typescript
interface PhotosManager {
  // From test suite requirements
  createAlbum(name: string): Promise<AlbumInfo>;
  uploadMedia(stream: Readable, metadata: MediaMetadata): Promise<UploadResult>;
  addToAlbum(mediaItemIds: string[], albumId: string): Promise<AlbumAddResult>;
  batchUpload(mediaItems: MediaItem[], options?: BatchOptions): Promise<BatchResult>;
  
  // Album management
  listAlbums(): Promise<AlbumInfo[]>;
  findAlbums(pattern: RegExp): Promise<AlbumInfo[]>;
  getAlbumDetails(albumId: string): Promise<AlbumDetails>;
  
  // Additional methods for implementation
  initialize(): Promise<void>;
}
```

### Key Types Required
```typescript
interface PhotosConfig {
  auth: any; // OAuth2 client from googleapis
  maxRetries?: number; // Default: 3
  batchSize?: number; // Default: 50 (Google Photos limit)
  uploadTimeout?: number; // Default: 300000 (5 minutes)
}

interface MediaMetadata {
  filename: string;
  mimeType: string;
  description?: string;
  timestamp?: Date;
}

interface MediaItem {
  stream: Readable;
  metadata: MediaMetadata;
}

interface UploadResult {
  success: boolean;
  mediaItem?: {
    id: string;
    filename: string;
    mimeType: string;
    mediaMetadata?: any;
  };
  error?: string;
}

interface AlbumInfo {
  id: string;
  title: string;
  url?: string;
  isWriteable?: boolean;
  mediaItemsCount?: number;
}

interface AlbumDetails extends AlbumInfo {
  coverPhotoId?: string;
}

interface AlbumAddResult {
  success: boolean;
  addedItems: string[];
  errors?: string[];
}

interface BatchResult {
  totalItems: number;
  successCount: number;
  failureCount: number;
  results: UploadResult[];
}

interface BatchOptions {
  onProgress?: (progress: { completed: number; total: number; percentage: number }) => void;
  albumId?: string; // Auto-add to album after upload
}
```

## Test Requirements

The comprehensive test suite exists at `tests/unit/google-photos/photos-manager.test.ts` with **744+ test assertions** that must all pass. Key test coverage includes:

### Album Management Tests
- ✅ Album creation with validation
- ✅ Album name sanitization and security
- ✅ Album listing and filtering
- ✅ Album details retrieval
- ✅ Error handling for album operations

### Media Upload Tests
- ✅ Single photo upload (two-phase process)
- ✅ Single video upload
- ✅ Upload failure handling
- ✅ Network error recovery
- ✅ Retry logic with exponential backoff
- ✅ Property-based testing for various media types

### Batch Processing Tests
- ✅ Batch upload with multiple items
- ✅ Large batch splitting (>50 items)
- ✅ Partial batch failure handling
- ✅ Progress reporting during batch operations

### Album Organization Tests
- ✅ Adding media items to albums
- ✅ Partial failure handling in album operations
- ✅ Batch size limit handling (50 items max)
- ✅ Input validation

### Error Handling Tests
- ✅ Quota exceeded errors (429)
- ✅ Invalid media format errors
- ✅ Property-based error response testing
- ✅ Network error recovery

## Implementation Strategy

### Phase 1: Core Structure (Day 1)
1. **Setup Infrastructure**
   - Create `api-client.ts` with OAuth integration
   - Implement `photos-types.ts` with all required interfaces
   - Setup error classification and retry logic

2. **Basic Album Management**
   - Implement `album-manager.ts` with creation/listing
   - Add album name validation and sanitization
   - Handle album API errors

### Phase 2: Media Upload (Day 2)
1. **Single Media Upload**
   - Implement `media-uploader.ts` with two-phase process
   - Add upload token generation and media item creation
   - Implement retry logic with exponential backoff

2. **Media Validation**
   - Add supported format validation
   - Implement file size checks
   - Add metadata extraction

### Phase 3: Batch Processing (Day 3)
1. **Batch Upload System**
   - Implement `batch-uploader.ts` with 50-item limit handling
   - Add progress tracking and reporting
   - Handle partial batch failures

2. **Album Integration**
   - Add automatic album addition after upload
   - Implement album organization features
   - Handle album size limits (20,000 items)

### Phase 4: Testing & Polish (Day 4)
1. **Test Suite Completion**
   - Ensure all 744+ test assertions pass
   - Fix any failing property-based tests
   - Add comprehensive error scenario coverage

2. **Performance Optimization**
   - Optimize batch processing performance
   - Implement efficient progress reporting
   - Add memory usage monitoring

## Quality Standards

### Performance Requirements
- **Memory Usage**: <256MB constant regardless of file size or batch size
- **Upload Speed**: >1MB/s for photos, >500KB/s for videos
- **Batch Processing**: Handle 1000+ items efficiently with progress tracking
- **Concurrent Uploads**: Support configurable concurrency (default: 3)

### Security Requirements
- **OAuth Integration**: Use existing TokenManager for secure authentication
- **Input Validation**: Sanitize all user inputs (album names, descriptions)
- **Path Security**: Prevent directory traversal in file paths
- **No Sensitive Logging**: Never log access tokens or user data

### Error Handling Standards
- **Retry Logic**: Exponential backoff (1s, 2s, 4s, 8s, 16s, max 30s)
- **Error Classification**: Clear distinction between permanent and transient errors
- **Progress Preservation**: Maintain upload progress across retry attempts
- **Graceful Degradation**: Partial success reporting for batch operations

## Google Photos API Specifics

### Rate Limits and Quotas
- **Requests per 100 seconds per user**: 10,000
- **Requests per 100 seconds**: 10,000,000
- **Media item creation**: 100 requests per minute per user
- **Album item addition**: 20 requests per minute per user

### Media Item Limits
- **File size**: Max 200MB for photos, 20GB for videos
- **Album capacity**: Max 20,000 items per album
- **Batch operations**: Max 50 items per request
- **Description length**: Max 1000 characters

### Upload Token Behavior
- **Expiration**: Upload tokens expire after 1 hour
- **Single Use**: Each upload token can only be used once
- **Error Handling**: Failed media item creation doesn't consume token

## Integration Points

### OAuth TokenManager Integration
```typescript
// Use existing TokenManager for authentication
import { TokenManager } from '@whatsapp-uploader/oauth';

class PhotosManager {
  private tokenManager: TokenManager;
  
  constructor(config: PhotosConfig) {
    this.tokenManager = config.tokenManager;
    // Initialize Google Photos API client with OAuth
  }
  
  private async getAuthenticatedClient() {
    const tokens = await this.tokenManager.loadTokens();
    if (!tokens || !await this.tokenManager.hasValidTokens()) {
      throw new Error('Authentication required');
    }
    
    return new google.auth.OAuth2Client({
      credentials: tokens
    });
  }
}
```

### Stream Processing Pattern
```typescript
// Memory-efficient stream processing
async uploadMedia(stream: Readable, metadata: MediaMetadata): Promise<UploadResult> {
  // Phase 1: Upload bytes
  const uploadToken = await this.uploadBytes(stream);
  
  // Phase 2: Create media item
  const mediaItem = await this.createMediaItem(uploadToken, metadata);
  
  return { success: true, mediaItem };
}

private async uploadBytes(stream: Readable): Promise<string> {
  // Use googleapis upload with stream directly
  // No intermediate buffer required (zero-copy)
}
```

## Testing Approach

### Test-Driven Development
1. **Start with failing tests**: All 744+ test assertions initially fail
2. **Implement to pass**: Build functionality to make tests pass
3. **Refactor with confidence**: Tests ensure no regression
4. **Property-based validation**: Use fast-check for edge case coverage

### Mock Strategy
The test suite uses sophisticated mocks:
- **Google Photos API**: Complete mock implementation
- **OAuth Client**: Integrated with TokenManager mocks
- **Stream Processing**: Readable stream mocks with various data patterns
- **Error Scenarios**: Comprehensive error response mocks

### Test Categories
1. **Unit Tests**: Individual method functionality (70%)
2. **Integration Tests**: OAuth + API interaction (20%)
3. **Property-Based Tests**: Edge cases and data validation (10%)

## Success Criteria

### Functional Success
- ✅ All 744+ test assertions pass
- ✅ Integration with OAuth TokenManager works
- ✅ Two-phase upload process functions correctly
- ✅ Batch processing handles large sets efficiently
- ✅ Album management operations work as expected
- ✅ Error handling covers all documented scenarios

### Performance Success
- ✅ Memory usage remains constant during large batch operations
- ✅ Upload progress reporting works accurately
- ✅ Retry logic functions without excessive delays
- ✅ Concurrent upload limits are respected

### Quality Success
- ✅ TypeScript strict mode compliance
- ✅ Comprehensive JSDoc documentation
- ✅ AIDEV comments for complex logic
- ✅ Security validation for all inputs
- ✅ Cross-platform compatibility verified

## Implementation Notes

### Key Differences from Drive API
1. **Upload Process**: Photos requires two-phase upload vs single-phase for Drive
2. **Organization**: Albums vs folders - different concepts and limits
3. **Batch Operations**: Photos has native batch support vs sequential for Drive
4. **Media Validation**: Photos has stricter format validation
5. **Rate Limits**: Different quota structures and limits

### Critical Implementation Details
1. **Upload Token Management**: Handle token expiration and single-use nature
2. **Batch Size Management**: Never exceed 50 items per API call
3. **Album Capacity**: Monitor and handle 20,000 item album limit
4. **Progress Reporting**: Accurate progress across multi-phase operations
5. **Error Recovery**: Distinguish between upload failures and media item creation failures

## Branch and Development Workflow

1. **Create Branch**: `TASK-004-dwarf` from main
2. **Development Approach**: Test-driven development with existing comprehensive test suite
3. **Commit Strategy**: Granular commits per phase with descriptive messages
4. **Integration Testing**: Verify OAuth TokenManager integration throughout
5. **Documentation**: Update AIDEV comments and JSDoc as implementation progresses

---

**Ready for Implementation**: All dependencies completed, comprehensive test suite available, architecture contracts defined.

**Success Measure**: All 744+ test assertions pass with full TypeScript compliance and OAuth integration.

**Expected Outcome**: Production-ready Google Photos library that integrates seamlessly with the WhatsApp upload workflow and provides robust photo/video backup capabilities.