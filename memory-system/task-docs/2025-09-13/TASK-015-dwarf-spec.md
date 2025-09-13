# TASK-015: Complete Proxy Implementation (Finish TASK-006)

## Overview
**Agent**: Dwarf  
**Priority**: 1 (Critical)  
**Phase**: Phase 3 - COMPLETE PROXY IMPLEMENTATION  
**Estimated Effort**: 8-10 hours  
**Branch**: TASK-015-dwarf  

## Context
TASK-006 was marked completed but is only ~20% implemented with placeholder code. The current proxy has Google Sheets integration but **no actual upload functionality**. This task completes the missing 80% with a focus on **simple, working implementation** rather than enterprise complexity.

### Current State (20% Complete):
```typescript
// ✅ WORKING: Google Sheets integration for progress/deduplication
await this.db.updateProgress(...)
await this.db.isFileUploaded(fileHash)
await this.db.saveUploadedFile(...)

// ❌ BROKEN: Placeholder file upload 
// TODO: Actual upload logic here (integrate with google-drive/google-photos)
await this.uploadFile(file); // DOES NOT EXIST

// ❌ BROKEN: Fake file hashing
file.hash = this.calculateHash(file.path); // Hashes filepath, not content!

// ❌ BROKEN: No rate limiting enforcement
// Config exists but isn't used

// ❌ BROKEN: No retry logic, error handling, smart routing
```

### Target Complete Implementation:
```typescript
// Real file uploads integrated with GoogleApis
await this.googleApis.uploadPhoto(file.path)  
await this.googleApis.uploadDocument(file.path)

// Content-based SHA-256 hashing
file.hash = await this.calculateFileHash(file.path) // Read file bytes

// Simple but effective error handling and retries
// Basic rate limiting (maxConcurrent uploads)
// Smart routing (photos→Photos, docs→Drive)
```

## Objectives
1. **Complete Upload Integration**: Replace TODO placeholders with real uploads
2. **Fix File Hashing**: Hash file content, not file paths
3. **Add Error Handling**: Simple retry logic for failed uploads  
4. **Implement Smart Routing**: Route files to appropriate Google service
5. **Add Rate Limiting**: Basic concurrent upload limits
6. **Enable Resume Capability**: Handle interrupted upload sessions

## Detailed Requirements

### 1. Complete Upload Integration

**Replace placeholder code** in `src/uploader/index.ts`:

```typescript
// CURRENT (placeholder)
// TODO: Actual upload logic here (integrate with google-drive/google-photos)

// NEW (working implementation)
async uploadFile(file: FileUpload): Promise<UploadResult> {
  const category = this.categorizeFile(file.mimeType);
  
  try {
    let googleId: string;
    
    switch (category) {
      case 'photo':
        googleId = await this.googleApis.uploadPhoto(file.path);
        break;
      case 'video':
        googleId = await this.googleApis.uploadVideo(file.path);
        break;
      case 'document':
        googleId = await this.googleApis.uploadDocument(file.path);
        break;
      default:
        throw new Error(`Unsupported file category: ${category}`);
    }
    
    return { id: googleId, name: file.name, success: true };
    
  } catch (error) {
    return { error: error.message, name: file.name, success: false };
  }
}
```

### 2. Fix Content-Based File Hashing

**Replace fake hashing** with real content hashing:

```typescript
// CURRENT (broken - hashes filepath)
calculateHash(filepath: string): string {
  return createHash('sha256').update(filepath).digest('hex');
}

// NEW (working - hashes file content)
async calculateFileHash(filepath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = fs.createReadStream(filepath);
    
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}
```

### 3. Implement Smart File Routing

**Add file categorization logic**:

```typescript
private categorizeFile(mimeType: string): 'photo' | 'video' | 'document' {
  if (mimeType.startsWith('image/')) return 'photo';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document'; // Documents, audio, other files → Google Drive
}
```

**Update routing logic**:
- **Photos/Images** → Google Photos  
- **Videos** → Google Photos
- **Documents/Audio/Other** → Google Drive

### 4. Add Simple Error Handling and Retries

