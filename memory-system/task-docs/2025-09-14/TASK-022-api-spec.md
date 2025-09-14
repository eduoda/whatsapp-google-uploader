# TASK-022-api-spec.md - Chat-Specific Upload Enhancement

**Agent**: API
**Task**: TASK-022 - Chat-Specific Upload Enhancement (Phase 3)
**Phase**: Chat-Specific Operations
**Priority**: 3 (Medium - Enhanced Feature)
**Depends On**: TASK-021 (Chat scanner working)

## Objective

Enhance the upload command to support chat-specific uploads using decrypted database information, enabling organized uploads to Google Photos with separate albums for different chats/groups.

## Requirements

### Functional Requirements
1. **Chat-Specific Uploads**: Upload media from specific chats to dedicated albums
2. **Album Management**: Create and organize Google Photos albums by chat name
3. **Interactive Selection**: Provide chat selection interface when multiple chats detected
4. **Backward Compatibility**: Maintain existing upload functionality when no chat specified
5. **Progress Tracking**: Update progress tracking to include chat context
6. **Batch Operations**: Support uploading multiple chats efficiently

### Non-Functional Requirements
- **KISS**: Simple enhancement to existing upload flow
- **YAGNI**: Only essential chat-specific features
- **Performance**: Efficient album creation and file organization
- **User Experience**: Intuitive chat selection and progress feedback

## Technical Specifications

### Enhanced Upload Command Interface

#### CLI Command Options
```bash
# Basic upload (existing functionality)
whatsapp-uploader upload

# Upload specific chat by name
whatsapp-uploader upload --chat "Family Group"

# Upload specific chat by ID
whatsapp-uploader upload --chat-id "120363012345678901@g.us"

# Interactive chat selection
whatsapp-uploader upload --select-chat

# Upload all chats to separate albums
whatsapp-uploader upload --all-chats

# Upload with custom album naming
whatsapp-uploader upload --chat "Family Group" --album-name "Family Photos 2025"

# Dry run to see what would be uploaded
whatsapp-uploader upload --chat "Family Group" --dry-run
```

#### Enhanced CLI Integration
```typescript
// src/cli/cli-application.ts - Enhanced upload command
this.program
  .command('upload')
  .description('Upload WhatsApp media to Google services')
  .option('--chat <name>', 'Upload files from specific chat name')
  .option('--chat-id <id>', 'Upload files from specific chat ID')
  .option('--select-chat', 'Interactive chat selection')
  .option('--all-chats', 'Upload all chats to separate albums')
  .option('--album-name <name>', 'Custom album name (overrides default)')
  .option('--dry-run', 'Show what would be uploaded without uploading')
  .action(async (options) => {
    // Enhanced implementation with chat support
  });
```

### Architecture Enhancement

#### 1. Enhanced UploaderManager
```typescript
// src/uploader/index.ts - Enhanced UploaderManager
export interface ChatUploadOptions extends UploadOptions {
  chatId?: string;
  chatName?: string;
  albumName?: string;
  createChatAlbum?: boolean;
}

export class UploaderManager {
  // ... existing methods

  /**
   * Upload files from specific chat
   */
  async uploadChatFiles(
    chatId: string,
    options: ChatUploadOptions
  ): Promise<void> {
    // 1. Get chat-specific files from enhanced scanner
    // 2. Create dedicated Google Photos album
    // 3. Upload with chat context
    // 4. Update progress tracking
  }

  /**
   * Upload all chats to separate albums
   */
  async uploadAllChats(
    options: ChatUploadOptions
  ): Promise<void> {
    // 1. Get all chats from scanner
    // 2. Process each chat separately
    // 3. Create albums and upload
    // 4. Provide consolidated progress
  }

  /**
   * Interactive chat selection
   */
  async selectAndUploadChat(): Promise<void> {
    // 1. List available chats
    // 2. Show interactive selection
    // 3. Upload selected chat
  }
}
```

#### 2. Google Photos Album Management
```typescript
// src/google-apis/album-manager.ts
export class AlbumManager {
  constructor(private googleApis: GoogleApis) {}

  /**
   * Create or get album for chat
   */
  async createChatAlbum(chatName: string): Promise<string> {
    const albumTitle = this.generateAlbumName(chatName);
    return await this.googleApis.createPhotoAlbum(albumTitle);
  }

  /**
   * Generate consistent album names
   */
  private generateAlbumName(chatName: string): string {
    // Format: "WhatsApp - Family Group" or "WhatsApp - John Doe"
    const cleanName = chatName.replace(/[^\w\s-]/g, '').trim();
    return `WhatsApp - ${cleanName}`;
  }

  /**
   * List existing WhatsApp albums
   */
  async getWhatsAppAlbums(): Promise<Array<{id: string, title: string}>> {
    // Find albums starting with "WhatsApp - "
  }
}
```

