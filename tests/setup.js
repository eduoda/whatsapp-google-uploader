/**
 * Minimal test setup - KISS principle
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Suppress warnings
process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';