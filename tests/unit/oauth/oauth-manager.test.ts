/**
 * OAuth Manager Unit Tests
 * AIDEV-NOTE: oauth-tests; comprehensive testing of OAuth2 authentication flow
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fc from 'fast-check';
import { OAuthManager } from '../../../src/auth/index';
import { mockDatabase } from '../../__mocks__/database';
import { createMockGoogleAuth } from '../../__mocks__/google-apis';
import { oauthTokenArbitrary, networkErrorArbitrary } from '../../fixtures/property-generators';

// Mock the google-auth-library
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    generateAuthUrl: jest.fn(),
    getToken: jest.fn(),
    setCredentials: jest.fn(),
    refreshAccessToken: jest.fn(),
    revokeCredentials: jest.fn()
  }))
}));

describe('OAuthManager', () => {
  let oauthManager: OAuthManager;
  let mockAuthClient: any;
  let mockAuth: ReturnType<typeof createMockGoogleAuth>;

  beforeEach(() => {
    mockDatabase.reset();
    mockAuth = createMockGoogleAuth();
    
    // Mock the OAuth2Client
    const { OAuth2Client } = require('google-auth-library');
    mockAuthClient = new OAuth2Client();
    
    oauthManager = new OAuthManager({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:3000/callback'
    });

    // Replace the internal auth client with our mock
    (oauthManager as any).authClient = mockAuthClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should successfully complete OAuth flow', async () => {
      const scopes = ['https://www.googleapis.com/auth/photoslibrary.appendonly'];
      const authUrl = 'https://accounts.google.com/oauth/authorize?test=true';
      const mockTokens = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expiry_date: Date.now() + 3600000
      };

      mockAuthClient.generateAuthUrl.mockReturnValue(authUrl);
      mockAuthClient.getToken.mockResolvedValue({ tokens: mockTokens });

      // Mock user input for authorization code
      const mockPrompt = jest.fn().mockResolvedValue({ code: 'test-auth-code' });
      (oauthManager as any).promptForCode = mockPrompt;

      const result = await oauthManager.authenticate(scopes);

      expect(result).toBe(true);
      expect(mockAuthClient.generateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
      });
      expect(mockAuthClient.getToken).toHaveBeenCalledWith('test-auth-code');
      expect(mockAuthClient.setCredentials).toHaveBeenCalledWith(mockTokens);
    });

    it('should handle authentication errors gracefully', async () => {
      const scopes = ['https://www.googleapis.com/auth/photoslibrary.appendonly'];
      
      mockAuthClient.generateAuthUrl.mockReturnValue('test-url');
      mockAuthClient.getToken.mockRejectedValue(new Error('Invalid authorization code'));

      const mockPrompt = jest.fn().mockResolvedValue({ code: 'invalid-code' });
      (oauthManager as any).promptForCode = mockPrompt;

      await expect(oauthManager.authenticate(scopes)).rejects.toThrow('Invalid authorization code');
    });

    it('should validate required scopes', async () => {
      await expect(oauthManager.authenticate([])).rejects.toThrow('At least one scope is required');
      await expect(oauthManager.authenticate(['invalid-scope'])).rejects.toThrow('Invalid scope');
    });

    it('should handle network errors during authentication', async () => {
      const scopes = ['https://www.googleapis.com/auth/photoslibrary.appendonly'];
      
      mockAuthClient.generateAuthUrl.mockReturnValue('test-url');
      mockAuthClient.getToken.mockRejectedValue(new Error('ENOTFOUND'));

      const mockPrompt = jest.fn().mockResolvedValue({ code: 'test-code' });
      (oauthManager as any).promptForCode = mockPrompt;

      await expect(oauthManager.authenticate(scopes)).rejects.toThrow('ENOTFOUND');
    });

    // Property-based test: OAuth tokens should have expected structure
    it('should handle various token formats', () => {
      fc.assert(fc.property(oauthTokenArbitrary, (token) => {
        // Test token validation
        const isValid = (oauthManager as any).validateTokenFormat(token);
        
        expect(typeof isValid).toBe('boolean');
        
        if (token.access_token && token.access_token.length > 10) {
          expect(isValid).toBe(true);
        }
      }));
    });
  });

  describe('getValidToken', () => {
    it('should return valid token when available', async () => {
      const validToken = {
        access_token: 'valid-token',
        expiry_date: Date.now() + 3600000 // 1 hour from now
      };

      mockAuthClient.credentials = validToken;
      (oauthManager as any).isTokenValid = jest.fn().mockReturnValue(true);

      const result = await oauthManager.getValidToken();

      expect(result).toBe('valid-token');
    });

    it('should refresh token when expired', async () => {
      const expiredToken = {
        access_token: 'expired-token',
        refresh_token: 'refresh-token',
        expiry_date: Date.now() - 3600000 // 1 hour ago
      };

      const refreshedToken = {
        access_token: 'new-token',
        refresh_token: 'refresh-token',
        expiry_date: Date.now() + 3600000
      };

      mockAuthClient.credentials = expiredToken;
      (oauthManager as any).isTokenValid = jest.fn().mockReturnValue(false);
      mockAuthClient.refreshAccessToken.mockResolvedValue({ credentials: refreshedToken });

      const result = await oauthManager.getValidToken();

      expect(result).toBe('new-token');
      expect(mockAuthClient.refreshAccessToken).toHaveBeenCalled();
      expect(mockAuthClient.setCredentials).toHaveBeenCalledWith(refreshedToken);
    });

    it('should throw error when no token available', async () => {
      mockAuthClient.credentials = null;

      await expect(oauthManager.getValidToken()).rejects.toThrow('No authentication credentials available');
    });

    it('should handle refresh token failure', async () => {
      const expiredToken = {
        access_token: 'expired-token',
        refresh_token: 'invalid-refresh-token',
        expiry_date: Date.now() - 3600000
      };

      mockAuthClient.credentials = expiredToken;
      (oauthManager as any).isTokenValid = jest.fn().mockReturnValue(false);
      mockAuthClient.refreshAccessToken.mockRejectedValue(new Error('Invalid refresh token'));

      await expect(oauthManager.getValidToken()).rejects.toThrow('Invalid refresh token');
    });

    // Property-based test: Network errors should be handled consistently
    it('should handle network errors during token refresh', () => {
      fc.assert(fc.property(networkErrorArbitrary, async (networkError) => {
        const expiredToken = {
          access_token: 'expired-token',
          refresh_token: 'refresh-token',
          expiry_date: Date.now() - 3600000
        };

        mockAuthClient.credentials = expiredToken;
        (oauthManager as any).isTokenValid = jest.fn().mockReturnValue(false);
        
        const error = new Error(networkError.message);
        (error as any).code = networkError.code;
        mockAuthClient.refreshAccessToken.mockRejectedValue(error);

        await expect(oauthManager.getValidToken()).rejects.toThrow();
      }));
    });
  });

  describe('revokeAccess', () => {
    it('should successfully revoke access', async () => {
      const mockTokens = {
        access_token: 'test-token',
        refresh_token: 'refresh-token'
      };

      mockAuthClient.credentials = mockTokens;
      mockAuthClient.revokeCredentials.mockResolvedValue({});

      await oauthManager.revokeAccess();

      expect(mockAuthClient.revokeCredentials).toHaveBeenCalled();
      expect(mockAuthClient.credentials).toBeNull();
    });

    it('should handle revocation errors gracefully', async () => {
      const mockTokens = {
        access_token: 'test-token',
        refresh_token: 'refresh-token'
      };

      mockAuthClient.credentials = mockTokens;
      mockAuthClient.revokeCredentials.mockRejectedValue(new Error('Revocation failed'));

      await expect(oauthManager.revokeAccess()).rejects.toThrow('Revocation failed');
    });

    it('should handle case when no credentials exist', async () => {
      mockAuthClient.credentials = null;

      await expect(oauthManager.revokeAccess()).rejects.toThrow('No credentials to revoke');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when valid token exists', () => {
      const validToken = {
        access_token: 'valid-token',
        expiry_date: Date.now() + 3600000
      };

      mockAuthClient.credentials = validToken;
      (oauthManager as any).isTokenValid = jest.fn().mockReturnValue(true);

      const result = oauthManager.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when no token exists', () => {
      mockAuthClient.credentials = null;

      const result = oauthManager.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when token is expired', () => {
      const expiredToken = {
        access_token: 'expired-token',
        expiry_date: Date.now() - 3600000
      };

      mockAuthClient.credentials = expiredToken;
      (oauthManager as any).isTokenValid = jest.fn().mockReturnValue(false);

      const result = oauthManager.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('token validation', () => {
    // Property-based test: Token validation should be consistent
    it('should consistently validate token formats', () => {
      fc.assert(fc.property(oauthTokenArbitrary, (token) => {
        const isValid1 = (oauthManager as any).isTokenValid(token);
        const isValid2 = (oauthManager as any).isTokenValid(token);
        
        expect(isValid1).toBe(isValid2); // Idempotent
      }));
    });

    it('should validate token expiry correctly', () => {
      const now = Date.now();
      
      // Valid token (expires in future)
      const validToken = {
        access_token: 'valid-token',
        expiry_date: now + 3600000
      };
      
      expect((oauthManager as any).isTokenValid(validToken)).toBe(true);
      
      // Expired token
      const expiredToken = {
        access_token: 'expired-token',
        expiry_date: now - 3600000
      };
      
      expect((oauthManager as any).isTokenValid(expiredToken)).toBe(false);
      
      // Token expiring very soon (within 5 minutes)
      const soonToExpireToken = {
        access_token: 'soon-to-expire-token',
        expiry_date: now + 240000 // 4 minutes
      };
      
      expect((oauthManager as any).isTokenValid(soonToExpireToken)).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should categorize errors correctly', () => {
      const authError = new Error('Invalid client credentials');
      const networkError = new Error('ENOTFOUND');
      const quotaError = new Error('Daily Limit Exceeded');
      
      expect((oauthManager as any).isAuthError(authError)).toBe(true);
      expect((oauthManager as any).isNetworkError(networkError)).toBe(true);
      expect((oauthManager as any).isQuotaError(quotaError)).toBe(true);
    });

    it('should implement retry logic for transient errors', async () => {
      const transientError = new Error('Service temporarily unavailable');
      
      mockAuthClient.refreshAccessToken
        .mockRejectedValueOnce(transientError)
        .mockRejectedValueOnce(transientError)
        .mockResolvedValueOnce({
          credentials: {
            access_token: 'new-token',
            expiry_date: Date.now() + 3600000
          }
        });

      const expiredToken = {
        access_token: 'expired-token',
        refresh_token: 'refresh-token',
        expiry_date: Date.now() - 3600000
      };

      mockAuthClient.credentials = expiredToken;
      (oauthManager as any).isTokenValid = jest.fn().mockReturnValue(false);

      // Enable retry logic
      (oauthManager as any).config.retryTransientErrors = true;
      (oauthManager as any).config.maxRetries = 3;

      const result = await oauthManager.getValidToken();

      expect(result).toBe('new-token');
      expect(mockAuthClient.refreshAccessToken).toHaveBeenCalledTimes(3);
    });
  });
});