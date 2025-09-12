/**
 * Google Photos Manager Unit Tests
 * AIDEV-NOTE: photos-manager-tests; comprehensive testing of Google Photos API integration
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fc from 'fast-check';
import { PhotosManager } from '@whatsapp-uploader/google-photos';
import { createMockGooglePhotos } from '../../__mocks__/google-apis';
import { mockFileSystem } from '../../__mocks__/filesystem';
import { 
  fileMetadataArbitrary, 
  googleApiErrorArbitrary,
  mediumFileArbitrary
} from '../../fixtures/property-generators';
import { Readable } from 'stream';

// Mock googleapis photos library
jest.mock('googleapis', () => ({
  google: {
    photos: jest.fn(() => ({
      albums: {
        create: jest.fn(),
        list: jest.fn(),
        get: jest.fn()
      },
      mediaItems: {
        create: jest.fn(),
        batchCreate: jest.fn(),
        search: jest.fn()
      },
      uploads: {
        create: jest.fn()
      }
    }))
  }
}));

describe('PhotosManager', () => {
  let photosManager: PhotosManager;
  let mockPhotos: ReturnType<typeof createMockGooglePhotos>;
  let mockPhotosApi: any;

  beforeEach(() => {
    mockFileSystem.reset();
    mockPhotos = createMockGooglePhotos();
    
    const { google } = require('googleapis');
    mockPhotosApi = google.photos();
    
    photosManager = new PhotosManager({
      auth: {} as any, // Mock auth client
      maxRetries: 3,
      batchSize: 50
    });

    // Replace internal photos client
    (photosManager as any).photos = mockPhotosApi;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAlbum', () => {
    it('should create album successfully', async () => {
      const albumName = 'WhatsApp Photos 2024';
      const expectedResponse = {
        data: {
          id: 'album-id-123',
          title: albumName,
          productUrl: 'https://photos.google.com/album/123',
          isWriteable: true
        }
      };

      mockPhotosApi.albums.create.mockResolvedValue(expectedResponse);

      const result = await photosManager.createAlbum(albumName);

      expect(result).toEqual({
        id: 'album-id-123',
        title: albumName,
        url: 'https://photos.google.com/album/123',
        isWriteable: true
      });
      
      expect(mockPhotosApi.albums.create).toHaveBeenCalledWith({
        requestBody: {
          album: {
            title: albumName
          }
        }
      });
    });

    it('should handle album creation errors', async () => {
      const error = new Error('Album limit exceeded');
      (error as any).code = 400;
      
      mockPhotosApi.albums.create.mockRejectedValue(error);

      await expect(photosManager.createAlbum('Test Album')).rejects.toThrow('Album limit exceeded');
    });

    it('should validate album names', async () => {
      await expect(photosManager.createAlbum('')).rejects.toThrow('Album name cannot be empty');
      await expect(photosManager.createAlbum('a'.repeat(501))).rejects.toThrow('Album name too long'); // Max 500 chars
    });

    it('should sanitize album names', async () => {
      const unsafeName = 'Album <script>alert("xss")</script>';
      const safeName = 'Album alert("xss")';

      mockPhotosApi.albums.create.mockResolvedValue({
        data: { id: 'safe-album-id', title: safeName }
      });

      await photosManager.createAlbum(unsafeName);

      expect(mockPhotosApi.albums.create).toHaveBeenCalledWith({
        requestBody: {
          album: {
            title: expect.stringContaining('Album') && expect.not.stringContaining('<script>')
          }
        }
      });
    });
  });

  describe('uploadMedia', () => {
    it('should upload photo successfully', async () => {
      const photoContent = Buffer.from('fake photo data');
      const stream = Readable.from([photoContent]);
      const metadata = {
        filename: 'photo.jpg',
        mimeType: 'image/jpeg',
        description: 'Test photo upload'
      };

      // Mock upload token creation
      mockPhotosApi.uploads.create.mockResolvedValue({
        data: 'upload-token-123'
      });

      // Mock media item creation
      mockPhotosApi.mediaItems.create.mockResolvedValue({
        data: {
          newMediaItemResults: [{
            uploadToken: 'upload-token-123',
            status: { message: 'Success' },
            mediaItem: {
              id: 'photo-item-123',
              filename: 'photo.jpg',
              mimeType: 'image/jpeg',
              mediaMetadata: {
                creationTime: '2024-01-01T00:00:00Z',
                width: '1920',
                height: '1080'
              }
            }
          }]
        }
      });

      const result = await photosManager.uploadMedia(stream, metadata);

      expect(result.success).toBe(true);
      expect(result.mediaItem.id).toBe('photo-item-123');
      expect(result.mediaItem.filename).toBe('photo.jpg');
      
      expect(mockPhotosApi.uploads.create).toHaveBeenCalled();
      expect(mockPhotosApi.mediaItems.create).toHaveBeenCalledWith({
        requestBody: {
          newMediaItems: [{
            description: 'Test photo upload',
            simpleMediaItem: {
              uploadToken: 'upload-token-123',
              fileName: 'photo.jpg'
            }
          }]
        }
      });
    });

    it('should upload video successfully', async () => {
      const videoContent = Buffer.from('fake video data');
      const stream = Readable.from([videoContent]);
      const metadata = {
        filename: 'video.mp4',
        mimeType: 'video/mp4',
        description: 'Test video upload'
      };

      mockPhotosApi.uploads.create.mockResolvedValue({
        data: 'video-upload-token'
      });

      mockPhotosApi.mediaItems.create.mockResolvedValue({
        data: {
          newMediaItemResults: [{
            uploadToken: 'video-upload-token',
            status: { message: 'Success' },
            mediaItem: {
              id: 'video-item-123',
              filename: 'video.mp4',
              mimeType: 'video/mp4',
              mediaMetadata: {
                creationTime: '2024-01-01T00:00:00Z',
                video: {
                  fps: 30,
                  status: 'READY'
                }
              }
            }
          }]
        }
      });

      const result = await photosManager.uploadMedia(stream, metadata);

      expect(result.success).toBe(true);
      expect(result.mediaItem.id).toBe('video-item-123');
      expect(result.mediaItem.mimeType).toBe('video/mp4');
    });

    it('should handle upload failures', async () => {
      const stream = Readable.from([Buffer.from('failed upload data')]);
      const metadata = { filename: 'failed.jpg', mimeType: 'image/jpeg' };

      mockPhotosApi.uploads.create.mockResolvedValue({
        data: 'failed-upload-token'
      });

      mockPhotosApi.mediaItems.create.mockResolvedValue({
        data: {
          newMediaItemResults: [{
            uploadToken: 'failed-upload-token',
            status: {
              code: 3,
              message: 'INVALID_ARGUMENT: Invalid media item'
            }
          }]
        }
      });

      const result = await photosManager.uploadMedia(stream, metadata);

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_ARGUMENT: Invalid media item');
    });

    it('should handle network errors during upload', async () => {
      const stream = Readable.from([Buffer.from('network error test')]);
      const metadata = { filename: 'network.jpg', mimeType: 'image/jpeg' };

      const networkError = new Error('ECONNREFUSED');
      mockPhotosApi.uploads.create.mockRejectedValue(networkError);

      await expect(photosManager.uploadMedia(stream, metadata)).rejects.toThrow('ECONNREFUSED');
    });

    it('should retry failed uploads', async () => {
      const stream = Readable.from([Buffer.from('retry test data')]);
      const metadata = { filename: 'retry.jpg', mimeType: 'image/jpeg' };

      // Fail upload creation twice, then succeed
      mockPhotosApi.uploads.create
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Another failure'))
        .mockResolvedValueOnce({ data: 'retry-token' });

      mockPhotosApi.mediaItems.create.mockResolvedValue({
        data: {
          newMediaItemResults: [{
            uploadToken: 'retry-token',
            status: { message: 'Success' },
            mediaItem: { id: 'retry-success-123' }
          }]
        }
      });

      const result = await photosManager.uploadMedia(stream, metadata);

      expect(result.success).toBe(true);
      expect(result.mediaItem.id).toBe('retry-success-123');
      expect(mockPhotosApi.uploads.create).toHaveBeenCalledTimes(3);
    });

    // Property-based test: Various media types should be handled
    it('should handle various media file types', () => {
      fc.assert(fc.asyncProperty(
        fc.record({
          filename: fc.string({ minLength: 1, maxLength: 100 }).filter(name => 
            /\.(jpg|jpeg|png|gif|mp4|mov|avi)$/i.test(name)
          ),
          mimeType: fc.constantFrom(
            'image/jpeg', 'image/png', 'image/gif',
            'video/mp4', 'video/quicktime', 'video/x-msvideo'
          )
        }),
        mediumFileArbitrary,
        async (metadata, size) => {
          const content = Buffer.alloc(Math.min(size, 10 * 1024), 'x'); // Limit for test performance
          const stream = Readable.from([content]);

          mockPhotosApi.uploads.create.mockResolvedValue({
            data: 'property-test-token'
          });

          mockPhotosApi.mediaItems.create.mockResolvedValue({
            data: {
              newMediaItemResults: [{
                uploadToken: 'property-test-token',
                status: { message: 'Success' },
                mediaItem: {
                  id: 'property-test-id',
                  filename: metadata.filename,
                  mimeType: metadata.mimeType
                }
              }]
            }
          });

          const result = await photosManager.uploadMedia(stream, metadata);

          expect(result.success).toBe(true);
          expect(result.mediaItem.filename).toBe(metadata.filename);
          expect(result.mediaItem.mimeType).toBe(metadata.mimeType);
        }
      ));
    });
  });

  describe('addToAlbum', () => {
    it('should add media items to album successfully', async () => {
      const albumId = 'album-123';
      const mediaItemIds = ['item-1', 'item-2', 'item-3'];

      mockPhotosApi.albums.batchAddMediaItems = jest.fn().mockResolvedValue({
        data: {
          results: mediaItemIds.map(id => ({
            mediaItemId: id,
            status: { message: 'Success' }
          }))
        }
      });

      const result = await photosManager.addToAlbum(mediaItemIds, albumId);

      expect(result.success).toBe(true);
      expect(result.addedItems).toEqual(mediaItemIds);
      
      expect(mockPhotosApi.albums.batchAddMediaItems).toHaveBeenCalledWith({
        albumId,
        requestBody: {
          mediaItemIds
        }
      });
    });

    it('should handle partial failures when adding to album', async () => {
      const albumId = 'album-456';
      const mediaItemIds = ['success-1', 'fail-2', 'success-3'];

      mockPhotosApi.albums.batchAddMediaItems = jest.fn().mockResolvedValue({
        data: {
          results: [
            { mediaItemId: 'success-1', status: { message: 'Success' } },
            { mediaItemId: 'fail-2', status: { code: 3, message: 'Invalid media item' } },
            { mediaItemId: 'success-3', status: { message: 'Success' } }
          ]
        }
      });

      const result = await photosManager.addToAlbum(mediaItemIds, albumId);

      expect(result.success).toBe(false);
      expect(result.addedItems).toEqual(['success-1', 'success-3']);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('fail-2');
    });

    it('should validate input parameters', async () => {
      await expect(photosManager.addToAlbum([], 'album-123')).rejects.toThrow('No media items provided');
      await expect(photosManager.addToAlbum(['item-1'], '')).rejects.toThrow('Album ID is required');
    });

    it('should handle batch size limits', async () => {
      // Google Photos allows max 50 items per batch
      const manyItemIds = Array.from({ length: 120 }, (_, i) => `item-${i}`);
      const albumId = 'batch-album';

      mockPhotosApi.albums.batchAddMediaItems = jest.fn().mockResolvedValue({
        data: {
          results: Array(50).fill(null).map((_, i) => ({
            mediaItemId: `item-${i}`,
            status: { message: 'Success' }
          }))
        }
      });

      await photosManager.addToAlbum(manyItemIds, albumId);

      // Should be called multiple times for batches
      expect(mockPhotosApi.albums.batchAddMediaItems).toHaveBeenCalledTimes(3); // 50 + 50 + 20
    });
  });

  describe('batchUpload', () => {
    it('should upload multiple media items in batches', async () => {
      const mediaItems = [
        {
          stream: Readable.from([Buffer.from('photo1')]),
          metadata: { filename: 'photo1.jpg', mimeType: 'image/jpeg' }
        },
        {
          stream: Readable.from([Buffer.from('photo2')]),
          metadata: { filename: 'photo2.jpg', mimeType: 'image/jpeg' }
        },
        {
          stream: Readable.from([Buffer.from('photo3')]),
          metadata: { filename: 'photo3.jpg', mimeType: 'image/jpeg' }
        }
      ];

      // Mock upload tokens
      mockPhotosApi.uploads.create
        .mockResolvedValueOnce({ data: 'token-1' })
        .mockResolvedValueOnce({ data: 'token-2' })
        .mockResolvedValueOnce({ data: 'token-3' });

      // Mock batch create
      mockPhotosApi.mediaItems.batchCreate = jest.fn().mockResolvedValue({
        data: {
          newMediaItemResults: [
            {
              uploadToken: 'token-1',
              status: { message: 'Success' },
              mediaItem: { id: 'batch-item-1', filename: 'photo1.jpg' }
            },
            {
              uploadToken: 'token-2',
              status: { message: 'Success' },
              mediaItem: { id: 'batch-item-2', filename: 'photo2.jpg' }
            },
            {
              uploadToken: 'token-3',
              status: { message: 'Success' },
              mediaItem: { id: 'batch-item-3', filename: 'photo3.jpg' }
            }
          ]
        }
      });

      const result = await photosManager.batchUpload(mediaItems);

      expect(result.totalItems).toBe(3);
      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(0);
      expect(result.results).toHaveLength(3);

      expect(mockPhotosApi.uploads.create).toHaveBeenCalledTimes(3);
      expect(mockPhotosApi.mediaItems.batchCreate).toHaveBeenCalledWith({
        requestBody: {
          newMediaItems: expect.arrayContaining([
            expect.objectContaining({
              simpleMediaItem: {
                uploadToken: 'token-1',
                fileName: 'photo1.jpg'
              }
            }),
            expect.objectContaining({
              simpleMediaItem: {
                uploadToken: 'token-2',
                fileName: 'photo2.jpg'
              }
            }),
            expect.objectContaining({
              simpleMediaItem: {
                uploadToken: 'token-3',
                fileName: 'photo3.jpg'
              }
            })
          ])
        }
      });
    });

    it('should handle large batch uploads by splitting into smaller batches', async () => {
      const manyItems = Array.from({ length: 120 }, (_, i) => ({
        stream: Readable.from([Buffer.from(`photo${i}`)]),
        metadata: { filename: `photo${i}.jpg`, mimeType: 'image/jpeg' }
      }));

      // Mock successful uploads for all items
      mockPhotosApi.uploads.create.mockImplementation(() => 
        Promise.resolve({ data: `token-${Date.now()}-${Math.random()}` })
      );

      mockPhotosApi.mediaItems.batchCreate = jest.fn().mockImplementation(({ requestBody }) => {
        const results = requestBody.newMediaItems.map((item: any, index: number) => ({
          uploadToken: item.simpleMediaItem.uploadToken,
          status: { message: 'Success' },
          mediaItem: { 
            id: `batch-large-${index}`, 
            filename: item.simpleMediaItem.fileName 
          }
        }));
        
        return Promise.resolve({ data: { newMediaItemResults: results } });
      });

      const result = await photosManager.batchUpload(manyItems);

      expect(result.totalItems).toBe(120);
      expect(result.successCount).toBe(120);
      expect(result.failureCount).toBe(0);

      // Should batch into groups of 50 (Google Photos limit)
      expect(mockPhotosApi.mediaItems.batchCreate).toHaveBeenCalledTimes(3); // 50 + 50 + 20
    });

    it('should handle partial batch failures', async () => {
      const mixedItems = [
        {
          stream: Readable.from([Buffer.from('success')]),
          metadata: { filename: 'success.jpg', mimeType: 'image/jpeg' }
        },
        {
          stream: Readable.from([Buffer.from('failure')]),
          metadata: { filename: 'failure.jpg', mimeType: 'image/jpeg' }
        }
      ];

      mockPhotosApi.uploads.create
        .mockResolvedValueOnce({ data: 'success-token' })
        .mockResolvedValueOnce({ data: 'failure-token' });

      mockPhotosApi.mediaItems.batchCreate = jest.fn().mockResolvedValue({
        data: {
          newMediaItemResults: [
            {
              uploadToken: 'success-token',
              status: { message: 'Success' },
              mediaItem: { id: 'success-item', filename: 'success.jpg' }
            },
            {
              uploadToken: 'failure-token',
              status: { code: 3, message: 'Invalid format' }
            }
          ]
        }
      });

      const result = await photosManager.batchUpload(mixedItems);

      expect(result.totalItems).toBe(2);
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
    });

    it('should report progress during batch upload', async () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        stream: Readable.from([Buffer.from(`item${i}`)]),
        metadata: { filename: `item${i}.jpg`, mimeType: 'image/jpeg' }
      }));

      const progressCallback = jest.fn();

      mockPhotosApi.uploads.create.mockImplementation(() => 
        Promise.resolve({ data: `token-${Math.random()}` })
      );

      mockPhotosApi.mediaItems.batchCreate = jest.fn().mockImplementation(() => 
        Promise.resolve({
          data: {
            newMediaItemResults: Array(10).fill(null).map((_, i) => ({
              uploadToken: `token-${i}`,
              status: { message: 'Success' },
              mediaItem: { id: `item-${i}` }
            }))
          }
        })
      );

      await photosManager.batchUpload(items, { onProgress: progressCallback });

      // Should report progress at various stages
      expect(progressCallback).toHaveBeenCalled();
      const lastCall = progressCallback.mock.calls[progressCallback.mock.calls.length - 1];
      expect(lastCall[0]).toEqual({
        completed: 10,
        total: 10,
        percentage: 100
      });
    });
  });

  describe('error handling and API limits', () => {
    it('should handle quota exceeded errors', async () => {
      const stream = Readable.from([Buffer.from('quota test')]);
      const metadata = { filename: 'quota.jpg', mimeType: 'image/jpeg' };

      const quotaError = new Error('Quota exceeded');
      (quotaError as any).code = 429;
      (quotaError as any).details = [{ reason: 'quotaExceeded' }];

      mockPhotosApi.uploads.create.mockRejectedValue(quotaError);

      await expect(photosManager.uploadMedia(stream, metadata)).rejects.toThrow('Quota exceeded');
    });

    it('should handle invalid media format errors', async () => {
      const stream = Readable.from([Buffer.from('invalid format')]);
      const metadata = { filename: 'invalid.xyz', mimeType: 'application/unknown' };

      mockPhotosApi.uploads.create.mockResolvedValue({ data: 'invalid-token' });
      mockPhotosApi.mediaItems.create.mockResolvedValue({
        data: {
          newMediaItemResults: [{
            uploadToken: 'invalid-token',
            status: {
              code: 3,
              message: 'INVALID_ARGUMENT: Unsupported media format'
            }
          }]
        }
      });

      const result = await photosManager.uploadMedia(stream, metadata);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported media format');
    });

    // Property-based test: Error responses should be handled consistently
    it('should handle various API error formats', () => {
      fc.assert(fc.asyncProperty(googleApiErrorArbitrary, async (errorData) => {
        const stream = Readable.from([Buffer.from('error test')]);
        const metadata = { filename: 'error.jpg', mimeType: 'image/jpeg' };

        const error = new Error(errorData.message);
        (error as any).code = errorData.code;
        (error as any).details = errorData.details;

        mockPhotosApi.uploads.create.mockRejectedValue(error);

        if (errorData.code >= 400 && errorData.code < 500) {
          // Client errors should not retry
          await expect(photosManager.uploadMedia(stream, metadata)).rejects.toThrow();
        } else if (errorData.code >= 500) {
          // Server errors should retry
          mockPhotosApi.uploads.create
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce({ data: 'recovery-token' });

          mockPhotosApi.mediaItems.create.mockResolvedValue({
            data: {
              newMediaItemResults: [{
                uploadToken: 'recovery-token',
                status: { message: 'Success' },
                mediaItem: { id: 'recovered-item' }
              }]
            }
          });

          const result = await photosManager.uploadMedia(stream, metadata);
          expect(result.success).toBe(true);
        }
      }));
    });
  });

  describe('album management', () => {
    it('should list existing albums', async () => {
      const mockAlbums = [
        { id: 'album1', title: 'WhatsApp 2023', mediaItemsCount: '150' },
        { id: 'album2', title: 'WhatsApp 2024', mediaItemsCount: '89' }
      ];

      mockPhotosApi.albums.list.mockResolvedValue({
        data: { albums: mockAlbums }
      });

      const result = await photosManager.listAlbums();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'album1',
        title: 'WhatsApp 2023',
        mediaItemsCount: 150
      });
      expect(result[1]).toEqual({
        id: 'album2',
        title: 'WhatsApp 2024',
        mediaItemsCount: 89
      });
    });

    it('should find albums by name pattern', async () => {
      const allAlbums = [
        { id: 'album1', title: 'WhatsApp 2023', mediaItemsCount: '100' },
        { id: 'album2', title: 'Family Photos', mediaItemsCount: '50' },
        { id: 'album3', title: 'WhatsApp 2024', mediaItemsCount: '75' }
      ];

      mockPhotosApi.albums.list.mockResolvedValue({
        data: { albums: allAlbums }
      });

      const whatsappAlbums = await photosManager.findAlbums(/^WhatsApp/);

      expect(whatsappAlbums).toHaveLength(2);
      expect(whatsappAlbums.map(a => a.title)).toEqual(['WhatsApp 2023', 'WhatsApp 2024']);
    });

    it('should get album details', async () => {
      const albumId = 'detailed-album-123';
      const albumDetails = {
        id: albumId,
        title: 'Detailed Album',
        productUrl: 'https://photos.google.com/album/123',
        mediaItemsCount: '42',
        coverPhotoMediaItemId: 'cover-photo-123'
      };

      mockPhotosApi.albums.get.mockResolvedValue({
        data: albumDetails
      });

      const result = await photosManager.getAlbumDetails(albumId);

      expect(result).toEqual({
        id: albumId,
        title: 'Detailed Album',
        url: 'https://photos.google.com/album/123',
        mediaItemsCount: 42,
        coverPhotoId: 'cover-photo-123'
      });
    });
  });
});