/**
 * WhatsApp Google Uploader - Main Entry Point
 * 
 * AIDEV-NOTE: main-entry-simplified; simplified API with unified GoogleApis class
 */

// Unified Google APIs (replaces separate Auth, Drive, Photos)
export { GoogleApis, createGoogleApis } from './google-apis/index';

// Core Components
export * from './scanner/index';
export * from './uploader/index';
export * from './database/index';

// Types
export * from './types/index';