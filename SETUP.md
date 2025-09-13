# Setup Instructions

## Getting Google Credentials

### Option 1: Download from Google Cloud Console (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Google Drive API
   - Google Photos Library API  
   - Google Sheets API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Desktop app" as application type
6. Download JSON → Save as `credentials.json` in project root

### Option 2: Manual Creation

If you have the credentials in another format, create `credentials.json`:

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

## First Run

```bash
# Test authentication
npm test

# This will:
# 1. Open browser for Google login
# 2. Save token to token.json
# 3. Test all components
```

## Files Created

- `credentials.json` - Your OAuth2 credentials (DO NOT commit to git)
- `token.json` - Authentication token (auto-created, DO NOT commit)
- Google Sheets spreadsheet `WhatsApp-Uploader-Database` (auto-created in your Google Drive)

## Security

Add to `.gitignore`:
```
credentials.json
token.json
.env
```

Never commit credentials to version control!