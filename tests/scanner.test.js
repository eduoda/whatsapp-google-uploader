/**
 * Simple Scanner Tests - KISS principle
 */

const { WhatsAppScanner } = require('../dist/scanner');

describe('WhatsAppScanner', () => {
  describe('detectWhatsAppPath', () => {
    it('should return string or null', async () => {
      const path = await WhatsAppScanner.detectWhatsAppPath();
      expect(path === null || typeof path === 'string').toBe(true);
    });
  });

  describe('constructor', () => {
    it('should create scanner instance', () => {
      const scanner = new WhatsAppScanner();
      expect(scanner).toBeDefined();
      expect(scanner).toBeInstanceOf(WhatsAppScanner);
    });

    it('should accept config', () => {
      const scanner = new WhatsAppScanner({
        whatsappPath: '/test/path',
        maxFileSize: 1000000
      });
      expect(scanner).toBeDefined();
    });
  });

  describe('validateAccess', () => {
    it('should return boolean', async () => {
      const scanner = new WhatsAppScanner();
      const result = await scanner.validateAccess();
      expect(typeof result).toBe('boolean');
    });
  });
});