# TASK-003: Google Drive Library Development Specification

**Agent:** dwarf  
**Priority:** 2  
**Created:** 2025-09-12  
**Dependencies:** TASK-001 (architecture), TASK-002 (OAuth), TASK-010 (project structure)

---

## Overview

Implement the Google Drive API integration library for document and audio file uploads with resumable upload capabilities, metadata handling, and comprehensive error recovery. This library will integrate with the existing OAuth TokenManager for authentication.

## Architecture Context

From the system architecture, the Google Drive Library is responsible for:
- Google Drive API integration for documents and audio files
- Folder creation and organization  
- Resumable uploads for files >5MB
- Metadata construction and preservation
- API error handling with retry logic
- Storage quota management

## Requirements

### Core Functionality
1. **File Upload**: Upload any file type to Google Drive with metadata preservation
2. **Resumable Uploads**: Handle large files (>5MB) with resumable upload protocol
3. **Folder Management**: Create and organize folders with hierarchy support
4. **Duplicate Detection**: Check if files already exist before uploading
5. **Storage Quota**: Monitor and report Drive storage usage
6. **Progress Tracking**: Provide upload progress callbacks for UI integration
7. **Error Recovery**: Comprehensive retry logic with exponential backoff

### Integration Requirements
1. **OAuth Integration**: Use existing `TokenManager` from `@whatsapp-uploader/oauth`
2. **TypeScript**: Full type safety with comprehensive interfaces
3. **Stream-Based**: Memory-efficient processing using Node.js streams
4. **Cross-Platform**: Compatible with Android/Termux and Desktop platforms

## Technical Specifications

### API Integration
- **Google Drive API v3**: Use latest stable version
- **OAuth Scopes**: `https://www.googleapis.com/auth/drive.file` (write-only access)
- **Rate Limiting**: Handle 429 responses with exponential backoff
- **Retry Logic**: Maximum 3 retries for transient errors

### File Size Handling
- **Small files (<5MB)**: Simple upload via `files.create`
- **Large files (≥5MB)**: Resumable upload protocol
- **Maximum file size**: 5TB (Google Drive limit)
- **Chunk size**: 256KB for resumable uploads

### Error Classification
```typescript
enum ErrorType {
  PERMANENT = 'permanent',    // 400, 401, 403 - no retry
  TRANSIENT = 'transient',    // 429, ≥500 - retry with backoff
  NETWORK = 'network',        // Connection errors - retry
  QUOTA = 'quota'            // Storage quota exceeded - no retry
}
```

## Implementation Files

### Core Library Files (packages/google-drive/src/)

1. **drive-manager.ts** - Main coordinator class ✅ (skeleton exists)
2. **api-client.ts** - Google Drive API wrapper
3. **folder-manager.ts** - Folder creation and management
4. **upload-handler.ts** - File upload with resumable support
5. **metadata-builder.ts** - Drive-specific metadata construction
6. **types/drive-types.ts** - TypeScript interfaces

### Expected Exports (packages/google-drive/src/index.ts)
```typescript
export { DriveManager } from './drive-manager';
export * from './types/drive-types';
```

## Interface Contracts

### DriveManager Public Interface
```typescript
interface DriveManager {
  // From architecture specification
  createFolder(name: string, parentId?: string): Promise<string>;
  uploadFile(stream: Readable, metadata: FileMetadata, options?: UploadOptions): Promise<UploadResult>;
  checkExists(name: string, parentId?: string): Promise<ExistenceResult>;
  getUsage(): Promise<StorageInfo>;
  
  // Additional methods for implementation
  initialize(): Promise<void>;
}
```

### Key Types Required
```typescript
interface DriveConfig {
  oauthManager: TokenManager; // From @whatsapp-uploader/oauth
  maxRetries?: number;        // Default: 3
  retryDelay?: number;       // Default: 1000ms
  resumableThreshold?: number; // Default: 5MB
}

interface FileMetadata {
  name: string;
  mimeType: string;
  parents?: string[];
  description?: string;
  properties?: Record<string, string>;
}

interface UploadOptions {
  onProgress?: (progress: ProgressInfo) => void;
  timeout?: number;
  retryOptions?: RetryOptions;
}

interface UploadResult {
  id: string;
  name: string;
  size?: number;
  mimeType: string;
  createdTime: string;
  webViewLink?: string;
}

interface ExistenceResult {
  exists: boolean;
  file: DriveFile | null;
}

interface StorageInfo {
  totalSpace: number;      // In bytes
  usedSpace: number;       // In bytes  
  driveUsage: number;      // Drive-specific usage
  availableSpace: number;  // Remaining space
}

interface ProgressInfo {
  uploaded: number;        // Bytes uploaded
  total: number;           // Total file size
  percentage: number;      // 0-100
}
```

## Test Requirements

### Test Files to Pass
1. **tests/unit/google-drive/drive-manager.test.ts** ✅ (comprehensive test suite exists)
   - **569 test assertions** covering all functionality
   - Property-based testing with fast-check
   - Mock Google APIs integration
   - Error handling and retry scenarios
   - Resumable upload testing
   - Rate limiting compliance

