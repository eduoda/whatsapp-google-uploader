/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test file patterns
  roots: ['<rootDir>/tests', '<rootDir>/packages', '<rootDir>/apps', '<rootDir>/shared'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // Module path mapping for TypeScript paths
  moduleNameMapping: {
    '^@whatsapp-uploader/oauth$': '<rootDir>/packages/oauth/src',
    '^@whatsapp-uploader/google-drive$': '<rootDir>/packages/google-drive/src',
    '^@whatsapp-uploader/google-photos$': '<rootDir>/packages/google-photos/src',
    '^@whatsapp-uploader/scanner$': '<rootDir>/packages/scanner/src',
    '^@whatsapp-uploader/proxy$': '<rootDir>/packages/proxy/src',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Coverage configuration
  collectCoverage: false, // Enable with --coverage flag
  collectCoverageFrom: [
    'packages/**/*.ts',
    'apps/**/*.ts',
    'shared/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/__tests__/**',
    '!**/*.test.ts',
    '!**/*.spec.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Setup and teardown
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true
    }]
  },
  
  // File extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Test environment configuration
  testTimeout: 30000,
  verbose: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Performance optimization
  maxConcurrency: 5,
  maxWorkers: '50%',
  
  // Mock configuration
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Globals
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};