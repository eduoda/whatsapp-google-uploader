#!/usr/bin/env node

/**
 * Test Suite for WhatsApp Google Uploader Components
 * Tests OAuth, Google Drive, Google Photos, and Scanner
 */

const fs = require('fs');
const path = require('path');
const { GoogleApis } = require('./dist/google-apis/GoogleApis');
const { WhatsAppScanner } = require('./dist/scanner');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m'
};

// Test configuration
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');
const TEST_IMAGE = path.join(__dirname, 'test-files', 'test-image.jpg');
const TEST_DOCUMENT = path.join(__dirname, 'test-files', 'test-document.pdf');

// Common WhatsApp paths
const WHATSAPP_PATHS = [
  '/storage/emulated/0/Android/media/com.whatsapp/WhatsApp',
  '/sdcard/Android/media/com.whatsapp/WhatsApp',
  '/storage/emulated/0/WhatsApp',
  '/sdcard/WhatsApp'
];

async function testOAuth() {
  console.log(`\n${colors.blue}📱 Testing OAuth Authentication...${colors.reset}`);
  
  try {
    // Check if credentials exist
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.log(`${colors.red}❌ credentials.json not found!${colors.reset}`);
      console.log(`${colors.yellow}💡 Please download from Google Cloud Console:${colors.reset}`);
      console.log('   1. Go to https://console.cloud.google.com/');
      console.log('   2. Create/select project');
      console.log('   3. Enable Google Drive and Photos APIs');
      console.log('   4. Create OAuth 2.0 credentials');
      console.log('   5. Download as credentials.json');
      return false;
    }

    const googleApis = new GoogleApis(CREDENTIALS_PATH);
    await googleApis.authenticate();
    
    console.log(`${colors.green}✅ OAuth authentication successful!${colors.reset}`);
    
    // Check token
    if (fs.existsSync(TOKEN_PATH)) {
      console.log(`${colors.green}✅ Token saved at: ${TOKEN_PATH}${colors.reset}`);
    }
    
    return googleApis;
  } catch (error) {
    console.log(`${colors.red}❌ OAuth failed: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testGoogleDrive(googleApis) {
  console.log(`\n${colors.blue}📁 Testing Google Drive Upload...${colors.reset}`);
  
  try {
    // Create test file if needed
    const testFile = path.join(__dirname, 'test-drive.txt');
    if (!fs.existsSync(testFile)) {
      fs.writeFileSync(testFile, `Test upload at ${new Date().toISOString()}`);
    }

    // Upload to Drive
    const result = await googleApis.uploadToDrive(testFile, 'WhatsApp-Backup-Test');
    
    if (result && result.id) {
      console.log(`${colors.green}✅ Drive upload successful!${colors.reset}`);
      console.log(`   File ID: ${result.id}`);
      console.log(`   View at: https://drive.google.com/file/d/${result.id}/view`);
      return true;
    } else {
      console.log(`${colors.yellow}⚠️ Upload completed but no ID returned${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Drive upload failed: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testGooglePhotos(googleApis) {
  console.log(`\n${colors.blue}📷 Testing Google Photos Upload...${colors.reset}`);
  
  try {
    // Create test image if needed
    const testImage = path.join(__dirname, 'test-photo.jpg');
    if (!fs.existsSync(testImage)) {
      // Create a minimal JPEG (1x1 pixel)
      const minimalJpeg = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
        0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C,
        0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D,
        0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
        0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
        0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34,
        0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4,
        0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
        0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
        0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF,
        0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
        0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04,
        0x00, 0x00, 0x01, 0x7D, 0x01, 0x02, 0x03, 0x00,
        0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
        0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32,
        0x81, 0x91, 0xA1, 0x08, 0x23, 0x42, 0xB1, 0xC1,
        0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
        0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A,
        0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x34, 0x35,
        0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
        0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55,
        0x56, 0x57, 0x58, 0x59, 0x5A, 0x63, 0x64, 0x65,
        0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
        0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85,
        0x86, 0x87, 0x88, 0x89, 0x8A, 0x92, 0x93, 0x94,
        0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
        0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2,
        0xB3, 0xB4, 0xB5, 0xB6, 0xB7, 0xB8, 0xB9, 0xBA,
        0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
        0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8,
        0xD9, 0xDA, 0xE1, 0xE2, 0xE3, 0xE4, 0xE5, 0xE6,
        0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
        0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA,
        0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
        0xFB, 0xD0, 0xFF, 0xD9
      ]);
      fs.writeFileSync(testImage, minimalJpeg);
    }

    // Upload to Photos
    const result = await googleApis.uploadToPhotos(testImage, 'WhatsApp-Test');
    
    if (result && result.id) {
      console.log(`${colors.green}✅ Photos upload successful!${colors.reset}`);
      console.log(`   Media item ID: ${result.id}`);
      console.log(`   View at: https://photos.google.com`);
      return true;
    } else {
      console.log(`${colors.yellow}⚠️ Upload completed but no ID returned${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Photos upload failed: ${error.message}${colors.reset}`);
    if (error.message.includes('code 403')) {
      console.log(`${colors.yellow}💡 Enable Photos API at:${colors.reset}`);
      console.log('   https://console.cloud.google.com/apis/library/photoslibrary.googleapis.com');
    }
    return false;
  }
}

async function testScanner() {
  console.log(`\n${colors.blue}📂 Testing WhatsApp Scanner...${colors.reset}`);
  
  try {
    const scanner = new WhatsAppScanner();
    
    // Try to find WhatsApp directory
    let whatsappPath = null;
    for (const path of WHATSAPP_PATHS) {
      if (fs.existsSync(path)) {
        whatsappPath = path;
        break;
      }
    }

    // For testing on development machine
    if (!whatsappPath) {
      // Create a mock structure for testing
      const testDir = path.join(__dirname, 'test-whatsapp', 'Media', 'WhatsApp Images');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
        // Create test files
        fs.writeFileSync(path.join(testDir, 'IMG-20240101-WA0001.jpg'), 'test');
        fs.writeFileSync(path.join(testDir, 'IMG-20240101-WA0002.jpg'), 'test');
      }
      whatsappPath = path.join(__dirname, 'test-whatsapp');
    }

    console.log(`   Scanning: ${whatsappPath}`);
    
    const chats = await scanner.discoverChats(whatsappPath);
    console.log(`${colors.green}✅ Found ${chats.length} chats${colors.reset}`);
    
    if (chats.length > 0) {
      // Scan first chat
      const firstChat = chats[0];
      const files = await scanner.scanChat(firstChat);
      console.log(`   ${firstChat.name}: ${files.length} files`);
      
      // Show summary
      const summary = {
        images: files.filter(f => f.mimeType?.startsWith('image/')).length,
        videos: files.filter(f => f.mimeType?.startsWith('video/')).length,
        audio: files.filter(f => f.mimeType?.startsWith('audio/')).length,
        documents: files.filter(f => f.mimeType?.startsWith('application/')).length
      };
      
      console.log(`   📷 Images: ${summary.images}`);
      console.log(`   🎥 Videos: ${summary.videos}`);
      console.log(`   🎵 Audio: ${summary.audio}`);
      console.log(`   📄 Documents: ${summary.documents}`);
    }
    
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Scanner failed: ${error.message}${colors.reset}`);
    return false;
  }
}

async function main() {
  console.log(`${colors.blue}🚀 WhatsApp Google Uploader - Component Test Suite${colors.reset}`);
  console.log('=' .repeat(50));

  const results = {
    oauth: false,
    drive: false,
    photos: false,
    scanner: false
  };

  // Test OAuth first (required for Drive/Photos)
  const googleApis = await testOAuth();
  results.oauth = !!googleApis;

  if (googleApis) {
    // Test Google Drive
    results.drive = await testGoogleDrive(googleApis);
    
    // Test Google Photos
    results.photos = await testGooglePhotos(googleApis);
  }

  // Test Scanner (independent)
  results.scanner = await testScanner();

  // Summary
  console.log(`\n${colors.blue}📊 Test Summary${colors.reset}`);
  console.log('=' .repeat(50));
  console.log(`OAuth:   ${results.oauth ? colors.green + '✅ PASS' : colors.red + '❌ FAIL'}${colors.reset}`);
  console.log(`Drive:   ${results.drive ? colors.green + '✅ PASS' : colors.red + '❌ FAIL'}${colors.reset}`);
  console.log(`Photos:  ${results.photos ? colors.green + '✅ PASS' : colors.red + '❌ FAIL'}${colors.reset}`);
  console.log(`Scanner: ${results.scanner ? colors.green + '✅ PASS' : colors.red + '❌ FAIL'}${colors.reset}`);

  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log(`\n${colors.green}🎉 All tests passed! System ready for use.${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️ Some tests failed. Check the output above for details.${colors.reset}`);
  }
}

// Run tests
main().catch(console.error);