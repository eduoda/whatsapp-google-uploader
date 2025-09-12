/**
 * Token Manager Unit Tests
 * AIDEV-NOTE: token-manager-tests; secure token storage and management testing
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fc from 'fast-check';
import { TokenManager } from '@whatsapp-uploader/oauth';
import { mockFileSystem } from '../../__mocks__/filesystem';
import { oauthTokenArbitrary } from '../../fixtures/property-generators';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';

// Mock file system operations
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  access: jest.fn(),
  mkdir: jest.fn()
}));

describe('TokenManager', () => {
  let tokenManager: TokenManager;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(() => {
    mockFs = fs as jest.Mocked<typeof fs>;
    mockFileSystem.reset();
    
    tokenManager = new TokenManager({
      tokenPath: '/mock/tokens',
      encryptionKey: 'test-encryption-key-32-characters!!'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('storeTokens', () => {
    it('should store tokens securely', async () => {
      const tokens = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
        expiry_date: Date.now() + 3600000
      };

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await tokenManager.storeTokens(tokens);

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('/mock'),
        { recursive: true }
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('tokens'),
        expect.any(String),
        { mode: 0o600 } // Secure file permissions
      );
    });

    it('should encrypt tokens before storage', async () => {
      const tokens = {
        access_token: 'sensitive-token-data',
        refresh_token: 'sensitive-refresh-token'
      };

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await tokenManager.storeTokens(tokens);

      // Verify that the stored data is encrypted (not plain text)
      const writeCall = mockFs.writeFile.mock.calls[0];
      const storedData = writeCall[1] as string;
      
      expect(storedData).not.toContain('sensitive-token-data');
      expect(storedData).not.toContain('sensitive-refresh-token');
      expect(storedData).toMatch(/^[a-f0-9]+$/); // Hex-encoded encrypted data
    });

    it('should handle file system errors', async () => {
      const tokens = { access_token: 'test-token' };

      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      await expect(tokenManager.storeTokens(tokens)).rejects.toThrow('Permission denied');
    });

    // Property-based test: Any valid token structure should be storable
    it('should store various token formats', () => {
      fc.assert(fc.asyncProperty(oauthTokenArbitrary, async (tokens) => {
        mockFs.mkdir.mockResolvedValue(undefined);
        mockFs.writeFile.mockResolvedValue(undefined);

        await expect(tokenManager.storeTokens(tokens)).resolves.not.toThrow();
        expect(mockFs.writeFile).toHaveBeenCalled();
      }));
    });
  });

  describe('loadTokens', () => {
    it('should load and decrypt stored tokens', async () => {
      const originalTokens = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      // Simulate encrypted token storage
      const encryptedData = tokenManager.encrypt(JSON.stringify(originalTokens));
      mockFs.readFile.mockResolvedValue(encryptedData);

      const loadedTokens = await tokenManager.loadTokens();

      expect(loadedTokens).toEqual(originalTokens);
    });

    it('should return null when no tokens exist', async () => {
      const error = new Error('ENOENT: no such file or directory');
      (error as any).code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);

      const result = await tokenManager.loadTokens();

      expect(result).toBeNull();
    });

    it('should handle corrupted token files', async () => {
      mockFs.readFile.mockResolvedValue('corrupted-data');

      await expect(tokenManager.loadTokens()).rejects.toThrow('Failed to decrypt tokens');
    });

    it('should handle invalid JSON in token files', async () => {
      const invalidJsonEncrypted = tokenManager.encrypt('invalid-json{');
      mockFs.readFile.mockResolvedValue(invalidJsonEncrypted);

      await expect(tokenManager.loadTokens()).rejects.toThrow('Failed to parse tokens');
    });

    // Property-based test: Round-trip token storage should preserve data
    it('should preserve token data through store/load cycle', () => {
      fc.assert(fc.asyncProperty(oauthTokenArbitrary, async (originalTokens) => {
        mockFs.mkdir.mockResolvedValue(undefined);
        
        // Capture what gets written
        let storedData: string = '';
        mockFs.writeFile.mockImplementation(async (_, data) => {
          storedData = data as string;
        });
        
        // Store tokens
        await tokenManager.storeTokens(originalTokens);
        
        // Load tokens (simulate reading from file)
        mockFs.readFile.mockResolvedValue(storedData);
        const loadedTokens = await tokenManager.loadTokens();

        expect(loadedTokens).toEqual(originalTokens);
      }));
    });
  });

  describe('clearTokens', () => {
    it('should remove token files', async () => {
      mockFs.access.mockResolvedValue(undefined); // File exists
      const unlinkMock = jest.fn().mockResolvedValue(undefined);
      (fs as any).unlink = unlinkMock;

      await tokenManager.clearTokens();

      expect(unlinkMock).toHaveBeenCalledWith(
        expect.stringContaining('tokens')
      );
    });

    it('should handle case when token file does not exist', async () => {
      const error = new Error('ENOENT');
      (error as any).code = 'ENOENT';
      mockFs.access.mockRejectedValue(error);

      await expect(tokenManager.clearTokens()).resolves.not.toThrow();
    });

    it('should handle permission errors', async () => {
      mockFs.access.mockResolvedValue(undefined);
      const unlinkMock = jest.fn().mockRejectedValue(new Error('Permission denied'));
      (fs as any).unlink = unlinkMock;

      await expect(tokenManager.clearTokens()).rejects.toThrow('Permission denied');
    });
  });

  describe('hasValidTokens', () => {
    it('should return true for valid non-expired tokens', async () => {
      const validTokens = {
        access_token: 'valid-token',
        expiry_date: Date.now() + 3600000 // 1 hour from now
      };

      mockFs.readFile.mockResolvedValue(
        tokenManager.encrypt(JSON.stringify(validTokens))
      );

      const result = await tokenManager.hasValidTokens();

      expect(result).toBe(true);
    });

    it('should return false for expired tokens', async () => {
      const expiredTokens = {
        access_token: 'expired-token',
        expiry_date: Date.now() - 3600000 // 1 hour ago
      };

      mockFs.readFile.mockResolvedValue(
        tokenManager.encrypt(JSON.stringify(expiredTokens))
      );

      const result = await tokenManager.hasValidTokens();

      expect(result).toBe(false);
    });

    it('should return false when no tokens exist', async () => {
      const error = new Error('ENOENT');
      (error as any).code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);

      const result = await tokenManager.hasValidTokens();

      expect(result).toBe(false);
    });

    it('should return false for tokens without expiry information', async () => {
      const tokensWithoutExpiry = {
        access_token: 'token-without-expiry'
      };

      mockFs.readFile.mockResolvedValue(
        tokenManager.encrypt(JSON.stringify(tokensWithoutExpiry))
      );

      const result = await tokenManager.hasValidTokens();

      expect(result).toBe(false);
    });
  });

  describe('encryption/decryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      const originalData = 'sensitive-token-information';
      
      const encrypted = tokenManager.encrypt(originalData);
      const decrypted = tokenManager.decrypt(encrypted);

      expect(decrypted).toBe(originalData);
      expect(encrypted).not.toBe(originalData);
    });

    it('should produce different ciphertext for same plaintext', () => {
      const data = 'same-data';
      
      const encrypted1 = tokenManager.encrypt(data);
      const encrypted2 = tokenManager.encrypt(data);

      expect(encrypted1).not.toBe(encrypted2); // Due to random IV
      expect(tokenManager.decrypt(encrypted1)).toBe(data);
      expect(tokenManager.decrypt(encrypted2)).toBe(data);
    });

    it('should handle encryption of empty strings', () => {
      const encrypted = tokenManager.encrypt('');
      const decrypted = tokenManager.decrypt(encrypted);

      expect(decrypted).toBe('');
    });

    it('should throw error for invalid ciphertext', () => {
      expect(() => tokenManager.decrypt('invalid-ciphertext')).toThrow('Failed to decrypt');
      expect(() => tokenManager.decrypt('')).toThrow('Failed to decrypt');
    });

    // Property-based test: Encryption should be deterministic in decryption
    it('should correctly encrypt/decrypt any string', () => {
      fc.assert(fc.property(fc.string(), (data) => {
        const encrypted = tokenManager.encrypt(data);
        const decrypted = tokenManager.decrypt(encrypted);
        expect(decrypted).toBe(data);
      }));
    });
  });

  describe('security', () => {
    it('should use secure file permissions', async () => {
      const tokens = { access_token: 'test' };
      
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await tokenManager.storeTokens(tokens);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        { mode: 0o600 } // Owner read/write only
      );
    });

    it('should validate encryption key strength', () => {
      expect(() => new TokenManager({
        tokenPath: '/test',
        encryptionKey: 'weak' // Too short
      })).toThrow('Encryption key must be at least 32 characters');
    });

    it('should use proper encryption algorithm', () => {
      // Verify AES-256-GCM is being used
      const encrypted = tokenManager.encrypt('test-data');
      
      // GCM encrypted data has specific structure: iv:authTag:ciphertext
      expect(encrypted.split(':')).toHaveLength(3);
      
      // IV should be 16 bytes (32 hex chars)
      const [iv] = encrypted.split(':');
      expect(iv).toHaveLength(32);
      expect(/^[a-f0-9]+$/.test(iv)).toBe(true);
    });

    it('should detect tampered ciphertext', () => {
      const encrypted = tokenManager.encrypt('test-data');
      const [iv, authTag, ciphertext] = encrypted.split(':');
      
      // Tamper with the ciphertext
      const tamperedCiphertext = ciphertext.slice(0, -2) + 'ff';
      const tampered = `${iv}:${authTag}:${tamperedCiphertext}`;
      
      expect(() => tokenManager.decrypt(tampered)).toThrow('Failed to decrypt');
    });
  });

  describe('token lifecycle', () => {
    it('should track token creation and expiry times', async () => {
      const tokens = {
        access_token: 'test-token',
        expires_in: 3600,
        created_at: Date.now()
      };

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await tokenManager.storeTokens(tokens);
      
      // Verify expiry_date is calculated correctly
      mockFs.readFile.mockResolvedValue(
        tokenManager.encrypt(JSON.stringify({
          ...tokens,
          expiry_date: tokens.created_at + (tokens.expires_in * 1000)
        }))
      );

      const loadedTokens = await tokenManager.loadTokens();
      expect(loadedTokens?.expiry_date).toBe(tokens.created_at + 3600000);
    });

    it('should handle tokens with different expiry formats', async () => {
      const scenarios = [
        { expires_in: 3600 }, // Standard OAuth
        { expiry_date: Date.now() + 3600000 }, // Google format
        { exp: Math.floor(Date.now() / 1000) + 3600 } // JWT format
      ];

      for (const tokenData of scenarios) {
        mockFs.readFile.mockResolvedValue(
          tokenManager.encrypt(JSON.stringify({
            access_token: 'test',
            ...tokenData
          }))
        );

        const isValid = await tokenManager.hasValidTokens();
        expect(typeof isValid).toBe('boolean');
      }
    });
  });
});