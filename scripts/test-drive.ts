#!/usr/bin/env node
/**
 * Google Drive Test Script - Test Drive API functionality
 * Usage: npm run test:drive
 */

import { DriveManager } from '../packages/google-drive/src/drive-manager';
import { OAuthManager } from '../packages/oauth/src/oauth-manager';
import { Readable } from 'stream';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testDrive() {
  console.log('\n📁 Google Drive API Test\n');
  console.log('=====================================\n');

  const config = {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: 'http://localhost:3000/callback',
    tokenStoragePath: path.join(__dirname, '..', '.tokens', 'oauth-tokens.json'),
    encryptionKey: process.env.TOKEN_ENCRYPTION_KEY || 'test-encryption-key-change-in-production-32chars'
  };

  try {
    // Create OAuth manager
    const oauthManager = new OAuthManager(config);
    
    // Check authentication
    const isAuthenticated = await oauthManager.hasValidTokensAsync();
    if (!isAuthenticated) {
      console.error('❌ Not authenticated! Please run: npm run test:oauth');
      process.exit(1);
    }

    console.log('✅ Authentication valid\n');

    // Get valid token
    const accessToken = await oauthManager.getValidToken();
    
    // Create mock auth client for Drive
    const auth = {
      getAccessToken: async () => ({ token: accessToken }),
      setCredentials: (tokens: any) => {},
      credentials: { access_token: accessToken }
    };

    // Create Drive manager
    const driveManager = new DriveManager({
      auth,
      maxRetries: 3,
      retryDelay: 1000,
      resumableThreshold: 5 * 1024 * 1024 // 5MB
    });

    console.log('📊 Testing Drive operations...\n');

    // Test 1: Get storage usage
    console.log('1. Getting storage usage...');
    try {
      const usage = await driveManager.getUsage();
      console.log('   ✅ Storage info:');
      console.log(`      Total: ${formatBytes(usage.totalSpace)}`);
      console.log(`      Used: ${formatBytes(usage.usedSpace)}`);
      console.log(`      Available: ${formatBytes(usage.availableSpace)}\n`);
    } catch (error: any) {
      console.log(`   ⚠️ Could not get storage info: ${error.message}\n`);
    }

    // Test 2: Create a test folder
    console.log('2. Creating test folder...');
    try {
      const folderId = await driveManager.createFolder('WhatsApp Backup Test');
      console.log(`   ✅ Folder created: ${folderId}\n`);

      // Test 3: Check if folder exists
      console.log('3. Checking folder existence...');
      const exists = await driveManager.checkExists('WhatsApp Backup Test');
      console.log(`   ✅ Folder exists: ${exists.exists}\n`);

      // Test 4: Upload a test file
      console.log('4. Uploading test file...');
      const testContent = 'Hello from WhatsApp Google Uploader!\nTest file content.';
      const stream = Readable.from([Buffer.from(testContent)]);
      
      const uploadResult = await driveManager.uploadFile(stream, {
        name: 'test-file.txt',
        mimeType: 'text/plain',
        parents: [folderId]
      });

      console.log('   ✅ File uploaded:');
      console.log(`      ID: ${uploadResult.id}`);
      console.log(`      Name: ${uploadResult.name}`);
      console.log(`      Size: ${uploadResult.size} bytes\n`);

      console.log('✨ All Drive tests completed successfully!');
      
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
    }

  } catch (error: any) {
    console.error('\n❌ Error during Drive test:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === Infinity) return 'Unlimited';
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run the test
testDrive().catch(console.error);