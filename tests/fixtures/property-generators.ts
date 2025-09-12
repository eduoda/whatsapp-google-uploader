/**
 * Property-based testing generators using fast-check
 * AIDEV-NOTE: property-generators; generators for edge case testing and invariant validation
 */

import * as fc from 'fast-check';

// File metadata generators
export const fileMetadataArbitrary = fc.record({
  path: fc.string({ minLength: 1, maxLength: 260 }), // Max path length
  name: fc.string({ minLength: 1, maxLength: 255 }).filter(name => !name.includes('/')),
  size: fc.integer({ min: 0, max: 5 * 1024 * 1024 * 1024 }), // Up to 5GB
  type: fc.constantFrom('photo', 'video', 'document', 'audio'),
  mimeType: fc.oneof(
    fc.constantFrom(
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
      'application/pdf', 'application/msword', 'text/plain',
      'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/aac'
    )
  ),
  hash: fc.string({ minLength: 64, maxLength: 64 }).filter(s => /^[a-f0-9]+$/.test(s)),
  timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  chat: fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    type: fc.constantFrom('individual', 'group')
  })
});

// Upload options generators
export const uploadOptionsArbitrary = fc.record({
  chatId: fc.string({ minLength: 1, maxLength: 50 }),
  batchSize: fc.option(fc.integer({ min: 1, max: 100 })),
  concurrent: fc.option(fc.integer({ min: 1, max: 10 })),
  dryRun: fc.option(fc.boolean()),
  fullSync: fc.option(fc.boolean()),
  noResume: fc.option(fc.boolean()),
  dateRange: fc.option(fc.record({
    from: fc.option(fc.date()),
    to: fc.option(fc.date())
  })),
  typeFilters: fc.option(fc.array(fc.constantFrom('photos', 'videos', 'documents', 'audio'))),
  excludeTypes: fc.option(fc.array(fc.constantFrom('photos', 'videos', 'documents', 'audio')))
});

// Progress state generators
export const progressStateArbitrary = fc.record({
  chatId: fc.string({ minLength: 1, maxLength: 50 }),
  chatName: fc.string({ minLength: 1, maxLength: 100 }),
  sessionId: fc.string({ minLength: 1, maxLength: 50 }),
  startTime: fc.date(),
  lastUpdate: fc.date(),
  totalFiles: fc.integer({ min: 0, max: 10000 }),
  processedFiles: fc.integer({ min: 0, max: 10000 }),
  successCount: fc.integer({ min: 0, max: 10000 }),
  errorCount: fc.integer({ min: 0, max: 1000 }),
  duplicateCount: fc.integer({ min: 0, max: 1000 }),
  currentBatch: fc.integer({ min: 0, max: 100 }),
  totalBatches: fc.integer({ min: 0, max: 100 }),
  status: fc.constantFrom('running', 'completed', 'interrupted', 'error'),
  lastProcessedFile: fc.option(fc.string()),
  errors: fc.array(fc.record({
    file: fc.string(),
    error: fc.string(),
    timestamp: fc.date(),
    retryCount: fc.integer({ min: 0, max: 5 })
  }))
});

// OAuth token generators
export const oauthTokenArbitrary = fc.record({
  access_token: fc.string({ minLength: 20, maxLength: 200 }),
  refresh_token: fc.option(fc.string({ minLength: 20, maxLength: 200 })),
  token_type: fc.constantFrom('Bearer', 'bearer'),
  expires_in: fc.integer({ min: 300, max: 7200 }), // 5 minutes to 2 hours
  scope: fc.string(),
  expiry_date: fc.integer({ min: Date.now(), max: Date.now() + 7200000 })
});

// File path generators for cross-platform testing
export const windowsPathArbitrary = fc.string()
  .filter(s => s.length > 0 && s.length < 260)
  .map(s => `C:\\Users\\User\\${s.replace(/[<>:"|?*]/g, '_')}`);

export const unixPathArbitrary = fc.string()
  .filter(s => s.length > 0 && s.length < 260)
  .map(s => `/home/user/${s.replace(/\0/g, '')}`);

export const androidPathArbitrary = fc.string()
  .filter(s => s.length > 0 && s.length < 260)
  .map(s => `/storage/emulated/0/WhatsApp/Media/${s.replace(/[<>:"|?*\0]/g, '_')}`);

// Network error generators
export const networkErrorArbitrary = fc.record({
  code: fc.constantFrom('ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET'),
  message: fc.string(),
  statusCode: fc.option(fc.integer({ min: 400, max: 599 }))
});

// Google API error generators
export const googleApiErrorArbitrary = fc.record({
  code: fc.constantFrom(400, 401, 403, 404, 429, 500, 502, 503, 504),
  message: fc.string(),
  details: fc.option(fc.array(fc.record({
    '@type': fc.string(),
    reason: fc.string(),
    domain: fc.string()
  })))
});

