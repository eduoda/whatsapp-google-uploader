# 🚀 Complete WhatsApp to Google Photos & Drive Uploader

## 📋 Project Overview

Create a complete Node.js application that automatically uploads WhatsApp media files to Google Photos (for photos/videos) and Google Drive (for documents/audio). The system should be production-ready with advanced features like deduplication, recovery, rate limiting, and comprehensive file management.

### **Core Functionality:**
- **Smart File Routing**: Photos/videos → Google Photos, documents/audio → Google Drive
- **Auto-Resume System**: Automatically detect and continue from last uploaded media timestamp
- **Deduplication**: SHA-256 hash-based duplicate detection with persistent database
- **Batch Processing**: Process files in configurable batches (default: 10) with progress display
- **Rate Limiting**: Exponential backoff for 429 errors, adaptive delays, quota management
- **Recovery System**: Save progress every batch, graceful Ctrl+C handling, resume from interruption
- **Authentication**: OAuth2 integration with automatic token refresh
- **User Interface**: User-friendly CLI interfaces with clear help text

### **Direct Upload System (NO TEMPORARY COPIES):**
- **Zero-Copy Architecture**: Upload files directly from WhatsApp directories
- **Stream-Based Upload**: Use Node.js streams for memory-efficient processing
- **File Indexing**: Build and cache file index without copying files
- **Path Validation**: Verify file access permissions before upload attempts
- **Incremental Scanning**: Only rescan directories for new files since last run

