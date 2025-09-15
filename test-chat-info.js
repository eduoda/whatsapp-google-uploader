require('dotenv').config();
const { GoogleApis } = require('./dist/google-apis');
const { SheetsDatabase } = require('./dist/database');

async function testChatInfo() {
  console.log('Testing chat info storage and retrieval...\n');

  // Initialize
  const googleApis = new GoogleApis({
    credentialsPath: './credentials.json',
    tokenPath: './tokens/google-tokens.json'
  });
  await googleApis.initialize();

  const sheetsDb = new SheetsDatabase(googleApis.authClient);
  await sheetsDb.initializeChatMetadata();

  // Test a specific chat JID
  const testJid = '5511999999999@s.whatsapp.net';

  console.log('1. Testing getChatGoogleInfo:');
  const info = await sheetsDb.getChatGoogleInfo(testJid);
  if (info) {
    console.log(`   Found info for ${testJid}:`);
    console.log(`   - Album ID: ${info.albumId || 'not set'}`);
    console.log(`   - Folder ID: ${info.folderId || 'not set'}`);
  } else {
    console.log(`   No info found for ${testJid}`);
  }

  console.log('\n2. Testing updateChatAlbumInfo:');
  const testAlbumId = 'test-album-123';
  const testAlbumName = 'Test Album';

  // Note: This will only work if the chat exists in the spreadsheet
  // You can manually add a test chat or use a real JID from your data

  console.log('   To test saving, run an actual upload command');
  console.log('   The album/folder IDs will be saved automatically');
}

testChatInfo().catch(console.error);