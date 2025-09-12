/**
 * WhatsApp Scanner Unit Tests
 * AIDEV-NOTE: scanner-tests; comprehensive testing of WhatsApp directory scanning and file discovery
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fc from 'fast-check';
import { WhatsAppScanner } from '@whatsapp-uploader/scanner';
import { mockFileSystem, createTestFileMetadata } from '../../__mocks__/filesystem';
import { 
  fileMetadataArbitrary,
  windowsPathArbitrary,
  unixPathArbitrary,
  androidPathArbitrary,
  whatsappChatArbitrary
} from '../../fixtures/property-generators';
import * as path from 'path';
import * as fs from 'fs/promises';

// Mock file system operations
jest.mock('fs/promises');
jest.mock('fs');
jest.mock('path');

describe('WhatsAppScanner', () => {
  let scanner: WhatsAppScanner;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(() => {
    mockFs = fs as jest.Mocked<typeof fs>;
    mockFileSystem.reset();
    mockFileSystem.createWhatsAppStructure(); // Create realistic WhatsApp directory structure
    
    scanner = new WhatsAppScanner({
      whatsappPath: '/storage/emulated/0/WhatsApp',
      supportedTypes: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'pdf', 'doc', 'ogg', 'mp3'],
      maxDepth: 5,
      followSymlinks: false
    });

    // Mock path operations for cross-platform testing
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    (path.resolve as jest.Mock).mockImplementation((p) => p.startsWith('/') ? p : `/${p}`);
    (path.extname as jest.Mock).mockImplementation((p) => {
      const lastDot = p.lastIndexOf('.');
      return lastDot === -1 ? '' : p.substring(lastDot);
    });
    (path.basename as jest.Mock).mockImplementation((p) => p.split('/').pop() || '');
    (path.dirname as jest.Mock).mockImplementation((p) => {
      const parts = p.split('/');
      return parts.slice(0, -1).join('/') || '/';
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findChats', () => {
    it('should discover available chats', async () => {
      // Mock readdir to return WhatsApp directory structure
      mockFs.readdir.mockImplementation(async (dirPath: any) => {
        if (dirPath.includes('WhatsApp Images')) {
          return ['Chat with John', 'Family Group', 'Work Team'] as any;
        }
        return [] as any;
      });

      mockFs.stat.mockImplementation(async (filePath: any) => ({
        isDirectory: () => true,
        isFile: () => false,
        size: 0,
        mtime: new Date(),
        ctime: new Date(),
        atime: new Date()
      } as any));

      const chats = await scanner.findChats();

      expect(chats).toHaveLength(3);
      expect(chats.map(c => c.name)).toEqual(['Chat with John', 'Family Group', 'Work Team']);
      expect(chats[0]).toEqual({
        id: expect.any(String),
        name: 'Chat with John',
        type: 'individual',
        mediaPath: expect.stringContaining('Chat with John'),
        lastActivity: expect.any(Date),
        estimatedFileCount: expect.any(Number)
      });
    });

    it('should handle empty WhatsApp directory', async () => {
      mockFs.readdir.mockResolvedValue([] as any);
      mockFs.stat.mockResolvedValue({
        isDirectory: () => true,
        isFile: () => false
      } as any);

      const chats = await scanner.findChats();

      expect(chats).toHaveLength(0);
    });

    it('should filter chats by options', async () => {
      mockFs.readdir.mockImplementation(async (dirPath: any) => {
        if (dirPath.includes('WhatsApp Images')) {
          return ['Chat with John', 'Family Group', 'Work Team', 'Old Chat'] as any;
        }
        return [] as any;
      });

      mockFs.stat.mockImplementation(async (filePath: any) => {
        const isOld = filePath.includes('Old Chat');
        return {
          isDirectory: () => true,
          isFile: () => false,
          mtime: isOld ? new Date('2020-01-01') : new Date('2024-01-01')
        } as any;
      });

      const options = {
        namePattern: /^(Chat|Family)/,
        minLastActivity: new Date('2023-01-01')
      };

      const chats = await scanner.findChats(options);

      expect(chats).toHaveLength(2);
      expect(chats.map(c => c.name)).toEqual(['Chat with John', 'Family Group']);
    });

    it('should determine chat type (individual vs group)', async () => {
      mockFs.readdir.mockImplementation(async (dirPath: any) => {
        if (dirPath.includes('WhatsApp Images')) {
          return ['Chat with +1 234 567 8901', 'Family Group Chat', 'Work Team 💼'] as any;
        }
        return [] as any;
      });

      mockFs.stat.mockResolvedValue({
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date()
      } as any);

      const chats = await scanner.findChats();

      expect(chats[0].type).toBe('individual'); // Phone number pattern
      expect(chats[1].type).toBe('group');      // Contains 'Group'
      expect(chats[2].type).toBe('group');      // Contains 'Team'
    });

    it('should handle file system errors gracefully', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'));

      await expect(scanner.findChats()).rejects.toThrow('Permission denied');
    });

    // Property-based test: Chat discovery should be deterministic
    it('should consistently identify chat types', () => {
      fc.assert(fc.property(whatsappChatArbitrary, (chatData) => {
        const type1 = (scanner as any).determineChatType(chatData.name);
        const type2 = (scanner as any).determineChatType(chatData.name);
        
        expect(type1).toBe(type2); // Consistent classification
        expect(['individual', 'group']).toContain(type1);
      }));
    });
  });

  describe('scanChat', () => {
    it('should scan files in a specific chat', async () => {
      const chatId = 'test-chat-123';
      const chatPath = '/storage/emulated/0/WhatsApp/Media/WhatsApp Images/Test Chat';
      
      // Mock file discovery
      mockFs.readdir.mockImplementation(async (dirPath: any) => {
        if (dirPath === chatPath) {
          return ['IMG-20240101-WA0001.jpg', 'IMG-20240102-WA0002.png', 'VID-20240103-WA0001.mp4'] as any;
        }
        return [] as any;
      });

      mockFs.stat.mockImplementation(async (filePath: any) => {
        if (filePath.endsWith('.jpg') || filePath.endsWith('.png')) {
          return {
            isFile: () => true,
            isDirectory: () => false,
            size: 2048,
            mtime: new Date('2024-01-01'),
            ctime: new Date('2024-01-01')
          } as any;
        }
        if (filePath.endsWith('.mp4')) {
          return {
            isFile: () => true,
            isDirectory: () => false,
            size: 5242880, // 5MB
            mtime: new Date('2024-01-03'),
            ctime: new Date('2024-01-03')
          } as any;
        }
        return {
          isDirectory: () => true,
          isFile: () => false
        } as any;
      });

      // Mock chat lookup
      (scanner as any).getChatPath = jest.fn().mockResolvedValue(chatPath);

      const files = await scanner.scanChat(chatId);

      expect(files).toHaveLength(3);
      expect(files[0]).toEqual({
        path: `${chatPath}/IMG-20240101-WA0001.jpg`,
        name: 'IMG-20240101-WA0001.jpg',
        size: 2048,
        type: 'photo',
        mimeType: 'image/jpeg',
        hash: expect.any(String),
        timestamp: expect.any(Date),
        chat: {
          id: chatId,
          name: expect.any(String),
          type: expect.any(String)
        }
      });
    });

    it('should apply file filters', async () => {
      const chatId = 'filtered-chat';
      const chatPath = '/test/chat/path';
      
      mockFs.readdir.mockResolvedValue([
        'IMG-20240101-WA0001.jpg',  // Should match
        'IMG-20240201-WA0002.jpg',  // Too new
        'VID-20240101-WA0001.mp4',  // Should match
        'DOC-20240101-WA0001.pdf',  // Wrong type
        'old-file.jpg'              // Too old
      ] as any);

      mockFs.stat.mockImplementation(async (filePath: any) => {
        let mtime: Date;
        if (filePath.includes('20240101')) mtime = new Date('2024-01-01');
        else if (filePath.includes('20240201')) mtime = new Date('2024-02-01');
        else mtime = new Date('2023-01-01');

        return {
          isFile: () => true,
          isDirectory: () => false,
          size: 1024,
          mtime,
          ctime: mtime
        } as any;
      });

      (scanner as any).getChatPath = jest.fn().mockResolvedValue(chatPath);

      const filters = {
        dateRange: {
          from: new Date('2023-12-01'),
          to: new Date('2024-01-31')
        },
        types: ['photo', 'video']
      };

      const files = await scanner.scanChat(chatId, filters);

      expect(files).toHaveLength(2);
      expect(files.map(f => f.name)).toEqual([
        'IMG-20240101-WA0001.jpg',
        'VID-20240101-WA0001.mp4'
      ]);
    });

    it('should calculate file hashes', async () => {
      const chatId = 'hash-test-chat';
      const chatPath = '/test/hash/path';
      const testContent = Buffer.from('test file content for hashing');

      mockFs.readdir.mockResolvedValue(['test-file.jpg'] as any);
      mockFs.stat.mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: testContent.length,
        mtime: new Date(),
        ctime: new Date()
      } as any);

      mockFs.readFile.mockResolvedValue(testContent as any);
      (scanner as any).getChatPath = jest.fn().mockResolvedValue(chatPath);

      const files = await scanner.scanChat(chatId);

      expect(files).toHaveLength(1);
      expect(files[0].hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash format
    });

    it('should handle nested directory structures', async () => {
      const chatId = 'nested-chat';
      const basePath = '/test/nested/path';
      
      mockFs.readdir.mockImplementation(async (dirPath: any) => {
        if (dirPath === basePath) {
          return ['Sent', 'Private'] as any;
        } else if (dirPath.endsWith('/Sent')) {
          return ['sent-photo.jpg', 'sent-video.mp4'] as any;
        } else if (dirPath.endsWith('/Private')) {
          return ['private-doc.pdf'] as any;
        }
        return [] as any;
      });

      mockFs.stat.mockImplementation(async (filePath: any) => {
        if (filePath.endsWith('Sent') || filePath.endsWith('Private')) {
          return { isDirectory: () => true, isFile: () => false } as any;
        }
        return {
          isFile: () => true,
          isDirectory: () => false,
          size: 1024,
          mtime: new Date(),
          ctime: new Date()
        } as any;
      });

      (scanner as any).getChatPath = jest.fn().mockResolvedValue(basePath);

      const files = await scanner.scanChat(chatId);

      expect(files).toHaveLength(3);
      expect(files.map(f => f.name)).toEqual(['sent-photo.jpg', 'sent-video.mp4', 'private-doc.pdf']);
    });

    // Property-based test: File metadata should be consistent
    it('should generate consistent metadata for files', () => {
      fc.assert(fc.asyncProperty(fileMetadataArbitrary, async (fileData) => {
        // Mock the file system to return our test data
        mockFs.readdir.mockResolvedValue([fileData.name] as any);
        mockFs.stat.mockResolvedValue({
          isFile: () => true,
          isDirectory: () => false,
          size: fileData.size,
          mtime: fileData.timestamp,
          ctime: fileData.timestamp
        } as any);

        const testContent = Buffer.alloc(Math.min(fileData.size, 1024), 'x');
        mockFs.readFile.mockResolvedValue(testContent as any);
        (scanner as any).getChatPath = jest.fn().mockResolvedValue('/test/path');

        const files = await scanner.scanChat(fileData.chat.id);

        if (files.length > 0) {
          const file = files[0];
          expect(file.name).toBe(fileData.name);
          expect(file.size).toBe(fileData.size);
          expect(file.timestamp).toEqual(fileData.timestamp);
          expect(file.chat.id).toBe(fileData.chat.id);
        }
      }));
    });
  });

  describe('getFileMetadata', () => {
    it('should extract complete file metadata', async () => {
      const filePath = '/test/path/IMG-20240101-WA0001.jpg';
      const fileContent = Buffer.from('fake image content');
      
      mockFs.stat.mockResolvedValue({
        size: fileContent.length,
        mtime: new Date('2024-01-01T10:00:00Z'),
        ctime: new Date('2024-01-01T09:30:00Z'),
        isFile: () => true,
        isDirectory: () => false
      } as any);

      mockFs.readFile.mockResolvedValue(fileContent as any);

      const metadata = await scanner.getFileMetadata(filePath);

      expect(metadata).toEqual({
        path: filePath,
        name: 'IMG-20240101-WA0001.jpg',
        size: fileContent.length,
        type: 'photo',
        mimeType: 'image/jpeg',
        hash: expect.stringMatching(/^[a-f0-9]{64}$/),
        timestamp: new Date('2024-01-01T10:00:00Z'),
        chat: {
          id: expect.any(String),
          name: expect.any(String),
          type: expect.any(String)
        }
      });
    });

    it('should determine correct file types', async () => {
      const testFiles = [
        { path: '/test/photo.jpg', expectedType: 'photo', expectedMime: 'image/jpeg' },
        { path: '/test/image.png', expectedType: 'photo', expectedMime: 'image/png' },
        { path: '/test/video.mp4', expectedType: 'video', expectedMime: 'video/mp4' },
        { path: '/test/audio.ogg', expectedType: 'audio', expectedMime: 'audio/ogg' },
        { path: '/test/document.pdf', expectedType: 'document', expectedMime: 'application/pdf' }
      ];

      for (const testFile of testFiles) {
        mockFs.stat.mockResolvedValue({
          size: 1024,
          mtime: new Date(),
          ctime: new Date(),
          isFile: () => true,
          isDirectory: () => false
        } as any);

        mockFs.readFile.mockResolvedValue(Buffer.from('test content') as any);

        const metadata = await scanner.getFileMetadata(testFile.path);

        expect(metadata.type).toBe(testFile.expectedType);
        expect(metadata.mimeType).toBe(testFile.expectedMime);
      }
    });

    it('should handle file access errors', async () => {
      const filePath = '/inaccessible/file.jpg';
      
      mockFs.stat.mockRejectedValue(new Error('EACCES: permission denied'));

      await expect(scanner.getFileMetadata(filePath)).rejects.toThrow('permission denied');
    });

    it('should extract WhatsApp-specific metadata from filenames', async () => {
      const testCases = [
        {
          filename: 'IMG-20240315-WA0042.jpg',
          expected: { date: '2024-03-15', sequence: '0042', type: 'IMG' }
        },
        {
          filename: 'VID-20231225-WA0001.mp4', 
          expected: { date: '2023-12-25', sequence: '0001', type: 'VID' }
        },
        {
          filename: 'AUD-20240101-WA0123.ogg',
          expected: { date: '2024-01-01', sequence: '0123', type: 'AUD' }
        }
      ];

      for (const testCase of testCases) {
        const extracted = (scanner as any).extractWhatsAppMetadata(testCase.filename);
        
        expect(extracted.date).toBe(testCase.expected.date);
        expect(extracted.sequence).toBe(testCase.expected.sequence);
        expect(extracted.type).toBe(testCase.expected.type);
      }
    });
  });

  describe('validateAccess', () => {
    it('should validate WhatsApp directory access', async () => {
      const whatsappPath = '/storage/emulated/0/WhatsApp';
      
      mockFs.access.mockImplementation(async (path: any, mode: any) => {
        // Simulate successful access check
        if (path.includes('WhatsApp')) {
          return;
        }
        throw new Error('Access denied');
      });

      mockFs.stat.mockResolvedValue({
        isDirectory: () => true,
        isFile: () => false
      } as any);

      const result = await scanner.validateAccess();

      expect(result.hasAccess).toBe(true);
      expect(result.readableDirectories).toContain('WhatsApp Images');
      expect(result.readableDirectories).toContain('WhatsApp Video');
      expect(result.readableDirectories).toContain('WhatsApp Documents');
      expect(result.readableDirectories).toContain('WhatsApp Audio');
    });

    it('should report missing permissions', async () => {
      mockFs.access.mockRejectedValue(new Error('EACCES: permission denied'));

      const result = await scanner.validateAccess();

      expect(result.hasAccess).toBe(false);
      expect(result.error).toContain('permission denied');
      expect(result.readableDirectories).toHaveLength(0);
    });

    it('should check individual subdirectory permissions', async () => {
      mockFs.access.mockImplementation(async (path: any) => {
        // Only allow access to Images and Video, deny Documents and Audio
        if (path.includes('Documents') || path.includes('Audio')) {
          throw new Error('Permission denied');
        }
      });

      mockFs.stat.mockResolvedValue({
        isDirectory: () => true,
        isFile: () => false
      } as any);

      const result = await scanner.validateAccess();

      expect(result.hasAccess).toBe(true); // Partial access is still access
      expect(result.readableDirectories).toContain('WhatsApp Images');
      expect(result.readableDirectories).toContain('WhatsApp Video');
      expect(result.readableDirectories).not.toContain('WhatsApp Documents');
      expect(result.readableDirectories).not.toContain('WhatsApp Audio');
    });
  });

  describe('cross-platform path handling', () => {
    // Property-based test: Path operations should work across platforms
    it('should handle Windows paths correctly', () => {
      fc.assert(fc.property(windowsPathArbitrary, (windowsPath) => {
        const normalized = (scanner as any).normalizePath(windowsPath);
        
        expect(typeof normalized).toBe('string');
        expect(normalized.length).toBeGreaterThan(0);
        
        // Should not contain backslashes after normalization
        expect(normalized).not.toContain('\\');
      }));
    });

    it('should handle Unix paths correctly', () => {
      fc.assert(fc.property(unixPathArbitrary, (unixPath) => {
        const normalized = (scanner as any).normalizePath(unixPath);
        
        expect(typeof normalized).toBe('string');
        expect(normalized.length).toBeGreaterThan(0);
        expect(normalized.startsWith('/')).toBe(true);
      }));
    });

    it('should handle Android/Termux paths correctly', () => {
      fc.assert(fc.property(androidPathArbitrary, (androidPath) => {
        const normalized = (scanner as any).normalizePath(androidPath);
        
        expect(typeof normalized).toBe('string');
        expect(normalized.length).toBeGreaterThan(0);
        expect(normalized.startsWith('/storage/')).toBe(true);
      }));
    });

    it('should resolve relative paths safely', () => {
      const relativePaths = ['../../../etc/passwd', './../../sensitive-file', 'normal-file.jpg'];
      
      for (const relativePath of relativePaths) {
        const resolved = (scanner as any).resolveSecurePath('/safe/base/path', relativePath);
        
        // Should not allow directory traversal outside base path
        expect(resolved.startsWith('/safe/base/path')).toBe(true);
      }
    });
  });

  describe('performance and memory management', () => {
    it('should handle large directories efficiently', async () => {
      // Simulate a directory with many files
      const manyFiles = Array.from({ length: 10000 }, (_, i) => `file-${i}.jpg`);
      
      mockFs.readdir.mockResolvedValue(manyFiles as any);
      mockFs.stat.mockImplementation(async (filePath: any) => ({
        isFile: () => true,
        isDirectory: () => false,
        size: 1024,
        mtime: new Date(),
        ctime: new Date()
      } as any));

      // Mock file reading to be fast
      mockFs.readFile.mockResolvedValue(Buffer.alloc(1024, 'x') as any);
      (scanner as any).getChatPath = jest.fn().mockResolvedValue('/large/directory');

      const startTime = Date.now();
      const files = await scanner.scanChat('large-chat-test');
      const endTime = Date.now();

      expect(files).toHaveLength(10000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should respect memory limits during file hashing', async () => {
      // Test with a simulated large file
      const largeFileSize = 100 * 1024 * 1024; // 100MB
      
      mockFs.readdir.mockResolvedValue(['large-file.mp4'] as any);
      mockFs.stat.mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: largeFileSize,
        mtime: new Date(),
        ctime: new Date()
      } as any);

      // Mock streaming file read for large files
      const mockCreateReadStream = jest.fn();
      (fs as any).createReadStream = mockCreateReadStream;
      
      (scanner as any).getChatPath = jest.fn().mockResolvedValue('/large/file/path');

      await scanner.scanChat('large-file-chat');

      // Should use streaming for large files instead of loading into memory
      if (largeFileSize > 50 * 1024 * 1024) { // 50MB threshold
        expect(mockCreateReadStream).toHaveBeenCalled();
      }
    });

    it('should batch file processing to avoid overwhelming the system', async () => {
      const moderateFileCount = 1000;
      const files = Array.from({ length: moderateFileCount }, (_, i) => `batch-file-${i}.jpg`);
      
      mockFs.readdir.mockResolvedValue(files as any);
      mockFs.stat.mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 1024,
        mtime: new Date(),
        ctime: new Date()
      } as any);

      mockFs.readFile.mockResolvedValue(Buffer.alloc(1024, 'y') as any);
      (scanner as any).getChatPath = jest.fn().mockResolvedValue('/batch/test/path');

      // Monitor how processing is batched
      const processingBatches: number[] = [];
      const originalProcessBatch = (scanner as any).processBatch;
      (scanner as any).processBatch = jest.fn().mockImplementation((batch) => {
        processingBatches.push(batch.length);
        return originalProcessBatch?.call(scanner, batch) || Promise.resolve([]);
      });

      await scanner.scanChat('batch-test-chat');

      // Should process in reasonable batch sizes (not all at once)
      if (processingBatches.length > 0) {
        const maxBatchSize = Math.max(...processingBatches);
        expect(maxBatchSize).toBeLessThanOrEqual(100); // Reasonable batch size
      }
    });
  });
});