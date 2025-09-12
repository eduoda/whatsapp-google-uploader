#!/usr/bin/env node
/**
 * Google Photos Test Script - Test Photos API functionality
 * Usage: npm run test:photos
 */

import { PhotosManager } from '../packages/google-photos/src/photos-manager';
import { OAuthManager } from '../packages/oauth/src/oauth-manager';
import { Readable } from 'stream';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testPhotos() {
  console.log('\n📸 Google Photos API Test\n');
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
    
    // Create a proper OAuth2 client for googleapis
    const { google } = require('googleapis');
    const OAuth2 = google.auth.OAuth2;
    const oauth2Client = new OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
    
    // Set the access token
    oauth2Client.setCredentials({
      access_token: accessToken
    });

    // Create Photos manager
    const photosManager = new PhotosManager({
      auth: oauth2Client,
      maxRetries: 3,
      batchSize: 50
    });

    console.log('📊 Testing Photos operations...\n');

    // Test 1: Create an album
    console.log('1. Creating test album...');
    try {
      const albumId = await photosManager.createAlbum('WhatsApp Backup Test');
      console.log(`   ✅ Album created: ${albumId}\n`);

      // Test 2: List albums
      console.log('2. Listing albums...');
      const albums = await photosManager.listAlbums(5);
      console.log(`   ✅ Found ${albums.length} album(s)`);
      albums.forEach((album: any) => {
        console.log(`      - ${album.title} (${album.mediaItemsCount || 0} items)`);
      });
      console.log();

      // Test 3: Upload a test photo
      console.log('3. Uploading test photo...');
      
      // Create a simple test image (1x1 red pixel PNG)
      const pngHeader = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // bit depth, color type, etc
        0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
        0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00, 0x00, 
        0x00, 0x03, 0x00, 0x01, 0x8D, 0xD6, 0x10, 0x3A,
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
        0xAE, 0x42, 0x60, 0x82
      ]);
      
      const stream = Readable.from([pngHeader]);
      
      const uploadResult = await photosManager.uploadMedia(stream, {
        filename: 'test-photo.png',
        mimeType: 'image/png',
        description: 'Test photo from WhatsApp Google Uploader'
      });

      if (uploadResult.success) {
        console.log('   ✅ Photo uploaded:');
        console.log(`      ID: ${uploadResult.mediaItem?.id}`);
        console.log(`      Filename: ${uploadResult.mediaItem?.filename}\n`);

        // Test 4: Add to album
        console.log('4. Adding photo to album...');
        const addResult = await photosManager.addToAlbum(albumId, [uploadResult.mediaItem!.id]);
        console.log(`   ✅ Added to album successfully\n`);
      } else {
        console.log(`   ⚠️ Upload failed: ${uploadResult.error}\n`);
      }

      console.log('✨ All Photos tests completed!');
      
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      
      // Check if it's a scope issue
      if (error.message?.includes('Request had insufficient authentication scopes')) {
        console.error('\n💡 Tip: You need to re-authenticate with Photos scope:');
        console.error('   1. Delete .tokens/oauth-tokens.json');
        console.error('   2. Run: npm run test:oauth');
        console.error('   3. Make sure to grant Photos Library access');
      }
    }

  } catch (error: any) {
    console.error('\n❌ Error during Photos test:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

// Run the test
testPhotos().catch(console.error);