// Rate limit configuration generators
export const rateLimitConfigArbitrary = fc.record({
  requestsPerMinute: fc.integer({ min: 1, max: 1000 }),
  burstLimit: fc.integer({ min: 1, max: 100 }),
  backoffMultiplier: fc.float({ min: Math.fround(1.0), max: Math.fround(5.0) }),
  maxRetries: fc.integer({ min: 0, max: 10 }),
  baseDelayMs: fc.integer({ min: 100, max: 5000 })
});

// File size generators for memory testing
export const smallFileArbitrary = fc.integer({ min: 1, max: 1024 * 1024 }); // Up to 1MB
export const mediumFileArbitrary = fc.integer({ min: 1024 * 1024, max: 100 * 1024 * 1024 }); // 1MB to 100MB
export const largeFileArbitrary = fc.integer({ min: 100 * 1024 * 1024, max: 2 * 1024 * 1024 * 1024 }); // 100MB to 2GB

// Hash generators for deduplication testing
export const sha256HashArbitrary = fc.string({ minLength: 64, maxLength: 64 })
  .filter(s => /^[a-f0-9]{64}$/.test(s));

// Chat structure generators for WhatsApp scanning
export const whatsappChatArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  type: fc.constantFrom('individual', 'group'),
  participantCount: fc.integer({ min: 1, max: 256 }),
  lastActivity: fc.date(),
  mediaCount: fc.record({
    photos: fc.integer({ min: 0, max: 10000 }),
    videos: fc.integer({ min: 0, max: 1000 }),
    documents: fc.integer({ min: 0, max: 1000 }),
    audio: fc.integer({ min: 0, max: 5000 })
  })
});

// Database query generators
export const sqlQueryArbitrary = fc.oneof(
  fc.string().map(s => `SELECT * FROM table WHERE id = '${s}'`),
  fc.string().map(s => `INSERT INTO table (name) VALUES ('${s}')`),
  fc.string().map(s => `UPDATE table SET name = '${s}' WHERE id = 1`),
  fc.constant('DELETE FROM table WHERE id = 1')
);

// Concurrent operation generators
export const concurrentOperationArbitrary = fc.record({
  operationId: fc.string(),
  type: fc.constantFrom('upload', 'scan', 'dedupe', 'retry'),
  priority: fc.integer({ min: 1, max: 10 }),
  startTime: fc.date(),
  dependencies: fc.array(fc.string(), { maxLength: 5 })
});

// Property testing utilities
export class PropertyTestUtils {
  /**
   * Test that a function is idempotent
   */
  static testIdempotent<T>(fn: (input: T) => T, arbitrary: fc.Arbitrary<T>): void {
    fc.assert(fc.property(arbitrary, (input) => {
      const result1 = fn(input);
      const result2 = fn(result1);
      expect(result1).toEqual(result2);
    }));
  }

  /**
   * Test round-trip property (serialize -> deserialize = identity)
   */
  static testRoundTrip<T>(
    serialize: (input: T) => string,
    deserialize: (input: string) => T,
    arbitrary: fc.Arbitrary<T>
  ): void {
    fc.assert(fc.property(arbitrary, (input) => {
      const serialized = serialize(input);
      const deserialized = deserialize(serialized);
      expect(deserialized).toEqual(input);
    }));
  }

  /**
   * Test that a function preserves certain invariants
   */
  static testInvariant<T>(
    fn: (input: T) => T,
    invariant: (input: T) => boolean,
    arbitrary: fc.Arbitrary<T>
  ): void {
    fc.assert(fc.property(arbitrary, (input) => {
      fc.pre(invariant(input)); // Precondition
      const result = fn(input);
      expect(invariant(result)).toBe(true); // Postcondition
    }));
  }

  /**
   * Test monotonicity (if input1 <= input2, then f(input1) <= f(input2))
   */
  static testMonotonicity<T>(
    fn: (input: T) => number,
    compare: (a: T, b: T) => number,
    arbitrary: fc.Arbitrary<T>
  ): void {
    fc.assert(fc.property(arbitrary, arbitrary, (input1, input2) => {
      if (compare(input1, input2) <= 0) {
        expect(fn(input1)).toBeLessThanOrEqual(fn(input2));
      }
    }));
  }
}

// Export commonly used combinations
export const fileUploadScenarioArbitrary = fc.record({
  files: fc.array(fileMetadataArbitrary, { minLength: 1, maxLength: 100 }),
  options: uploadOptionsArbitrary,
  expectedErrors: fc.array(googleApiErrorArbitrary, { maxLength: 10 }),
  networkConditions: fc.record({
    latency: fc.integer({ min: 0, max: 5000 }),
    packetLoss: fc.float({ min: 0, max: Math.fround(0.1) }),
    bandwidth: fc.integer({ min: 1000, max: 1000000 })
  })
});

export const deduplicationScenarioArbitrary = fc.record({
  existingHashes: fc.array(sha256HashArbitrary, { maxLength: 1000 }),
  newFiles: fc.array(fileMetadataArbitrary, { minLength: 1, maxLength: 100 }),
  expectedDuplicates: fc.integer({ min: 0, max: 50 })
});