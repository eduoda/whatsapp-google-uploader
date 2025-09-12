# TASK-004: Google Photos Library Development - Planning

**Agent:** dwarf  
**Task:** TASK-004 - Google Photos Library Development  
**Created:** 2025-09-12 09:15  
**Branch:** TASK-004-dwarf

---

## Task Understanding

Implement Google Photos API integration library with two-phase upload process, album management, and batch processing. Key requirements:

- **Two-phase upload**: Upload bytes → get token → create media item
- **Album management**: Create/list/manage albums with 20,000 item limit
- **Batch processing**: Handle 50-item batch limits efficiently  
- **OAuth integration**: Use existing TokenManager from TASK-002
- **Stream-based**: Memory-efficient processing
- **Comprehensive testing**: All 744+ test assertions must pass

## Technical Analysis

### Google Photos API Differences from Drive
1. **Upload Process**: Two-phase vs single-phase
2. **Organization**: Albums (20K limit) vs folders (unlimited)
3. **Batch Operations**: Native batch support vs sequential
4. **Rate Limits**: Different quota structures
5. **Media Validation**: Stricter format requirements

### Key Integration Points
- OAuth TokenManager from `@whatsapp-uploader/oauth`
- Google Photos Library API v1
- Stream processing for zero-copy architecture
- Error classification similar to Drive implementation

## Implementation Strategy

### Phase 1: Core Infrastructure (30 min)
1. **Review existing structure**:
   - Examine current `packages/google-photos/src/photos-manager.ts`
   - Check test requirements in `tests/unit/google-photos/photos-manager.test.ts`
   - Understand OAuth TokenManager integration

2. **Setup API Client** (`api-client.ts`):
   - Google Photos API wrapper with OAuth integration
   - Error classification (permanent, transient, network, quota, invalid_media)
   - Retry logic with exponential backoff (1s, 2s, 4s, 8s, 16s, max 30s)

3. **Define Types** (`types/photos-types.ts`):
   - Complete TypeScript interfaces per specification
   - Error enums and response types
   - Configuration interfaces

### Phase 2: Album Management (30 min) 
1. **Album Manager** (`album-manager.ts`):
   - Create albums with name validation/sanitization
   - List/search albums with pattern matching
   - Handle album capacity limits (20,000 items)
   - Album details retrieval

2. **Security validation**:
   - Input sanitization for album names
   - Path security validation
   - No sensitive data logging

### Phase 3: Media Upload (45 min)
1. **Media Uploader** (`media-uploader.ts`):
   - Two-phase upload: uploadBytes() → createMediaItem()
   - Upload token management (1-hour expiry, single-use)
   - Media format validation (JPEG, PNG, HEIC, WebP, GIF, MP4, MOV, AVI, WMV, FLV, ogg)
   - Stream processing for memory efficiency

2. **Error handling**:
   - Distinguish upload failures vs media item creation failures
   - Handle token expiration gracefully
   - Network error recovery with retry logic

### Phase 4: Batch Processing (45 min)
1. **Batch Uploader** (`batch-uploader.ts`):
   - Handle >50 item batches by splitting
   - Progress tracking across multi-phase operations
   - Partial failure handling
   - Concurrent upload management (default: 3)

2. **Album Integration**:
   - Auto-add to album after upload (if specified)
   - Handle album addition batch limits
   - Progress reporting for album operations

### Phase 5: PhotosManager Integration (30 min)
1. **Main Coordinator** (`photos-manager.ts`):
   - Integrate all components
   - Public API implementation per test requirements
   - Configuration management
   - Initialize method for setup

2. **Export configuration** (`index.ts`):
   - Clean public API exports
   - Type exports for external use

### Phase 6: Testing & Validation (30 min)
1. **Test execution**:
   - Run comprehensive test suite: `npm test tests/unit/google-photos/`
   - Fix any failing assertions
   - Verify OAuth integration works

2. **Quality verification**:
   - TypeScript strict mode compliance
   - Memory usage validation
   - Performance requirements check

## Technical Specifications

### API Integration Details
```typescript
// Google Photos Library API v1
const PHOTOS_API_BASE = 'https://photoslibrary.googleapis.com/v1';
const PHOTOS_UPLOAD_BASE = 'https://photoslibrary.googleapis.com/v1/uploads';

// OAuth scope required
const PHOTOS_SCOPE = 'https://www.googleapis.com/auth/photoslibrary.appendonly';

// Rate limits to respect
const RATE_LIMITS = {
  requests_per_100s_per_user: 10000,
  media_creation_per_minute: 100,
  album_addition_per_minute: 20
};
```

