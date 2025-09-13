# TASK-005: WhatsApp Scanner Library Development - Technical Specification

**Agent:** dwarf  
**Priority:** 2  
**Phase:** Phase 2 - Core Features  
**Dependencies:** TASK-001 (architecture), TASK-010 (project structure)  
**Assigned:** 2025-09-12  

---

## Executive Summary

Develop the WhatsApp Scanner library (`@whatsapp-uploader/scanner`) that provides cross-platform WhatsApp directory scanning, file discovery, and metadata extraction capabilities. This library serves as the foundation for discovering and cataloging WhatsApp media files across different operating systems and directory structures.

## Technical Requirements

### Core Functionality

#### 1. Cross-Platform Directory Detection
- **Windows:** `%USERPROFILE%\Documents\WhatsApp` or `C:\Users\{user}\AppData\Local\WhatsApp`
- **macOS:** `~/Library/Application Support/WhatsApp` or `~/Documents/WhatsApp`
- **Linux:** `~/.config/WhatsApp` or `~/Documents/WhatsApp`
- **Android/Termux:** `/storage/emulated/0/WhatsApp` or `/sdcard/WhatsApp`

#### 2. WhatsApp Directory Structure Understanding
```
WhatsApp/
├── Media/
│   ├── WhatsApp Images/
│   │   ├── Chat with John/
│   │   ├── Family Group/
│   │   └── Sent/
│   ├── WhatsApp Video/
│   │   ├── Chat with John/
│   │   ├── Family Group/
│   │   └── Sent/
│   ├── WhatsApp Documents/
│   ├── WhatsApp Audio/
│   └── WhatsApp Voice Notes/
├── Databases/
│   └── *.db.crypt*
└── Backups/
```

#### 3. File Type Classification
- **Photos:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`
- **Videos:** `.mp4`, `.avi`, `.mov`, `.3gp`, `.mkv`, `.webm`
- **Documents:** `.pdf`, `.doc`, `.docx`, `.txt`, `.ppt`, `.pptx`, `.xls`, `.xlsx`
- **Audio:** `.mp3`, `.ogg`, `.aac`, `.m4a`, `.wav`, `.opus`

#### 4. WhatsApp Filename Pattern Recognition
- **Images:** `IMG-YYYYMMDD-WA####.{ext}` (e.g., `IMG-20240315-WA0042.jpg`)
- **Videos:** `VID-YYYYMMDD-WA####.{ext}` (e.g., `VID-20240315-WA0001.mp4`)
- **Audio:** `AUD-YYYYMMDD-WA####.{ext}` (e.g., `AUD-20240315-WA0123.ogg`)
- **Voice Notes:** `PTT-YYYYMMDD-WA####.opus`
- **Documents:** `DOC-YYYYMMDD-WA####.{ext}`

## API Interface Specification

### Primary Class: WhatsAppScanner

