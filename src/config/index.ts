/**
 * Configuration Management - Environment Variables and Settings
 * AIDEV-NOTE: config-loader; centralized configuration using dotenv and credentials.json
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env file
dotenv.config();

/**
 * Application configuration loaded from environment variables
 * AIDEV-NOTE: env-config; non-sensitive configuration from .env file
 */
export interface AppConfig {
  // Application
  nodeEnv: string;
  logLevel: string;
  
  // Google API
  credentialsPath: string;
  tokenPath: string;
  
  // Upload Settings
  maxConcurrentUploads: number;
  requestsPerSecond: number;
  uploadChunkSize: number;
  
  // Database (Google Sheets)
  sheetsSpreadsheetId?: string;
  sheetsWorksheetName: string;
  
  // Scanner
  scannerBatchSize: number;
  scannerSkipHidden: boolean;
  
  // Retry
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  
  // WhatsApp
  whatsappPath?: string;
}

/**
 * Load and validate configuration from environment variables
 * AIDEV-NOTE: config-validation; ensure required configuration is present
 */
function loadConfig(): AppConfig {
  return {
    // Application
    nodeEnv: process.env.NODE_ENV || 'production',
    logLevel: process.env.LOG_LEVEL || 'info',
    
    // Google API - credentials stay in credentials.json
    credentialsPath: process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json',
    tokenPath: process.env.GOOGLE_TOKEN_PATH || './tokens/google-tokens.json',
    
    // Upload Settings
    maxConcurrentUploads: parseInt(process.env.MAX_CONCURRENT_UPLOADS || '3', 10),
    requestsPerSecond: parseInt(process.env.REQUESTS_PER_SECOND || '10', 10),
    uploadChunkSize: parseInt(process.env.UPLOAD_CHUNK_SIZE || '5242880', 10), // 5MB default
    
    // Database (Google Sheets)
    sheetsSpreadsheetId: process.env.SHEETS_SPREADSHEET_ID,
    sheetsWorksheetName: process.env.SHEETS_WORKSHEET_NAME || 'whatsapp_uploads',
    
    // Scanner
    scannerBatchSize: parseInt(process.env.SCANNER_BATCH_SIZE || '100', 10),
    scannerSkipHidden: process.env.SCANNER_SKIP_HIDDEN !== 'false', // default true
    
    // Retry
    maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10),
    retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '1000', 10),
    retryBackoffMultiplier: parseFloat(process.env.RETRY_BACKOFF_MULTIPLIER || '2'),
    
    // WhatsApp
    whatsappPath: process.env.WHATSAPP_PATH,
  };
}

/**
 * Load OAuth credentials from credentials.json file
 * AIDEV-NOTE: credentials-loader; sensitive OAuth credentials kept separate from env vars
 */
export interface OAuthCredentials {
  installed?: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
    auth_uri: string;
    token_uri: string;
  };
  web?: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
    auth_uri: string;
    token_uri: string;
  };
}

export function loadCredentials(credentialsPath?: string): OAuthCredentials {
  const configPath = credentialsPath || config.credentialsPath;
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`Credentials file not found at: ${configPath}. Please run setup first.`);
  }
  
  try {
    const credentialsData = fs.readFileSync(configPath, 'utf-8');
    const credentials = JSON.parse(credentialsData);
    
    if (!credentials.installed && !credentials.web) {
      throw new Error('Invalid credentials format. Expected "installed" or "web" application.');
    }
    
    return credentials;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in credentials file: ${configPath}`);
    }
    throw error;
  }
}

/**
 * Create Google APIs configuration from app config
 * AIDEV-NOTE: google-config-adapter; adapt app config to GoogleApisConfig format
 */
export function getGoogleApisConfig(): any {
  return {
    credentialsPath: config.credentialsPath,
    tokenPath: config.tokenPath,
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/photoslibrary.appendonly',
      'https://www.googleapis.com/auth/spreadsheets'
    ]
  };
}

/**
 * Check if .env file exists
 */
export function envFileExists(): boolean {
  return fs.existsSync(path.join(process.cwd(), '.env'));
}

/**
 * Create .env file from template if it doesn't exist
 */
export function createEnvFile(): void {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('.env file created from .env.example - please update with your values');
  }
}

// Export the loaded configuration as a singleton
export const config = loadConfig();