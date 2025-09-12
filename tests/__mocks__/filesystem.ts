/**
 * Mock File System for testing
 * AIDEV-NOTE: filesystem-mocks; virtual file system for consistent testing without real I/O
 */

import { EventEmitter } from 'events';
import { Readable, Writable } from 'stream';

export interface MockFile {
  path: string;
  name: string;
  size: number;
  content: Buffer;
  mimeType: string;
  timestamp: Date;
  permissions: string;
}

export interface MockDirectory {
  path: string;
  name: string;
  files: Map<string, MockFile>;
  subdirectories: Map<string, MockDirectory>;
  permissions: string;
}

export class MockFileSystem {
  private root: MockDirectory;
  private cwd: string = '/';
  private errors: Map<string, Error> = new Map();

  constructor() {
    this.root = {
      path: '/',
      name: '',
      files: new Map(),
      subdirectories: new Map(),
      permissions: '755'
    };
  }

  reset(): void {
    this.root = {
      path: '/',
      name: '',
      files: new Map(),
      subdirectories: new Map(),
      permissions: '755'
    };
    this.cwd = '/';
    this.errors.clear();
  }

  // Add error conditions for testing
  addError(path: string, error: Error): void {
    this.errors.set(path, error);
  }

  private checkError(path: string): void {
    const error = this.errors.get(path);
    if (error) {
      throw error;
    }
  }

  // Create directory structure
  createDirectory(path: string, permissions: string = '755'): void {
    this.checkError(path);
    const parts = path.split('/').filter(Boolean);
    let current = this.root;

    for (const part of parts) {
      if (!current.subdirectories.has(part)) {
        current.subdirectories.set(part, {
          path: `${current.path === '/' ? '' : current.path}/${part}`,
          name: part,
          files: new Map(),
          subdirectories: new Map(),
          permissions
        });
      }
      current = current.subdirectories.get(part)!;
    }
  }

  // Create file
  createFile(path: string, content: Buffer | string, options: Partial<MockFile> = {}): void {
    this.checkError(path);
    const dirPath = path.substring(0, path.lastIndexOf('/'));
    const fileName = path.substring(path.lastIndexOf('/') + 1);

    if (dirPath && dirPath !== '/') {
      this.createDirectory(dirPath);
    }

    const directory = this.getDirectory(dirPath || '/');
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);

