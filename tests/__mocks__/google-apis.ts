/**
 * Mock Google APIs for consistent testing
 * AIDEV-NOTE: google-api-mocks; centralized mock factories for all Google API interactions
 */

export interface MockResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

export interface MockAPIConfig {
  shouldFail: boolean;
  responseDelay: number;
  rateLimitAfter: number;
  quotaExceeded: boolean;
  networkError: boolean;
}

export class MockGooglePhotos {
  private uploads: any[] = [];
  private albums: Map<string, any> = new Map();
  private config: MockAPIConfig = {
    shouldFail: false,
    responseDelay: 0,
    rateLimitAfter: 0,
    quotaExceeded: false,
    networkError: false
  };

  configure(config: Partial<MockAPIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  reset(): void {
    this.uploads = [];
    this.albums.clear();
    this.config = {
      shouldFail: false,
      responseDelay: 0,
      rateLimitAfter: 0,
      quotaExceeded: false,
      networkError: false
    };
  }

  async uploadMedia(stream: any, metadata: any): Promise<MockResponse> {
    if (this.config.networkError) {
      throw new Error('Network error');
    }

    if (this.config.quotaExceeded) {
      const error = new Error('Quota exceeded');
      (error as any).code = 429;
      throw error;
    }

    if (this.config.rateLimitAfter > 0 && this.uploads.length >= this.config.rateLimitAfter) {
      const error = new Error('Rate limit exceeded');
      (error as any).code = 429;
      throw error;
    }

    if (this.config.shouldFail) {
      throw new Error('Mock API failure');
    }

    const uploadId = `mock-photo-${this.uploads.length + 1}`;
    this.uploads.push({ id: uploadId, metadata, uploadTime: new Date() });

    return {
      data: { id: uploadId, filename: metadata.filename },
      status: 200,
      statusText: 'OK'
    };
  }

  async createAlbum(name: string): Promise<MockResponse> {
    if (this.config.shouldFail) {
      throw new Error('Mock API failure');
    }

    const albumId = `mock-album-${this.albums.size + 1}`;
    this.albums.set(albumId, { id: albumId, title: name, createdAt: new Date() });

    return {
      data: { id: albumId, title: name },
      status: 200,
      statusText: 'OK'
    };
  }

  getUploads(): any[] {
    return [...this.uploads];
  }

  getAlbums(): any[] {
    return Array.from(this.albums.values());
  }
}

export class MockGoogleDrive {
  private files: any[] = [];
  private folders: Map<string, any> = new Map();
  private config: MockAPIConfig = {
    shouldFail: false,
    responseDelay: 0,
    rateLimitAfter: 0,
    quotaExceeded: false,
    networkError: false
  };

  configure(config: Partial<MockAPIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  reset(): void {
    this.files = [];
    this.folders.clear();
    this.config = {
      shouldFail: false,
      responseDelay: 0,
      rateLimitAfter: 0,
      quotaExceeded: false,
      networkError: false
    };
  }

  async uploadFile(stream: any, metadata: any): Promise<MockResponse> {
    if (this.config.networkError) {
      throw new Error('Network error');
    }

    if (this.config.quotaExceeded) {
      const error = new Error('Storage quota exceeded');
      (error as any).code = 403;
      throw error;
    }

    if (this.config.rateLimitAfter > 0 && this.files.length >= this.config.rateLimitAfter) {
      const error = new Error('Rate limit exceeded');
      (error as any).code = 429;
      throw error;
    }

    if (this.config.shouldFail) {
      throw new Error('Mock API failure');
    }

    const fileId = `mock-file-${this.files.length + 1}`;
    this.files.push({ id: fileId, metadata, uploadTime: new Date() });

    return {
      data: { id: fileId, name: metadata.name },
      status: 200,
      statusText: 'OK'
    };
  }

  async createFolder(name: string, parentId?: string): Promise<MockResponse> {
    if (this.config.shouldFail) {
      throw new Error('Mock API failure');
    }

    const folderId = `mock-folder-${this.folders.size + 1}`;
    this.folders.set(folderId, { 
      id: folderId, 
      name, 
      parents: parentId ? [parentId] : [],
      createdAt: new Date() 
    });

    return {
      data: { id: folderId, name },
      status: 200,
      statusText: 'OK'
    };
  }

  getFiles(): any[] {
    return [...this.files];
  }

  getFolders(): any[] {
    return Array.from(this.folders.values());
  }
}

export class MockGoogleAuth {
  private tokens: any = null;
  private config: MockAPIConfig = {
    shouldFail: false,
    responseDelay: 0,
    rateLimitAfter: 0,
    quotaExceeded: false,
    networkError: false
  };

  configure(config: Partial<MockAPIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  reset(): void {
    this.tokens = null;
    this.config = {
      shouldFail: false,
      responseDelay: 0,
      rateLimitAfter: 0,
      quotaExceeded: false,
      networkError: false
    };
  }

  async authenticate(): Promise<MockResponse> {
    if (this.config.shouldFail) {
      throw new Error('Authentication failed');
    }

    this.tokens = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'Bearer',
      expiry_date: Date.now() + 3600000 // 1 hour
    };

    return {
      data: this.tokens,
      status: 200,
      statusText: 'OK'
    };
  }

  async refreshToken(): Promise<MockResponse> {
    if (this.config.shouldFail) {
      throw new Error('Token refresh failed');
    }

    this.tokens = {
      ...this.tokens,
      access_token: 'mock-refreshed-token',
      expiry_date: Date.now() + 3600000
    };

    return {
      data: this.tokens,
      status: 200,
      statusText: 'OK'
    };
  }

  getTokens(): any {
    return this.tokens;
  }
}

// Factory functions for creating pre-configured mocks
export function createMockGooglePhotos(config?: Partial<MockAPIConfig>): MockGooglePhotos {
  const mock = new MockGooglePhotos();
  if (config) mock.configure(config);
  return mock;
}

export function createMockGoogleDrive(config?: Partial<MockAPIConfig>): MockGoogleDrive {
  const mock = new MockGoogleDrive();
  if (config) mock.configure(config);
  return mock;
}

export function createMockGoogleAuth(config?: Partial<MockAPIConfig>): MockGoogleAuth {
  const mock = new MockGoogleAuth();
  if (config) mock.configure(config);
  return mock;
}