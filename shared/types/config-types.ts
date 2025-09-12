/**
 * Configuration Types - System configuration interfaces
 * AIDEV-NOTE: config-types; centralized configuration type definitions
 */

export interface SystemConfig {
  nodeEnv: 'development' | 'production' | 'test';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  dataDir: string;
  whatsappDir: string;
}

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface UploadConfig {
  batchSize: number;
  concurrentUploads: number;
  maxRetryAttempts: number;
  rateLimitDelay: number;
}

export interface AppConfig extends SystemConfig {
  google: GoogleConfig;
  upload: UploadConfig;
}