#### 3. Enhanced Progress Tracking
```typescript
// src/database/index.ts - Enhanced progress tracking
export interface ChatProgressRecord extends ProgressRecord {
  chatId: string;
  chatName: string;
  albumId?: string;
  albumUrl?: string;
}

export class SheetsDatabase {
  // ... existing methods

  /**
   * Update progress with chat context
   */
  async updateChatProgress(progress: ChatProgressRecord): Promise<void> {
    // Enhanced progress tracking with chat information
  }

  /**
   * Get progress for specific chat
   */
  async getChatProgress(chatId: string): Promise<ChatProgressRecord | null> {
    // Chat-specific progress retrieval
  }

  /**
   * Get all chat upload statistics
   */
  async getChatStatistics(): Promise<Array<{
    chatId: string;
    chatName: string;
    totalFiles: number;
    uploadedFiles: number;
    status: string;
    albumUrl?: string;
  }>> {
    // Comprehensive chat upload statistics
  }
}
```

### Interactive Chat Selection

#### 4. Chat Selector Interface
```typescript
// src/cli/chat-selector.ts
export class ChatSelector {
  constructor(
    private scanner: WhatsAppScanner,
    private uploader: UploaderManager
  ) {}

  /**
   * Show interactive chat selection menu
   */
  async selectChat(): Promise<ChatInfo | null> {
    const chats = await this.scanner.getChats();

    if (chats.length === 0) {
      console.log('No chats with media files found.');
      return null;
    }

    // Use inquirer for interactive selection
    return this.showChatMenu(chats);
  }

  private async showChatMenu(chats: ChatInfo[]): Promise<ChatInfo | null> {
    // Interactive menu implementation
  }
}
```

#### Interactive Menu Implementation
```typescript
// Using inquirer for user-friendly selection
import inquirer from 'inquirer';

async showChatMenu(chats: ChatInfo[]): Promise<ChatInfo | null> {
  const choices = chats.map(chat => ({
    name: `${chat.displayName} (${chat.mediaCount} files)`,
    value: chat,
    short: chat.displayName
  }));

  const { selectedChat } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedChat',
    message: 'Select a chat to upload:',
    choices: [
      ...choices,
      new inquirer.Separator(),
      { name: 'Cancel', value: null }
    ]
  }]);

  return selectedChat;
}
```

## Implementation Details

### 1. Upload Flow Enhancement

#### Chat-Specific Upload Process
```typescript
// src/uploader/chat-uploader.ts
export class ChatUploader {
  async uploadChatFiles(
    chatId: string,
    chatName: string,
    options: ChatUploadOptions
  ): Promise<void> {
    // 1. Get files for specific chat
    const scanner = new WhatsAppScanner();
    const chatFiles = await scanner.scanChatFiles(chatId);

    if (chatFiles.length === 0) {
      console.log(`No media files found for chat: ${chatName}`);
      return;
    }

    // 2. Create or get Google Photos album
    const albumManager = new AlbumManager(this.googleApis);
    const albumId = await albumManager.createChatAlbum(chatName);

    // 3. Convert to upload format
    const uploads: FileUpload[] = chatFiles.map(file => ({
      path: file.path,
      name: file.name,
      size: file.size,
      mimeType: file.mimeType,
      hash: file.hash
    }));

    // 4. Upload with album context
    await this.uploadToAlbum(uploads, albumId, {
      ...options,
      chatId,
      onProgress: (progress) => {
        console.log(`Uploading ${chatName}: ${(progress * 100).toFixed(1)}%`);
        options.onProgress?.(progress);
      }
    });

    // 5. Display results
    const albumUrl = `https://photos.google.com/lr/album/${albumId}`;
    console.log(`\n✅ Upload complete for "${chatName}"`);
    console.log(`📸 Album: ${albumUrl}`);
  }
}
```

### 2. Google Photos Album Integration

#### Enhanced GoogleApis Methods
```typescript
// src/google-apis/index.ts - Enhanced with album support
export class GoogleApis {
  // ... existing methods

  /**
   * Create Google Photos album
   */
  async createPhotoAlbum(title: string): Promise<string> {
    const album = await this.photos.albums.create({
      requestBody: {
        album: { title }
      }
    });

    return album.data.id!;
  }

