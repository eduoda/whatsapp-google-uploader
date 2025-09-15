# Code Patterns and Conventions - WhatsApp Google Uploader

## Overview
This document defines the actual coding patterns and conventions used in the WhatsApp Google Uploader production codebase (v1.0.0). These patterns follow KISS/YAGNI/DRY principles and reflect the current unified architecture.

---

## Core Architectural Patterns

### Unified API Class Pattern
**Pattern**: Single GoogleApis class handling all Google service interactions
```typescript
// Pattern: Consolidated API management
class GoogleApis {
  private auth: GoogleAuth;
  private drive: drive_v3.Drive;
  private photos: any;
  private sheets: sheets_v4.Sheets;

  // All Google API operations in one class
  async uploadToPhotos(filePath: string, albumId: string): Promise<string>
  async uploadToDrive(filePath: string, folderId: string): Promise<string>
  async updateSheets(spreadsheetId: string, values: any[][]): Promise<void>
}
```
**Rationale**: Simplified from modular approach, 85% code reduction while maintaining functionality

### Stream-Based File Processing
**Pattern**: Direct streaming without temporary files
```typescript
// Pattern: Zero-copy streaming
const fileStream = fs.createReadStream(filePath);
const media = {
  mimeType: mimeType,
  body: fileStream
};
await drive.files.create({ requestBody: metadata, media });
```
**Rationale**: Constant ~50MB memory usage regardless of file size

### Google Sheets as Database Pattern
**Pattern**: Cloud-based persistence using Google Sheets API
```typescript
// Pattern: Sheets as database
class SheetsDatabase {
  async findRowByJID(jid: string): Promise<number | null>
  async updateRow(row: number, values: any[]): Promise<void>
  async appendRows(values: any[][]): Promise<void>
}
```
**Rationale**: Zero-install, cross-platform, manually editable database

---

## Naming Conventions (Actual Usage)

### Current Project Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Classes | PascalCase | `GoogleApis`, `WhatsAppScanner`, `UploaderManager` |
| Methods | camelCase | `authenticateUser()`, `scanDirectory()`, `uploadFile()` |
| Interfaces | PascalCase | `ChatFileInfo`, `ScanResult`, `UploadConfig` |
| Files | kebab-case | `google-apis.ts`, `whatsapp-scanner.ts`, `cli-application.ts` |
| Constants | UPPER_SNAKE_CASE | `WHATSAPP_BACKUP_KEY`, `MAX_RETRIES` |
| Commands | kebab-case | `npm run scan`, `npm run upload` |

### Google API Naming
| Element | Convention | Example |
|---------|------------|---------|
| Album Names | `WA_[chat_name]_[JID]` | `WA_Family Group_1234567890@g.us` |
| Folder Names | `[chat_name]_[JID]` | `Family Group_1234567890@g.us` |
| Sheet Names | Same as folder | `/WhatsApp Google Uploader/Family Group_1234567890@g.us` |

---

## Error Handling Patterns

### Graceful Degradation
```typescript
// Pattern: Graceful error handling with user feedback
try {
  await this.uploadFile(file);
  console.log(`✅ Uploaded: ${file.name}`);
} catch (error) {
  console.error(`❌ Failed: ${file.name} - ${error.message}`);
  await this.updateSheetWithError(file, error.message);
}
```

### Quota Management
```typescript
// Pattern: Exponential backoff for API limits
private async handleQuotaError(error: any, attempt: number): Promise<void> {
  if (error.code === 429) {
    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
    console.log(`⏳ Rate limited. Waiting ${delay/1000}s...`);
    await this.sleep(delay);
  }
}
```

### Graceful Shutdown
```typescript
// Pattern: Ctrl+C handling with state preservation
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await this.saveCurrentState();
  process.exit(0);
});
```

---

## Data Patterns

### JID-Based Lookups
```typescript
// Pattern: Use WhatsApp JID as primary key
interface ChatFileInfo {
  jid: string;           // Primary key: WhatsApp JID
  chatName: string;      // Display name (user can edit)
  filePath: string;      // File system path
  fileHash: string;      // SHA-256 for deduplication
  uploadStatus: string;  // 'pending' | 'uploaded' | 'failed'
}
```

### SHA-256 Deduplication
```typescript
// Pattern: Content-based duplicate detection
const fileHash = crypto.createHash('sha256')
  .update(await fs.readFile(filePath))
  .digest('hex');

const isDuplicate = await this.findFileByHash(fileHash);
if (isDuplicate) {
  console.log(`⏭️  Skipping duplicate: ${fileName}`);
  return;
}
```

### Manual Edit Preservation
```typescript
// Pattern: Preserve user edits in Google Sheets
// ✅ JID-based lookups allow row reordering
// ✅ Chat names can be manually edited
// ✅ Manual status changes are preserved
const row = await this.findRowByJID(file.jid);
if (row) {
  // Update existing row, preserve manual edits
  await this.updateRow(row, newValues);
}
```

---

## CLI Patterns

### Command Structure
```bash
# Pattern: npm run [action] [options]
npm run auth                           # Authentication
npm run scan [path] [--dry-run]        # Media scanning
npm run upload "Chat Name" [options]   # Upload specific chat
npm run decrypt [path] [--key hex]     # Database decryption
```

### Progress Indication
```typescript
// Pattern: Simple console feedback
console.log(`📊 Found ${files.length} media files`);
console.log(`📤 Uploading ${fileName}...`);
console.log(`✅ Upload complete: ${googleUrl}`);
console.log(`❌ Upload failed: ${error.message}`);
```

---

## TypeScript Patterns

