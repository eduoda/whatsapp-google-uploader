/**
 * Simple Config Tests - KISS principle
 */

const { config, envFileExists, getGoogleApisConfig } = require('../dist/config');

describe('Config', () => {
  describe('config object', () => {
    it('should have required properties', () => {
      expect(config).toBeDefined();
      expect(config.nodeEnv).toBeDefined();
      expect(config.logLevel).toBeDefined();
      expect(config.credentialsPath).toBeDefined();
      expect(config.tokenPath).toBeDefined();
    });

    it('should have default values', () => {
      expect(config.maxConcurrentUploads).toBeGreaterThan(0);
      expect(config.requestsPerSecond).toBeGreaterThan(0);
      expect(config.maxRetryAttempts).toBeGreaterThan(0);
    });
  });

  describe('envFileExists', () => {
    it('should return boolean', () => {
      const exists = envFileExists();
      expect(typeof exists).toBe('boolean');
    });
  });

  describe('getGoogleApisConfig', () => {
    it('should return config object', () => {
      const apiConfig = getGoogleApisConfig();
      expect(apiConfig).toBeDefined();
      expect(apiConfig.credentialsPath).toBeDefined();
      expect(apiConfig.tokenPath).toBeDefined();
      expect(Array.isArray(apiConfig.scopes)).toBe(true);
    });
  });
});