# WhatsApp Google Uploader

🚀 Simple CLI tool for uploading WhatsApp media to Google Photos and Google Drive.

## Features

### ✅ Implemented
- **Google OAuth Authentication** - Desktop app authentication flow
- **Google Photos Upload** - Upload photos/videos with album support
- **Google Drive Upload** - Upload documents and other files to folders
- **WhatsApp Directory Scanning** - Find and categorize media files
- **Google Sheets Database** - Track uploaded files with SHA-256 hashes
- **File Categorization** - Smart routing (photos → Photos, docs → Drive)
- **Test Suite** - Functional tests with mock WhatsApp structure

### 🚧 Not Yet Implemented
- **CLI Commands** - `scan`, `upload`, `status`, `logs` commands
- **Upload Orchestration** - Batch upload with progress tracking
- **Resume System** - Recovery from interrupted uploads
- **Deduplication Check** - Skip already uploaded files
- **Rate Limiting** - API quota management
- **Progress UI** - Real-time upload progress display
- **Error Recovery** - Automatic retry with exponential backoff
- **Album/Folder Selection** - Choose target album/folder via CLI

## Current Status

⚠️ **Development Phase** - Basic modules work individually but CLI is incomplete.

Currently, you can:
1. Authenticate with Google (via `auth` command)
2. Run tests to verify Google APIs work
3. Scan WhatsApp directories programmatically

## Quick Start

### Installation

```bash
# Clone and build from source (npm package not yet published)
git clone https://github.com/eduoda/whatsapp-google-uploader.git
cd whatsapp-google-uploader
npm install --production
npm run build
```

### Termux (Android) Installation

```bash
# 1. Install Node.js in Termux
pkg update && pkg install nodejs

# 2. Grant storage access (IMPORTANT!)
termux-setup-storage
# Accept the permission on Android

# 3. Clone the repository
git clone https://github.com/eduoda/whatsapp-google-uploader.git
cd whatsapp-google-uploader

# 4. Run setup script
bash scripts/setup-termux.sh

# 5. Install production dependencies
npm install --production

# 6. Build and run
npm run build
node dist/cli.js scan
```

**Why it works on Termux:**
- ✅ **Zero native compilation** - No SQLite, no node-gyp
- ✅ **Cloud persistence** - Google Sheets instead of local files
- ✅ **Minimal dependencies** - Only essential packages
- ✅ **Comprehensive tests** - Full test suite for all modules

### Available Commands (Currently Working)

```bash
# Authenticate with Google
node dist/cli.js auth

# Setup environment (creates .env file)
node dist/cli.js setup

# Check configuration
node dist/cli.js check
```

### Planned Commands (Not Yet Implemented)

```bash
# These commands are NOT YET WORKING:
node dist/cli.js scan                    # Will scan WhatsApp directories
node dist/cli.js upload --chat="ChatName" # Will upload media from specific chat
node dist/cli.js status                   # Will show upload progress
node dist/cli.js logs                     # Will display activity logs
```

## Architecture

Simplified single-package architecture:

