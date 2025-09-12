/**
 * OAuth Type Definitions
 * AIDEV-NOTE: oauth-types; defines OAuth interfaces from architecture
 */

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tokenStoragePath: string;
}

export interface AuthenticationResult {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  scopes: string[];
}

export interface TokenInfo {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  expiryDate: number;
  isExpired: boolean;
  scopes: string[];
}