### Interface Design
```typescript
// Pattern: Simple, focused interfaces
interface ScanResult {
  totalFiles: number;
  filesByType: Record<string, number>;
  chats: ChatInfo[];
}

interface ChatInfo {
  jid: string;
  name: string;
  fileCount: number;
  lastActivity: Date;
}
```

### Async/Await Usage
```typescript
// Pattern: Consistent async/await, no mixing with Promises
async scanDirectory(path: string): Promise<ScanResult> {
  const files = await fs.readdir(path);
  const results = await Promise.all(
    files.map(file => this.processFile(file))
  );
  return this.consolidateResults(results);
}
```

### Error Types
```typescript
// Pattern: Simple error handling, no custom error classes
throw new Error(`Invalid WhatsApp path: ${path}`);
throw new Error(`Authentication failed: ${response.statusText}`);
throw new Error(`Quota exceeded. Try again later.`);
```

---

## Testing Patterns

### Integration Testing
```javascript
// Pattern: Real integration tests with mock data
async function testScanCommand() {
  console.log('Testing scan command...');
  const result = await scanner.scanDirectory('./test-data');
  assert(result.totalFiles > 0, 'Should find test files');
}
```

### Dry-Run Pattern
```typescript
// Pattern: Dry-run mode for all destructive operations
async uploadFiles(files: FileInfo[], dryRun = false): Promise<void> {
  for (const file of files) {
    if (dryRun) {
      console.log(`[DRY RUN] Would upload: ${file.name}`);
    } else {
      await this.actualUpload(file);
    }
  }
}
```

---

## Configuration Patterns

### Environment Variables
```bash
# Pattern: Optional environment configuration
WHATSAPP_BACKUP_KEY=64-character-hex-key  # Optional for decryption
GOOGLE_CLIENT_ID=auto-from-credentials    # Auto-extracted
GOOGLE_CLIENT_SECRET=auto-from-credentials # Auto-extracted
```

### File-Based Configuration
```typescript
// Pattern: JSON configuration with fallbacks
const config = {
  whatsappPath: process.env.WHATSAPP_PATH || './WhatsApp',
  maxRetries: 3,
  batchSize: 50,
  rateLimit: true
};
```

---

## Performance Patterns

### Streaming Architecture
```typescript
// Pattern: Stream processing for large files
const stream = fs.createReadStream(filePath);
const uploadStream = googleApi.files.create({
  media: { body: stream },
  // No file buffering - direct stream
});
```

### Batch Operations
```typescript
// Pattern: Batch Google Sheets updates
const batchData = files.map(file => [
  file.jid, file.name, file.size, file.uploadStatus
]);
await sheets.spreadsheets.values.batchUpdate({
  resource: { data: batchData }
});
```

### Memory Management
```typescript
// Pattern: Explicit cleanup for large operations
async processLargeDirectory(path: string): Promise<void> {
  const files = await fs.readdir(path);

  // Process in chunks to manage memory
  for (let i = 0; i < files.length; i += CHUNK_SIZE) {
    const chunk = files.slice(i, i + CHUNK_SIZE);
    await this.processChunk(chunk);

    // Allow garbage collection
    if (global.gc) global.gc();
  }
}
```

---

## Security Patterns

### OAuth2 Token Management
```typescript
// Pattern: Secure token storage with minimal scope
const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);
oAuth2Client.setCredentials(tokens);

// Minimal scopes - only what's needed
const SCOPES = [
  'https://www.googleapis.com/auth/photoslibrary.appendonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets'
];
```

### Credential Handling
```typescript
// Pattern: Local file storage, no network transmission
const credentialsPath = './credentials.json';
const tokensPath = './tokens.json';

// Never log or transmit credentials
const credentials = JSON.parse(await fs.readFile(credentialsPath));
```

---

## Anti-Patterns (Avoid)

### ❌ Over-Engineering
```typescript
// BAD: Complex inheritance hierarchies
class AbstractUploader extends BaseService implements IUploadStrategy
class GooglePhotosUploader extends AbstractUploader
class GoogleDriveUploader extends AbstractUploader

// GOOD: Simple unified class
class GoogleApis {
  uploadToPhotos() { /* direct implementation */ }
  uploadToDrive() { /* direct implementation */ }
}
```

### ❌ Configuration Complexity
```typescript
// BAD: Complex configuration objects
const config = new ConfigManager()
  .withEnvironment(env)
  .withDefaults(defaults)
  .withValidation(schema)
  .build();

// GOOD: Simple object with fallbacks
const config = {
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  maxRetries: Number(process.env.MAX_RETRIES) || 3
};
```

### ❌ Premature Abstraction
```typescript
// BAD: Generic interfaces for single use case
interface IFileProcessor<T> {
  process(input: T): Promise<ProcessResult<T>>;
}

// GOOD: Specific implementation
class WhatsAppScanner {
  scanDirectory(path: string): Promise<ScanResult> { /* ... */ }
}
```

---

## Best Practices Summary

1. **KISS Principle**: Simple solutions over complex architectures
2. **YAGNI Principle**: Implement only what's needed now
3. **DRY Principle**: Eliminate code duplication but don't over-abstract
4. **Single Responsibility**: Each class/function has one clear purpose
5. **Graceful Failure**: Always handle errors with user feedback
6. **Stream Processing**: Use streams for large files
7. **Content-Based Identity**: Use SHA-256 hashes for file identity
8. **Manual Edit Support**: Design for human interaction
9. **Cross-Platform**: Test on multiple platforms
10. **Production Focus**: Prioritize working code over perfect code

---

*Last Updated: 2025-09-15*
*Version: 1.0.0 Production*
*Architecture: Post-Refactoring Unified Approach*

**Note:** These patterns reflect the actual production codebase after 85% code reduction and architectural simplification.