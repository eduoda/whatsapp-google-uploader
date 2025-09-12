#!/usr/bin/env node

/**
 * Setup Script - Initial system setup and configuration
 * AIDEV-NOTE: setup-script; handles initial system configuration
 */

const fs = require('fs');
const path = require('path');
const { prompts } = require('inquirer');
const chalk = require('chalk');

async function setupSystem() {
  console.log(chalk.blue.bold('🚀 WhatsApp Google Uploader Setup'));
  console.log(chalk.gray('This script will help you configure the uploader for first use.\n'));

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  
  if (majorVersion < 14) {
    console.log(chalk.red('❌ Node.js 14 or higher is required'));
    console.log(chalk.yellow(`Current version: ${nodeVersion}`));
    process.exit(1);
  }

  console.log(chalk.green(`✅ Node.js version: ${nodeVersion}`));

  // AIDEV-TODO: implement-setup-script; complete setup wizard
  console.log(chalk.yellow('\n⚠️  Setup script not yet implemented'));
  console.log(chalk.gray('This will be implemented in TASK-002 (OAuth Library Development)'));
  
  console.log(chalk.blue('\nFor now, please:'));
  console.log('1. Copy .env.template to .env');
  console.log('2. Configure your Google API credentials');
  console.log('3. Run authentication setup manually');
}

if (require.main === module) {
  setupSystem().catch(console.error);
}

module.exports = { setupSystem };