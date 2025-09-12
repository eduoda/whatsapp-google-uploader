#!/usr/bin/env node

/**
 * CLI Binary Entry Point
 * AIDEV-NOTE: cli-binary; executable entry point for CLI
 */

const path = require('path');

// Handle production vs development paths
const isProduction = !__filename.includes('src');
const distPath = isProduction ? '../dist/cli-application.js' : '../src/cli-application.ts';

// Load and run the CLI application
if (isProduction) {
  require(path.join(__dirname, distPath));
} else {
  // Development mode with ts-node
  require('ts-node/register');
  require(path.join(__dirname, distPath));
}