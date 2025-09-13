# WhatsApp Google Uploader

🚀 Production-ready CLI application for uploading WhatsApp media to Google Photos and Google Drive with enterprise-grade reliability.

## Features

- **Smart File Routing** - Photos/videos → Google Photos, Documents/audio → Google Drive
- **Zero-Copy Architecture** - Direct streaming without temporary files
- **Auto-Resume System** - Interruption recovery with persistent progress tracking
- **SHA-256 Deduplication** - Prevent duplicate uploads with persistent database
- **Cross-Platform** - Works on Windows, macOS, Linux, and Android (Termux)
- **Rate Limiting** - Respectful API usage with exponential backoff
- **Enterprise Reliability** - Comprehensive error handling and retry mechanisms

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
# 1. Install Termux dependencies
pkg update && pkg install nodejs python git build-essential

# 2. Clone the repository
git clone https://github.com/eduoda/whatsapp-google-uploader.git
cd whatsapp-google-uploader

# 3. Setup Termux environment
bash scripts/setup-termux.sh

# 4. Install without problematic dependencies
npm run install:termux

# 5. Grant storage access
termux-setup-storage
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
   ```

4. **Upload media**
   ```bash
   whatsapp-uploader upload --chat-id="ChatName"
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

This application follows a modular library architecture:

- **@whatsapp-uploader/oauth** - Google OAuth2 authentication
- **@whatsapp-uploader/google-drive** - Google Drive API integration
- **@whatsapp-uploader/google-photos** - Google Photos API integration  
- **@whatsapp-uploader/scanner** - WhatsApp directory scanning
- **@whatsapp-uploader/proxy** - Core orchestration and rate limiting

## Development

### Prerequisites

- Node.js 14+ (18+ recommended)
- npm 6+
- SQLite3

### Build from Source

```bash
# Clone repository
git clone https://github.com/user/whatsapp-google-uploader.git
cd whatsapp-google-uploader

# Install dependencies
npm install

# Build all packages
npm run build

# Run system check
npm run check

# Run tests
npm test
```

### Development Commands

```bash
# Build and watch for changes
npm run dev

# Run tests with watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
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

Configuration is managed through environment variables and config files:

- Copy `.env.template` to `.env` and configure
- Platform-specific configs in `config/platforms/`
- Database schema in `config/database/schema.sql`

## Security

- **Minimal OAuth Scopes** - Only requests necessary permissions
- **Encrypted Token Storage** - Secure credential storage
- **No Data Collection** - All processing happens locally
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