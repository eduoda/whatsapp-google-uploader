/**
 * API Client - Google Drive API wrapper
 * AIDEV-TODO: implement-api-client; Google Drive API client implementation
 */

export class ApiClient {
  constructor(private oauthManager: any) {}

  async initialize(): Promise<void> {
    throw new Error('ApiClient.initialize not implemented');
  }

  async findFile(name: string, parentId?: string): Promise<string | null> {
    throw new Error('ApiClient.findFile not implemented');
  }

  async getStorageInfo(): Promise<any> {
    throw new Error('ApiClient.getStorageInfo not implemented');
  }
}