# TASK-005 WhatsApp Scanner Library - Implementation Planning

**Agent:** dwarf  
**Started:** 2025-09-12 12:30  
**Branch:** TASK-005-dwarf  
**Dependencies:** TASK-001 (architecture), TASK-010 (project structure)  

## Implementation Strategy

### Phase 1: Core Infrastructure Setup
1. **Analyze existing test suite** to understand required interfaces
2. **Create basic class structure** with TypeScript interfaces
3. **Implement cross-platform path detection** (Windows, macOS, Linux, Android)
4. **Setup configuration handling** with platform-specific defaults

### Phase 2: Chat Discovery Engine
1. **Directory traversal and chat discovery** logic
2. **Chat type determination** (individual vs group)
3. **File count estimation** for discovered chats
4. **Last activity detection** from file timestamps

### Phase 3: File Analysis and Metadata
1. **File type classification** by extension and MIME type
2. **WhatsApp filename pattern recognition** (IMG-DATE-WA####.ext format)
3. **File metadata extraction** (size, timestamps, type)
4. **SHA-256 hash calculation** with streaming for large files

### Phase 4: Batch Processing and Performance
1. **Batch processing implementation** for memory efficiency
2. **Progress callback system** for UI integration
3. **Memory optimization** with streaming and garbage collection
4. **Error handling and recovery** strategies

### Phase 5: Security and Validation
1. **Path validation and security** (directory traversal prevention)
2. **Permission checking** across platforms
3. **Symlink handling** with loop detection
4. **Input sanitization** and edge case handling

## Test-Driven Development Approach

### Step 1: Run Tests First
```bash
npm test -- --testPathPattern=scanner/whatsapp-scanner.test.ts
```

### Step 2: Understand Test Requirements
- Analyze failing tests to understand expected interfaces
- Identify core methods and their signatures
- Note performance requirements (10K files in 5s)
- Understand cross-platform expectations

### Step 3: Implement Incrementally
- Start with basic class structure and constructor
- Add core methods one by one to make tests pass
- Focus on correctness before optimization
- Never modify tests - fix implementation instead

## Key Technical Decisions

### Cross-Platform Path Handling
```typescript
const PLATFORM_PATHS = {
  win32: [
    '%USERPROFILE%\\Documents\\WhatsApp',
    '%LOCALAPPDATA%\\WhatsApp'
  ],
  darwin: [
    '~/Library/Application Support/WhatsApp',
    '~/Documents/WhatsApp'
  ],
  linux: [
    '~/.config/WhatsApp',
    '~/Documents/WhatsApp'
  ],
  android: [
    '/storage/emulated/0/WhatsApp',
    '/sdcard/WhatsApp'
  ]
};
```

### WhatsApp Directory Structure
```
WhatsApp/
├── Media/
│   ├── WhatsApp Images/     → photos
│   ├── WhatsApp Video/      → videos  
│   ├── WhatsApp Documents/  → documents
│   ├── WhatsApp Audio/      → audio
│   └── WhatsApp Voice Notes/→ audio
└── [Chat Directories]/
    ├── Individual Chat/
    ├── Group Chat/
    └── Sent/
```

### File Type Classification
```typescript
const FILE_TYPES = {
  photo: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
  video: ['.mp4', '.avi', '.mov', '.3gp', '.mkv', '.webm'],
  document: ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.xlsx'],
  audio: ['.mp3', '.ogg', '.aac', '.m4a', '.wav', '.opus']
};
```

### Hash Calculation Strategy
- Files ≤50MB: Read into buffer and calculate hash
- Files >50MB: Use streaming approach with crypto streams
- Use SHA-256 for deduplication compatibility with Proxy library

## Performance Targets

### Memory Usage
- **Constant memory**: Regardless of file count or sizes
- **Streaming**: For files >50MB and hash calculation
- **Batch processing**: Process files in configurable batches (≤100)
- **Garbage collection**: Explicit cleanup of large objects

### Processing Speed  
- **Large directories**: Handle 10,000+ files within 5 seconds
- **Concurrent processing**: Limited concurrency (e.g., 10 files at once)
- **Progressive scanning**: Allow interruption and resumption
- **Smart caching**: Cache directory listings and file stats

### I/O Optimization
- **Minimal file access**: Only read what's necessary for metadata
- **Efficient directory traversal**: Use fs.readdir with withFileTypes
- **Permission checking**: Check access before attempting operations
- **Path normalization**: Standardize paths early to avoid repeated work

## Error Handling Strategy

### Error Categories
1. **Permission Errors** → Report accessible directories, continue processing
2. **File System Errors** → Retry with exponential backoff (1s, 2s, 4s)
3. **Path Validation Errors** → Prevent directory traversal, sanitize input
4. **Memory Errors** → Use streaming for large files, batch processing
5. **Platform Errors** → Graceful degradation, platform-specific handling

### Error Recovery Patterns
```typescript
interface ScannerError extends Error {
  code: string;
  retryable: boolean;
  category: 'permission' | 'filesystem' | 'validation' | 'memory' | 'platform';
}
```

## Implementation Order

### 1. Core Class and Configuration (First)
- `WhatsAppScanner` class constructor
- Configuration handling with defaults
- Platform detection logic
- Basic validation methods

### 2. Path Detection and Validation  
- `PathDetector` for cross-platform path discovery
- `PathValidator` for security and permissions
- Path normalization utilities
- Permission checking methods

### 3. Chat Discovery Engine
- `ChatDiscovery` for finding chat directories
- Chat type determination logic
- File count estimation
- Last activity detection

### 4. File Analysis and Metadata
- `FileAnalyzer` for metadata extraction
- MIME type detection
- WhatsApp pattern recognition
- Basic metadata collection

### 5. Hash Calculation and Streaming
- `HashCalculator` with streaming support
- Memory-efficient large file handling
- Progress reporting for hash calculation
- Error handling for I/O operations

### 6. Batch Processing and Performance
- `BatchProcessor` for memory management
- Progress callback implementation
- Concurrent processing limits
- Memory optimization strategies

## Integration Points

### With Other Libraries
- **Proxy Library**: Will receive `FileMetadata[]` from scanner
- **Database Library**: May cache scan results for performance
- **CLI Application**: Will use progress callbacks for user feedback

### Dependencies
- **Node.js built-ins**: `fs/promises`, `path`, `crypto`, `stream`, `os`
- **No external dependencies**: Self-contained implementation
- **TypeScript**: Strict mode compliance required

## Files to Implement

### Core Implementation
1. `packages/scanner/src/WhatsAppScanner.ts` - Main class
2. `packages/scanner/src/platform/PathDetector.ts` - Path detection
3. `packages/scanner/src/discovery/ChatDiscovery.ts` - Chat discovery
4. `packages/scanner/src/analysis/FileAnalyzer.ts` - File analysis
5. `packages/scanner/src/processing/BatchProcessor.ts` - Batch processing
6. `packages/scanner/src/streaming/HashCalculator.ts` - Hash calculation
7. `packages/scanner/src/security/PathValidator.ts` - Security validation

### Supporting Files
8. `packages/scanner/src/types/index.ts` - TypeScript interfaces
9. `packages/scanner/src/constants/index.ts` - Constants and defaults
10. `packages/scanner/src/config/defaults.ts` - Default configuration
11. `packages/scanner/src/index.ts` - Public API exports

## Success Criteria

### Functional Requirements
- [ ] All unit tests pass (650+ assertions)
- [ ] Cross-platform path detection works correctly
- [ ] Chat discovery finds all chat types
- [ ] File metadata extraction is complete and accurate
- [ ] SHA-256 hash calculation works for all file sizes
- [ ] WhatsApp filename pattern recognition works correctly

### Performance Requirements
- [ ] Handle 10,000+ files within 5 seconds
- [ ] Constant memory usage regardless of file count
- [ ] Streaming works for large files (>50MB)
- [ ] Batch processing maintains efficiency

### Quality Requirements
- [ ] TypeScript strict mode compliance
- [ ] No external runtime dependencies
- [ ] Comprehensive error handling
- [ ] Security validation prevents directory traversal
- [ ] Progress reporting works correctly

## Risk Mitigation

### Technical Risks
1. **Performance with large directories** → Implement streaming and batching early
2. **Cross-platform compatibility** → Test on multiple platforms, use Node.js built-ins
3. **Memory usage with large files** → Use streaming for hash calculation
4. **Permission handling** → Graceful fallback and clear error reporting

### Development Risks  
1. **Complex test requirements** → Focus on TDD, make tests pass incrementally
2. **Integration complexity** → Keep interfaces simple and well-defined
3. **Time constraints** → Prioritize core functionality first, optimize later

## Next Steps

1. **Run tests** to see current failures
2. **Analyze test expectations** to understand required interfaces
3. **Implement basic class structure** with configuration
4. **Add cross-platform path detection**
5. **Implement chat discovery logic**
6. **Add file metadata extraction**
7. **Implement hash calculation with streaming**
8. **Add batch processing and optimization**
9. **Comprehensive testing and validation**

---

This plan provides a structured approach to implementing the WhatsApp Scanner library with focus on TDD, performance, and cross-platform compatibility. The implementation will be done incrementally to ensure all tests pass and requirements are met.