```typescript
interface ScannerConfig {
  whatsappPath?: string;           // Override auto-detection
  supportedTypes?: string[];       // File extensions to scan
  maxDepth?: number;              // Directory traversal depth (default: 5)
  followSymlinks?: boolean;       // Follow symbolic links (default: false)
  batchSize?: number;             // File processing batch size (default: 100)
  maxFileSize?: number;           // Skip files larger than this (bytes, default: 2GB)
  progressCallback?: (progress: ScanProgress) => void;
}

interface ChatInfo {
  id: string;                     // Unique chat identifier
  name: string;                   // Display name
  type: 'individual' | 'group';   // Chat type
  mediaPath: string;              // Path to media directory
  lastActivity: Date;             // Most recent file modification
  estimatedFileCount: number;     // Approximate file count
}

interface FileMetadata {
  path: string;                   // Absolute file path
  name: string;                   // Original filename
  size: number;                   // File size in bytes
  type: 'photo' | 'video' | 'document' | 'audio';
  mimeType: string;               // MIME type
  hash: string;                   // SHA-256 hash
  timestamp: Date;                // File modification time
  chat: {
    id: string;                   // Chat identifier
    name: string;                 // Chat display name
    type: 'individual' | 'group';
  };
  whatsappMeta?: {               // WhatsApp-specific metadata
    date?: string;                // Date from filename (YYYY-MM-DD)
    sequence?: string;            // Sequence number from filename
    prefix?: string;              // File type prefix (IMG, VID, AUD, etc.)
  };
}

interface FindChatsOptions {
  namePattern?: RegExp;           // Filter by chat name pattern
  minLastActivity?: Date;         // Filter by minimum activity date
  includeEmpty?: boolean;         // Include chats with no media (default: false)
  types?: string[];               // Only include chats with these file types
}

interface ScanChatFilters {
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  types?: ('photo' | 'video' | 'document' | 'audio')[];
  minSize?: number;               // Minimum file size in bytes
  maxSize?: number;               // Maximum file size in bytes
  namePattern?: RegExp;           // Filter by filename pattern
}

interface AccessValidation {
  hasAccess: boolean;             // Overall access status
  readableDirectories: string[];  // List of accessible directories
  error?: string;                 // Error message if no access
  platform: string;              // Detected platform
  whatsappPath: string;           // Detected or configured WhatsApp path
}

interface ScanProgress {
  stage: 'discovering' | 'scanning' | 'hashing' | 'complete';
  currentDirectory: string;
  processedFiles: number;
  totalFiles: number;
  currentFile?: string;
  bytesProcessed: number;
  totalBytes: number;
}

class WhatsAppScanner {
  constructor(config?: ScannerConfig);
  
  // Core Methods
  async findChats(options?: FindChatsOptions): Promise<ChatInfo[]>;
  async scanChat(chatId: string, filters?: ScanChatFilters): Promise<FileMetadata[]>;
  async getFileMetadata(filePath: string): Promise<FileMetadata>;
  async validateAccess(): Promise<AccessValidation>;
  
  // Utility Methods
  static detectWhatsAppPath(): Promise<string | null>;
  static getSupportedFileTypes(): string[];
  static normalizePath(path: string): string;
}
```

## Implementation Requirements

### 1. Core Class Structure

```typescript
// src/WhatsAppScanner.ts
export class WhatsAppScanner {
  private config: ScannerConfig;
  private logger: Logger;
  private platform: string;
  private whatsappPath: string;

  constructor(config?: ScannerConfig) {
    // Initialize configuration with defaults
    // Detect platform and WhatsApp path
    // Setup logging
  }

  // Implementation methods...
}
```

### 2. Cross-Platform Path Detection

```typescript
// src/platform/PathDetector.ts
export class PathDetector {
  static async detectWhatsAppPath(): Promise<string | null>;
  static getDefaultPaths(): Record<string, string[]>;
  static validatePath(path: string): Promise<boolean>;
}
```

### 3. Chat Discovery Engine

```typescript
// src/discovery/ChatDiscovery.ts
export class ChatDiscovery {
  async discoverChats(mediaPath: string): Promise<ChatInfo[]>;
  private determineChatType(chatName: string): 'individual' | 'group';
  private estimateFileCount(chatPath: string): Promise<number>;
}
```

### 4. File Analysis and Metadata

```typescript
// src/analysis/FileAnalyzer.ts
export class FileAnalyzer {
  async analyzeFile(filePath: string): Promise<FileMetadata>;
  private determineFileType(extension: string): string;
  private getMimeType(extension: string): string;
  private calculateHash(filePath: string): Promise<string>;
  private extractWhatsAppMetadata(filename: string): object;
}
```

### 5. Memory-Efficient File Processing

```typescript
// src/processing/BatchProcessor.ts
export class BatchProcessor {
  async processBatch<T>(
    items: T[], 
    batchSize: number, 
    processor: (batch: T[]) => Promise<any[]>
  ): Promise<any[]>;
}

// src/streaming/HashCalculator.ts
export class HashCalculator {
  async calculateFileHash(filePath: string): Promise<string>;
  private createHashStream(filePath: string): ReadableStream;
}
```

