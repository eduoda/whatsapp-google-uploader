/**
 * OAuth Manager - Main OAuth2 authentication coordinator
 * 
 * AIDEV-NOTE: oauth-main-class; implements OAuth interface from architecture
 */

import { OAuth2Client } from 'google-auth-library';
import { TokenManager } from './token-manager';
import { FlowManager } from './flow-manager';
import { ScopeValidator } from './scope-validator';
import { OAuthConfig, AuthenticationResult, TokenInfo } from './types/oauth-types';
import { REQUIRED_SCOPES } from './constants';

export class OAuthManager {
  private readonly tokenManager: TokenManager;
  private readonly flowManager: FlowManager;
  private readonly scopeValidator: ScopeValidator;
  private readonly oauth2Client: OAuth2Client;

  constructor(private readonly config: OAuthConfig) {
    this.oauth2Client = new OAuth2Client(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
    
    this.tokenManager = new TokenManager({
      tokenPath: config.tokenStoragePath,
      encryptionKey: config.encryptionKey || 'default-key-change-in-production-32-chars'
    });
    this.flowManager = new FlowManager(this.oauth2Client);
    this.scopeValidator = new ScopeValidator();
  }

  /**
   * Interactive OAuth flow - implements architecture interface
   * AIDEV-NOTE: oauth-authenticate; main authentication entry point
   */
  async authenticate(scopes: string[] = REQUIRED_SCOPES): Promise<AuthenticationResult> {
    // Validate requested scopes
    this.scopeValidator.validateScopes(scopes);

    // Start interactive OAuth flow
    const tokens = await this.flowManager.startInteractiveFlow(scopes);

    // Store tokens securely
    await this.tokenManager.storeTokens(tokens);

    return {
      success: true,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiryDate: tokens.expiry_date || Date.now() + 3600000, // 1 hour default
      scopes
    };
  }

  /**
   * Get valid access token - implements architecture interface
   * AIDEV-NOTE: oauth-token-access; handles token refresh automatically
   */
  async getValidToken(): Promise<string> {
    const storedTokens = await this.tokenManager.loadTokens();
    
    if (!storedTokens) {
      throw new Error('No authentication found. Please run authentication first.');
    }

    // Set tokens in OAuth2 client
    this.oauth2Client.setCredentials(storedTokens);

    // Check if token needs refresh
    if (this.isTokenExpired(storedTokens.expiry_date)) {
      const refreshedTokens = await this.oauth2Client.refreshAccessToken();
      await this.tokenManager.storeTokens(refreshedTokens.credentials);
      return refreshedTokens.credentials.access_token!;
    }

    return storedTokens.access_token!;
  }

  /**
   * Revoke authentication - implements architecture interface
   * AIDEV-TODO: implement-oauth-revoke; add token revocation
   */
  async revokeAccess(): Promise<void> {
    const storedTokens = await this.tokenManager.loadTokens();
    
    if (storedTokens?.access_token) {
      await this.oauth2Client.revokeToken(storedTokens.access_token);
    }

    await this.tokenManager.clearTokens();
  }

  /**
   * Check authentication status - implements architecture interface
   * AIDEV-NOTE: oauth-status-check; quick authentication status check
   */
  isAuthenticated(): boolean {
    const credentials = this.oauth2Client.credentials;
    
    if (!credentials || !credentials.access_token) {
      return false;
    }

    // Check if token is valid (can be mocked in tests)
    return this.isTokenValid(credentials);
  }

  /**
   * Token validity check - can be mocked in tests
   */
  private isTokenValid(token: any): boolean {
    if (!token || !token.access_token) {
      return false;
    }

    // Check if token is expired
    if (token.expiry_date) {
      return !this.isTokenExpired(token.expiry_date);
    }

    // If no expiry date, assume valid
    return true;
  }

  /**
   * Async version of authentication check with full token validation
   */
  async hasValidTokensAsync(): Promise<boolean> {
    return this.tokenManager.hasValidTokens();
  }

  /**
   * Get token information for debugging
   */
  async getTokenInfo(): Promise<TokenInfo | null> {
    const tokens = await this.tokenManager.loadTokens();
    
    if (!tokens) {
      return null;
    }

    return {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date || 0,
      isExpired: this.isTokenExpired(tokens.expiry_date),
      scopes: tokens.scope?.split(' ') || []
    };
  }

  private isTokenExpired(expiryDate?: number | null): boolean {
    if (!expiryDate) return true;
    
    // Consider token expired 5 minutes before actual expiry
    const bufferTime = 5 * 60 * 1000; // 5 minutes in ms
    return Date.now() >= (expiryDate - bufferTime);
  }

  /**
   * Validate token format for property-based testing
   * AIDEV-NOTE: token-validation; validates OAuth token structure
   */
  private validateTokenFormat(token: any): boolean {
    if (!token || typeof token !== 'object') {
      return false;
    }

    // Check required fields
    if (!token.access_token || typeof token.access_token !== 'string') {
      return false;
    }

    if (!token.token_type || typeof token.token_type !== 'string') {
      return false;
    }

    // Check optional but important fields
    if (token.expires_in !== undefined && typeof token.expires_in !== 'number') {
      return false;
    }

    if (token.expiry_date !== undefined && typeof token.expiry_date !== 'number') {
      return false;
    }

    if (token.refresh_token !== undefined && token.refresh_token !== null && typeof token.refresh_token !== 'string') {
      return false;
    }

    if (token.scope !== undefined && typeof token.scope !== 'string') {
      return false;
    }

    return true;
  }

  /**
   * Error categorization methods for retry logic
   * AIDEV-NOTE: error-categorization; helps determine retry strategies
   */
  private isAuthError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('invalid') || 
           message.includes('unauthorized') || 
           message.includes('forbidden') ||
           message.includes('expired');
  }

  private isNetworkError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('enotfound') || 
           message.includes('econnrefused') || 
           message.includes('timeout') ||
           message.includes('network');
  }

  private isQuotaError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('quota') || 
           message.includes('rate limit') || 
           message.includes('too many requests');
  }
}