**Implement basic retry logic**:

```typescript
async uploadWithRetry(file: FileUpload, maxRetries: number = 3): Promise<UploadResult> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await this.uploadFile(file);
      if (result.success) return result;
      
      // Wait before retry (simple exponential backoff)
      await this.sleep(Math.pow(2, attempt) * 1000);
      
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors (auth, file not found, etc.)
      if (this.isPermanentError(error)) {
        break;
      }
      
      if (attempt < maxRetries) {
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }
  
  return { 
    error: lastError?.message || 'Upload failed after retries', 
    name: file.name, 
    success: false 
  };
}

private isPermanentError(error: any): boolean {
  // Don't retry on auth errors, file not found, quota exceeded
  const message = error.message?.toLowerCase() || '';
  return message.includes('unauthorized') || 
         message.includes('not found') || 
         message.includes('quota exceeded');
}
```

### 5. Implement Basic Rate Limiting

**Add concurrent upload management**:

```typescript
async uploadFiles(files: FileUpload[], options: UploadOptions): Promise<void> {
  const { maxConcurrent = 3 } = this.config.rateLimit || {};
  const chatId = options.chatId || 'default';
  
  // Update initial progress
  await this.db.updateProgress({
    chatId,
    totalFiles: files.length,
    processedFiles: 0,
    status: 'active',
    lastUpdated: new Date().toISOString()
  });
  
  // Process files with concurrency control
  const semaphore = new Semaphore(maxConcurrent);
  const results: PromiseSettledResult<void>[] = [];
  
  for (let i = 0; i < files.length; i += maxConcurrent) {
    const batch = files.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(async (file) => {
      await semaphore.acquire();
      try {
        await this.processFile(file, chatId);
      } finally {
        semaphore.release();
      }
    });
    
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);
    
    // Update progress after each batch
    await this.db.updateProgress({
      chatId,
      totalFiles: files.length,
      processedFiles: i + batch.length,
      status: 'active',
      lastUpdated: new Date().toISOString()
    });
  }
  
  // Final status update
  await this.db.updateProgress({
    chatId,
    totalFiles: files.length,
    processedFiles: files.length,
    status: 'completed',
    lastUpdated: new Date().toISOString()
  });
}
```

### 6. Add Resume Capability

**Handle interrupted sessions**:

```typescript
async resumeUpload(chatId: string): Promise<void> {
  const progress = await this.db.getProgress(chatId);
  if (!progress || progress.status === 'completed') {
    throw new Error('No resumable upload found');
  }
  
  // Get list of files from original scan
  // Filter out already uploaded files
  // Continue upload from where it left off
  
  const allFiles = await this.loadOriginalFileList(chatId);
  const uploadedHashes = await this.db.getUploadedHashes(chatId);
  const remainingFiles = allFiles.filter(file => !uploadedHashes.has(file.hash));
  
  await this.uploadFiles(remainingFiles, { chatId });
}
```

### 7. Integrate with Simplified GoogleApis (from TASK-014)

**Update imports and initialization**:

```typescript
import { GoogleApis } from '../google-apis';

export class UploaderManager {
  private googleApis: GoogleApis;
  private db: SheetsDatabase;
  
  constructor(config: UploaderConfig) {
    this.googleApis = new GoogleApis(config.credentialsPath, config.tokenPath);
    this.db = new SheetsDatabase(this.googleApis.getAuthClient());
  }
  
  async initialize(): Promise<void> {
    await this.googleApis.authenticate();
    await this.db.initialize();
  }
}
```

## Critical Missing Implementations

### Must Implement (80% of TASK-006):
1. **Real upload integration**: Connect to GoogleApis class for actual uploads
2. **Content-based file hashing**: Read and hash file bytes (not paths)
3. **Smart routing**: Photos/videos → Google Photos, documents → Google Drive
4. **Basic error handling**: Try/catch with simple retry logic
5. **Rate limiting**: Control concurrent uploads (respect maxConcurrent)
6. **Progress tracking**: Update Google Sheets with real progress
7. **Resume capability**: Handle interrupted upload sessions

