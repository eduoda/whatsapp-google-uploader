# WhatsApp Google Uploader

🚀 Simple CLI tool for uploading WhatsApp media to Google Photos and Google Drive.

## Features
- **Smart File Routing** - Photos/videos → Album in Google Photos, Documents/audio → Directory in Google Drive
- **Intuitive naming** - Album in Google Photos and directory in Google Drive have the same name the whatspp chat/group
- **Zero-Copy Architecture** - Direct streaming without temporary files
- **Auto-Resume System** - Interruption recovery with cloud-based progress tracking
- **SHA-256 Deduplication** - Prevent duplicate uploads with Google Sheets database
- **Cross-Platform** - Works on Windows, macOS, Linux, and Android 11+ (Termux)
- **Cloud Storage** - Uses Google Sheets for all persistence (no local database needed)
- **Rate Limiting** - Respectful API usage with exponential backoff

## Modules/libs
### ✅ Implemented
- **Google OAuth Authentication** - Desktop app authentication flow
- **Google Photos Upload** - Upload photos/videos with album support
- **Google Drive Upload** - Upload documents and other files to folders
- **WhatsApp Directory Scanning** - Find and categorize media files
- **Google Sheets Database** - Track uploaded files with SHA-256 hashes
- **File Categorization** - Smart routing (photos → Photos, docs → Drive)
- **Test Suite** - Functional tests with mock WhatsApp structure

### 🚧 Not Yet Implemented
- **CLI Upload Command** - `upload` command to execute uploads
- **Status Command** - `status` to show upload progress
- **Logs Command** - `logs` to display activity logs
- **Upload Progress UI** - Real-time upload progress display

### Current Status

⚠️ **Development Phase** - Core functionality works, finalizing CLI commands.

Currently, you can:
1. Authenticate with Google (via `auth` command)
2. Setup environment configuration (via `setup` command)
3. Check system configuration (via `check` command)
4. **NEW: Scan WhatsApp media files (via `scan` command)** ✅
5. Run tests to verify all modules work

## Quick Start

### Installation - Windows/macOS/Linux
```bash
# Install Node.js from nodejs.org or package manager
# Clone and build from source (npm package not yet published)
git clone https://github.com/eduoda/whatsapp-google-uploader.git
cd whatsapp-google-uploader
npm install --production
npm run build
```

### Installation - Termux (Android)

```bash
# 1. Clone the repository
git clone https://github.com/eduoda/whatsapp-google-uploader.git
cd whatsapp-google-uploader

# 2. Run setup script
bash scripts/setup-termux.sh
OR
# 2.1 Manually install in Termux
pkg update && pkg install nodejs
termux-setup-storage # Accept the permission on Android

# 3. Install production dependencies
npm install --production

# 4. Build and run
npm run build
node dist/cli.js scan
```


### Available Commands (Currently Working)

```bash
# Authenticate with Google
node dist/cli.js auth

# Setup environment (creates .env file)
node dist/cli.js setup

# Check configuration
node dist/cli.js check

# Scan WhatsApp media files
node dist/cli.js scan                    # Scan default WhatsApp location
node dist/cli.js scan /path/to/whatsapp  # Scan custom path
```

### Planned Commands (Not Yet Implemented)

```bash
# These commands are NOT YET WORKING:
node dist/cli.js upload --chat="ChatName" # Will upload media from specific chat
node dist/cli.js status                   # Will show upload progress
node dist/cli.js logs                     # Will display activity logs
```

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

### Using the Scan Command

```bash
# Scan WhatsApp media files (auto-detect location)
node dist/cli.js scan

# Scan with custom WhatsApp path
node dist/cli.js scan /path/to/WhatsApp

# Example output:
# WhatsApp Media Files:
#
# PHOTO: 20 files (15.3 MB)
#   - IMG-20240101-WA0001.jpg (1.2 MB)
#   - IMG-20240102-WA0002.jpg (0.8 MB)
#   ... and 18 more
#
# VIDEO: 6 files (45.7 MB)
#   - VID-20240210-WA0006.mp4 (12.3 MB)
#   ... and 5 more
#
# Total: 26 files, 61.0 MB
```

### Development Commands

```bash
# Build TypeScript
npm run build              # Build once
npm run dev                # Build and watch

# Clean build
npm run clean              # Remove dist folder
```


## Configuration

### Google Sheets Database
The system automatically creates a Google Sheets database on first run:
- Spreadsheet: `WhatsApp-Uploader-Database`
- Sheet 1: `uploaded_files` - Tracks uploaded files with SHA-256 hashes
- Sheet 2: `upload_progress` - Tracks progress per chat

### OAuth Token
After first authentication, token is saved to `token.json` for future use.


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

The project includes scripts to create a mock WhatsApp directory structure for testing:

To test with the mock structure:
```bash
# Run test with mock WhatsApp directory
node tests/test.js tests/mock-whatsapp
```
