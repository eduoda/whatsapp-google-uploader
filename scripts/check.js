#!/usr/bin/env node

/**
 * System Check Script - Verify system configuration and dependencies
 * AIDEV-NOTE: check-script; system validation and health check
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

async function checkSystem() {
  console.log(chalk.blue.bold('🔍 WhatsApp Google Uploader System Check'));
  console.log(chalk.gray('Verifying system configuration and dependencies.\n'));

  let allGood = true;

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  
  if (majorVersion >= 14) {
    console.log(chalk.green(`✅ Node.js version: ${nodeVersion}`));
  } else {
    console.log(chalk.red(`❌ Node.js version: ${nodeVersion} (requires 14+)`));
    allGood = false;
  }

  // Check if packages are built
  const distPaths = [
    'packages/oauth/dist',
    'packages/google-drive/dist',
    'packages/google-photos/dist',
    'packages/scanner/dist',
    'packages/proxy/dist',
    'apps/cli/dist'
  ];

  let builtPackages = 0;
  for (const distPath of distPaths) {
    if (fs.existsSync(path.join(process.cwd(), distPath))) {
      builtPackages++;
    }
  }

  if (builtPackages === distPaths.length) {
    console.log(chalk.green('✅ All packages built'));
  } else {
    console.log(chalk.yellow(`⚠️  ${builtPackages}/${distPaths.length} packages built`));
    console.log(chalk.gray('   Run "npm run build" to build all packages'));
  }

  // AIDEV-TODO: implement-check-script; complete system validation
  console.log(chalk.yellow('\n⚠️  Full system check not yet implemented'));
  console.log(chalk.gray('This will be implemented as libraries are developed'));

  if (allGood) {
    console.log(chalk.green.bold('\n🎉 Basic system check passed!'));
  } else {
    console.log(chalk.red.bold('\n❌ System check failed - please fix issues above'));
    process.exit(1);
  }
}

if (require.main === module) {
  checkSystem().catch(console.error);
}

module.exports = { checkSystem };