### Nice to Have (if time permits):
1. Batch upload optimization
2. Upload speed throttling  
3. Better error classification
4. Upload preview/dry-run mode

## Acceptance Criteria

### ✅ Core Upload Functionality
- [ ] **Real uploads work**: Files successfully uploaded to Google Photos/Drive
- [ ] **File hashing works**: SHA-256 hash computed from file content
- [ ] **Smart routing works**: Photos→Photos, documents→Drive
- [ ] **Deduplication works**: Skip files already uploaded (by hash)
- [ ] **Progress tracking works**: Google Sheets shows real upload progress

### ✅ Error Handling & Reliability
- [ ] **Retry logic works**: Failed uploads retried with exponential backoff
- [ ] **Error classification**: Permanent errors (auth, not found) not retried
- [ ] **Graceful failure**: Individual file failures don't crash entire batch
- [ ] **Clear error messages**: Failed uploads provide useful error information

### ✅ Performance & Rate Limiting  
- [ ] **Concurrent uploads**: Multiple files uploaded simultaneously (respects maxConcurrent)
- [ ] **Rate limiting enforced**: Config settings actually control upload behavior
- [ ] **Progress updates**: Reasonable frequency (per batch, not per file)
- [ ] **Memory efficiency**: Large files handled without memory issues

### ✅ Resume & Recovery
- [ ] **Resume capability**: Interrupted uploads can be resumed
- [ ] **State persistence**: Upload state survives application restart
- [ ] **Clean completion**: Successful uploads marked completed in database

### ✅ Integration Tests
- [ ] **End-to-end upload**: Scan files → upload → verify in Google Photos/Drive
- [ ] **Deduplication test**: Re-running upload skips already uploaded files
- [ ] **Error recovery test**: Failed uploads retry and eventually succeed
- [ ] **Resume test**: Interrupted upload resumes from correct point

## Risk Mitigation

### **High Risk**: Google API Failures
- **Mitigation**: Robust error handling, clear error messages
- **Validation**: Test with real files and Google API responses  
- **Fallback**: Retry logic handles transient failures

### **Medium Risk**: File Hashing Performance
- **Mitigation**: Streaming hash calculation for large files
- **Validation**: Test with various file sizes (1MB to 1GB)
- **Optimization**: Consider parallel hashing if needed

### **Low Risk**: Rate Limiting Issues
- **Mitigation**: Conservative default limits, configurable settings
- **Validation**: Test with different concurrency settings
- **Monitoring**: Log rate limit hits and adjust accordingly

## Definition of Done
1. ✅ All placeholder TODO comments replaced with working code
2. ✅ File uploads work for photos, videos, and documents  
3. ✅ Content-based SHA-256 hashing implemented and working
4. ✅ Smart file routing to appropriate Google services
5. ✅ Basic error handling and retry logic working
6. ✅ Rate limiting controls concurrent uploads effectively
7. ✅ Resume capability handles interrupted sessions
8. ✅ All integration tests passing with real uploads
9. ✅ Google Sheets database correctly tracking upload progress
10. ✅ Ready for CLI integration (TASK-007)

## Success Metrics
- **Functionality**: 100% of core upload features working
- **Reliability**: <5% upload failure rate for valid files  
- **Performance**: Handle 1000+ files without issues
- **Usability**: Clear error messages and progress indication

## Dependencies
- **Depends on**: TASK-014 (Simplified GoogleApis class must exist)
- **Blocks**: TASK-007 (CLI needs working upload functionality)

## Notes for Dwarf Agent
- **Focus on working code** - replace ALL placeholder/TODO comments
- **Test with real files** - ensure uploads actually work with Google APIs
- **Keep it simple** - this is a personal backup tool, not enterprise system
- **Handle errors gracefully** - individual file failures shouldn't crash batch
- **Document any limitations** - note what works and what doesn't

**Critical Success Factor**: At completion, a user should be able to scan WhatsApp files and successfully upload them to Google Photos and Google Drive with progress tracking and resume capability.

This completes the proxy implementation that was started in TASK-006, delivering the missing 80% of functionality needed for a working WhatsApp backup system.