### 6. Security and Path Validation

```typescript
// src/security/PathValidator.ts
export class PathValidator {
  static validateSecurePath(basePath: string, targetPath: string): string;
  static preventDirectoryTraversal(path: string): boolean;
  static checkFilePermissions(filePath: string): Promise<boolean>;
}
```

## Test Requirements

### Unit Tests Must Pass
- **File:** `tests/unit/scanner/whatsapp-scanner.test.ts`
- **Assertions:** 650+ test assertions covering:
  - Chat discovery across all scenarios
  - File metadata extraction and validation
  - Cross-platform path handling
  - Memory-efficient large directory scanning
  - Error handling and edge cases
  - Property-based testing for path operations
  - WhatsApp filename pattern recognition
  - Permission validation
  - Performance benchmarks

### Property-Based Testing
- **File path normalization** across Windows, Unix, and Android paths
- **Filename pattern recognition** for all WhatsApp formats
- **Chat type determination** consistency
- **Metadata extraction** accuracy and completeness

### Performance Requirements
- **Large directories:** Handle 10,000+ files within 5 seconds
- **Memory usage:** Constant memory regardless of file size (streaming)
- **Batch processing:** Process files in configurable batches (≤100 per batch)
- **Hash calculation:** Use streaming for files >50MB

## Error Handling Strategy

### Error Categories
1. **Permission Errors:** Handle gracefully, report accessible directories
2. **File System Errors:** Retry with exponential backoff
3. **Path Validation Errors:** Prevent directory traversal, validate input
4. **Memory Errors:** Use streaming for large files
5. **Platform Errors:** Graceful degradation across platforms

### Error Recovery
```typescript
interface ScannerError extends Error {
  code: string;
  retryable: boolean;
  category: 'permission' | 'filesystem' | 'validation' | 'memory' | 'platform';
}
```

## Integration Points

### Dependencies
- **Node.js built-ins:** `fs/promises`, `path`, `crypto`, `stream`
- **No external runtime dependencies** (self-contained)

### Interfaces with Other Libraries
- **Proxy Library:** Receives `FileMetadata[]` from scanner
- **Database:** May store file scan results for caching
- **CLI:** Progress callbacks for user feedback

## Platform-Specific Considerations

### Android/Termux
- Handle `/storage/emulated/0/` vs `/sdcard/` path variations
- Respect Android file permissions
- Handle case-sensitive filesystems

### Windows
- Handle both forward and backslashes
- Support long path names (>260 characters)
- Handle Windows-specific permission models

### macOS/Linux
- Handle symbolic links appropriately
- Respect Unix file permissions
- Handle case-sensitive filesystems

## Performance Optimizations

### Memory Management
- **Streaming:** Use Node.js streams for large file operations
- **Batch Processing:** Process files in configurable batches
- **Lazy Loading:** Only load file content when needed
- **Garbage Collection:** Explicit cleanup of large objects

### I/O Optimization
- **Concurrent Processing:** Limited concurrency for file operations
- **Smart Caching:** Cache directory listings and file stats
- **Progressive Scanning:** Allow interruption and resumption

## Security Considerations

### Path Security
- **Directory Traversal Prevention:** Validate all paths against base directory
- **Symlink Handling:** Configurable symlink following with loop detection
- **Permission Validation:** Check file access before operations

### Data Protection
- **No Content Reading:** Only read file headers for type detection
- **Minimal File Access:** Only access files within WhatsApp directories
- **Secure Hashing:** Use cryptographically secure SHA-256

## Configuration Options

### Default Configuration
```typescript
const DEFAULT_CONFIG: ScannerConfig = {
  supportedTypes: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'pdf', 'doc', 'ogg', 'mp3'],
  maxDepth: 5,
  followSymlinks: false,
  batchSize: 100,
  maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
};
```