### **WhatsApp Directory Integration:**
- **Auto-Detection**: Automatically find WhatsApp media directories across platforms
- **Direct Path Access**: Read files directly from WhatsApp/Media/* folders
- **Permission Handling**: Request and validate file system permissions
- **Symbolic Link Support**: Handle symlinks and junction points safely

### **Performance Optimizations:**
- **Memory Efficiency**: Process large video files without loading into RAM
- **Disk Space Savings**: Zero temporary storage requirements
- **Faster Processing**: Eliminate file copy overhead
- **Concurrent Uploads**: Stream multiple files simultaneously
- **Resume-Friendly**: Resume uploads without re-copying files

### **Nice to have functionality:**
- Interactive mode for chat selection
- Real-time progress bars with ETA
- Memory-efficient processing for large files
- Streaming uploads for video files
- Concurrent processing where possible
- Intelligent batching based on file sizes

## 🎯 Core Requirements

### **Main Upload Script**

A comprehensive Node.js script for upload files.

#### **Command Line Interface:**
```bash
# Scan chats
npm run scan                          # All chats
npm run scan -- --type=group          # Only groups
npm run scan -- --type=individual     # Only individual chats
npm run scan -- --format=json         # JSON output
npm run scan -- --search="João"       # Search by name

# Basic upload
npm run upload -- --chat-id="123456"          # Upload files (automatically resumes if interrupted)
npm run upload -- --chat-name="João Silva"    # Upload files (automatically resumes if interrupted)

# Mode options
npm run upload -- --chat-id="123456" --dry-run      # Preview upload: show files to be processed without uploading
npm run upload -- --chat-id="123456" --full-sync    # Force complete re-upload of all files (ignores deduplication)
npm run upload -- --chat-id="123456" --no-resume    # Ignore previous progress and restart upload from scratch

# Date filters
npm run upload -- --chat-id="123456" --from="2024-01-01"
npm run upload -- --chat-id="123456" --to="2024-12-31"
npm run upload -- --chat-id="123456" --from="2024-01-01" --to="2024-02-01"

# Type filters
npm run upload -- --chat-id="123456" --types="photos,videos"
npm run upload -- --chat-id="123456" --exclude="documents"

# Advanced settings
npm run upload -- --chat-id="123456" --batch-size=20
npm run upload -- --chat-id="123456" --concurrent=1
npm run upload -- --chat-id="123456" --whatsapp-path="/custom/path"
npm run upload -- --chat-id="123456" --drive-folder="Custom Backup"
```

### **Authentication & Setup**

A comprehensive Node.js script for interactive OAuth flow with clear instructions and automatic API enablement verification.

#### **Command Line Interface:**
```bash
npm run setup                         # Interactive OAuth setup
npm run setup -- --reset              # Clear tokens and re-authenticate
npm run setup -- --verify             # Test current configuration

```

### **System Verification**

Must verify:
- Node.js version compatibility
- Required permissions (storage access)
- WhatsApp directory access
- Google API credentials validity

#### **Command Line Interface:**
```bash
npm run check                         # Check everything
npm run check -- --enviroment         # Check node.js and dependecies
npm run check -- --permissions        # Check filesystem permissions
npm run check -- --api                # Check Google API credentials validity and permissions
```

### **Log Analyzer Script (`log-analyzer.js`)**

Create a comprehensive log analysis system:

#### **Commands:**
```bash
# Reports
npm run logs -- --report              # General report
npm run logs -- --sessions            # List all upload sessions
npm run logs -- --chats               # List processed chats with statistics
npm run logs -- --files               # Show files upload status and progress
npm run logs -- --errors              # Show errors only with details
npm run logs -- --performance         # Performance analysis with metrics
npm run logs -- --watch               # Real-time logs

# Specific analysis
npm run logs -- --session="session-123"     # Analyze specific session by ID
npm run logs -- --chat="João Silva"         # Show logs for specific chat
npm run logs -- --date="2024-01-15"         # Show logs for specific date

# Export
npm run logs -- --export=json --output="backup.json"    # Export logs to JSON file
npm run logs -- --export=csv --output="report.csv"      # Export logs to CSV file
```

### **Test Suite Script (`test-suite.js`)**

Create comprehensive testing system:

#### **Commands:**
```bash
# Component tests (simplified structure)
node test-all.js                      # All component tests with summary
./test-components.sh                  # Test each component separately
node scripts/test-scanner-simple.js   # Scanner only (Termux-friendly)

# Individual component tests
node -e "const {GoogleApis} = require('./dist/google-apis/GoogleApis'); 
         new GoogleApis('credentials.json').authenticate()
         .then(() => console.log('✅ Auth OK!'))"
```


## 🛠️ Technical Specifications

### **Environment Support:**
- **Termux (Android)**: Primary target with Android storage access
- **Desktop**: Windows, macOS, Linux support
- **Node.js**: v14+ compatibility

### **File Structure Created:**
```
/storage/emulated/0/Download/ (Termux) or ~/Downloads/ (Desktop)
├── WhatsApp_Progress/               # Progress and recovery data
│   ├── uploaded_files.json         # Deduplication database
│   └── ChatName_ChatId_progress.json      # Per-chat progress
└── WhatsApp_Logs/                   # Detailed logs
    ├── upload_2024-01-15T10-30-00.log
    └── session_analysis.json
```

### **Google Integration:**
- **Google Photos API**: Album creation, batch media upload
- **Google Drive API**: Folder creation, document upload
- **OAuth2**: Authentication flow with token persistence
- **Error Handling**: Rate limits (429), quota exceeded (403), network errors

### **Advanced Features:**

#### **Deduplication System:**
- Calculate SHA-256 hash for each file
- Maintain persistent database (`uploaded_files.json`)
- Skip duplicates with progress reporting
- Cross-session duplicate detection

#### **Recovery System:**
- Save progress after each batch
- Handle Ctrl+C gracefully with cleanup
- Resume from exact interruption point
- Preserve authentication tokens

#### **Rate Limiting:**
- Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
- Adaptive batch delays based on response times
- Quota detection and 24-hour pause
- Intelligent retry for transient errors

#### **Progress Tracking:**
```javascript
// Real-time progress display
📤 Iniciando upload de 150 arquivos...
     📦 Lote 1/8: 20 arquivos
       ✅ IMG_20240115_103045.jpg
       ✅ VID_20240115_103102.mp4
       ⏰ Rate limit detectado. Aguardando 2s...
     📦 Lote 2/8: 20 arquivos
```

## 📦 Package.json and Configuration

Create complete package.json with shortcuts to all scripts.

```json
// config.json
{
  "processing": {
    "batchSize": 10,
    "maxConcurrentUploads": 3,
    "streamBufferSize": "64KB",
    "maxRetries": 5
  }
}
```
## 🔐 Security & Best Practices

### **OAuth2 Implementation:**
- Secure credential storage
- Automatic token refresh
- Scope limitation (photos, drive.file only)
- Error handling for expired/invalid tokens

### **File Handling:**
- Safe path manipulation (prevent directory traversal)
- Proper permission checking
- Graceful handling of locked/missing files
- Memory-efficient processing for large files

### **Error Recovery:**
- Transient error retry (network issues)
- Permanent error detection and reporting
- Progress preservation during failures
- Progress resume after failures
- Clean state recovery after crashes

## 📊 Monitoring & Logging

### **Structured Logging:**
```javascript
// Log format
{
  timestamp: "2024-01-15T10:30:00.000Z",
  level: "INFO|ERROR|WARNING|SUCCESS",
  operation: "upload|batch|auth|cleanup",
  chatId: "5511999999999@c.us",
  chatName: "João Silva",
  details: { fileName: "image.jpg", size: 1024, duration: 500 }
}
```

### **Performance Metrics:**
- Upload speed (files/minute)
- API response times
- Error rates by type
- Quota usage tracking
- Success/failure ratios

### **Statistics Tracking:**
- Total files processed
- Deduplication efficiency
- Recovery usage patterns
- Peak usage times
- Storage optimization metrics

## 🎯 Success Criteria

The application should:

1. **Work out of the box** after Google API setup
2. **Handle interruptions gracefully** with full recovery
3. **Process thousands of files** efficiently with rate limiting
4. **Provide comprehensive feedback** on progress and issues
5. **Maintain data integrity** with deduplication and verification
6. **Offer complete file management** with safe cleanup options
7. **Generate actionable insights** through logging and analysis
8. **Support both Termux and desktop** environments seamlessly

## 💡 Implementation Notes

- Use modern JavaScript (async/await, classes, ES6+ features)
- Implement comprehensive error handling for all operations
- Follow Node.js best practices for file I/O and networking
- Design for scalability (handle large WhatsApp archives)
- Prioritize data safety (multiple confirmation prompts for destructive operations)
- Include extensive console output for transparency
- Make all features configurable through command-line arguments
- Consider the following libs and frameworks:
  - commander.js
  - ora
  - chalk
  - inquirer
  - sqlite3
  - node-stream-zip