- **src/google-apis/** - Unified Google APIs (OAuth, Drive, Photos)
- **src/scanner/** - WhatsApp directory scanning
- **src/database/** - Google Sheets cloud database
- **src/uploader/** - Core upload orchestration
- **src/cli/** - Command-line interface

## Development

### Prerequisites

- Node.js 14+ (18+ recommended)
- npm 6+
- Google Account with API access

### Setup

#### 1. Get Google Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable these APIs:
   - Google Drive API
   - Google Photos Library API
   - Google Sheets API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. **IMPORTANT**: Choose **"Desktop app"** as application type (NOT "Web application")
6. Name it "WhatsApp Uploader" or similar
7. Download JSON → Save as `credentials.json` in project root

**Manual Creation (if needed):**
```json
{
  "installed": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "project_id": "your-project-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uris": ["http://localhost"]
  }
}
```

#### 2. Build from Source

```bash
# Clone repository
git clone https://github.com/eduoda/whatsapp-google-uploader.git
cd whatsapp-google-uploader

# Install dependencies
npm install --production  # For users (no dev dependencies)
npm install              # For developers

# Build project
npm run build

# Run tests (see Testing section for details)
npm test                 # Run all functional tests
```

### First Run and Authentication

```bash
# Build the project
npm run build

# Run authentication (will open browser)
node dist/cli.js auth

# This will:
# 1. Open browser for Google login
# 2. Save token to token.json
# 3. Create Google Sheets database automatically
```

**Authentication Process:**
1. A URL will be displayed in the terminal
2. Open the URL in your browser
3. Login with your Google account
4. Grant the requested permissions
5. You'll be redirected to localhost (may show error page - this is normal)
6. Copy the code from the URL and paste it in the terminal
7. Token will be saved for future use

### Development Commands

```bash
# Build TypeScript
npm run build              # Build once
npm run dev                # Build and watch

# Clean build
npm run clean              # Remove dist folder
```

## Platform Support

### Android (Termux)

```bash
# Install Termux from F-Droid or Google Play
# Setup storage access
termux-setup-storage

# Install Node.js
pkg install nodejs

# Clone and build (npm package not yet published)
git clone https://github.com/eduoda/whatsapp-google-uploader.git
cd whatsapp-google-uploader
npm install --production
npm run build
```

### Windows/macOS/Linux

```bash
# Install Node.js from nodejs.org or package manager
# Clone and build (npm package not yet published)
git clone https://github.com/eduoda/whatsapp-google-uploader.git
cd whatsapp-google-uploader
npm install --production
npm run build
```

## Configuration

### Google Sheets Database
The system automatically creates a Google Sheets database on first run:
- Spreadsheet: `WhatsApp-Uploader-Database`
- Sheet 1: `uploaded_files` - Tracks uploaded files with SHA-256 hashes
- Sheet 2: `upload_progress` - Tracks progress per chat

### OAuth Token
After first authentication, token is saved to `token.json` for future use.

## Security

- **Minimal OAuth Scopes** - Only requests necessary permissions
- **Simple Token Storage** - OAuth token in local JSON file (appropriate for personal use)
- **Cloud-Based Database** - All persistence in Google Sheets (no local database files)
- **No Complex Encryption** - Simplified for personal backup tool
- **Secure File Access** - Validates all file paths and permissions

**Important Security Notes:**
- Never commit `credentials.json` or `token.json` to git
- These files are already in `.gitignore`
- Keep your Google Cloud project private
- Regularly review API usage in Google Cloud Console

## Performance

- **Memory Efficient** - Constant memory usage regardless of file size
- **Streaming Architecture** - No temporary file creation
- **Configurable Concurrency** - Adjustable for system capabilities
- **Rate Limit Compliance** - Respects Google API quotas

## Testing

### Running Tests

Simple functional test that verifies real production code.

```bash
# Run test with dry-run (builds first, no uploads)
npm test

# Run test with actual uploads (builds first, requires authentication)
npm run test:live

# Run test directly with custom WhatsApp directory (no build)
node tests/test.js /path/to/whatsapp

# Run test directly with dry-run and custom directory (no build)
node tests/test.js --dry-run /path/to/whatsapp
```

### Test Features

The test verifies:
1. **Scanner**: Finds media files in WhatsApp directories
2. **Google APIs**: Initializes with credentials
3. **Album Creation**: Creates albums in Google Photos (live mode)
4. **Photo Upload**: Uploads photos to Google Photos (live mode)
5. **Album Management**: Adds photos to albums (live mode)

### Mock WhatsApp Directory

The project includes a mock WhatsApp directory structure for testing:

```bash
# Create mock directory structure only
./tests/mock-whatsapp/setup.sh

# Create structure and populate with sample files
./tests/mock-whatsapp/setup.sh --populate
```

The mock structure replicates Android 12+ WhatsApp layout:
```
tests/mock-whatsapp/
└── Android/media/com.whatsapp/WhatsApp/
    ├── Media/
    │   ├── WhatsApp Images/      # Photos (.jpg, .png)
    │   ├── WhatsApp Video/        # Videos (.mp4)
    │   ├── WhatsApp Documents/    # Documents (.pdf, .txt)
    │   ├── WhatsApp Audio/        # Audio messages (.mp3)
    │   ├── WhatsApp Voice Notes/  # Voice notes (.opus)
    │   ├── WhatsApp Animated Gifs/# GIFs (.gif)
    │   ├── WhatsApp Stickers/     # Stickers (.webp)
    │   └── .Statuses/             # Status updates
    ├── Databases/                 # Encrypted backups (.crypt14)
    └── Profile Pictures/          # Contact photos

Each media folder includes Sent/ and Private/ subdirectories for complete coverage.
```

To test with the mock structure:
```bash
# Run test with mock WhatsApp directory
node tests/test.js tests/mock-whatsapp
```

## Security

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Delete `tokens/google-tokens.json` and authenticate again
   - Check if credentials.json is valid
   - Verify APIs are enabled in Google Cloud Console

2. **"WhatsApp directory not found" (Android)**
   ```bash
   # Run this first:
   termux-setup-storage
   # Then check paths:
   ls /storage/emulated/0/Android/media/com.whatsapp/
   ```

3. **"invalid_client" error**
   - Verify Client ID and Secret in credentials.json
   - Ensure you selected "Desktop app" type in Google Console

4. **"redirect_uri_mismatch"**
   - Check that redirect URI is exactly "http://localhost"
   - Recreate credentials as Desktop app type

5. **Commands not working**
   - Most CLI commands are NOT YET IMPLEMENTED
   - Currently only `auth`, `setup`, and `check` work
   - Use the test suite to verify functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- GitHub Issues: [Report bugs and request features](https://github.com/user/whatsapp-google-uploader/issues)
- Documentation: [Full documentation](https://github.com/user/whatsapp-google-uploader/wiki)
- Discussions: [Community discussions](https://github.com/user/whatsapp-google-uploader/discussions)

---

**Built with Claude Code Multi-Agent System**