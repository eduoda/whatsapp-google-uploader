#!/usr/bin/env node
/**
 * WhatsApp Google Uploader - CLI Entry Point
 * 
 * AIDEV-NOTE: cli-entry-point; main CLI application entry
 */

import { CLIApplication } from './cli/cli-application';

async function main() {
  const cli = new CLIApplication();
  cli.run();
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

main().catch((error) => {
  console.error('CLI Error:', error);
  process.exit(1);
});