  /**
   * Upload file to specific album
   */
  async uploadToAlbum(
    filePath: string,
    albumId: string,
    options: UploadOptions,
    onProgress?: (uploaded: number, total: number) => void
  ): Promise<{ id: string; url: string }> {
    // 1. Upload file (existing uploadFile method)
    const result = await this.uploadFile(filePath, options, onProgress);

    // 2. Add to album
    await this.photos.albums.batchAddMediaItems({
      albumId,
      requestBody: {
        mediaItemIds: [result.id]
      }
    });

    return result;
  }
}
```

### 3. CLI Command Implementation

#### Enhanced Upload Command Handler
```typescript
// src/cli/cli-application.ts - Upload command enhancement
.action(async (options) => {
  try {
    // Initialize components
    const scanner = new WhatsAppScanner();
    const uploader = new UploaderManager(config);
    await uploader.initialize();

    // Check authentication
    if (!uploader.isAuthenticated()) {
      console.log('Please authenticate first: whatsapp-uploader auth');
      process.exit(1);
    }

    // Handle different upload modes
    if (options.selectChat) {
      // Interactive chat selection
      const selector = new ChatSelector(scanner, uploader);
      const selectedChat = await selector.selectChat();

      if (selectedChat) {
        await uploader.uploadChatFiles(selectedChat.chatId, {
          chatId: selectedChat.chatId,
          chatName: selectedChat.displayName,
          createChatAlbum: true
        });
      }
    } else if (options.allChats) {
      // Upload all chats
      await uploader.uploadAllChats({ createChatAlbum: true });
    } else if (options.chat || options.chatId) {
      // Specific chat upload
      const chatId = options.chatId || await this.findChatByName(options.chat);
      await uploader.uploadChatFiles(chatId, {
        chatId,
        createChatAlbum: true,
        albumName: options.albumName
      });
    } else {
      // Default upload (existing functionality)
      const files = await scanner.findFiles();
      await uploader.uploadFiles(files, {});
    }

    // Show completion summary
    this.showUploadSummary(uploader);

  } catch (error) {
    console.error('Upload failed:', (error as Error).message);
    process.exit(1);
  }
})
```

### 4. Progress and Feedback

#### Enhanced Progress Display
```typescript
// src/cli/progress-display.ts
export class ProgressDisplay {
  showChatUploadProgress(
    chatName: string,
    current: number,
    total: number,
    currentFile: string
  ): void {
    const percentage = ((current / total) * 100).toFixed(1);
    console.log(`📱 ${chatName}: ${current}/${total} files (${percentage}%)`);
    console.log(`   Current: ${currentFile}`);
  }

  showUploadSummary(results: Array<{
    chatName: string;
    filesUploaded: number;
    albumUrl: string;
    status: 'success' | 'partial' | 'failed';
  }>): void {
    console.log('\n📊 Upload Summary:');

    results.forEach(result => {
      const status = result.status === 'success' ? '✅' :
                    result.status === 'partial' ? '⚠️' : '❌';
      console.log(`${status} ${result.chatName}: ${result.filesUploaded} files`);

      if (result.albumUrl) {
        console.log(`   📸 Album: ${result.albumUrl}`);
      }
    });
  }
}
```

## Acceptance Criteria

### Must Pass Tests
- [ ] **Backward Compatibility**: Existing upload functionality unchanged when no chat options specified
- [ ] **Chat Upload**: `--chat` option correctly uploads files from specific chat
- [ ] **Interactive Selection**: `--select-chat` shows menu and uploads selected chat
- [ ] **Album Creation**: Creates separate Google Photos albums for each chat
- [ ] **All Chats Upload**: `--all-chats` processes all chats with separate albums
- [ ] **Progress Tracking**: Enhanced progress tracking includes chat context
- [ ] **Error Handling**: Clear error messages for chat-related issues
- [ ] **Dry Run**: `--dry-run` shows what would be uploaded without uploading

### Integration Requirements
- [ ] Works seamlessly with enhanced scanner from TASK-021
- [ ] Integrates with existing UploaderManager functionality
- [ ] Maintains Google Sheets database compatibility
- [ ] Follows established CLI command patterns

## Testing Strategy

### Unit Tests
```typescript
// tests/chat-uploader.test.js
describe('ChatUploader', () => {
  it('uploads chat files to correct album');
  it('creates album with proper naming convention');
  it('handles empty chats gracefully');
  it('updates progress with chat context');
});

