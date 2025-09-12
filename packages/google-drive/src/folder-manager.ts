/**
 * Folder Manager - Drive folder creation and organization
 * AIDEV-TODO: implement-folder-manager; folder management implementation
 */

import { ApiClient } from './api-client';

export class FolderManager {
  constructor(private apiClient: ApiClient) {}

  async createFolder(name: string, parentId?: string): Promise<string> {
    throw new Error('FolderManager.createFolder not implemented');
  }
}