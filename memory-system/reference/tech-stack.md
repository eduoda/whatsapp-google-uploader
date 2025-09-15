# Technology Stack - WhatsApp Google Uploader

## Overview
This document provides the actual technology stack used in the WhatsApp Google Uploader project as of the production-ready release (v1.0.0).

---

## Runtime Environment
- **Platform:** Node.js CLI Application
- **Node.js Version:** >= 14.0.0 (ES6+ features, async/await, TypeScript support)
- **Target Platforms:** Windows, macOS, Linux, Android (Termux)
- **Package Manager:** npm

## Core Dependencies (Production)

### CLI Framework
- **commander.js v14.0.1**: Command parsing and CLI interface
- **Node.js readline**: Interactive prompts and user input

### Google API Integration
- **googleapis v126.0.1**: Official Google APIs client library
- **google-auth-library v9.0.0**: OAuth2 authentication and token management
- **Required APIs**:
  - Google Photos Library API
  - Google Drive API v3
  - Google Sheets API v4 (for database functionality)
  - OAuth2 API for authentication

### File Processing & Utilities
- **Node.js Streams**: Native streaming for memory-efficient file processing
- **crypto**: Native module for SHA-256 hash calculation
- **fs/promises**: Async file system operations
- **path**: Cross-platform path manipulation
- **mime-types v2.1.35**: MIME type detection for smart file routing

### Database & HTTP
- **better-sqlite3 v11.3.0**: SQLite3 database for WhatsApp msgstore.db reading
- **axios v1.12.1**: HTTP client for API requests
- **Google Sheets API v4**: Cloud-based database for progress tracking and deduplication

### Configuration
- **dotenv v17.2.2**: Environment variable management for credentials

## Development Dependencies

### TypeScript & Build Tools
- **typescript v5.9.2**: TypeScript compiler
- **@types/node v20.19.14**: Node.js type definitions
- **@types/better-sqlite3 v7.6.11**: better-sqlite3 type definitions
- **@types/mime-types v2.1.4**: mime-types type definitions
- **rimraf v5.0.10**: Cross-platform file deletion for build cleanup

## Architecture Decisions

### Database Strategy
- **Primary Storage:** Google Sheets (cloud-based, zero-install, cross-platform)
- **Local Database:** better-sqlite3 (only for reading WhatsApp msgstore.db)
- **No Local Persistence:** All progress/state stored in Google Sheets

### Authentication & Authorization
- **Strategy:** Google OAuth2 with desktop app flow
- **Scope:** Minimal required permissions (photos.append, drive.file, sheets)
- **Token Storage:** Local file system with secure permissions
- **Credential Management:** JSON file (credentials.json) + .env for backup keys

### File Processing Architecture
- **Zero-Copy Streaming:** Direct file streams from source to Google APIs
- **Content-Based Hashing:** SHA-256 for duplicate detection
- **Smart Routing:** Photos/videos → Google Photos, Documents/audio → Google Drive
- **No Temporary Files:** Stream directly without intermediate storage

## Production Configuration

### Required Environment Variables
```bash
# Optional - WhatsApp Database Decryption
WHATSAPP_BACKUP_KEY=64-character-hex-key-for-crypt15-decryption

# Auto-created by OAuth flow
GOOGLE_CLIENT_ID=auto-generated-from-credentials.json
GOOGLE_CLIENT_SECRET=auto-generated-from-credentials.json
```

### File Structure
```
whatsapp-google-uploader/
├── credentials.json          # Google OAuth credentials (user provides)
├── tokens.json              # OAuth tokens (auto-created)
├── .env                     # Environment variables (optional)
├── dist/                    # Compiled TypeScript output
├── src/                     # TypeScript source code
└── decrypted/              # WhatsApp database decryption output
```

## External Dependencies

### Python (Optional - for WhatsApp Decryption)
- **wa-crypt-tools**: Python library for .crypt15 decryption
- **Installation**: `pip install wa-crypt-tools`
- **Usage**: Called via Node.js child process for `npm run decrypt`

### Google Cloud APIs
| Service | Purpose | Version |
|---------|---------|---------|
| Google Photos Library API | Photo/video uploads | v1 |
| Google Drive API | Document/audio uploads | v3 |
| Google Sheets API | Progress database | v4 |
| OAuth2 API | Authentication | v2 |

## Testing Strategy

### Current Testing Approach
- **Framework:** Native Node.js (no external test framework)
- **Location:** `tests/test.js`
- **Types:** Integration tests with mock data
- **Coverage:** All core functionality tested
- **Commands:**
  - `npm test` - Run tests with mock data
  - `npm run test:live` - Run tests with real APIs (requires auth)

## Performance Characteristics

### Memory Usage
- **Streaming Architecture:** Constant ~50MB memory usage regardless of file size
- **No File Buffering:** Direct stream processing from filesystem to APIs
- **Efficient Scanning:** SQLite3 database queries for chat metadata

### Upload Performance
- **Sequential Uploads:** One file at a time to avoid quota limits
- **Adaptive Rate Limiting:** Exponential backoff for quota management
- **Smart Deduplication:** SHA-256 content hashing prevents re-uploads

### Cross-Platform Support
- **Desktop:** Windows, macOS, Linux
- **Mobile:** Android 11+ via Termux
- **Path Handling:** Universal path resolution
- **Permissions:** Platform-appropriate file access

## Build & Deployment

### Build Process
```bash
npm run build        # Compile TypeScript to JavaScript
npm run dev         # Watch mode for development
npm run clean       # Clean build artifacts
```

### CLI Commands (Production)
```bash
npm run auth        # Authenticate with Google
npm run scan        # Scan WhatsApp media and save to Sheets
npm run upload      # Upload media from specific chat
npm run decrypt     # Decrypt WhatsApp database
npm run check       # Verify configuration
npm run setup       # Create .env template
npm test           # Run test suite
```

## Quality Assurance

### Code Quality
- **TypeScript:** Strict type checking enabled
- **No Linting Framework:** Following KISS principle - simple, readable code
- **Manual Code Review:** All changes reviewed by architect
- **Test Coverage:** All CLI commands and core functionality tested

### Security Considerations
- **OAuth2 Best Practices:** Following Google's recommended OAuth2 flow
- **Minimal API Scopes:** Only required permissions requested
- **Credential Security:** Local file storage with appropriate permissions
- **No Network Storage:** All sensitive data stored locally or in user's Google account

## Versioning & Updates

### Current Version: 1.0.0
- **Status:** Production-ready
- **Versioning:** Semantic versioning (MAJOR.MINOR.PATCH)
- **Update Strategy:** Manual updates via git pull + npm install

### Upgrade Path
- **Node.js:** Tested on 14.x, 16.x, 18.x, 20.x
- **Dependencies:** Regular security updates applied
- **Google APIs:** Using latest stable versions

---

## Quick Commands Reference

### Setup & Authentication
```bash
# Initial setup
npm install --production
npm run build
npm run auth

# Verify setup
npm run check
```

### Daily Usage
```bash
# Scan WhatsApp media
npm run scan

# Upload specific chat
npm run upload "Chat Name"

# Decrypt WhatsApp database (if needed)
npm run decrypt
```

---

*Last Updated: 2025-09-15*
*Production Version: 1.0.0*
*Architecture Status: Production-Ready*

**Note:** This tech stack follows KISS/YAGNI/DRY principles with minimal dependencies and maximum functionality.