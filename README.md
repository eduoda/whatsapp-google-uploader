# WhatsApp Google Uploader

🚀 Production-ready CLI tool for uploading WhatsApp media to Google Photos and Google Drive with intelligent deduplication and quota management.

## ✨ Features

- **📱 Smart File Routing** - Photos/videos → Google Photos albums, Documents/audio → Google Drive folders
- **🔒 SHA-256 Deduplication** - Prevents duplicate uploads using content hashing
- **📊 Per-Chat Tracking** - Individual Google Sheets for each chat with full upload history
- **⚡ Zero-Copy Architecture** - Direct streaming without temporary files
- **🛡️ Graceful Shutdown** - Saves state on Ctrl+C, resumes from exact point
- **🎯 Adaptive Rate Limiting** - Smart quota management with exponential backoff
- **☁️ Cloud Persistence** - Google Sheets as database (no local storage needed)
- **🌍 Cross-Platform** - Windows, macOS, Linux, and Android 11+ (Termux)

## 📦 Installation

### Desktop (Windows/macOS/Linux)
```bash
git clone https://github.com/eduoda/whatsapp-google-uploader.git
cd whatsapp-google-uploader
npm install --production
npm run build
```

### Android (Termux)
```bash
pkg update && pkg install nodejs
termux-setup-storage  # Grant storage permission
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
npm run auth
# Opens browser for Google login
# Creates Google Sheets database automatically
```

### 3. Decrypt WhatsApp Database (Optional)
```bash
# Install wa-crypt-tools
pip install wa-crypt-tools

# Add backup key to .env
echo "WHATSAPP_BACKUP_KEY=your-64-character-hex-key" >> .env

# Decrypt database
npm run decrypt
```

### 4. Scan WhatsApp Media
```bash
npm run scan                    # Auto-detect location
npm run scan -- /custom/path    # Custom WhatsApp path
npm run scan -- --dry-run       # Preview without saving to Sheets
```

### 5. Upload Media
```bash
npm run upload -- "Chat Name"                      # Upload from specific chat
npm run upload -- "Chat Name" --skip-failed        # Skip previously failed files
npm run upload -- "Chat Name" --dry-run            # Preview what would be uploaded
```

## 📖 Command Reference

### Main Commands

| Command | Description | Options |
|---------|-------------|---------|
| `npm run auth` | Authenticate with Google | `--manual` - Use manual code entry |
| `npm run scan` | Scan WhatsApp media and save to Sheets | `[path]` - Custom WhatsApp path<br>`--dry-run` - Skip Sheets saving |
| `npm run upload` | Upload media from specific chat | `"Chat Name"` - Required chat name<br>`--skip-failed` - Skip failed files<br>`--dry-run` - Preview only |
| `npm run decrypt` | Decrypt WhatsApp database | `[path]` - Custom WhatsApp path<br>`--key` - Direct hex key (64 chars) |

### Utility Commands

| Command | Description |
|---------|-------------|
| `npm run check` | Verify configuration and authentication |
| `npm run setup` | Create environment file template |
| `npm test` | Run tests with mock data |
| `npm run test:live` | Run tests with actual uploads |

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build TypeScript to JavaScript |
| `npm run dev` | Build and watch for changes |
| `npm run clean` | Remove dist folder |

## 🏗️ Architecture

### Google Sheets Structure

#### Main Sheet: `WhatsApp-Media-Tracker-YYYY-MM-DD`
Tracks all chats with metadata and upload statistics.

#### Per-Chat Sheet: `[Chat-Name]_[JID]`
Individual tracking for each chat's files with SHA-256 hashes and upload status.

### Upload Organization

- **Photos/Videos** → Google Photos album: `WA_[Chat-Name]_[JID]`
- **Documents/Audio** → Google Drive folder: `/WhatsApp Google Uploader/[Chat-Name]_[JID]/`

### Quota Management

- **Initial delay**: 1.5 seconds between uploads
- **Adaptive**: Reduces delay on success (min 1s)
- **Backoff**: Exponential increase on quota errors (max 60s)
- **Batch updates**: Progress saved every 5 seconds
- **Critical saves**: Success/failure saved immediately

## 📊 Google Sheets Capabilities

### ✅ You CAN Safely:
- **Reorder rows** - All lookups use unique IDs
- **Edit chat names** - Custom names preserved across scans
- **Apply filters and sorting** - Won't affect the system
- **Hide rows or columns** - For visual organization
- **Format cells** - Colors, fonts, etc.
- **Add columns at the end** - For your own notes

### ❌ DO NOT:
- Delete or move existing columns
- Insert columns in the middle
- Change column headers

## ⚠️ Known Limitations

- **Google Photos API**: No checksum verification available
- **Google Drive API**: MD5 available but not implemented
- **API Quotas**:
  - Google Sheets: 60 requests/minute/user
  - Google Photos/Drive: Variable rate limits

## 🛠️ Project Structure

```
whatsapp-google-uploader/
├── src/
│   ├── cli/               # CLI commands
│   ├── scanner/           # WhatsApp scanner
│   ├── google-apis/       # Google APIs integration
│   ├── database/          # Sheets database layer
│   ├── uploader/          # Upload manager
│   ├── chat-metadata/     # Chat analysis
│   └── decrypt/           # Database decryption
├── tests/                 # Test suite
└── credentials.json       # Google OAuth credentials
```

## 📄 License

MIT License - See LICENSE file for details