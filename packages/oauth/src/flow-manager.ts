/**
 * Flow Manager - Interactive OAuth2 flow handling
 * AIDEV-TODO: implement-flow-manager; OAuth2 interactive flow implementation
 */

import { OAuth2Client, Credentials } from 'google-auth-library';

export class FlowManager {
  constructor(private readonly oauth2Client: OAuth2Client) {}

  async startInteractiveFlow(scopes: string[]): Promise<Credentials> {
    // AIDEV-TODO: implement interactive OAuth2 flow for CLI
    // Should open browser, handle authorization, and return tokens
    throw new Error('FlowManager.startInteractiveFlow not implemented');
  }

  async getAuthUrl(scopes: string[]): Promise<string> {
    // AIDEV-TODO: implement authorization URL generation
    throw new Error('FlowManager.getAuthUrl not implemented');
  }

  async exchangeCodeForTokens(code: string): Promise<Credentials> {
    // AIDEV-TODO: implement authorization code exchange
    throw new Error('FlowManager.exchangeCodeForTokens not implemented');
  }
}