/**
 * Token Manager - Secure token storage and retrieval
 * AIDEV-NOTE: token-manager-implementation; AES-256-GCM encryption for secure token storage
 */

import { StoredTokens, TokenValidationResult } from './types/token-types';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

interface TokenManagerConfig {
  tokenPath: string;
  encryptionKey: string;
}

export class TokenManager {
  private readonly tokenPath: string;
  private readonly encryptionKey: string;

  constructor(config: TokenManagerConfig) {
    if (!config.encryptionKey || config.encryptionKey.length < 32) {
      throw new Error('Encryption key must be at least 32 characters');
    }
    
    this.tokenPath = config.tokenPath;
    this.encryptionKey = config.encryptionKey;
  }

  /**
   * Store tokens securely with AES-256-GCM encryption
   * AIDEV-NOTE: token-storage; uses secure file permissions and encryption
   */
  async storeTokens(tokens: StoredTokens): Promise<void> {
    try {
      // Ensure directory exists with proper permissions
      const dir = path.dirname(this.tokenPath);
      await fs.mkdir(dir, { recursive: true });
      
      // Encrypt token data
      const tokenData = JSON.stringify(tokens);
      const encryptedData = this.encrypt(tokenData);
      
      // Convert to hex-only format for storage (test expectation: /^[a-f0-9]+$/)
      const hexData = encryptedData.replace(/:/g, '');
      
      
      // Write to file with secure permissions (0o600 = owner read/write only)  
      await fs.writeFile(this.tokenPath, hexData, { mode: 0o600 });
    } catch (error) {
      throw error; // Re-throw for proper error handling in tests
    }
  }

  /**
   * Load and decrypt stored tokens
   * AIDEV-NOTE: token-loading; handles decryption errors and missing files
   */
  async loadTokens(): Promise<StoredTokens | null> {
    try {
      const fileData = await fs.readFile(this.tokenPath, 'utf8');
      
      
      // Reconstruct colon-separated format from hex-only storage
      let encryptedData: string;
      if (fileData.includes(':')) {
        // Already in correct format (backward compatibility)
        encryptedData = fileData;
      } else {
        // Hex-only format - reconstruct iv:authTag:ciphertext
        if (fileData.length < 64) {
          throw new Error('Failed to decrypt'); // Invalid format
        }
        const iv = fileData.substring(0, 32);
        const authTag = fileData.substring(32, 64);
        const ciphertext = fileData.substring(64);
        encryptedData = `${iv}:${authTag}:${ciphertext}`;
      }
      
      const decryptedData = this.decrypt(encryptedData);
      
      let tokens: StoredTokens;
      try {
        tokens = JSON.parse(decryptedData);
      } catch {
        throw new Error('Failed to parse tokens');
      }
      
      return tokens;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null; // No tokens exist
      }
      if (error.message.includes('Failed to decrypt')) {
        throw new Error('Failed to decrypt tokens');
      }
      if (error.message.includes('Failed to parse')) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Remove stored tokens securely
   * AIDEV-NOTE: token-cleanup; handles missing files gracefully
   */
  async clearTokens(): Promise<void> {
    try {
      // Check if file exists first
      await fs.access(this.tokenPath);
      
      // Remove the file - handle both real fs and mocked scenarios
      const fsAny = fs as any;
      if (typeof fsAny.unlink === 'function') {
        await fsAny.unlink(this.tokenPath);
      } else {
        // In test environment, fs.unlink might not be available
        // This is a fallback that should not happen in real usage
        throw new Error('unlink not available');
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, which is fine
        return;
      }
      throw error; // Re-throw other errors
    }
  }

  /**
   * Check if valid tokens exist and are not expired
   * AIDEV-NOTE: token-validation; 5-minute expiry buffer for safety
   */
  async hasValidTokens(): Promise<boolean> {
    try {
      const tokens = await this.loadTokens();
      if (!tokens || !tokens.access_token) {
        return false;
      }
      
      // Check if token has expiry information
      if (!tokens.expiry_date && !tokens.expires_in && !tokens.exp) {
        return false;
      }
      
      // Check expiration with 5-minute buffer
      const bufferTime = 5 * 60 * 1000; // 5 minutes in ms
      let expiryTime: number;
      
      if (tokens.expiry_date) {
        expiryTime = tokens.expiry_date;
      } else if (tokens.expires_in && tokens.created_at) {
        expiryTime = (tokens as any).created_at + (tokens.expires_in * 1000);
      } else if ((tokens as any).exp) {
        expiryTime = (tokens as any).exp * 1000; // JWT exp is in seconds
      } else {
        return false;
      }
      
      return Date.now() < (expiryTime - bufferTime);
    } catch {
      return false;
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   * AIDEV-NOTE: encryption-implementation; uses random IV and auth tag for security
   */
  encrypt(data: string): string {
    // Generate random IV (16 bytes for GCM)
    const iv = crypto.randomBytes(16);
    
    // Create key from encryption string (ensure 32 bytes for AES-256)
    const key = crypto.createHash('sha256').update(this.encryptionKey).digest();
    
    // Create cipher with AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Return IV:authTag:ciphertext format for GCM structure verification
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt data using AES-256-GCM
   * AIDEV-NOTE: decryption-implementation; validates auth tag to prevent tampering
   */
  decrypt(encryptedData: string): string {
    try {
      if (!encryptedData) {
        throw new Error('Failed to decrypt');
      }
      
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Failed to decrypt');
      }
      
      const [ivHex, authTagHex, ciphertext] = parts;
      
      if (!ivHex || !authTagHex || !ciphertext) {
        throw new Error('Failed to decrypt');
      }
      
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      // Create key from encryption string (ensure 32 bytes for AES-256)
      const key = crypto.createHash('sha256').update(this.encryptionKey).digest();
      
      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt the data
      let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch {
      throw new Error('Failed to decrypt');
    }
  }

  /**
   * Comprehensive token validation (legacy method for compatibility)
   */
  async validateTokens(): Promise<TokenValidationResult> {
    try {
      const tokens = await this.loadTokens();
      if (!tokens || !tokens.access_token) {
        return {
          isValid: false,
          needsRefresh: false,
          expiresIn: 0,
          error: 'No tokens found'
        };
      }
      
      const hasValid = await this.hasValidTokens();
      const expiryDate = tokens.expiry_date || 0;
      const expiresIn = Math.max(0, Math.floor((expiryDate - Date.now()) / 1000));
      
      return {
        isValid: hasValid,
        needsRefresh: !hasValid && !!tokens.refresh_token,
        expiresIn,
        error: hasValid ? undefined : 'Token expired'
      };
    } catch (error: any) {
      return {
        isValid: false,
        needsRefresh: false,
        expiresIn: 0,
        error: error.message
      };
    }
  }
}