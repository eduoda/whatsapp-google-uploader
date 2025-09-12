/**
 * Drive Manager - Main Google Drive API coordinator
 * 
 * AIDEV-NOTE: drive-main-class; implements Drive interface from architecture
 */

import { Readable } from 'stream';
import { ApiClient } from './api-client';
import { FolderManager } from './folder-manager';
import { UploadHandler } from './upload-handler';
import { MetadataBuilder } from './metadata-builder';
import { DriveConfig, UploadResult, FileMetadata, StorageInfo } from './types/drive-types';

export class DriveManager {
  private readonly apiClient: ApiClient;
  private readonly folderManager: FolderManager;
  private readonly uploadHandler: UploadHandler;
  private readonly metadataBuilder: MetadataBuilder;

  constructor(private readonly config: DriveConfig) {
    this.apiClient = new ApiClient(config.oauthManager);
    this.folderManager = new FolderManager(this.apiClient);
    this.uploadHandler = new UploadHandler(this.apiClient);
    this.metadataBuilder = new MetadataBuilder();
  }

  /**
   * Create folder - implements architecture interface
   * AIDEV-TODO: implement-drive-folder; folder creation with organization
   */
  async createFolder(name: string, parentId?: string): Promise<string> {
    return this.folderManager.createFolder(name, parentId);
  }

  /**
   * Upload file with metadata - implements architecture interface
   * AIDEV-TODO: implement-drive-upload; resumable upload with progress
   */
  async uploadFile(stream: Readable, metadata: FileMetadata): Promise<UploadResult> {
    // Build Drive-specific metadata
    const driveMetadata = this.metadataBuilder.buildMetadata(metadata);
    
    // Upload file with resumable upload
    return this.uploadHandler.uploadFile(stream, driveMetadata);
  }

  /**
   * Check file existence - implements architecture interface
   * AIDEV-TODO: implement-drive-exists; efficient file existence check
   */
  async checkExists(name: string, parentId?: string): Promise<string | null> {
    return this.apiClient.findFile(name, parentId);
  }

  /**
   * Get storage quota info - implements architecture interface
   * AIDEV-TODO: implement-drive-quota; storage usage information
   */
  async getUsage(): Promise<StorageInfo> {
    return this.apiClient.getStorageInfo();
  }

  /**
   * Initialize Drive manager
   * AIDEV-TODO: implement-drive-init; setup and validation
   */
  async initialize(): Promise<void> {
    await this.apiClient.initialize();
  }
}