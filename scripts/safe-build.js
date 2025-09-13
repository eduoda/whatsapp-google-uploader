#!/usr/bin/env node

/**
 * Safe build script that checks for TypeScript before building
 * Used in postinstall to avoid failures on Termux
 */

const { execSync } = require('child_process');

try {
  // Check if tsc is available
  execSync('which tsc', { stdio: 'ignore' });
  
  console.log('✅ TypeScript found, building packages...');
  
  // If tsc exists, run the build
  execSync('npm run build:packages', { stdio: 'inherit' });
  
} catch (error) {
  console.log('ℹ️  TypeScript not found, skipping build.');
  console.log('💡 For production use: npm install --production');
  console.log('💡 For development: install TypeScript first');
  
  // Exit successfully - this is not an error for production installs
  process.exit(0);
}