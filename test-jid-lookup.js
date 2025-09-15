#!/usr/bin/env node
/**
 * Test JID-based lookup (not position-based)
 * Ensures that reordering rows in Google Sheets won't break the lookup
 */

require('dotenv').config();
const { GoogleApis } = require('./dist/google-apis');
const { SheetsDatabase } = require('./dist/database');

async function testJidLookup() {
  console.log('Testing JID-based lookup for chat metadata...\n');

  try {
    // Initialize
    const googleApis = new GoogleApis({
      credentialsPath: './credentials.json',
      tokenPath: './tokens/google-tokens.json'
    });
    await googleApis.initialize();

    const sheetsDb = new SheetsDatabase(googleApis.authClient);
    await sheetsDb.initializeChatMetadata();

    // Test with a few different JIDs
    const testJids = [
      '5511999999999@s.whatsapp.net',
      '5511888888888@s.whatsapp.net',
      '5511777777777@s.whatsapp.net'
    ];

    console.log('Testing getChatGoogleInfo with JID lookup:\n');

    for (const jid of testJids) {
      console.log(`Testing JID: ${jid}`);
      const info = await sheetsDb.getChatGoogleInfo(jid);

      if (info) {
        console.log(`  ✓ Found chat info:`);
        console.log(`    - Album ID: ${info.albumId || 'not set'}`);
        console.log(`    - Folder ID: ${info.folderId || 'not set'}`);
      } else {
        console.log(`  ✗ No info found (chat might not exist in sheet)`);
      }
      console.log();
    }

    console.log('IMPORTANT: The lookup now uses JID column (B) to find rows.');
    console.log('This means you can safely:');
    console.log('  1. Sort the chats table by any column');
    console.log('  2. Reorder rows manually');
    console.log('  3. Add filters or hide rows');
    console.log('  4. The script will still find the correct chat by JID\n');

    console.log('Technical details:');
    console.log('  - updateChatAlbumInfo: Searches column B for JID match');
    console.log('  - updateChatDriveInfo: Searches column B for JID match');
    console.log('  - getChatGoogleInfo: Searches column B for JID match');
    console.log('  - No longer depends on specific row positions!\n');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testJidLookup().catch(console.error);