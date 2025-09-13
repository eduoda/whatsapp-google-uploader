# WhatsApp Google Uploader

🚀 Production-ready CLI application for uploading WhatsApp media to Google Photos and Google Drive with enterprise-grade reliability.

## Features

- **Smart File Routing** - Photos/videos → Google Photos, Documents/audio → Google Drive
- **Zero-Copy Architecture** - Direct streaming without temporary files
- **Auto-Resume System** - Interruption recovery with cloud-based progress tracking
- **SHA-256 Deduplication** - Prevent duplicate uploads with Google Sheets database
- **Cross-Platform** - Works on Windows, macOS, Linux, and Android 11+ (Termux)
- **Cloud Storage** - Uses Google Sheets for all persistence (no local database needed)
- **Rate Limiting** - Respectful API usage with exponential backoff
- **Enterprise Reliability** - Comprehensive error handling and retry mechanisms

## Project Status

⚠️ **In Development** - Core functionality implemented, CLI pending.

### What's Working ✅
- Google OAuth authentication
- Google Drive uploads
- Google Photos uploads  
- WhatsApp directory scanning
- Google Sheets database
- File deduplication with SHA-256

### What's Pending 🚧
- CLI commands (scan, upload, status)
- Complete upload orchestration
- Progress tracking UI

## Quick Start

### Installation

```bash
# Install globally from npm
npm install -g whatsapp-google-uploader

# Or run directly with npx
npx whatsapp-google-uploader --help
```

### Termux (Android) Installation

```bash
# 1. Install Node.js in Termux
pkg update && pkg install nodejs

# 2. Grant storage access (important!)
termux-setup-storage

# 3. Clone the repository
git clone https://github.com/eduoda/whatsapp-google-uploader.git
cd whatsapp-google-uploader

# 4. Run setup script
bash scripts/setup-termux.sh

# 5. Install production dependencies
npm install --production

# 6. Test scanner
npm run test:scanner
```

### Setup

1. **Configure Google APIs**
   ```bash
   whatsapp-uploader setup
   ```

2. **Authenticate with Google**
   ```bash
   whatsapp-uploader auth
   ```

3. **Scan available chats**
   ```bash
   whatsapp-uploader scan
   # Or specify custom WhatsApp path (Android 11+)
   whatsapp-uploader scan --whatsapp-path="/storage/emulated/0/Android/media/com.whatsapp/WhatsApp"
   ```

4. **Upload media**
   ```bash
   whatsapp-uploader upload --chat-id="ChatName"
   # Or with custom path
   whatsapp-uploader upload --chat-id="ChatName" --whatsapp-path="/custom/path/to/WhatsApp"
   ```

## Commands

- `setup` - Initial system configuration
- `auth` - Google authentication management
- `scan` - Discover WhatsApp chats and media
- `upload` - Upload media to Google services
- `status` - Check upload progress and system status
- `logs` - View detailed logs and error reports
- `check` - Verify system configuration

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
4. Create OAuth 2.0 credentials
5. Download as `credentials.json` to project root

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

# Test components
npm test                 # Run all tests
```

### Testing

```bash
# Test all components
npm test                    # Runs test-all.js
npm run test:components     # Test each component separately
npm run test:scanner        # Scanner only (Termux-friendly)

# Manual testing
node test-all.js            # Direct test with detailed output
./test-components.sh        # Component by component
```

### Development Commands

```bash
# Build TypeScript
npm run build              # Build once
npm run dev                # Build and watch

# Code quality
npm run lint               # Check code style
npm run lint:fix           # Fix code style
```

## Platform Support

### Android (Termux)

```bash
# Install Termux from F-Droid or Google Play
# Setup storage access
termux-setup-storage

# Install Node.js
pkg install nodejs

# Install uploader
npm install -g whatsapp-google-uploader
```

### Windows

```bash
# Install Node.js from nodejs.org
# Install uploader via npm
npm install -g whatsapp-google-uploader
```

### macOS/Linux

```bash
# Install Node.js via package manager or nodejs.org
# Install uploader via npm
npm install -g whatsapp-google-uploader
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

## Performance

- **Memory Efficient** - Constant memory usage regardless of file size
- **Streaming Architecture** - No temporary file creation
- **Configurable Concurrency** - Adjustable for system capabilities
- **Rate Limit Compliance** - Respects Google API quotas

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   ```bash
   whatsapp-uploader auth --reset
   ```

2. **Permission Denied (Android)**
   ```bash
   termux-setup-storage
   ```

3. **Out of Memory**
   - Reduce batch size and concurrency in config
   - Check available system memory

4. **Rate Limited**
   - Wait for quota reset
   - Check Google Cloud Console quotas

### Logs and Debugging

```bash
# View recent logs
whatsapp-uploader logs --tail

# Enable debug mode
export LOG_LEVEL=debug
whatsapp-uploader upload --verbose

# Check system status
whatsapp-uploader status --detailed
```

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