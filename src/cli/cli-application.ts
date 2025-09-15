/**
 * CLI Application - Main CLI application entry point
 * AIDEV-NOTE: cli-main-app; main CLI application coordinator
 * AIDEV-TODO: implement-cli-app; complete CLI application implementation
 */

import { Command } from 'commander';
import { config, envFileExists, createEnvFile } from '../config';
import { FileInfo } from '../scanner';
import { ChatFileInfo } from '../chat-metadata/types';
import * as crypto from 'crypto';
import { createReadStream } from 'fs';

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
            console.log('\nRun "node dist/cli.js setup" to configure');
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
            console.log('\nRun "node dist/cli.js auth" to authenticate');
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

          console.log('\n🔍 Starting WhatsApp media scan...');

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
              console.log('- Use "node dist/cli.js check" to verify configuration');
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
          console.log('\n📂 WhatsApp Media Files Found:\n');

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
          console.log(`📊 Total: ${totalCount.toLocaleString()} files, ${(totalSize / 1024 / 1024).toFixed(1)} MB`);

          // AIDEV-NOTE: Chat metadata extraction and Google Sheets integration (TASK-023)
          if (!isDryRun) {
            try {
              // Initialize Google APIs first to get auth client
              const { GoogleApis } = require('../google-apis');
              const googleApis = new GoogleApis({
                credentialsPath: './credentials.json',
                tokenPath: './tokens/google-tokens.json'
              });
              await googleApis.initialize();

              // Extract chat metadata from msgstore.db with Google Contacts support
              const chatExtractor = new ChatMetadataExtractor(
                undefined,
                customPath || config.whatsappPath,
                googleApis.isAuthenticated() ? googleApis.authClient : undefined
              );
              const chatMetadata = await chatExtractor.extractChatMetadata();

              if (chatMetadata.length > 0) {
                // Initialize SheetsDatabase with the already authenticated client
                const { SheetsDatabase } = require('../database');

                if (!googleApis.isAuthenticated()) {
                  console.log('⚠️  Authentication required for Google Sheets saving.');
                  console.log('   Run "node dist/cli.js auth" first, or use --dry-run flag to skip.');
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
        console.log('\nTip: Use "node dist/cli.js scan" first to see all available chats');
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
          console.log('\nRun "node dist/cli.js auth" to authenticate with Google services first.');
          process.exit(1);
        }
        console.log('✓ Authenticated with Google services\n');

        // Initialize sheets database and check per-chat sheet
        console.log('☁️  Checking Google Sheets...');
        const sheetsDb = new SheetsDatabase(googleApis.auth);
        await sheetsDb.initializeChatMetadata();

        // Get existing album/folder IDs from chats table
        let chatGoogleInfo = await sheetsDb.getChatGoogleInfo(chatJid);
        console.log('📂 Chat Google info:', chatGoogleInfo ? 'Found existing album/folder' : 'Will create new');

        // Load existing upload status from per-chat sheets
        await sheetsDb.saveChatFiles(chatJid, chatName, existingFiles);

        // Read current upload status from sheets
        const spreadsheetId = await sheetsDb.createChatFileSheet(chatJid, chatName);
        const existingData = await sheetsDb.readExistingChatFiles(spreadsheetId);

        // Update files with current upload status from sheets
        let filesWithStatus = this.mergeUploadStatus(existingFiles, existingData);

        // TASK-030: Calculate file hashes and detect duplicates
        filesWithStatus = await this.processFileHashes(filesWithStatus);

        // Save updated file information (with hashes) back to sheets
        console.log('💾 Saving updated file information to Google Sheets...');
        await sheetsDb.saveChatFiles(chatJid, chatName, filesWithStatus);

        // Filter files based on upload status and options
        let filesToUpload = filesWithStatus.filter(file => {
          if (file.uploadStatus === 'uploaded') {
            return false; // Always skip uploaded files
          }
          if (file.uploadStatus === 'skipped') {
            return false; // Skip duplicate files (TASK-030)
          }
          if (skipFailed && file.uploadStatus === 'failed') {
            return false; // Skip failed files if --skip-failed flag is used
          }
          return true; // Upload pending and failed files (unless --skip-failed)
        });

        let skippedUploaded = filesWithStatus.filter(f => f.uploadStatus === 'uploaded').length;
        const skippedDuplicates = filesWithStatus.filter(f => f.uploadStatus === 'skipped').length; // TASK-030
        const skippedFailed = skipFailed ? filesWithStatus.filter(f => f.uploadStatus === 'failed').length : 0;

        console.log(`📊 Upload Status:`);
        console.log(`   ${filesToUpload.length} files ready for upload`);
        console.log(`   ${skippedUploaded} files already uploaded (skipping)`);
        if (skippedDuplicates > 0) {
          console.log(`   ${skippedDuplicates} duplicate files skipped (TASK-030: same content hash)`);
        }
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

        // Initialize uploader manager with adaptive delay for quota management
        console.log('🚀 Starting uploads...\n');
        const uploaderManager = new UploaderManager({
          credentialsPath: './credentials.json',
          tokenPath: './tokens/google-tokens.json',
          rateLimit: {
            adaptiveDelay: true, // Enable smart quota management
            initialDelayMs: 1500, // Start with 1.5s delay between uploads
            maxDelayMs: 60000 // Max 60s backoff for quota errors
          }
        });
        await uploaderManager.initialize();

        // Upload files sequentially with progress tracking
        let uploadedCount = 0;
        let failedCount = 0;
        const startTime = Date.now();

        // Setup graceful shutdown handler to save state on interruption
        let isShuttingDown = false;
        const gracefulShutdown = async (signal: string) => {
          if (isShuttingDown) return; // Prevent multiple shutdowns
          isShuttingDown = true;

          console.log(`\n⚠️  ${signal} received. Saving current state...`);

          // Save current progress to sheets immediately
          try {
            await sheetsDb.saveChatFiles(chatJid, chatName, filesWithStatus);
            console.log('✅ Upload state saved successfully');
            console.log(`📊 Progress: ${uploadedCount} uploaded, ${failedCount} failed`);
          } catch (error) {
            console.error('❌ Failed to save state:', error);
          }

          process.exit(0);
        };

        // Register signal handlers
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

        for (let i = 0; i < filesToUpload.length; i++) {
          if (isShuttingDown) break; // Stop processing if shutting down
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
            // AIDEV-NOTE: Pass existing album/folder IDs to avoid re-searching
            const uploadOptions: any = {
              chatId: chatJid,
              chatName: chatName // TASK-029: pass chat name for album/folder naming
            };

            // Add existing IDs if available
            if (chatGoogleInfo?.albumId) {
              uploadOptions.existingAlbumId = chatGoogleInfo.albumId;
            }
            if (chatGoogleInfo?.folderId) {
              uploadOptions.existingFolderId = chatGoogleInfo.folderId;
            }

            const uploadResult = await uploaderManager.uploadFiles([fileUpload], uploadOptions);

            // Save album/folder info to chats table if it's the first upload
            if (uploadResult && uploadResult.length > 0) {
              const result = uploadResult[0];

              // If new album was created (no existing ID was passed)
              if (result?.albumId && !chatGoogleInfo?.albumId) {
                await sheetsDb.updateChatAlbumInfo(chatJid, result.albumId, result.albumName || '');
                chatGoogleInfo = chatGoogleInfo || {};
                chatGoogleInfo.albumId = result.albumId;
              }

              // If new folder was created (no existing ID was passed)
              if (result?.folderId && !chatGoogleInfo?.folderId) {
                await sheetsDb.updateChatDriveInfo(chatJid, result.folderId, result.folderName || '');
                chatGoogleInfo = chatGoogleInfo || {};
                chatGoogleInfo.folderId = result.folderId;
              }

              // Update Google Sheets with success IMMEDIATELY (no buffering for critical status)
              // AIDEV-NOTE: Album/folder info stored in main chats table, not individual sheets (TASK-023)
              file.uploadStatus = 'uploaded';

              // CRITICAL: Save success status immediately to prevent re-upload on interruption
              await sheetsDb.updateFileUploadStatus(chatJid, chatName, file.messageId, {
                uploadStatus: 'uploaded',
                uploadDate: new Date(),
                fileLink: result?.url || '', // Use actual file URL from upload result
                uploadError: undefined
              });

              uploadedCount++;
              console.log(`   ✅ Uploaded successfully\n`);
            } else {
              console.log(`   ⏭️  Already uploaded (skipped)\n`);
              skippedUploaded++;
            }

          } catch (uploadError: any) {
            const errorMessage = uploadError?.message || 'Unknown error';
            const isQuotaError = errorMessage.includes('Quota exceeded') ||
                                errorMessage.includes('quota') ||
                                uploadError?.response?.status === 429;

            if (isQuotaError) {
              // For quota errors, don't mark as failed - will be retried automatically
              console.log(`   ⏸️ Quota limit reached. Will retry after cooldown.\n`);
            } else {
              failedCount++;
              console.log(`   ❌ Upload failed: ${errorMessage}\n`);

              // Update Google Sheets with failure (only for non-quota errors)
              file.uploadStatus = 'failed';
              await sheetsDb.updateFileUploadStatus(chatJid, chatName, file.messageId, {
                uploadStatus: 'failed',
                uploadDate: new Date(),
                uploadError: errorMessage
              });
            }
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
        console.log('\n💡 Tip: Run "node dist/cli.js auth" to authenticate with Google services');
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
        // TASK-030: Preserve existing file hash for duplicate detection
        file.fileHash = existing.fileHash || file.fileHash;
      } else {
        file.uploadStatus = 'pending';
      }
      return file;
    });
  }

  /**
   * Calculate SHA-256 hash for file content (TASK-030)
   * AIDEV-NOTE: hash-calculation; reuses same logic as UploaderManager for consistency
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filePath);

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        hash.update(chunk);
      });

      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });

      stream.on('error', reject);
    });
  }

  /**
   * Calculate hashes for files and check for duplicates (TASK-030)
   * AIDEV-NOTE: hash-and-duplicate-check; calculates hashes and adds duplicate detection
   */
  private async processFileHashes(files: ChatFileInfo[]): Promise<ChatFileInfo[]> {
    console.log('🔍 Calculating file hashes for duplicate detection...');

    const hashToFiles = new Map<string, ChatFileInfo[]>();
    let hashesCalculated = 0;
    const totalFiles = files.filter(f => f.fileExists && f.filePath && !f.fileHash).length;

    const processedFiles = await Promise.all(files.map(async (file, index) => {
      // Calculate hash if file exists and no hash yet
      if (file.fileExists && file.filePath && !file.fileHash) {
        try {
          if (totalFiles > 0) {
            process.stdout.write(`\r   ⏳ Hashing: ${hashesCalculated + 1}/${totalFiles} files (${Math.round((hashesCalculated + 1) / totalFiles * 100)}%)`);
          }
          file.fileHash = await this.calculateFileHash(file.filePath);
          hashesCalculated++;
        } catch (error) {
          console.warn(`\n     ⚠️  Failed to hash ${file.fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Track files by hash for duplicate detection
      if (file.fileHash) {
        if (!hashToFiles.has(file.fileHash)) {
          hashToFiles.set(file.fileHash, []);
        }
        hashToFiles.get(file.fileHash)!.push(file);
      }

      return file;
    }));

    if (totalFiles > 0) {
      console.log(`\r   ✅ Hashed ${hashesCalculated}/${totalFiles} files successfully             `);
    }

    // Check for duplicates and mark them
    let duplicatesFound = 0;
    for (const [hash, filesWithSameHash] of hashToFiles) {
      if (filesWithSameHash.length > 1) {
        duplicatesFound += filesWithSameHash.length - 1;
        console.log(`   🔍 Found ${filesWithSameHash.length} files with same content (hash: ${hash.substring(0, 16)}...)`);

        // Keep the first one, mark others as duplicates
        const originalFile = filesWithSameHash[0];
        for (let i = 1; i < filesWithSameHash.length; i++) {
          const duplicateFile = filesWithSameHash[i];
          if (duplicateFile && originalFile) {
            duplicateFile.uploadStatus = 'skipped';
            duplicateFile.uploadError = `Duplicate content (same as ${originalFile.fileName})`;
            console.log(`     - ${duplicateFile.fileName} → marked as duplicate`);
          }
        }
      }
    }

    if (duplicatesFound > 0) {
      console.log(`   📊 Found ${duplicatesFound} duplicate files that will be skipped`);
    } else {
      console.log(`   ✅ No duplicate files found`);
    }

    return processedFiles;
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