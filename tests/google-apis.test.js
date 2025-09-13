/**
 * Simple Google APIs Tests - KISS principle
 */

const { GoogleApis } = require('../dist/google-apis');

describe('GoogleApis', () => {
  describe('constructor', () => {
    it('should create instance', () => {
      const apis = new GoogleApis({
        credentialsPath: './credentials.json',
        tokenPath: './tokens/token.json'
      });
      expect(apis).toBeDefined();
      expect(apis).toBeInstanceOf(GoogleApis);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when not authenticated', () => {
      const apis = new GoogleApis({
        credentialsPath: './credentials.json',
        tokenPath: './tokens/token.json'
      });
      expect(apis.isAuthenticated()).toBe(false);
    });
  });

  describe('getAuthUrl', () => {
    it('should return auth URL', () => {
      const apis = new GoogleApis({
        credentialsPath: './credentials.json',
        tokenPath: './tokens/token.json'
      });
      const url = apis.getAuthUrl();
      expect(typeof url).toBe('string');
      expect(url).toContain('https://');
    });
  });
});