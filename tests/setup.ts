/**
 * Global Jest setup file
 * AIDEV-NOTE: test-setup; configure global test environment and mocks
 */

import { jest } from '@jest/globals';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to avoid cluttering test output
const originalConsole = { ...console };

beforeEach(() => {
  // Mock console methods but allow specific test logging if needed
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  // Restore console methods
  jest.restoreAllMocks();
});

// Global test utilities
global.testUtils = {
  // Restore console for debugging specific tests
  enableConsole: (): void => {
    Object.assign(console, originalConsole);
  },
  
  // Create mock file system paths
  createMockPath: (filename: string): string => {
    return `/mock/path/${filename}`;
  },
  
  // Create mock file metadata
  createMockFileMetadata: (overrides = {}): any => {
    return {
      path: '/mock/path/test.jpg',
      name: 'test.jpg',
      size: 1024,
      type: 'photo',
      mimeType: 'image/jpeg',
      hash: 'abc123def456',
      timestamp: new Date('2023-01-01T00:00:00.000Z'),
      chat: {
        id: 'test-chat',
        name: 'Test Chat',
        type: 'group'
      },
      ...overrides
    };
  }
};

// Declare global types for TypeScript
declare global {
  var testUtils: {
    enableConsole(): void;
    createMockPath(filename: string): string;
    createMockFileMetadata(overrides?: Record<string, any>): any;
  };
}

// Environment variables for testing
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Suppress specific warnings during tests
process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';