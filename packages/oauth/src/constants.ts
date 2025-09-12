/**
 * OAuth Constants
 * AIDEV-NOTE: oauth-constants; centralized OAuth configuration
 */

/**
 * Required Google API scopes for WhatsApp uploader functionality
 * Following architecture decision for minimal scope principle
 */
export const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/photoslibrary.appendonly', // Upload to Google Photos
  'https://www.googleapis.com/auth/drive.file'                // Upload files to Google Drive
];

/**
 * Default OAuth configuration
 */
export const DEFAULT_CONFIG = {
  redirectUri: 'urn:ietf:wg:oauth:2.0:oob', // Out-of-band flow for CLI
  tokenStoragePath: '~/.whatsapp-uploader/tokens.json'
};

/**
 * OAuth flow constants
 */
export const OAUTH_CONSTANTS = {
  // Token refresh buffer time (5 minutes before expiry)
  TOKEN_REFRESH_BUFFER_MS: 5 * 60 * 1000,
  
  // Maximum token refresh attempts
  MAX_REFRESH_ATTEMPTS: 3,
  
  // OAuth flow timeout (5 minutes)
  FLOW_TIMEOUT_MS: 5 * 60 * 1000
};