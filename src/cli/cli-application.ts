/**
 * CLI Application - Main CLI application entry point
 * AIDEV-NOTE: cli-main-app; main CLI application coordinator
 * AIDEV-TODO: implement-cli-app; complete CLI application implementation
 */

import { Command } from 'commander';
import { config, envFileExists, createEnvFile } from '../config';

export class CLIApplication {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.checkEnvironment();
    this.setupProgram();
  }
  
  private checkEnvironment(): void {
    // Check if .env file exists, create from template if not
    if (!envFileExists()) {
      console.log('No .env file found. Creating from template...');
      createEnvFile();
      console.log('Please edit .env file with your configuration values.');
    }
    
    // Log current environment (only in development)
    if (config.nodeEnv === 'development') {
      console.log('Running in development mode with log level:', config.logLevel);
    }
  }

  private setupProgram(): void {
    this.program
      .name('whatsapp-uploader')
      .description('WhatsApp Google Uploader - Upload WhatsApp media to Google services')
      .version('1.0.0');

    // AIDEV-TODO: implement CLI commands
    this.program
      .command('setup')
      .description('Initial system configuration')
      .action(() => {
        console.log('Setup command not yet implemented');
      });

    this.program
      .command('check')
      .description('Verify system configuration')
      .action(() => {
        console.log('Check command not yet implemented');
      });
  }

  run(): void {
    this.program.parse();
  }
}

// CLI entry point
if (require.main === module) {
  const cli = new CLIApplication();
  cli.run();
}