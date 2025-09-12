/**
 * Flow Manager - Interactive OAuth2 flow handling
 * AIDEV-NOTE: flow-manager-implementation; OAuth2 interactive flow for CLI
 */

import { OAuth2Client, Credentials } from 'google-auth-library';
import * as readline from 'readline';

export class FlowManager {
  constructor(private readonly oauth2Client: OAuth2Client) {}

  async startInteractiveFlow(scopes: string[]): Promise<Credentials> {
    // AIDEV-NOTE: interactive-oauth-flow; implements browser-based OAuth2 flow
    
    // Generate auth URL
    const authUrl = await this.getAuthUrl(scopes);
    
    // Display URL to user
    console.log('\n🔗 Please visit this URL to authorize the application:');
    console.log(authUrl);
    console.log('\n📝 After authorization, you will be redirected to a URL like:');
    console.log('   http://localhost:3000/callback?code=XXXXX');
    console.log('\n✂️  Copy the code parameter from the URL and paste it below:\n');
    
    // Get code from user
    const code = await this.promptForCode();
    
    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(code);
    
    return tokens;
  }

  async getAuthUrl(scopes: string[]): Promise<string> {
    // AIDEV-NOTE: auth-url-generation; generates Google OAuth2 authorization URL
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Needed for refresh token
      scope: scopes,
      prompt: 'consent' // Force consent to ensure refresh token
    });
    
    return authUrl;
  }

  async exchangeCodeForTokens(code: string): Promise<Credentials> {
    // AIDEV-NOTE: code-exchange; exchanges authorization code for tokens
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      // Set credentials for future use
      this.oauth2Client.setCredentials(tokens);
      
      return tokens;
    } catch (error: any) {
      if (error.message?.includes('invalid_grant')) {
        throw new Error('Invalid authorization code. Please try again.');
      }
      throw error;
    }
  }

  private async promptForCode(): Promise<string> {
    // AIDEV-NOTE: code-prompt; interactive prompt for authorization code
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Enter authorization code: ', (code) => {
        rl.close();
        resolve(code.trim());
      });
    });
  }
}