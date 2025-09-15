# WhatsApp Google Uploader

🚀 Production-ready CLI tool for uploading WhatsApp media to Google Photos and Google Drive with intelligent deduplication and quota management.

## ✨ Features

### Core Functionality
- **📱 Smart File Routing** - Photos/videos → Google Photos albums, Documents/audio → Google Drive folders
- **🏷️ Intuitive Naming** - Albums and folders named after WhatsApp chat/group names
- **🔄 Chat-Specific Uploads** - Upload media from specific chats with dedicated tracking sheets
- **🔒 SHA-256 Deduplication** - Prevents duplicate uploads using content hashing
- **📊 Per-Chat Tracking** - Individual Google Sheets for each chat with full upload history

### Technical Excellence
- **⚡ Zero-Copy Architecture** - Direct streaming without temporary files
- **🛡️ Graceful Shutdown** - Saves state on Ctrl+C, resumes from exact point
- **🎯 Adaptive Rate Limiting** - Smart quota management with exponential backoff
- **☁️ Cloud-Based Persistence** - Google Sheets as database (no local storage needed)
- **🔄 Auto-Resume System** - Automatic recovery from interruptions
- **🌍 Cross-Platform** - Windows, macOS, Linux, and Android 11+ (Termux)

## 📦 Installation

### Desktop (Windows/macOS/Linux)
```bash
# Clone repository
git clone https://github.com/eduoda/whatsapp-google-uploader.git
cd whatsapp-google-uploader

# Install dependencies and build
npm install --production
npm run build
```

### Android (Termux)
```bash
# Setup Termux environment
pkg update && pkg install nodejs
termux-setup-storage  # Grant storage permission

# Clone and build
git clone https://github.com/eduoda/whatsapp-google-uploader.git
cd whatsapp-google-uploader
npm install --production
npm run build
```

## 🚀 Quick Start

### 1. Get Google Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable these APIs:
   - Google Drive API
   - Google Photos Library API
   - Google Sheets API
4. Create credentials: "OAuth 2.0 Client ID"
5. **IMPORTANT**: Choose **"Desktop app"** as application type
6. Download JSON → Save as `credentials.json` in project root

### 2. Authenticate
```bash
node dist/cli.js auth
# Opens browser for Google login
# Creates Google Sheets database automatically
```

### 3. Decrypt WhatsApp Database
```bash
# Install wa-crypt-tools
pip install wa-crypt-tools

# Add backup key to .env
echo "WHATSAPP_BACKUP_KEY=your-64-character-hex-key" >> .env

# Decrypt database
npm run decrypt
```

### 4. Upload Media
```bash
# Upload from specific chat
node dist/cli.js upload "Family Group"

# Upload with options
node dist/cli.js upload "Work Chat" --skip-failed --dry-run
```

## 📖 Commands

### Core Commands

#### `auth` - Authenticate with Google
```bash
node dist/cli.js auth
```
Opens browser for Google authentication and saves tokens.

#### `scan` - Scan WhatsApp Media
```bash
node dist/cli.js scan                    # Auto-detect location
node dist/cli.js scan /path/to/whatsapp  # Custom path
node dist/cli.js scan --dry-run          # Without saving to Sheets
```
Analyzes WhatsApp directory and saves chat metadata to Google Sheets.

#### `upload` - Upload Media to Google
```bash
node dist/cli.js upload "Chat Name"      # Upload from specific chat
node dist/cli.js upload "Chat Name" --skip-failed  # Skip previously failed files
node dist/cli.js upload "Chat Name" --dry-run      # Preview what would be uploaded
```

**Upload Features:**
- Creates dedicated Google Sheets for each chat
- Tracks upload status per file (pending/uploaded/failed)
- Calculates SHA-256 hashes for deduplication
- Creates Google Photos album and Drive folder per chat
- Adaptive delay to respect API quotas
- Graceful shutdown saves progress on Ctrl+C

#### `decrypt` - Decrypt WhatsApp Database
```bash
npm run decrypt                           # Auto-detect path
npm run decrypt -- /path/to/whatsapp     # Custom path
npm run decrypt -- --key 0A1B2C3D...     # Direct hex key (64 chars)
```

### Utility Commands

#### `check` - Verify Configuration
```bash
node dist/cli.js check
```

