/**
 * CLI Application - Main CLI application entry point
 * AIDEV-NOTE: cli-main-app; main CLI application coordinator
 * AIDEV-TODO: implement-cli-app; complete CLI application implementation
 */

import { Command } from 'commander';
import { config, envFileExists, createEnvFile } from '../config';

export class CLIApplication {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.checkEnvironment();
    this.setupProgram();
  }
  
  private checkEnvironment(): void {
    // Check if .env file exists, create from template if not
    if (!envFileExists()) {
      console.log('No .env file found. Creating from template...');
      createEnvFile();
      console.log('Please edit .env file with your configuration values.');
    }
    
    // Log current environment (only in development)
    if (config.nodeEnv === 'development') {
      console.log('Running in development mode with log level:', config.logLevel);
    }
  }

  private setupProgram(): void {
    this.program
      .name('whatsapp-uploader')
      .description('WhatsApp Google Uploader - Upload WhatsApp media to Google services')
      .version('1.0.0');

    // Authentication command
    this.program
      .command('auth')
      .description('Authenticate with Google services')
      .option('--manual', 'Use manual code entry instead of local server')
      .action(async (options) => {
        try {
          const { GoogleApis } = require('../google-apis');
          const http = require('http');
          const url = require('url');

          console.log('Starting OAuth authentication...\n');

          // Initialize GoogleApis
          const googleApis = new GoogleApis({
            credentialsPath: './credentials.json',
            tokenPath: './tokens/google-tokens.json'
          });

          await googleApis.initialize();

          // Check if already authenticated
          if (googleApis.isAuthenticated()) {
            console.log('✓ Already authenticated with Google services');
            return;
          }

          // Get auth URL
          const authUrl = googleApis.getAuthUrl();

          if (options.manual) {
            // Manual flow (original behavior)
            console.log('Visit this URL to authorize the application:');
            console.log(`\n${authUrl}\n`);

            const readline = require('readline');
            const rl = readline.createInterface({
              input: process.stdin,
              output: process.stdout
            });

            const code = await new Promise<string>((resolve) => {
              rl.question('Enter the authorization code: ', (answer: string) => {
                rl.close();
                resolve(answer);
              });
            });

            await googleApis.authenticate(code);
          } else {
            // Automated flow with local server
            console.log('Starting local server for OAuth callback...');

            const code = await new Promise<string>((resolve, reject) => {
              const server = http.createServer((req: any, res: any) => {
                const parsedUrl = url.parse(req.url, true);

                if (parsedUrl.pathname === '/callback/' || parsedUrl.pathname === '/callback') {
                  const authCode = parsedUrl.query.code as string;

                  if (authCode) {
                    // Send success response
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>Authentication Successful</title>
                        <style>
                          body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          }
                          .container {
                            background: white;
                            padding: 40px;
                            border-radius: 10px;
                            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                            text-align: center;
                          }
                          h1 { color: #4CAF50; }
                          p { color: #666; margin: 20px 0; }
                          .check {
                            font-size: 60px;
                            color: #4CAF50;
                            margin-bottom: 20px;
                          }
                        </style>
                      </head>
                      <body>
                        <div class="container">
                          <div class="check">✓</div>
                          <h1>Authentication Successful!</h1>
                          <p>You can close this window and return to the terminal.</p>
                          <p>The application has been authorized to access your Google services.</p>
                        </div>
                        <script>setTimeout(() => window.close(), 3000);</script>
                      </body>
                      </html>
                    `);

                    server.close(() => {
                      resolve(authCode);
                    });
                  } else {
                    // Error response
                    res.writeHead(400, { 'Content-Type': 'text/html' });
                    res.end(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>Authentication Failed</title>
                        <style>
                          body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            background: #f44336;
                          }
                          .container {
                            background: white;
                            padding: 40px;
                            border-radius: 10px;
                            text-align: center;
                          }
                          h1 { color: #f44336; }
                        </style>
                      </head>
                      <body>
                        <div class="container">
                          <h1>Authentication Failed</h1>
                          <p>No authorization code received. Please try again.</p>
                        </div>
                      </body>
                      </html>
                    `);

                    server.close(() => {
                      reject(new Error('No authorization code received'));
                    });
                  }
                } else {
                  // Redirect to auth URL for any other path
                  res.writeHead(302, { 'Location': authUrl });
                  res.end();
                }
              });

              server.listen(3000, 'localhost', () => {
                console.log('✓ Local server running on http://localhost:3000\n');
                console.log('Opening browser for authentication...');
                console.log('If the browser doesn\'t open automatically, visit:');
                console.log(`\n${authUrl}\n`);

                // Try to open browser automatically
                const { exec } = require('child_process');
                const platform = process.platform;
                let command: string;

                if (platform === 'darwin') {
                  command = `open "${authUrl}"`;
                } else if (platform === 'win32') {
                  command = `start "${authUrl}"`;
                } else {
                  command = `xdg-open "${authUrl}"`;
                }

                exec(command, (error: any) => {
                  if (error) {
                    console.log('Please open the URL manually in your browser.');
                  }
                });
              });

              // Timeout after 5 minutes
              const timeoutId = setTimeout(() => {
                server.close(() => {
                  reject(new Error('Authentication timeout - no response received'));
                });
              }, 5 * 60 * 1000);

              // Clear timeout when server closes normally
              server.on('close', () => {
                clearTimeout(timeoutId);
              });
            });

            await googleApis.authenticate(code);
          }

          console.log('\n✓ Authentication successful!');
          console.log('Token saved to ./tokens/google-tokens.json');

          // Exit successfully
          process.exit(0);
        } catch (error) {
          console.error('Authentication failed:', (error as Error).message);
          process.exit(1);
        }
      });

    // Setup command
    this.program
      .command('setup')
      .description('Initial system configuration and authentication')
      .action(async () => {
        console.log('Welcome to WhatsApp Google Uploader Setup!\n');
        console.log('This will guide you through the initial configuration.\n');

        // Check for credentials.json
        const fs = require('fs');
        if (!fs.existsSync('./credentials.json')) {
          console.error('Error: credentials.json not found!');
          console.log('\nPlease follow these steps:');
          console.log('1. Go to https://console.cloud.google.com/');
          console.log('2. Create a new project or select existing');
          console.log('3. Enable Google Drive and Google Photos APIs');
          console.log('4. Create OAuth 2.0 credentials (Desktop application)');
          console.log('5. Download credentials and save as credentials.json');
          process.exit(1);
        }

        console.log('✓ credentials.json found\n');
        console.log('Starting authentication...\n');

        // Run auth command with automated flow
        await this.program.parseAsync(['node', 'cli.js', 'auth']);
      });

    // Check command
    this.program
      .command('check')
      .description('Verify system configuration')
      .action(async () => {
        try {
          const { GoogleApis } = require('../google-apis');
          const fs = require('fs');

          console.log('Checking system configuration...\n');

          // Check credentials
          const hasCredentials = fs.existsSync('./credentials.json');
          console.log(`Credentials file: ${hasCredentials ? '✓' : '✗'} credentials.json`);

          if (!hasCredentials) {
            console.log('\nRun "whatsapp-uploader setup" to configure');
            process.exit(1);
          }

          // Check authentication
          const googleApis = new GoogleApis({
            credentialsPath: './credentials.json',
            tokenPath: './tokens/google-tokens.json'
          });

          await googleApis.initialize();
          const isAuth = googleApis.isAuthenticated();
          console.log(`Authentication: ${isAuth ? '✓' : '✗'} ${isAuth ? 'Valid token' : 'Not authenticated'}`);

          if (!isAuth) {
            console.log('\nRun "whatsapp-uploader auth" to authenticate');
            process.exit(1);
          }

          console.log('\n✓ System is properly configured');
        } catch (error) {
          console.error('Configuration check failed:', (error as Error).message);
          process.exit(1);
        }
      });
  }

  run(): void {
    this.program.parse();
  }
}

// CLI entry point
if (require.main === module) {
  const cli = new CLIApplication();
  cli.run();
}