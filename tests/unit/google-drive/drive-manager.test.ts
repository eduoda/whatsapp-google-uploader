/**
 * Google Drive Manager Unit Tests
 * AIDEV-NOTE: drive-manager-tests; comprehensive testing of Google Drive API integration
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fc from 'fast-check';
import { DriveManager } from '@whatsapp-uploader/google-drive';
import { createMockGoogleDrive } from '../../__mocks__/google-apis';
import { mockFileSystem } from '../../__mocks__/filesystem';
import { 
  fileMetadataArbitrary, 
  googleApiErrorArbitrary,
  largeFileArbitrary,
  smallFileArbitrary
} from '../../fixtures/property-generators';
import { Readable } from 'stream';

// Mock googleapis
jest.mock('googleapis', () => ({
  google: {
    drive: jest.fn(() => ({
      files: {
        create: jest.fn(),
        get: jest.fn(),
        list: jest.fn(),
        update: jest.fn()
      },
      about: {
        get: jest.fn()
      }
    })),
    auth: {
      OAuth2: jest.fn()
    }
  }
}));

describe('DriveManager', () => {
  let driveManager: DriveManager;
  let mockDrive: ReturnType<typeof createMockGoogleDrive>;
  let mockDriveApi: any;

  beforeEach(() => {
    mockFileSystem.reset();
    mockDrive = createMockGoogleDrive();
    
    const { google } = require('googleapis');
    mockDriveApi = google.drive();
    
    driveManager = new DriveManager({
      auth: {} as any, // Mock auth client
      maxRetries: 3,
      retryDelay: 1000
    });

    // Replace internal drive client
    (driveManager as any).drive = mockDriveApi;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFolder', () => {
    it('should create folder successfully', async () => {
      const folderName = 'Test Folder';
      const parentId = 'parent-folder-id';
      const expectedResponse = {
        data: { id: 'new-folder-id', name: folderName }
      };

      mockDriveApi.files.create.mockResolvedValue(expectedResponse);

      const result = await driveManager.createFolder(folderName, parentId);

      expect(result).toBe('new-folder-id');
      expect(mockDriveApi.files.create).toHaveBeenCalledWith({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId]
        },
        fields: 'id,name'
      });
    });

    it('should create folder without parent', async () => {
      const folderName = 'Root Folder';
      const expectedResponse = {
        data: { id: 'root-folder-id', name: folderName }
      };

      mockDriveApi.files.create.mockResolvedValue(expectedResponse);

      const result = await driveManager.createFolder(folderName);

      expect(result).toBe('root-folder-id');
      expect(mockDriveApi.files.create).toHaveBeenCalledWith({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id,name'
      });
    });

    it('should handle API errors when creating folder', async () => {
      const error = new Error('Insufficient permissions');
      (error as any).code = 403;
      
      mockDriveApi.files.create.mockRejectedValue(error);

      await expect(driveManager.createFolder('Test Folder')).rejects.toThrow('Insufficient permissions');
    });

    it('should validate folder names', async () => {
      await expect(driveManager.createFolder('')).rejects.toThrow('Folder name cannot be empty');
      await expect(driveManager.createFolder('folder/with/slashes')).rejects.toThrow('Invalid folder name');
    });

    // Property-based test: Various folder names should be handled
    it('should handle various folder name formats', () => {
      fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(name => 
          !name.includes('/') && !name.includes('\\') && name.trim().length > 0
        ),
        async (folderName) => {
          mockDriveApi.files.create.mockResolvedValue({
            data: { id: 'test-id', name: folderName }
          });

          await expect(driveManager.createFolder(folderName)).resolves.toBe('test-id');
        }
      ));
    });
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const fileContent = Buffer.from('test file content');
      const stream = Readable.from([fileContent]);
      const metadata = {
        name: 'test-file.txt',
        parents: ['folder-id'],
        mimeType: 'text/plain'
      };

      const expectedResponse = {
        data: { id: 'uploaded-file-id', name: 'test-file.txt' }
      };

      mockDriveApi.files.create.mockResolvedValue(expectedResponse);

      const result = await driveManager.uploadFile(stream, metadata);

      expect(result.id).toBe('uploaded-file-id');
      expect(mockDriveApi.files.create).toHaveBeenCalledWith({
        requestBody: metadata,
        media: {
          mimeType: metadata.mimeType,
          body: stream
        },
        fields: 'id,name,size,mimeType,createdTime'
      });
    });

    it('should handle large file uploads with resumable upload', async () => {
      const largeSize = 100 * 1024 * 1024; // 100MB
      const largeContent = Buffer.alloc(largeSize, 'a');
      const stream = Readable.from([largeContent]);
      
      const metadata = {
        name: 'large-file.bin',
        mimeType: 'application/octet-stream'
      };

      mockDriveApi.files.create.mockResolvedValue({
        data: { id: 'large-file-id', name: 'large-file.bin' }
      });

      // Mock resumable upload detection
      (driveManager as any).shouldUseResumableUpload = jest.fn().mockReturnValue(true);

      const result = await driveManager.uploadFile(stream, metadata);

      expect(result.id).toBe('large-file-id');
      expect((driveManager as any).shouldUseResumableUpload).toHaveBeenCalled();
    });

    it('should handle upload failures with retry', async () => {
      const fileContent = Buffer.from('retry test content');
      const stream = Readable.from([fileContent]);
      const metadata = { name: 'retry-test.txt' };

      // Fail twice, then succeed
      mockDriveApi.files.create
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Another temporary failure'))
        .mockResolvedValueOnce({
          data: { id: 'retry-success-id', name: 'retry-test.txt' }
        });

      const result = await driveManager.uploadFile(stream, metadata);

      expect(result.id).toBe('retry-success-id');
      expect(mockDriveApi.files.create).toHaveBeenCalledTimes(3);
    });

    it('should handle quota exceeded errors', async () => {
      const stream = Readable.from([Buffer.from('test')]);
      const metadata = { name: 'quota-test.txt' };

      const quotaError = new Error('Storage quota exceeded');
      (quotaError as any).code = 403;
      (quotaError as any).details = [{ reason: 'storageQuotaExceeded' }];

      mockDriveApi.files.create.mockRejectedValue(quotaError);

      await expect(driveManager.uploadFile(stream, metadata)).rejects.toThrow('Storage quota exceeded');
    });

    // Property-based test: File metadata should be preserved
    it('should preserve file metadata during upload', () => {
      fc.assert(fc.asyncProperty(
        fileMetadataArbitrary,
        smallFileArbitrary,
        async (fileData, size) => {
          const content = Buffer.alloc(Math.min(size, 1024), 'x'); // Limit size for test performance
          const stream = Readable.from([content]);
          
          const metadata = {
            name: fileData.name,
            mimeType: fileData.mimeType
          };

          mockDriveApi.files.create.mockResolvedValue({
            data: { 
              id: 'test-id', 
              name: metadata.name,
              mimeType: metadata.mimeType
            }
          });

          const result = await driveManager.uploadFile(stream, metadata);
          
          expect(result.name).toBe(fileData.name);
          expect(mockDriveApi.files.create).toHaveBeenCalledWith(
            expect.objectContaining({
              requestBody: expect.objectContaining({
                name: fileData.name,
                mimeType: fileData.mimeType
              })
            })
          );
        }
      ));
    });
  });

  describe('checkExists', () => {
    it('should find existing file', async () => {
      const fileName = 'existing-file.txt';
      const parentId = 'parent-folder-id';

      mockDriveApi.files.list.mockResolvedValue({
        data: {
          files: [
            { id: 'file-id', name: fileName, parents: [parentId] }
          ]
        }
      });

      const result = await driveManager.checkExists(fileName, parentId);

      expect(result).toEqual({
        exists: true,
        file: { id: 'file-id', name: fileName, parents: [parentId] }
      });
    });

    it('should return false for non-existent file', async () => {
      const fileName = 'non-existent.txt';

      mockDriveApi.files.list.mockResolvedValue({
        data: { files: [] }
      });

      const result = await driveManager.checkExists(fileName);

      expect(result.exists).toBe(false);
      expect(result.file).toBeNull();
    });

    it('should handle search with parent folder', async () => {
      const fileName = 'file-in-folder.txt';
      const parentId = 'specific-folder-id';

      mockDriveApi.files.list.mockResolvedValue({
        data: { files: [] }
      });

      await driveManager.checkExists(fileName, parentId);

      expect(mockDriveApi.files.list).toHaveBeenCalledWith({
        q: `name='${fileName}' and '${parentId}' in parents and trashed=false`,
        fields: 'files(id,name,parents,createdTime,size)'
      });
    });

    it('should handle API errors during file search', async () => {
      const error = new Error('Search failed');
      mockDriveApi.files.list.mockRejectedValue(error);

      await expect(driveManager.checkExists('test.txt')).rejects.toThrow('Search failed');
    });
  });

  describe('getUsage', () => {
    it('should return storage usage information', async () => {
      const usageData = {
        storageQuota: {
          limit: '15000000000', // 15GB
          usage: '5000000000',   // 5GB
          usageInDrive: '3000000000' // 3GB
        }
      };

      mockDriveApi.about.get.mockResolvedValue({ data: usageData });

      const result = await driveManager.getUsage();

      expect(result).toEqual({
        totalSpace: 15000000000,
        usedSpace: 5000000000,
        driveUsage: 3000000000,
        availableSpace: 10000000000
      });
    });

    it('should handle unlimited storage accounts', async () => {
      const unlimitedData = {
        storageQuota: {
          limit: null, // Unlimited
          usage: '1000000000',
          usageInDrive: '500000000'
        }
      };

      mockDriveApi.about.get.mockResolvedValue({ data: unlimitedData });

      const result = await driveManager.getUsage();

      expect(result.totalSpace).toBe(Infinity);
      expect(result.availableSpace).toBe(Infinity);
    });

    it('should handle API errors when getting usage', async () => {
      const error = new Error('Access denied');
      (error as any).code = 403;
      
      mockDriveApi.about.get.mockRejectedValue(error);

      await expect(driveManager.getUsage()).rejects.toThrow('Access denied');
    });
  });

  describe('resumable uploads', () => {
    it('should use resumable upload for large files', () => {
      const largeSize = 5 * 1024 * 1024; // 5MB (threshold)
      const smallSize = 1024; // 1KB

      expect((driveManager as any).shouldUseResumableUpload(largeSize)).toBe(true);
      expect((driveManager as any).shouldUseResumableUpload(smallSize)).toBe(false);
    });

    it('should handle resumable upload interruptions', async () => {
      const stream = Readable.from([Buffer.alloc(10 * 1024 * 1024, 'data')]); // 10MB
      const metadata = { name: 'large-interrupted.bin' };

      // Mock resumable upload that gets interrupted and resumed
      const mockResumableUpload = jest.fn()
        .mockRejectedValueOnce(new Error('Connection lost'))
        .mockResolvedValueOnce({
          data: { id: 'resumed-file-id', name: 'large-interrupted.bin' }
        });

      (driveManager as any).performResumableUpload = mockResumableUpload;
      (driveManager as any).shouldUseResumableUpload = jest.fn().mockReturnValue(true);

      const result = await driveManager.uploadFile(stream, metadata);

      expect(result.id).toBe('resumed-file-id');
      expect(mockResumableUpload).toHaveBeenCalledTimes(2); // Initial attempt + retry
    });

    it('should track upload progress for resumable uploads', async () => {
      const progressCallback = jest.fn();
      const stream = Readable.from([Buffer.alloc(5 * 1024 * 1024, 'progress')]); // 5MB
      const metadata = { name: 'progress-test.bin' };

      (driveManager as any).shouldUseResumableUpload = jest.fn().mockReturnValue(true);
      (driveManager as any).performResumableUpload = jest.fn().mockImplementation(async (stream, metadata, onProgress) => {
        // Simulate progress updates
        onProgress({ uploaded: 1024 * 1024, total: 5 * 1024 * 1024 }); // 20%
        onProgress({ uploaded: 3 * 1024 * 1024, total: 5 * 1024 * 1024 }); // 60%
        onProgress({ uploaded: 5 * 1024 * 1024, total: 5 * 1024 * 1024 }); // 100%
        
        return { data: { id: 'progress-file-id' } };
      });

      await driveManager.uploadFile(stream, metadata, { onProgress: progressCallback });

      expect(progressCallback).toHaveBeenCalledTimes(3);
      expect(progressCallback).toHaveBeenCalledWith({ uploaded: 5 * 1024 * 1024, total: 5 * 1024 * 1024 });
    });

    // Property-based test: File sizes should consistently determine upload method
    it('should consistently choose upload method based on file size', () => {
      fc.assert(fc.property(
        fc.integer({ min: 0, max: 2 * 1024 * 1024 * 1024 }), // Up to 2GB
        (fileSize) => {
          const useResumable1 = (driveManager as any).shouldUseResumableUpload(fileSize);
          const useResumable2 = (driveManager as any).shouldUseResumableUpload(fileSize);
          
          expect(useResumable1).toBe(useResumable2); // Consistent decision
          
          if (fileSize >= 5 * 1024 * 1024) { // 5MB threshold
            expect(useResumable1).toBe(true);
          } else {
            expect(useResumable1).toBe(false);
          }
        }
      ));
    });
  });

  describe('error handling and retries', () => {
    it('should retry transient errors', async () => {
      const stream = Readable.from([Buffer.from('retry test')]);
      const metadata = { name: 'retry.txt' };

      const transientError = new Error('Service temporarily unavailable');
      (transientError as any).code = 503;

      mockDriveApi.files.create
        .mockRejectedValueOnce(transientError)
        .mockRejectedValueOnce(transientError)
        .mockResolvedValueOnce({ data: { id: 'retry-success', name: 'retry.txt' } });

      const result = await driveManager.uploadFile(stream, metadata);

      expect(result.id).toBe('retry-success');
      expect(mockDriveApi.files.create).toHaveBeenCalledTimes(3);
    });

    it('should not retry permanent errors', async () => {
      const stream = Readable.from([Buffer.from('permanent error test')]);
      const metadata = { name: 'permanent.txt' };

      const permanentError = new Error('Invalid request');
      (permanentError as any).code = 400;

      mockDriveApi.files.create.mockRejectedValue(permanentError);

      await expect(driveManager.uploadFile(stream, metadata)).rejects.toThrow('Invalid request');
      expect(mockDriveApi.files.create).toHaveBeenCalledTimes(1); // No retries
    });

    it('should respect max retry limit', async () => {
      const stream = Readable.from([Buffer.from('max retry test')]);
      const metadata = { name: 'maxretry.txt' };

      const retryableError = new Error('Rate limit exceeded');
      (retryableError as any).code = 429;

      mockDriveApi.files.create.mockRejectedValue(retryableError);

      await expect(driveManager.uploadFile(stream, metadata)).rejects.toThrow('Rate limit exceeded');
      expect(mockDriveApi.files.create).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    // Property-based test: Different error types should be handled appropriately
    it('should categorize errors correctly', () => {
      fc.assert(fc.property(googleApiErrorArbitrary, (errorData) => {
        const error = new Error(errorData.message);
        (error as any).code = errorData.code;
        (error as any).details = errorData.details;

        const isRetryable = (driveManager as any).isRetryableError(error);
        const isPermanent = (driveManager as any).isPermanentError(error);

        // Errors should be either retryable or permanent, not both
        expect(isRetryable && isPermanent).toBe(false);

        // Specific error codes should be categorized correctly
        if (errorData.code === 429 || errorData.code >= 500) {
          expect(isRetryable).toBe(true);
        }
        
        if (errorData.code === 400 || errorData.code === 401 || errorData.code === 403) {
          expect(isPermanent).toBe(true);
        }
      }));
    });
  });

  describe('rate limiting', () => {
    it('should handle rate limit errors with exponential backoff', async () => {
      const stream = Readable.from([Buffer.from('rate limit test')]);
      const metadata = { name: 'ratelimit.txt' };

      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).code = 429;
      (rateLimitError as any).headers = { 'retry-after': '60' }; // 60 seconds

      const startTime = Date.now();
      
      mockDriveApi.files.create
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ data: { id: 'ratelimit-success', name: 'ratelimit.txt' } });

      // Mock the delay function to avoid actual waiting in tests
      const originalDelay = (driveManager as any).delay;
      (driveManager as any).delay = jest.fn().mockResolvedValue(undefined);

      const result = await driveManager.uploadFile(stream, metadata);

      expect(result.id).toBe('ratelimit-success');
      expect((driveManager as any).delay).toHaveBeenCalledWith(60000); // 60 seconds
      
      // Restore original delay
      (driveManager as any).delay = originalDelay;
    });

    it('should respect exponential backoff for consecutive failures', async () => {
      const stream = Readable.from([Buffer.from('backoff test')]);
      const metadata = { name: 'backoff.txt' };

      const rateLimitError = new Error('Too many requests');
      (rateLimitError as any).code = 429;

      mockDriveApi.files.create
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ data: { id: 'backoff-success', name: 'backoff.txt' } });

      const mockDelay = jest.fn().mockResolvedValue(undefined);
      (driveManager as any).delay = mockDelay;

      await driveManager.uploadFile(stream, metadata);

      // Should use exponential backoff: 1s, 2s
      expect(mockDelay).toHaveBeenNthCalledWith(1, 1000);
      expect(mockDelay).toHaveBeenNthCalledWith(2, 2000);
    });
  });
});