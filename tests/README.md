# WhatsApp Google Uploader - Tests

## 📁 Test Structure

```
tests/
├── oauth.test.js        # OAuth authentication tests
├── photos.test.js       # Google Photos upload tests
├── drive.test.js        # Google Drive upload tests
├── scanner.test.js      # WhatsApp media scanner tests
├── run-all-tests.js     # Main test runner
└── mock-whatsapp/       # Mock WhatsApp directory for testing
    └── WhatsApp/
        ├── Images/      # Test images
        ├── Videos/      # Test videos
        ├── Documents/   # Test documents
        ├── Audio/       # Test audio files
        ├── Voice Notes/ # Test voice notes
        └── Animated Gifs/ # Test GIFs
```

## 🚀 Running Tests

### Run all tests
```bash
npm test
```

### Run with custom WhatsApp directory
```bash
npm test -- /path/to/your/WhatsApp
```

### Run individual test suites
```bash
npm run test:oauth     # OAuth authentication tests
npm run test:scanner   # Scanner functionality tests
npm run test:photos    # Google Photos upload tests
npm run test:drive     # Google Drive upload tests
```

## 📝 Test Coverage

### OAuth Tests
- ✅ GoogleApis initialization with credentials.json
- ✅ OAuth2 client creation
- ✅ Token existence and validation
- ✅ Token structure (access_token, refresh_token)
- ✅ Token expiry checking
- ✅ OAuth scopes configuration

### Scanner Tests
- ✅ WhatsApp directory detection
- ✅ Folder structure validation
- ✅ Media file discovery
- ✅ Metadata extraction
- ✅ Hidden file filtering
- ✅ Batch processing
- ✅ MIME type detection
- ✅ Auto-path detection

### Google Photos Tests
- ✅ API initialization
- ✅ Test image availability
- ✅ Upload preparation
- ✅ API methods availability
- ✅ Album operations structure
- ✅ Media type scanning

### Google Drive Tests
- ✅ API initialization
- ✅ Folder structure planning
- ✅ Test document availability
- ✅ API methods availability
- ✅ File metadata preparation
- ✅ MIME type detection
- ✅ Folder organization logic
- ✅ Resumable upload support

## 🎯 Mock WhatsApp Directory

The tests use a mock WhatsApp directory structure at `tests/mock-whatsapp/WhatsApp/` that mimics the real WhatsApp media folder structure:

- **Images/**: JPEG and PNG image files
- **Videos/**: MP4 video files
- **Documents/**: PDF and document files
- **Audio/**: MP3 and audio files
- **Voice Notes/**: OPUS voice messages
- **Animated Gifs/**: GIF files

Test files are automatically created if they don't exist.

## ⚠️ Important Notes

1. **No Real Uploads**: Tests don't perform actual uploads to Google services to avoid API quota usage
2. **Credentials Required**: OAuth tests require a valid `credentials.json` file in the project root
3. **Token Path**: Tokens are saved to `./tokens/test-google-tokens.json` for tests
4. **Custom Path**: You can test with your actual WhatsApp directory by passing it as an argument

## 🔧 Troubleshooting

If tests fail:

1. **Check credentials.json**: Ensure you have valid Google OAuth credentials
2. **Build first**: Tests require the project to be built (`npm run build`)
3. **Check permissions**: Ensure read access to WhatsApp directories
4. **Token issues**: Delete `tokens/test-google-tokens.json` and re-authenticate