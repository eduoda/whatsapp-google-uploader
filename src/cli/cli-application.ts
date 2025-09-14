/**
 * CLI Application - Main CLI application entry point
 * AIDEV-NOTE: cli-main-app; main CLI application coordinator
 * AIDEV-TODO: implement-cli-app; complete CLI application implementation
 */

import { Command } from 'commander';
import { config, envFileExists, createEnvFile } from '../config';
import { FileInfo } from '../scanner';
import { ChatFileInfo } from '../chat-metadata/types';

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

    // Scan command - AIDEV-NOTE: scan-command; integrates Scanner with Chat Metadata (TASK-023)
    this.program
      .command('scan')
      .description('Scan WhatsApp directory for media files and save chat metadata to Google Sheets')
      .argument('[path]', 'Custom WhatsApp path (optional)')
      .option('--dry-run', 'Preview mode - skip Google Sheets saving')
      .action(async (customPath, options) => {
        try {
          const { WhatsAppScanner } = require('../scanner');
          const { ChatMetadataExtractor } = require('../chat-metadata');
          const isDryRun = options.dryRun;

          console.log('Scanning WhatsApp media files...\n');

          // Create scanner with custom path or config path
          // AIDEV-NOTE: env-config-priority; use config.whatsappPath when no custom path (TASK-023 fix)
          const scanner = new WhatsAppScanner({
            whatsappPath: customPath || config.whatsappPath
          });

          // Use existing Scanner API
          const files = customPath ?
            await scanner.scan(customPath) :
            await scanner.findFiles();

          if (files.length === 0) {
            console.log('No WhatsApp media files found.');
            if (!customPath) {
              console.log('\nTips:');
              console.log('- Make sure WhatsApp is installed');
              console.log('- Try specifying custom path: scan /path/to/whatsapp');
              console.log('- Use "whatsapp-uploader check" to verify configuration');
            }
            return;
          }

          // Group by type and display
          const grouped: Record<string, FileInfo[]> = files.reduce((acc: Record<string, FileInfo[]>, file: FileInfo) => {
            if (!acc[file.type]) {
              acc[file.type] = [];
            }
            acc[file.type]!.push(file);
            return acc;
          }, {});

          // Display results (simple format)
          console.log('WhatsApp Media Files:\n');

          for (const [type, typeFiles] of Object.entries(grouped)) {
            const totalSizeForType = typeFiles.reduce((sum: number, f: FileInfo) => sum + f.size, 0);
            console.log(`${type.toUpperCase()}: ${typeFiles.length} files (${(totalSizeForType / 1024 / 1024).toFixed(1)} MB)`);

            // Show first few files as examples
            typeFiles.slice(0, 3).forEach((file: FileInfo) => {
              console.log(`  - ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
            });
            if (typeFiles.length > 3) {
              console.log(`  ... and ${typeFiles.length - 3} more`);
            }
            console.log();
          }

          // Summary
          const totalSize = files.reduce((sum: number, f: FileInfo) => sum + f.size, 0);
          const totalCount = files.length;
          console.log(`Total: ${totalCount} files, ${(totalSize / 1024 / 1024).toFixed(1)} MB`);

          // AIDEV-NOTE: Chat metadata extraction and Google Sheets integration (TASK-023)
          if (!isDryRun) {
            console.log('\n📊 Extracting chat metadata...');

            try {
              // Extract chat metadata from msgstore.db
              const chatExtractor = new ChatMetadataExtractor();
              const chatMetadata = await chatExtractor.extractChatMetadata();

              if (chatMetadata.length > 0) {
                console.log('\n☁️  Saving to Google Sheets...');

                // Initialize Google APIs and SheetsDatabase
                const { GoogleApis } = require('../google-apis');
                const { SheetsDatabase } = require('../database');

                const googleApis = new GoogleApis({
                  credentialsPath: './credentials.json',
                  tokenPath: './tokens/google-tokens.json'
                });

                await googleApis.initialize();

                if (!googleApis.isAuthenticated()) {
                  console.log('⚠️  Authentication required for Google Sheets saving.');
                  console.log('   Run "whatsapp-uploader auth" first, or use --dry-run flag to skip.');
                  return;
                }

                // Create sheets database and save chat metadata
                const sheetsDb = new SheetsDatabase(googleApis.auth);
                await sheetsDb.initializeChatMetadata();
                await sheetsDb.saveChatMetadata(chatMetadata);

                // Display success message with spreadsheet link
                const spreadsheetUrl = sheetsDb.getChatMetadataSpreadsheetUrl();
                console.log('\n✓ Chat metadata saved to Google Sheets!');
                if (spreadsheetUrl) {
                  console.log(`📋 View at: ${spreadsheetUrl}`);
                }
              } else {
                console.log('\nℹ️  No chat metadata found (msgstore.db unavailable or empty)');
                console.log('   To extract chat metadata: run "npm run decrypt" first');
              }

            } catch (chatError) {
              console.warn('\n⚠️  Chat metadata extraction failed:', (chatError as Error).message);
              console.log('   File scan completed successfully. Chat metadata can be added later.');
            }
          } else {
            console.log('\n🔍 Dry-run mode: Skipping Google Sheets operations');
            console.log('   Remove --dry-run flag to save chat metadata to Google Sheets');
          }

        } catch (error) {
          console.error('Scan failed:', (error as Error).message);
          if ((error as Error).message.includes('not found')) {
            console.log('\nTips:');
            console.log('- Make sure WhatsApp is installed');
            console.log('- Try specifying custom path: scan /path/to/whatsapp');
            console.log('- Use "whatsapp-uploader check" to verify configuration');
          }
          process.exit(1);
        }
      });

    // Upload command - AIDEV-NOTE: upload-command; chat-specific file upload with progress tracking (TASK-027)
    this.program
      .command('upload')
      .description('Upload media files from specific chat to Google services')
      .requiredOption('--chat <jid>', 'Chat JID to upload files from (e.g., 5511999999999@c.us)')
      .option('--skip-failed', 'Skip files that previously failed to upload')
      .option('--dry-run', 'Preview mode - show files that would be uploaded without uploading')
      .action(async (options) => {
        await this.handleUploadCommand(options);
      });
  }

  // AIDEV-NOTE: upload-handler; handles chat-specific upload command with chronological ordering
  private async handleUploadCommand(options: { chat: string; skipFailed?: boolean; dryRun?: boolean }): Promise<void> {
    try {
      const { ChatFileAnalyzer } = require('../chat-metadata');
      const { SheetsDatabase } = require('../database');
      const { UploaderManager } = require('../uploader');
      const { GoogleApis } = require('../google-apis');

      const chatJid = options.chat.trim();
      const skipFailed = options.skipFailed || false;
      const isDryRun = options.dryRun || false;

      // Validate JID format
      if (!this.isValidJid(chatJid)) {
        console.error('Error: Invalid chat JID format.');
        console.log('\nExpected format examples:');
        console.log('  Individual chat: 5511999999999@s.whatsapp.net');
        console.log('  Group chat: 120363XXXXXXXXXX@g.us');
        console.log('  Business chat: 5511999999999@c.us');
        process.exit(1);
      }

      console.log(`🔍 Analyzing chat: ${chatJid}\n`);

      // Initialize chat file analyzer
      const analyzer = new ChatFileAnalyzer();

      // Get chat name for user-friendly display
      const chatName = await analyzer.getChatName(chatJid);
      console.log(`📱 Chat: ${chatName}`);

      // Analyze chat files (chronologically sorted by default)
      const files = await analyzer.analyzeChat(chatJid);

      if (files.length === 0) {
        console.log('ℹ️  No media files found in this chat.');
        console.log('\nPossible reasons:');
        console.log('- Chat has no media files');
        console.log('- Incorrect JID format');
        console.log('- Chat doesn\'t exist in msgstore.db');
        console.log('\nTip: Use "npm run scan" first to see all available chats');
        return;
      }

      // Filter files that exist on filesystem
      const existingFiles = files.filter((f: ChatFileInfo) => f.fileExists);
      console.log(`📁 Found ${files.length} media files (${existingFiles.length} exist on filesystem)`);

      if (existingFiles.length === 0) {
        console.log('❌ No files found on filesystem to upload.');
        console.log('\nThis usually means:');
        console.log('- Files were already deleted from phone');
        console.log('- WhatsApp path is incorrect');
        console.log('- Files are in a different location');
        return;
      }

      // Show date range
      if (files.length > 0) {
        const oldestFile = files[0];
        const newestFile = files[files.length - 1];
        console.log(`📅 Date range: ${oldestFile.messageTimestamp.toLocaleDateString()} to ${newestFile.messageTimestamp.toLocaleDateString()}\n`);
      }

      if (!isDryRun) {
        // Initialize Google APIs and authenticate
        console.log('🔐 Checking authentication...');
        const googleApis = new GoogleApis({
          credentialsPath: './credentials.json',
          tokenPath: './tokens/google-tokens.json'
        });

        await googleApis.initialize();

        if (!googleApis.isAuthenticated()) {
          console.error('❌ Authentication required for uploads.');
          console.log('\nRun "npm run auth" to authenticate with Google services first.');
          process.exit(1);
        }
        console.log('✓ Authenticated with Google services\n');

        // Initialize sheets database and check per-chat sheet
        console.log('☁️  Checking Google Sheets...');
        const sheetsDb = new SheetsDatabase(googleApis.auth);

        // Load existing upload status from per-chat sheets
        await sheetsDb.saveChatFiles(chatJid, chatName, existingFiles);

        // Read current upload status from sheets
        const spreadsheetId = await sheetsDb.createChatFileSheet(chatJid, chatName);
        const existingData = await sheetsDb.readExistingChatFiles(spreadsheetId);

        // Update files with current upload status from sheets
        const filesWithStatus = this.mergeUploadStatus(existingFiles, existingData);

        // Filter files based on upload status and options
        let filesToUpload = filesWithStatus.filter(file => {
          if (file.uploadStatus === 'uploaded') {
            return false; // Always skip uploaded files
          }
          if (skipFailed && file.uploadStatus === 'failed') {
            return false; // Skip failed files if --skip-failed flag is used
          }
          return true; // Upload pending and failed files (unless --skip-failed)
        });

        const skippedUploaded = filesWithStatus.filter(f => f.uploadStatus === 'uploaded').length;
        const skippedFailed = skipFailed ? filesWithStatus.filter(f => f.uploadStatus === 'failed').length : 0;

        console.log(`📊 Upload Status:`);
        console.log(`   ${filesToUpload.length} files ready for upload`);
        console.log(`   ${skippedUploaded} files already uploaded (skipping)`);
        if (skippedFailed > 0) {
          console.log(`   ${skippedFailed} failed files skipped (--skip-failed flag used)`);
        } else {
          const failedToRetry = filesWithStatus.filter(f => f.uploadStatus === 'failed').length;
          if (failedToRetry > 0) {
            console.log(`   ${failedToRetry} failed files will be retried`);
          }
        }
        console.log();

        if (filesToUpload.length === 0) {
          console.log('✅ All files are already processed! Nothing to upload.');
          return;
        }

        // Initialize uploader manager
        console.log('🚀 Starting uploads...\n');
        const uploaderManager = new UploaderManager({
          credentialsPath: './credentials.json',
          tokenPath: './tokens/google-tokens.json'
        });
        await uploaderManager.initialize();

        // Upload files sequentially with progress tracking
        let uploadedCount = 0;
        let failedCount = 0;
        const startTime = Date.now();

        for (let i = 0; i < filesToUpload.length; i++) {
          const file = filesToUpload[i]!;
          const progress = Math.round(((i + 1) / filesToUpload.length) * 100);

          // Determine destination based on file type
          const isPhotoVideo = file.mimeType?.startsWith('image/') || file.mimeType?.startsWith('video/') ||
                               file.mediaType === 'photo' || file.mediaType === 'video';
          const destination = isPhotoVideo ? '📷 Google Photos' : '📁 Google Drive';

          console.log(`[${i + 1}/${filesToUpload.length}] Uploading: ${file.fileName}`);
          console.log(`   Size: ${(file.actualSize! / 1024 / 1024).toFixed(1)} MB | Progress: ${progress}%`);
          console.log(`   Date: ${file.messageTimestamp.toLocaleDateString()} | Destination: ${destination}`);

          try {
            // Convert ChatFileInfo to FileUpload format
            const fileUpload = {
              path: file.filePath!,
              name: file.fileName,
              size: file.actualSize!,
              mimeType: file.mimeType || 'application/octet-stream'
            };

            // Upload single file with chat organization (TASK-029)
            await uploaderManager.uploadFiles([fileUpload], {
              chatId: chatJid,
              chatName: chatName // TASK-029: pass chat name for album/folder naming
            });

            // Update Google Sheets with success and organization info (TASK-029)
            file.uploadStatus = 'uploaded';
            const organizationInfo = fileUpload.mimeType.startsWith('image/') || fileUpload.mimeType.startsWith('video/')
              ? `WA_${chatName}_${chatJid}` // Photos album name
              : `${chatName}_${chatJid}`;   // Drive folder name

            await sheetsDb.updateFileUploadStatus(chatJid, chatName, file.messageId, {
              uploadStatus: 'uploaded',
              uploadDate: new Date(),
              fileLink: `https://photos.google.com/`, // Placeholder for now
              directoryName: organizationInfo,
              directoryLink: undefined, // Will be updated later when we have album/folder links
              uploadError: undefined
            });

            uploadedCount++;
            console.log(`   ✅ Uploaded successfully\n`);

          } catch (uploadError) {
            failedCount++;
            console.log(`   ❌ Upload failed: ${(uploadError as Error).message}\n`);

            // Update Google Sheets with failure
            file.uploadStatus = 'failed';
            await sheetsDb.updateFileUploadStatus(chatJid, chatName, file.messageId, {
              uploadStatus: 'failed',
              uploadDate: new Date(),
              uploadError: (uploadError as Error).message
            });
          }
        }

        // Show completion summary
        const totalTime = Math.round((Date.now() - startTime) / 1000);
        console.log('🎉 Upload Complete!\n');
        console.log(`📈 Results:`);
        console.log(`   ✅ Uploaded: ${uploadedCount} files`);
        console.log(`   ❌ Failed: ${failedCount} files`);
        console.log(`   ⏭️  Already uploaded: ${skippedUploaded} files`);
        if (skippedFailed > 0) {
          console.log(`   ⏭️  Skipped failed: ${skippedFailed} files`);
        }
        console.log(`   ⏱️  Total time: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s\n`);

        // Show sheets link
        const sheetsUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
        console.log(`📋 View detailed progress: ${sheetsUrl}`);

      } else {
        // Dry-run mode - just show what would be uploaded
        console.log('🔍 DRY-RUN MODE: Showing files that would be uploaded\n');

        existingFiles.forEach((file: ChatFileInfo, index: number) => {
          // Determine destination based on file type
          const isPhotoVideo = file.mimeType?.startsWith('image/') || file.mimeType?.startsWith('video/') ||
                               file.mediaType === 'photo' || file.mediaType === 'video';
          const destination = isPhotoVideo ? '📷 Google Photos' : '📁 Google Drive';

          console.log(`[${index + 1}] ${file.fileName}`);
          console.log(`    Size: ${(file.actualSize! / 1024 / 1024).toFixed(1)} MB`);
          console.log(`    Type: ${file.mediaType}`);
          console.log(`    Date: ${file.messageTimestamp.toLocaleDateString()}`);
          console.log(`    Destination: ${destination}`);
          console.log(`    Path: ${file.filePath}`);
          console.log();
        });

        console.log(`📊 Summary: ${existingFiles.length} files would be uploaded`);
        console.log('\nRemove --dry-run flag to perform actual upload.');
      }

    } catch (error) {
      console.error('Upload failed:', (error as Error).message);
      if ((error as Error).message.includes('Database not found')) {
        console.log('\n💡 Tip: Run "npm run decrypt" to decrypt WhatsApp database first');
      } else if ((error as Error).message.includes('Authentication')) {
        console.log('\n💡 Tip: Run "npm run auth" to authenticate with Google services');
      }
      process.exit(1);
    }
  }

  // AIDEV-NOTE: jid-validation; validates WhatsApp JID format for upload command
  private isValidJid(jid: string): boolean {
    // WhatsApp JID patterns:
    // Individual: phone@s.whatsapp.net
    // Group: groupid@g.us
    // Business: phone@c.us
    const jidPattern = /^[\d\w\-]+@(s\.whatsapp\.net|g\.us|c\.us)$/;
    return jidPattern.test(jid);
  }

  // AIDEV-NOTE: status-merge; merges upload status from Google Sheets with file info
  private mergeUploadStatus(files: ChatFileInfo[], existingData: Map<string, any>): ChatFileInfo[] {
    return files.map(file => {
      const existing = existingData.get(file.messageId);
      if (existing && existing.uploadStatus) {
        file.uploadStatus = existing.uploadStatus.toLowerCase();
      } else {
        file.uploadStatus = 'pending';
      }
      return file;
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