### Environment-Specific Overrides
- **Android/Termux:** Smaller batch sizes, careful memory management
- **Desktop:** Larger batch sizes, more aggressive caching
- **Development:** Additional logging and debugging options

## Acceptance Criteria

### Functional Requirements ✅
- [ ] Successfully discover all chat directories across platforms
- [ ] Extract complete and accurate file metadata
- [ ] Calculate SHA-256 hashes for all supported file types
- [ ] Handle WhatsApp filename patterns correctly
- [ ] Support all specified file type classifications
- [ ] Validate file system permissions appropriately

### Performance Requirements ✅
- [ ] Scan 10,000+ files within 5 seconds
- [ ] Maintain constant memory usage with streaming
- [ ] Process files in configurable batches
- [ ] Handle large files (>50MB) without memory issues

### Quality Requirements ✅
- [ ] Pass all 650+ test assertions
- [ ] Handle all error scenarios gracefully
- [ ] Support cross-platform path operations
- [ ] Prevent security vulnerabilities (directory traversal)
- [ ] Provide comprehensive progress reporting

### Integration Requirements ✅
- [ ] Compatible with Proxy library interfaces
- [ ] Supports CLI progress callbacks
- [ ] No external runtime dependencies
- [ ] Clean TypeScript interfaces and exports

## Development Workflow

### 1. Setup Development Branch
```bash
git checkout -b TASK-005-dwarf
```

### 2. Implementation Order
1. **Core class structure and configuration**
2. **Platform detection and path handling**
3. **Chat discovery implementation**
4. **File metadata extraction**
5. **Hash calculation with streaming**
6. **Batch processing and memory management**
7. **Error handling and validation**
8. **Cross-platform testing**

### 3. Test-Driven Development
- Run tests frequently: `npm test -- --testPathPattern=scanner`
- Make tests pass incrementally
- **Never modify tests to pass** - fix implementation instead
- Ensure all property-based tests pass consistently

### 4. Code Quality Standards
- **TypeScript:** Strict type checking, proper interfaces
- **Error Handling:** Comprehensive error categories and recovery
- **Documentation:** JSDoc comments for all public methods
- **Performance:** Profile memory usage and processing time
- **Security:** Validate all path operations

## Files to Modify/Create

### Core Implementation
- `packages/scanner/src/WhatsAppScanner.ts` - Main class
- `packages/scanner/src/platform/PathDetector.ts` - Path detection
- `packages/scanner/src/discovery/ChatDiscovery.ts` - Chat discovery
- `packages/scanner/src/analysis/FileAnalyzer.ts` - File analysis
- `packages/scanner/src/processing/BatchProcessor.ts` - Batch processing
- `packages/scanner/src/streaming/HashCalculator.ts` - Hash calculation
- `packages/scanner/src/security/PathValidator.ts` - Security validation

### Interfaces and Types
- `packages/scanner/src/types/index.ts` - TypeScript interfaces
- `packages/scanner/src/constants/index.ts` - Constants and defaults
- `packages/scanner/src/index.ts` - Public API exports

### Configuration
- `packages/scanner/src/config/defaults.ts` - Default configuration
- `packages/scanner/src/config/platform.ts` - Platform-specific settings

## Success Metrics

- **All unit tests pass** (650+ assertions)
- **Property-based tests pass** consistently
- **Performance benchmarks met** (10K files in 5s)
- **Memory usage optimized** (streaming for large files)
- **Cross-platform compatibility** verified
- **Security validation** prevents directory traversal
- **Integration ready** with clean interfaces

## Next Steps After Completion

1. **Integration with Proxy Library** (TASK-006)
2. **CLI Integration** for progress reporting
3. **Performance optimization** based on real-world usage
4. **Additional platform support** as needed

---

**Note:** This specification provides comprehensive requirements for implementing a production-ready WhatsApp Scanner library. The implementation must handle real-world complexities including cross-platform compatibility, security considerations, and enterprise-grade performance requirements.