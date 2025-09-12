# @whatsapp-uploader/oauth

Google OAuth2 authentication library for the WhatsApp Google Uploader system.

## Overview

This library provides secure Google OAuth2 authentication and token management with minimal required scopes for Photos and Drive API access.

## Features

- **Secure Token Storage**: Encrypted token storage with secure file permissions
- **Automatic Token Refresh**: Transparent token refresh with error handling
- **Minimal Scopes**: Only requests necessary permissions for Photos and Drive access
- **Interactive Flow**: CLI-friendly OAuth2 authorization flow
- **Cross-platform**: Works on Windows, macOS, Linux, and Android/Termux

## Usage

```typescript
import { OAuthManager } from '@whatsapp-uploader/oauth';

const oauthManager = new OAuthManager({
  clientId: 'your-google-client-id',
  clientSecret: 'your-google-client-secret',
  redirectUri: 'urn:ietf:wg:oauth:2.0:oob',
  tokenStoragePath: '~/.whatsapp-uploader/tokens.json'
});

// Authenticate user (interactive)
const result = await oauthManager.authenticate();
console.log('Authenticated successfully:', result.success);

// Get valid access token (handles refresh automatically)
const accessToken = await oauthManager.getValidToken();

// Check authentication status
const isAuthenticated = await oauthManager.isAuthenticated();
```

## Required Scopes

The library requests minimal required scopes following security best practices:

- `https://www.googleapis.com/auth/photoslibrary.appendonly` - Upload photos/videos to Google Photos
- `https://www.googleapis.com/auth/drive.file` - Upload files to Google Drive

## API Reference

### OAuthManager

Main authentication coordinator class.

#### Methods

- `authenticate(scopes?: string[]): Promise<AuthenticationResult>` - Start interactive OAuth flow
- `getValidToken(): Promise<string>` - Get valid access token (refreshes if needed)  
- `revokeAccess(): Promise<void>` - Revoke authentication and clear tokens
- `isAuthenticated(): Promise<boolean>` - Check if user is authenticated
- `getTokenInfo(): Promise<TokenInfo | null>` - Get token information for debugging

### TokenManager

Secure token storage and retrieval.

#### Methods

- `storeTokens(tokens: StoredTokens): Promise<void>` - Store tokens securely
- `getStoredTokens(): Promise<StoredTokens | null>` - Retrieve stored tokens
- `clearTokens(): Promise<void>` - Clear all stored tokens
- `hasValidTokens(): Promise<boolean>` - Check if valid tokens exist

### FlowManager  

Interactive OAuth2 flow handling.

#### Methods

- `startInteractiveFlow(scopes: string[]): Promise<Credentials>` - Complete OAuth flow
- `getAuthUrl(scopes: string[]): Promise<string>` - Generate authorization URL
- `exchangeCodeForTokens(code: string): Promise<Credentials>` - Exchange auth code for tokens

### ScopeValidator

OAuth scope validation and management.

#### Methods

- `validateScopes(scopes: string[]): void` - Validate requested scopes
- `hasRequiredScopes(scopes: string[]): boolean` - Check if required scopes present
- `getMinimalScopes(): string[]` - Get minimal required scopes
- `getMissingScopes(granted: string[]): string[]` - Find missing required scopes

## Security Features

- **Encrypted Storage**: Tokens encrypted at rest using system keychain when available
- **Secure Permissions**: Token files created with restricted permissions (600)
- **Minimal Scopes**: Only requests necessary permissions
- **Token Refresh**: Automatic token refresh with secure refresh token storage
- **Revocation**: Proper token revocation on logout

## Error Handling

The library throws specific error types for different failure scenarios:

- `AuthenticationError` - OAuth flow failures
- `TokenError` - Token storage/retrieval failures  
- `ScopeError` - Scope validation failures
- `NetworkError` - Network-related failures

## Development

```bash
# Install dependencies
npm install

# Build library
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

## Dependencies

- `google-auth-library`: Google's official OAuth2 library
- Peer dependencies managed by parent package

## License

MIT - See LICENSE file for details.