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
}

export interface TokenValidationResult {
  isValid: boolean;
  needsRefresh: boolean;
  expiresIn: number; // seconds until expiry
  error?: string;
}