### Upload Process Flow
```typescript
async uploadMedia(stream: Readable, metadata: MediaMetadata): Promise<UploadResult> {
  // Phase 1: Upload bytes to get upload token
  const uploadToken = await this.uploadBytes(stream);
  
  // Phase 2: Create media item using upload token
  const mediaItem = await this.createMediaItem(uploadToken, metadata);
  
  return { success: true, mediaItem };
}
```

### Error Classification System
```typescript
enum PhotosErrorType {
  PERMANENT = 'permanent',        // 400, 401, 403 - no retry
  TRANSIENT = 'transient',        // 429, ≥500 - retry with backoff  
  NETWORK = 'network',            // Connection errors - retry
  QUOTA = 'quota',               // Storage quota exceeded - no retry
  INVALID_MEDIA = 'invalid_media' // Unsupported format - no retry
}
```

## Dependencies & Integration

### OAuth TokenManager Integration
```typescript
import { TokenManager } from '@whatsapp-uploader/oauth';

// Use existing TokenManager for authentication
private async getAuthenticatedClient() {
  const tokens = await this.tokenManager.loadTokens();
  if (!tokens || !await this.tokenManager.hasValidTokens()) {
    throw new Error('Authentication required');
  }
  
  return new google.auth.OAuth2Client({
    credentials: tokens
  });
}
```

### Stream Processing Pattern
- Use Node.js Readable streams directly
- No intermediate buffering (zero-copy)
- Memory-efficient for large files
- Progress tracking through stream events

## Testing Strategy

### Test-Driven Development Approach
1. **Start with 744+ failing tests** - comprehensive coverage exists
2. **Implement incrementally** - make tests pass one by one
3. **Focus on test requirements** - tests define exact API contracts
4. **Don't modify tests** - fix implementation to match test expectations

### Key Test Categories
- Album management (creation, listing, validation)
- Single media upload (two-phase process)
- Batch processing (splitting, progress, partial failures)
- Error handling (all error types and recovery)
- Album organization (adding items, limits)
- Property-based testing with fast-check

## Success Criteria

### Functional Requirements
- ✅ All 744+ test assertions pass
- ✅ OAuth TokenManager integration works
- ✅ Two-phase upload process functions correctly
- ✅ Album management handles all operations
- ✅ Batch processing respects 50-item limits
- ✅ Error handling covers all scenarios

### Performance Requirements  
- ✅ Memory usage <256MB constant
- ✅ Upload progress reporting accurate
- ✅ Retry logic functions efficiently
- ✅ Concurrent upload limits respected

### Quality Standards
- ✅ TypeScript strict mode compliance
- ✅ Cross-platform compatibility
- ✅ Security validation for inputs
- ✅ Comprehensive JSDoc documentation
- ✅ AIDEV comments for complex logic

## Risk Assessment

### Technical Risks
- **Two-phase upload complexity**: Different from Drive API - Mitigation: Follow existing test patterns
- **Batch size limits**: Must never exceed 50 items - Mitigation: Implement strict validation  
- **Token expiration**: Upload tokens expire in 1 hour - Mitigation: Handle expiration gracefully
- **Mock integration**: Complex googleapis mocking - Mitigation: Follow Drive implementation patterns

### Integration Risks
- **OAuth dependency**: Requires TokenManager - Mitigation: Already completed in TASK-002
- **Test suite complexity**: 744+ assertions - Mitigation: TDD approach, implement incrementally
- **API differences**: Photos vs Drive patterns - Mitigation: Study specification carefully

### Time Risks
- **Comprehensive testing**: Large test suite - Mitigation: Focus on failing tests first
- **API learning curve**: New API patterns - Mitigation: Use specification and test guidance

## Implementation Timeline

- **Phase 1 (30 min)**: Core infrastructure & API client
- **Phase 2 (30 min)**: Album management
- **Phase 3 (45 min)**: Media upload with two-phase process
- **Phase 4 (45 min)**: Batch processing & album integration
- **Phase 5 (30 min)**: PhotosManager integration
- **Phase 6 (30 min)**: Testing & validation

**Total Estimate**: 3.5 hours

## Next Steps

1. Examine current library structure and test requirements
2. Study OAuth TokenManager integration patterns from TASK-002
3. Review Drive implementation patterns from TASK-003 for comparison
4. Start with core infrastructure and API client setup
5. Follow TDD approach with comprehensive test suite

---

**Ready to implement**: All dependencies completed, clear specification, comprehensive test coverage available.