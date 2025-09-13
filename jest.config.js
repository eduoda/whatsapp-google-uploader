/**
 * Minimal Jest configuration - KISS principle
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'dist/**/*.js',
    '!dist/**/*.d.ts',
    '!dist/cli.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  testTimeout: 10000,
  clearMocks: true
};