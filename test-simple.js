#!/usr/bin/env node

/**
 * Simple test for refactored components
 */

const { WhatsAppScanner } = require('./dist/scanner');
const { GoogleApis } = require('./dist/google-apis');

async function testScanner() {
  console.log('Testing WhatsApp Scanner...');
  
  const scanner = new WhatsAppScanner();
  
  // Test path detection
  const path = await WhatsAppScanner.detectWhatsAppPath();
  console.log('WhatsApp path detected:', path || 'Not found');
  
  // Test access validation
  const hasAccess = await scanner.validateAccess();
  console.log('Has access to WhatsApp directory:', hasAccess);
  
  if (hasAccess) {
    // Test file scanning
    console.log('Scanning for files...');
    const files = await scanner.findFiles();
    console.log(`Found ${files.length} files`);
    
    if (files.length > 0) {
      console.log('Sample file:', files[0]);
    }
  }
}

async function testGoogleApis() {
  console.log('\nTesting Google APIs...');
  
  const config = {
    credentialsPath: './credentials.json',
    tokenPath: './tokens/google-tokens.json'
  };
  
  const apis = new GoogleApis(config);
  
  try {
    await apis.initialize();
    console.log('Google APIs initialized');
    console.log('Authenticated:', apis.isAuthenticated());
  } catch (error) {
    console.log('Could not initialize (expected if no credentials):', error.message);
  }
}

async function main() {
  console.log('=== Simple Functionality Test ===\n');
  
  try {
    await testScanner();
    await testGoogleApis();
    console.log('\n✅ All tests completed');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();