// tests/album-manager.test.js
describe('AlbumManager', () => {
  it('creates albums with consistent naming');
  it('finds existing WhatsApp albums');
  it('handles album creation failures');
});
```

### Integration Tests
```typescript
describe('CLI upload with chats', () => {
  it('uploads specific chat when --chat specified');
  it('shows interactive selection with --select-chat');
  it('uploads all chats with --all-chats');
  it('maintains backward compatibility');
});
```

### User Acceptance Tests
- Manual testing of interactive chat selection
- Verify Google Photos albums created correctly
- Confirm progress tracking accuracy
- Test error scenarios (no chat data, network issues)

## Dependencies

### New Dependencies
```json
{
  "dependencies": {
    "inquirer": "^9.2.0"  // For interactive chat selection
  },
  "devDependencies": {
    "@types/inquirer": "^9.0.0"
  }
}
```

### File Structure
```
src/
├── uploader/
│   ├── index.ts              // Enhanced UploaderManager
│   └── chat-uploader.ts      // Chat-specific upload logic
├── google-apis/
│   ├── index.ts              // Enhanced with album methods
│   └── album-manager.ts      // Google Photos album management
├── cli/
│   ├── cli-application.ts    // Enhanced upload command
│   ├── chat-selector.ts      // Interactive chat selection
│   └── progress-display.ts   // Enhanced progress display
└── database/
    └── index.ts              // Enhanced with chat progress
```

## User Experience Enhancement

### Interactive Features
```
$ whatsapp-uploader upload --select-chat

📱 Available Chats:

❓ Select a chat to upload:
  ❯ Family Group (128 files)
    Work Team (67 files)
    Travel Squad (45 files)
    College Friends (23 files)
    John Doe (34 files)
    Jane Smith (12 files)
    ────────────────────────
    Upload All Chats
    Cancel

✅ Selected: Family Group (128 files)
📸 Creating album "WhatsApp - Family Group"...
📤 Uploading 128 files...

Family Group: 45/128 files (35.2%)
Current: IMG_20250312_143052.jpg

✅ Upload complete for "Family Group"
📸 Album: https://photos.google.com/lr/album/AF1...
📊 Uploaded 128 files to Google Photos
```

### Command Examples
```bash
# Quick chat upload
whatsapp-uploader upload --chat "Family Group"

# Interactive selection
whatsapp-uploader upload --select-chat

# Upload all chats (batch operation)
whatsapp-uploader upload --all-chats

# Custom album name
whatsapp-uploader upload --chat "Work Team" --album-name "Work Photos Q1 2025"

# Preview mode
whatsapp-uploader upload --chat "Family Group" --dry-run
```

## Performance Considerations

### Batch Operations
- Process chats sequentially to avoid API rate limits
- Use existing rate limiting and retry mechanisms
- Implement progress aggregation for multi-chat uploads

### Memory Management
- Stream file processing, don't load all files at once
- Cache chat information during session
- Clean up temporary data after each chat

### API Optimization
- Reuse album creation logic
- Batch album additions where possible
- Leverage existing Google API optimizations

## Error Handling

### Chat-Specific Errors
```typescript
interface ChatUploadError {
  type: 'CHAT_NOT_FOUND' | 'NO_MEDIA_FILES' | 'ALBUM_CREATION_FAILED' | 'PARTIAL_UPLOAD';
  chatId: string;
  chatName: string;
  message: string;
  suggestion: string;
}

// Example error handling:
try {
  await uploader.uploadChatFiles(chatId, options);
} catch (error) {
  if (error.type === 'CHAT_NOT_FOUND') {
    console.error(`Chat "${chatName}" not found. Use --list-chats to see available options.`);
  } else if (error.type === 'NO_MEDIA_FILES') {
    console.log(`No media files found in chat "${chatName}".`);
  }
  // Handle other error types...
}
```

## Success Metrics

- ✅ **Functionality**: Chat-specific uploads create correct albums and organize files
- ✅ **Usability**: Interactive selection is intuitive and helpful
- ✅ **Compatibility**: Existing upload functionality remains unchanged
- ✅ **Performance**: Multi-chat uploads complete efficiently
- ✅ **Progress**: Users can track upload progress for each chat
- ✅ **Albums**: Google Photos albums are created with consistent, readable names

---

**Final Integration**: After completing all three phases (TASK-020, TASK-021, TASK-022), users will have a complete chat-aware WhatsApp backup system with decryption, scanning, and organized uploading capabilities.