### Key Test Scenarios
1. **Folder Creation**: Various folder names, with/without parents, error handling
2. **File Uploads**: Small files, large files, resumable uploads, progress tracking
3. **Existence Checks**: File search with/without parent folders, API errors
4. **Storage Usage**: Quota information, unlimited accounts, access errors  
5. **Error Handling**: Retry logic, permanent vs transient errors, rate limiting
6. **Resumable Uploads**: Size thresholds, interruption recovery, progress callbacks

## Implementation Guidelines

### 1. Start with Test Analysis
- Read and understand `tests/unit/google-drive/drive-manager.test.ts`
- Identify all mock expectations and required behaviors
- Note the specific API call patterns expected by tests

### 2. OAuth Integration Pattern
```typescript
import { TokenManager } from '@whatsapp-uploader/oauth';

class ApiClient {
  constructor(private tokenManager: TokenManager) {}
  
  async makeRequest(request: any) {
    const token = await this.tokenManager.getValidToken();
    // Use token for Drive API authentication
  }
}
```

### 3. Error Handling Implementation
- Classify errors by HTTP status code
- Implement exponential backoff for retries
- Handle rate limiting with `Retry-After` headers
- Provide meaningful error messages to users

### 4. Resumable Upload Protocol
- Use Google's resumable upload API for files ≥5MB
- Implement upload session management
- Support progress callbacks
- Handle interruption and resume scenarios

### 5. Memory Management
- Use streams throughout for large file handling
- Avoid loading entire files into memory
- Implement proper cleanup for interrupted uploads

## Success Criteria

### Functional Tests Must Pass
- All 569 test assertions in drive-manager.test.ts
- Property-based tests with various inputs
- Mock API integration tests
- Error scenario handling

### Performance Requirements
- Upload 100MB file with <256MB memory usage
- Resumable upload recovery within 30 seconds
- Rate limit compliance (no API violations)

### Integration Requirements  
- Successful OAuth token usage via TokenManager
- Stream-based processing throughout
- Cross-platform path handling
- TypeScript compilation without errors

## Dependencies and Integration

### Required Dependencies
```json
{
  "@whatsapp-uploader/oauth": "workspace:*",
  "googleapis": "^128.0.0",
  "stream": "node builtin"
}
```

### OAuth Integration
- Import `TokenManager` from existing OAuth library
- Use `getValidToken()` for API authentication
- Handle token refresh automatically
- Support revocation scenarios

### Testing Dependencies
- Use existing Jest configuration
- Leverage fast-check for property testing
- Mock `googleapis` package as shown in tests
- Use existing test fixtures and generators

## Implementation Order

### Phase 1: Core Structure (Day 1)
1. Implement `api-client.ts` with OAuth integration
2. Create `drive-types.ts` with all required interfaces
3. Basic `drive-manager.ts` initialization

### Phase 2: Upload Functionality (Day 2)
1. Implement `upload-handler.ts` with small file support
2. Add `metadata-builder.ts` for Drive metadata construction
3. Basic upload tests passing

### Phase 3: Advanced Features (Day 3)
1. Resumable upload implementation
2. `folder-manager.ts` for folder operations
3. Comprehensive error handling and retries

### Phase 4: Testing and Polish (Day 4)
1. All tests passing
2. Performance optimization
3. Documentation and type refinement

## Git Workflow

### Branch Strategy
- **Branch Name**: `TASK-003-dwarf`
- **Base Branch**: Current working branch (TASK-002-dwarf)
- **Target**: Main branch after architect review

### Commit Strategy
```bash
# Example commits:
git commit -m "feat(ai-dwarf-task-003): implement DriveManager with OAuth integration"
git commit -m "feat(ai-dwarf-task-003): add resumable upload support for large files"  
git commit -m "feat(ai-dwarf-task-003): implement folder management with hierarchy support"
git commit -m "test(ai-dwarf-task-003): ensure all drive-manager tests pass"
```

## Quality Assurance

### Code Quality
- All TypeScript strict mode compliance
- ESLint passing without warnings
- Comprehensive JSDoc documentation
- AIDEV- comments for complex logic

### Security Requirements
- Use existing TokenManager security patterns
- Validate all file paths and names
- Handle API credentials securely
- No sensitive data in logs

### Performance Benchmarks  
- File upload: >1MB/s on average network
- Memory usage: <256MB for any file size
- Resumable recovery: <30 seconds

---

## Notes for Implementation

1. **Test-Driven Development**: The comprehensive test suite provides a complete specification - implement to make all tests pass
2. **OAuth Integration**: The TokenManager is already implemented and tested - use its `getValidToken()` method
3. **Architecture Compliance**: Follow the established patterns from the OAuth library for consistency
4. **Stream Processing**: Use Node.js streams throughout to maintain zero-copy architecture
5. **Error Recovery**: Implement robust error handling as this library will handle user's important files

This task builds on the solid OAuth foundation (TASK-002) and enables the core file upload functionality for the WhatsApp Google Uploader system.