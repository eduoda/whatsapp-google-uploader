#!/usr/bin/env node
/**
 * OAuth Test Script - Test Google OAuth authentication
 * Usage: npm run test:oauth
 */

import { OAuthManager } from '../packages/oauth/src/oauth-manager';
import * as readline from 'readline';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function testOAuth() {
  console.log('\n🔐 Google OAuth Authentication Test\n');
  console.log('=====================================\n');

  // Check for required environment variables
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error('❌ Missing required environment variables!');
    console.error('\nPlease create a .env file with:');
    console.error('GOOGLE_CLIENT_ID=your-client-id');
    console.error('GOOGLE_CLIENT_SECRET=your-client-secret');
    console.error('\nTo get these credentials:');
    console.error('1. Go to https://console.cloud.google.com/');
    console.error('2. Create a new project or select existing');
    console.error('3. Enable Google Drive API and Google Photos Library API');
    console.error('4. Create OAuth 2.0 credentials');
    console.error('5. Add http://localhost:3000/callback as redirect URI');
    process.exit(1);
  }

  const config = {
    clientId,
    clientSecret,
    redirectUri: 'http://localhost:3000/callback',
    tokenStoragePath: path.join(__dirname, '..', '.tokens', 'oauth-tokens.json'),
    encryptionKey: process.env.TOKEN_ENCRYPTION_KEY || 'test-encryption-key-change-in-production-32chars'
  };

  try {
    // Create OAuth manager
    const oauthManager = new OAuthManager(config);
    
    console.log('📋 Configuration:');
    console.log(`   Client ID: ${clientId.substring(0, 20)}...`);
    console.log(`   Redirect URI: ${config.redirectUri}`);
    console.log(`   Token Storage: ${config.tokenStoragePath}\n`);

    // Check if already authenticated
    const isAuthenticated = await oauthManager.hasValidTokensAsync();
    
    if (isAuthenticated) {
      console.log('✅ Already authenticated!');
      
      const tokenInfo = await oauthManager.getTokenInfo();
      if (tokenInfo) {
        console.log('\n📊 Token Information:');
        console.log(`   Has Access Token: ${tokenInfo.hasAccessToken}`);
        console.log(`   Has Refresh Token: ${tokenInfo.hasRefreshToken}`);
        console.log(`   Expired: ${tokenInfo.isExpired ? 'No' : 'Yes'}`);
        const expiresInMs = tokenInfo.expiryDate - Date.now();
        console.log(`   Expires In: ${Math.round(expiresInMs / 60000)} minutes`);
        console.log(`   Scopes: ${tokenInfo.scopes.length > 0 ? tokenInfo.scopes.join(', ') : 'None'}`);
      }

      const answer = await question('\n🔄 Do you want to re-authenticate? (y/n): ');
      if (answer.toLowerCase() !== 'y') {
        console.log('\n✨ OAuth test completed successfully!');
        rl.close();
        return;
      }
      
      // Revoke existing tokens
      console.log('\n🗑️  Revoking existing tokens...');
      await oauthManager.revokeAccess();
    }

    // Start authentication flow
    console.log('\n🚀 Starting OAuth authentication flow...\n');
    console.log('Instructions:');
    console.log('1. A URL will be displayed below');
    console.log('2. Open it in your browser');
    console.log('3. Log in with your Google account');
    console.log('4. Grant the requested permissions');
    console.log('5. Copy the authorization code from the redirect URL');
    console.log('6. Paste it here\n');

    // Authenticate
    const result = await oauthManager.authenticate();
    
    if (result.success) {
      console.log('\n✅ Authentication successful!');
      console.log('\n📊 Authentication Result:');
      console.log(`   Access Token: ${result.accessToken.substring(0, 20)}...`);
      console.log(`   Refresh Token: ${result.refreshToken ? 'Present' : 'Not provided'}`);
      console.log(`   Expires: ${new Date(result.expiryDate).toLocaleString()}`);
      console.log(`   Scopes: ${result.scopes.join(', ')}`);
      
      // Test token retrieval
      console.log('\n🔍 Testing token retrieval...');
      const token = await oauthManager.getValidToken();
      console.log(`   ✅ Token retrieved: ${token.substring(0, 20)}...`);
      
      // Test token validation
      console.log('\n🔍 Testing token validation...');
      const isValid = await oauthManager.hasValidTokensAsync();
      console.log(`   ✅ Token validation: ${isValid ? 'Valid' : 'Invalid'}`);
      
      // Show token info
      const tokenInfo = await oauthManager.getTokenInfo();
      if (tokenInfo) {
        console.log('\n📊 Final Token Status:');
        console.log(`   Expired: ${tokenInfo.isExpired ? 'No' : 'Yes'}`);
        const expiresInMs = tokenInfo.expiryDate - Date.now();
        console.log(`   Expires In: ${Math.round(expiresInMs / 60000)} minutes`);
      }
      
      console.log('\n✨ OAuth test completed successfully!');
      console.log('   Your tokens are securely stored and encrypted.');
      console.log('   The application can now access Google Drive and Photos on your behalf.');
      
    } else {
      console.error('\n❌ Authentication failed!');
      console.error('   Please check your credentials and try again.');
    }

  } catch (error: any) {
    console.error('\n❌ Error during OAuth test:');
    console.error(`   ${error.message}`);
    
    if (error.message.includes('ENOENT')) {
      console.error('\n💡 Tip: Make sure the token directory exists');
    } else if (error.message.includes('invalid_client')) {
      console.error('\n💡 Tip: Check your Client ID and Client Secret');
    } else if (error.message.includes('redirect_uri_mismatch')) {
      console.error('\n💡 Tip: Make sure http://localhost:3000/callback is added as redirect URI in Google Console');
    }
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the test
testOAuth().catch(console.error);