#### `setup` - Create Environment File
```bash
node dist/cli.js setup
```

## 🏗️ Architecture

### Google Sheets Structure

#### Main Sheet: `WhatsApp-Media-Tracker-YYYY-MM-DD`
```
┌─────────────────┬──────────────┬───┬─────────────┬─────────────────┐
│ Nome do Chat    │ ID WhatsApp  │...│ Total Files │ Album/Folder ID │
├─────────────────┼──────────────┼───┼─────────────┼─────────────────┤
│ Family Group    │ 123@g.us     │...│ 1,234       │ album_xyz       │
│ Work Team       │ 456@g.us     │...│ 567         │ folder_abc      │
└─────────────────┴──────────────┴───┴─────────────┴─────────────────┘
```

#### Per-Chat Sheet: `[Chat-Name]_[JID]`
```
┌────────────┬─────────────┬──────────────┬───┬────────────────────┐
│ Message ID │ File Name   │ SHA-256 Hash │...│ Upload Status      │
├────────────┼─────────────┼──────────────┼───┼────────────────────┤
│ msg_001    │ IMG001.jpg  │ a1b2c3d4...  │...│ uploaded           │
│ msg_002    │ VID001.mp4  │ e5f6g7h8...  │...│ pending            │
│ msg_003    │ IMG002.jpg  │ a1b2c3d4...  │...│ skipped (duplicate)│
└────────────┴─────────────┴──────────────┴───┴────────────────────┘
```

### Quota Management

The system implements adaptive delay between uploads:
- **Initial delay**: 1.5 seconds
- **On success**: Gradually reduces delay (min 1s)
- **On quota error**: Exponential backoff (up to 60s)
- **Batch updates**: Progress updates every 5 seconds
- **Critical updates**: Success/failure saved immediately

### Deduplication System

1. **SHA-256 hashing** of file content before upload
2. **Hash stored** in Google Sheets for each file
3. **Duplicate detection** across different messages
4. **Skip upload** if same hash already uploaded

## ⚠️ Known Limitations

### API Limitations
- **Google Photos API**: Does not provide checksums for integrity verification
- **Google Drive API**: Provides MD5 but not currently used for verification
- **Quota Limits**:
  - Google Sheets: 60 requests/minute/user
  - Google Photos: Variable rate limits
  - Google Drive: Similar per-minute quotas

### Google Sheets Restrictions
**DO NOT manually:**
- ❌ Reorder rows (breaks position-based updates)
- ❌ Delete or move columns (breaks index-based reading)
- ❌ Insert columns in the middle (shifts indices)

**Safe to do:**
- ✅ Apply filters and sorting views
- ✅ Hide rows or columns
- ✅ Add columns at the end
- ✅ Format cells (colors, fonts)

## 🧪 Testing

```bash
# Run tests with mock data (no uploads)
npm test

# Run tests with actual uploads
npm run test:live

# Test with custom WhatsApp directory
node tests/test.js /path/to/whatsapp
```

## 📝 Recent Updates

### Version 1.0.0 (Current)
- ✅ **TASK-023**: Chat-specific upload with dedicated tracking sheets
- ✅ **TASK-030**: SHA-256 deduplication system
- ✅ Adaptive rate limiting for quota management
- ✅ Graceful shutdown with state persistence
- ✅ Fixed column index issues in Google Sheets updates
- ✅ Immediate persistence for critical operations
- ✅ Smart batch updates for progress tracking

## 🛠️ Development

### Project Structure
```
whatsapp-google-uploader/
├── src/
│   ├── cli/               # CLI commands and application
│   ├── scanner/           # WhatsApp directory scanner
│   ├── google-apis/       # Google Photos/Drive/Sheets APIs
│   ├── database/          # Google Sheets database layer
│   ├── uploader/          # Upload manager with deduplication
│   ├── chat-metadata/     # Chat analysis and metadata
│   └── decrypt/           # WhatsApp database decryption
├── tests/                 # Test suite with mock data
├── memory-system/         # Development documentation
└── credentials.json       # Google OAuth credentials
```

### Build Commands
```bash
npm run build              # Build TypeScript
npm run dev                # Build and watch
npm run clean              # Remove dist folder
```

## 📄 License

MIT License - See LICENSE file for details
