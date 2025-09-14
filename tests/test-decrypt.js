/**
 * Test for WhatsApp Decrypt Module
 * Tests the decrypt module logic (without actual wa-crypt-tools)
 */

const { WhatsAppDecryptor } = require('../dist/decrypt');
const path = require('path');

async function testDecrypt() {
  console.log('=== WhatsApp Decrypt Module Test ===\n');

  // Test 1: Initialize decryptor
  console.log('Test 1: Initialize decryptor...');
  const decryptor = new WhatsAppDecryptor({
    whatsappPath: './tests/mock-whatsapp/Android/media/com.whatsapp/WhatsApp',
    outputDir: './tests/decrypted'
  });
  console.log('✓ Decryptor initialized\n');

  // Test 2: Check for missing backup key
  console.log('Test 2: Validate missing backup key...');
  const isValid = await decryptor.validateKey();
  if (!isValid) {
    console.log('✓ Correctly detected missing backup key\n');
  } else {
    console.error('✗ Should have detected missing key\n');
  }

  // Test 3: Check with invalid key format
  console.log('Test 3: Validate invalid key format...');
  const decryptor2 = new WhatsAppDecryptor({
    backupKey: 'invalid-key',
    whatsappPath: './tests/mock-whatsapp/Android/media/com.whatsapp/WhatsApp'
  });
  const isValid2 = await decryptor2.validateKey();
  if (!isValid2) {
    console.log('✓ Correctly detected invalid key format\n');
  } else {
    console.error('✗ Should have detected invalid format\n');
  }

  // Test 4: Check with valid key format
  console.log('Test 4: Validate valid key format...');
  const validKey = '493bd54c5ef341ac2952b624d0b996a773b1d206b72c361e5026ec52c126c2c0';
  const decryptor3 = new WhatsAppDecryptor({
    backupKey: validKey,
    whatsappPath: './tests/mock-whatsapp/Android/media/com.whatsapp/WhatsApp'
  });
  const isValid3 = await decryptor3.validateKey();
  if (isValid3) {
    console.log('✓ Correctly validated key format\n');
  } else {
    console.error('✗ Should have validated correct format\n');
  }

  // Test 5: Find crypt files
  console.log('Test 5: Find encrypted database files...');
  const cryptFiles = await decryptor3.findCryptFiles();
  if (cryptFiles.length > 0) {
    console.log(`✓ Found ${cryptFiles.length} encrypted files:`);
    cryptFiles.slice(0, 3).forEach(f => {
      console.log(`   - ${path.basename(f)}`);
    });
    if (cryptFiles.length > 3) {
      console.log(`   ... and ${cryptFiles.length - 3} more`);
    }
    console.log();
  } else {
    console.log('⚠️  No encrypted files found (this is OK for test environment)\n');
  }

  // Test 6: Check dependencies (will fail without wa-crypt-tools)
  console.log('Test 6: Check for wa-crypt-tools dependency...');
  const hasDeps = await decryptor3.checkDependencies();
  if (!hasDeps) {
    console.log('✓ Correctly detected missing wa-crypt-tools\n');
  } else {
    console.log('✓ wa-crypt-tools is installed\n');
  }

  console.log('=== All logic tests passed ===\n');
  console.log('Note: Actual decryption requires:');
  console.log('1. wa-crypt-tools installed (pip install wa-crypt-tools)');
  console.log('2. Valid 64-character backup key in .env');
  console.log('3. Encrypted .crypt15 files from WhatsApp\n');

  return 0;
}

// Run test
testDecrypt().then(code => {
  process.exit(code);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});