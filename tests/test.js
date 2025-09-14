#!/usr/bin/env node
/**
 * WhatsApp Google Uploader - Real Functional Test
 * KISS: Test real functions, no duplications
 * YAGNI: Only needed parameters
 * DRY: No code repetition
 */

const fs = require('fs');
const path = require('path');

// Parse arguments - KISS: only what we need
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const shouldCleanup = args.includes('--cleanup');
const whatsappPath = args.find(arg => !arg.startsWith('--')) ||
                      './tests/mock-whatsapp/Android/media/com.whatsapp/WhatsApp';

// Test the REAL production modules
async function test() {
  console.log('=== WhatsApp Google Uploader Test ===\n');
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`WhatsApp path: ${whatsappPath}`);
  if (shouldCleanup) console.log('Cleanup: ENABLED');
  console.log();

  const uploadedFiles = [];

  try {
    // Test 1: Scanner - the REAL scanner used in production
    const { Scanner } = require('../dist/scanner');
    const scanner = new Scanner({ whatsappPath });

    const files = await scanner.scan();
    console.log(`Scanner: Found ${files.length} files`);

    // Test 2: Google APIs - the REAL APIs used in production
    const { GoogleApis } = require('../dist/google-apis');
    const googleApis = new GoogleApis({
      credentialsPath: './credentials.json',
      tokenPath: './tokens/google-tokens.json'
    });

    await googleApis.initialize();
    console.log('Google APIs: Initialized');

    // Debug: check if drive is initialized
    if (!isDryRun) {
      console.log('Drive client exists:', !!googleApis.drive);
    }

    // Test 3: Drive folder and uploads (only if not dry-run and authenticated)
    if (!isDryRun) {
      const isAuth = googleApis.isAuthenticated();
      console.log(`Authentication: ${isAuth ? 'YES' : 'NO'}`);

      if (!isAuth) {
        console.log('Please authenticate first: node dist/cli/index.js auth');
      } else if (files.length > 0) {
      try {
        // Create test folder in Drive
        const folderName = `WhatsApp Test ${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;
        const folderId = await googleApis.createFolder(folderName);
        console.log(`\nDrive folder created: ${folderName}`);

      // Upload documents to folder
      const documents = files.filter(f => f.type === 'document').slice(0, 3);

      for (const doc of documents) {
        console.log(`Uploading to Drive: ${doc.name}`);
        const result = await googleApis.uploadToDrive(doc.path, { parentId: folderId });
        uploadedFiles.push({ id: result.id, name: result.name, type: 'drive' });
      }
      console.log(`Added ${documents.length} documents to Drive folder`);

      // Test 4: Photos album creation
      const albumTitle = `WhatsApp Test ${new Date().toISOString().slice(0, 10)}`;
      const albumId = await googleApis.createAlbum(albumTitle);
      console.log(`\nPhotos album created: ${albumTitle}`);

      // Upload photos to album
      const photos = files.filter(f => f.type === 'photo').slice(0, 3);
      const mediaIds = [];

      for (const photo of photos) {
        console.log(`Uploading to Photos: ${photo.name}`);
        const result = await googleApis.uploadToPhotos(photo.path);
        mediaIds.push(result.id);
      }

      // Add photos to album
      await googleApis.addToAlbum(albumId, mediaIds);
      console.log(`Added ${mediaIds.length} photos to album`);

      // Cleanup if requested
      if (shouldCleanup && uploadedFiles.length > 0) {
        console.log('\nCleaning up Drive files...');
        for (const file of uploadedFiles.filter(f => f.type === 'drive')) {
          await googleApis.deleteFromDrive(file.id);
          console.log(`Deleted: ${file.name}`);
        }
        console.log('Note: Photos cannot be deleted via API');
      }
      } catch (error) {
        console.error(`Upload error: ${error.message}`);
        throw error;
      }
      }
    }

    // Test 5: CLI scan command - Test the actual CLI integration
    console.log('\nTesting CLI scan command...');
    const { spawn } = require('child_process');

    const cliScanTest = () => {
      return new Promise((resolve, reject) => {
        const child = spawn('node', ['dist/cli.js', 'scan', whatsappPath], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let error = '';

        child.stdout.on('data', (data) => {
          output += data.toString();
        });

        child.stderr.on('data', (data) => {
          error += data.toString();
        });

        child.on('close', (code) => {
          if (code === 0 && output.includes('WhatsApp Media Files:') && output.includes('Total:')) {
            console.log('CLI scan command: PASSED');
            resolve();
          } else {
            console.log(`CLI scan command: FAILED (exit code: ${code})`);
            console.log('Output:', output);
            console.log('Error:', error);
            reject(new Error(`CLI scan command failed with exit code: ${code}`));
          }
        });

        child.on('error', reject);
      });
    };

    await cliScanTest();

    console.log('\n✓ All tests passed (including CLI scan command)');
    return 0;

  } catch (error) {
    console.error(`\n✗ Test failed: ${error.message}`);
    return 1;
  }
}

// Run test
test().then(process.exit);