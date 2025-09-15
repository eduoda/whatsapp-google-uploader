require('dotenv').config();
const { GoogleApis } = require('./dist/google-apis');
const { SheetsDatabase } = require('./dist/database');

async function testLinks() {
  console.log('Testing album/folder link storage and retrieval...\n');

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

  console.log('Getting chat Google info:');
  const info = await sheetsDb.getChatGoogleInfo(testJid);
  if (info) {
    console.log(`Found info for ${testJid}:`);
    console.log(`- Album ID: ${info.albumId || 'not set'}`);
    console.log(`- Folder ID: ${info.folderId || 'not set'}`);

    // Check if links are stored correctly in the sheet
    if (info.albumId) {
      console.log(`- Album Link: https://photos.google.com/album/${info.albumId}`);
    }
    if (info.folderId) {
      console.log(`- Folder Link: https://drive.google.com/drive/folders/${info.folderId}`);
    }
  } else {
    console.log(`No info found for ${testJid}`);
  }

  console.log('\nNote: Album/folder links are now stored in the main chats table.');
  console.log('Individual file links are stored in the [chat-name]_[JID] sheets.');
}

testLinks().catch(console.error);