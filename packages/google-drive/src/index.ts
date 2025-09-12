/**
 * @whatsapp-uploader/google-drive - Google Drive API Integration Library
 * 
 * AIDEV-NOTE: drive-main-export; primary entry point for Drive functionality
 * 
 * This library provides Google Drive API integration for uploading documents
 * and audio files from WhatsApp with resumable upload support.
 */

export { DriveManager } from './drive-manager';
export { ApiClient } from './api-client';
export { FolderManager } from './folder-manager';
export { UploadHandler } from './upload-handler';
export { MetadataBuilder } from './metadata-builder';

// Types and interfaces
export * from './types/drive-types';
export * from './types/upload-types';

// Constants
export { DRIVE_CONSTANTS, FILE_TYPE_MAPPING } from './constants';