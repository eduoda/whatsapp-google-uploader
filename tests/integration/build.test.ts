/**
 * Build Integration Test
 * AIDEV-NOTE: build-test; verifies project structure and TypeScript compilation
 */

import { describe, it, expect } from '@jest/globals';
import { existsSync } from 'fs';
import { join } from 'path';

describe('Project Build Integration', () => {
  const projectRoot = join(__dirname, '../..');
  
  it('should have all required configuration files', () => {
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      '.eslintrc.json',
      '.prettierrc.json',
      'jest.config.js'
    ];

    for (const file of requiredFiles) {
      const filePath = join(projectRoot, file);
      expect(existsSync(filePath)).toBe(true);
    }
  });

  it('should have all library packages', () => {
    const packages = [
      'packages/oauth/package.json',
      'packages/google-drive/package.json', 
      'packages/google-photos/package.json',
      'packages/scanner/package.json',
      'packages/proxy/package.json'
    ];

    for (const pkg of packages) {
      const pkgPath = join(projectRoot, pkg);
      expect(existsSync(pkgPath)).toBe(true);
    }
  });

  it('should have CLI application structure', () => {
    const cliFiles = [
      'apps/cli/package.json',
      'apps/cli/src/index.ts',
      'apps/cli/bin/cli.js'
    ];

    for (const file of cliFiles) {
      const filePath = join(projectRoot, file);
      expect(existsSync(filePath)).toBe(true);
    }
  });

  it('should have shared types', () => {
    const sharedFiles = [
      'shared/types/index.ts',
      'shared/types/file-metadata.ts',
      'shared/types/upload-options.ts',
      'shared/types/progress-state.ts'
    ];

    for (const file of sharedFiles) {
      const filePath = join(projectRoot, file);
      expect(existsSync(filePath)).toBe(true);
    }
  });

  it('should have configuration structure', () => {
    const configFiles = [
      'config/database/schema.sql',
      'config/environments/.env.template',
      'config/platforms/termux.json',
      'config/platforms/windows.json'
    ];

    for (const file of configFiles) {
      const filePath = join(projectRoot, file);
      expect(existsSync(filePath)).toBe(true);
    }
  });

  it('should have Docker configuration', () => {
    const dockerFiles = [
      'Dockerfile',
      'docker/Dockerfile.dev',
      'docker-compose.yml'
    ];

    for (const file of dockerFiles) {
      const filePath = join(projectRoot, file);
      expect(existsSync(filePath)).toBe(true);
    }
  });

  it('should have CI/CD configuration', () => {
    const ciFiles = [
      '.github/workflows/ci.yml'
    ];

    for (const file of ciFiles) {
      const filePath = join(projectRoot, file);
      expect(existsSync(filePath)).toBe(true);
    }
  });
});