    directory.files.set(fileName, {
      path,
      name: fileName,
      size: buffer.length,
      content: buffer,
      mimeType: 'application/octet-stream',
      timestamp: new Date(),
      permissions: '644',
      ...options
    });
  }

  // Get directory
  private getDirectory(path: string): MockDirectory {
    if (path === '/') return this.root;

    const parts = path.split('/').filter(Boolean);
    let current = this.root;

    for (const part of parts) {
      if (!current.subdirectories.has(part)) {
        throw new Error(`Directory not found: ${path}`);
      }
      current = current.subdirectories.get(part)!;
    }

    return current;
  }

  // Check if file exists
  existsSync(path: string): boolean {
    try {
      this.checkError(path);
      const dirPath = path.substring(0, path.lastIndexOf('/'));
      const fileName = path.substring(path.lastIndexOf('/') + 1);
      const directory = this.getDirectory(dirPath || '/');
      return directory.files.has(fileName);
    } catch {
      return false;
    }
  }

  // Get file stats
  statSync(path: string): any {
    this.checkError(path);
    const dirPath = path.substring(0, path.lastIndexOf('/'));
    const fileName = path.substring(path.lastIndexOf('/') + 1);
    const directory = this.getDirectory(dirPath || '/');
    const file = directory.files.get(fileName);

    if (!file) {
      throw new Error(`File not found: ${path}`);
    }

    return {
      size: file.size,
      mtime: file.timestamp,
      ctime: file.timestamp,
      atime: file.timestamp,
      isFile: () => true,
      isDirectory: () => false,
      mode: parseInt(file.permissions, 8)
    };
  }

  // Read file
  readFileSync(path: string): Buffer {
    this.checkError(path);
    const dirPath = path.substring(0, path.lastIndexOf('/'));
    const fileName = path.substring(path.lastIndexOf('/') + 1);
    const directory = this.getDirectory(dirPath || '/');
    const file = directory.files.get(fileName);

    if (!file) {
      throw new Error(`File not found: ${path}`);
    }

    return file.content;
  }

  // Create readable stream
  createReadStream(path: string, options: any = {}): Readable {
    this.checkError(path);
    const file = this.getFile(path);
    const stream = new Readable({
      highWaterMark: options.highWaterMark || 64 * 1024
    });

    let position = options.start || 0;
    const end = options.end || file.content.length;

    stream._read = () => {
      if (position >= end) {
        stream.push(null); // End of stream
        return;
      }

      const chunkSize = Math.min(stream.readableHighWaterMark, end - position);
      const chunk = file.content.slice(position, position + chunkSize);
      position += chunkSize;
      stream.push(chunk);
    };

    return stream;
  }

  // Get file object
  private getFile(path: string): MockFile {
    const dirPath = path.substring(0, path.lastIndexOf('/'));
    const fileName = path.substring(path.lastIndexOf('/') + 1);
    const directory = this.getDirectory(dirPath || '/');
    const file = directory.files.get(fileName);

    if (!file) {
      throw new Error(`File not found: ${path}`);
    }

    return file;
  }

  // Read directory
  readdirSync(path: string): string[] {
    this.checkError(path);
    const directory = this.getDirectory(path);
    return [
      ...Array.from(directory.files.keys()),
      ...Array.from(directory.subdirectories.keys())
    ];
  }

  // Check access permissions
  accessSync(path: string, mode: number = 0): void {
    this.checkError(path);
    // For testing, we'll just check if the file/directory exists
    if (!this.existsSync(path) && !this.directoryExists(path)) {
      const error = new Error(`ENOENT: no such file or directory, access '${path}'`);
      (error as any).code = 'ENOENT';
      throw error;
    }
  }

  private directoryExists(path: string): boolean {
    try {
      this.getDirectory(path);
      return true;
    } catch {
      return false;
    }
  }

  // Create WhatsApp-like directory structure for testing
  createWhatsAppStructure(): void {
    const baseDir = '/storage/emulated/0/WhatsApp/Media';
    
    // Create main directories
    this.createDirectory(`${baseDir}/WhatsApp Images`);
    this.createDirectory(`${baseDir}/WhatsApp Video`);
    this.createDirectory(`${baseDir}/WhatsApp Audio`);
    this.createDirectory(`${baseDir}/WhatsApp Documents`);

    // Create chat-specific directories
    const chats = ['Chat with John', 'Family Group', 'Work Team'];
    
    for (const chat of chats) {
      this.createDirectory(`${baseDir}/WhatsApp Images/${chat}`);
      this.createDirectory(`${baseDir}/WhatsApp Video/${chat}`);
      this.createDirectory(`${baseDir}/WhatsApp Audio/${chat}`);
      this.createDirectory(`${baseDir}/WhatsApp Documents/${chat}`);

      // Create sample files
      this.createFile(
        `${baseDir}/WhatsApp Images/${chat}/IMG-20240101-WA0001.jpg`,
        Buffer.from('mock-image-data'),
        { mimeType: 'image/jpeg', timestamp: new Date('2024-01-01') }
      );

      this.createFile(
        `${baseDir}/WhatsApp Video/${chat}/VID-20240101-WA0001.mp4`,
        Buffer.from('mock-video-data'),
        { mimeType: 'video/mp4', timestamp: new Date('2024-01-01') }
      );

      this.createFile(
        `${baseDir}/WhatsApp Audio/${chat}/AUD-20240101-WA0001.ogg`,
        Buffer.from('mock-audio-data'),
        { mimeType: 'audio/ogg', timestamp: new Date('2024-01-01') }
      );

      this.createFile(
        `${baseDir}/WhatsApp Documents/${chat}/DOC-20240101-WA0001.pdf`,
        Buffer.from('mock-document-data'),
        { mimeType: 'application/pdf', timestamp: new Date('2024-01-01') }
      );
    }
  }

  // Get all files in directory recursively
  getAllFiles(dirPath: string): MockFile[] {
    const directory = this.getDirectory(dirPath);
    const files: MockFile[] = [];

    // Add files from current directory
    files.push(...Array.from(directory.files.values()));

    // Recursively add files from subdirectories
    for (const [name, subDir] of directory.subdirectories) {
      files.push(...this.getAllFiles(subDir.path));
    }

    return files;
  }
}

// Global mock file system instance
export const mockFileSystem = new MockFileSystem();

// Helper function to create test file metadata
export function createTestFileMetadata(overrides: Partial<any> = {}): any {
  return {
    path: '/mock/path/test.jpg',
    name: 'test.jpg',
    size: 1024,
    type: 'photo',
    mimeType: 'image/jpeg',
    hash: 'abc123def456789',
    timestamp: new Date('2024-01-01T00:00:00.000Z'),
    chat: {
      id: 'test-chat',
      name: 'Test Chat',
      type: 'group'
    },
    ...overrides
  };
}