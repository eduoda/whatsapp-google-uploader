/**
 * @whatsapp-uploader/oauth - Google OAuth2 Authentication Library
 * 
 * AIDEV-NOTE: oauth-main-export; primary entry point for OAuth functionality
 * 
 * This library provides Google OAuth2 authentication and token management
 * for the WhatsApp Google Uploader system.
 */

export { OAuthManager } from './oauth-manager';
export { TokenManager } from './token-manager';
export { FlowManager } from './flow-manager';
export { ScopeValidator } from './scope-validator';

// Types and interfaces
export * from './types/oauth-types';
export * from './types/token-types';

// Constants
export { REQUIRED_SCOPES, DEFAULT_CONFIG } from './constants';