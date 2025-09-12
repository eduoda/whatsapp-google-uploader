/**
 * Token Type Definitions
 * AIDEV-NOTE: token-types; secure token handling types
 */

import { Credentials } from 'google-auth-library';

export interface StoredTokens extends Credentials {
  // Extended from google-auth-library Credentials
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
  scope?: string;
  token_type?: string | null;
  id_token?: string | null;
  
  // Additional OAuth fields for comprehensive token handling
  expires_in?: number; // Token lifetime in seconds
  created_at?: number; // When token was created (timestamp)
  exp?: number; // JWT expiry (timestamp in seconds)
}

export interface TokenValidationResult {
  isValid: boolean;
  needsRefresh: boolean;
  expiresIn: number; // seconds until expiry
  error?: string;
}