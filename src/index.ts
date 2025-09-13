/**
 * WhatsApp Google Uploader - Main Entry Point
 * 
 * AIDEV-NOTE: main-entry-point; consolidates all library functionality
 */

// Authentication
export * from './auth/index';

// Google APIs  
export { DriveManager } from './google-apis/drive/index';
export { PhotosManager } from './google-apis/photos/index';

// Core Components
export * from './scanner/index';
export * from './uploader/index';
export * from './database/index';