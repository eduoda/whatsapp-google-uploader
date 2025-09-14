/**
 * Google Sheets Database Implementation
 * Uses Google Sheets as a cloud-based database for persistence
 */

import { google, sheets_v4 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { ChatMetadata, PORTUGUESE_COLUMN_LABELS } from '../chat-metadata/types.js';

export interface FileRecord {
  fileHash: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadDate: string;
  googleId: string;
  mimeType: string;
  chatId?: string;
}

export interface ProgressRecord {
  chatId: string;
  lastProcessedFile: string;
  totalFiles: number;
  processedFiles: number;
  status: 'active' | 'paused' | 'completed' | 'error';
  lastUpdated: string;
  errorMessage?: string;
}

export class SheetsDatabase {
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string | null = null;
  private chatMetadataSpreadsheetId: string | null = null;
  private initialized = false;

  private readonly SPREADSHEET_NAME = 'WhatsApp-Uploader-Database';
  private readonly UPLOADED_FILES_SHEET = 'uploaded_files';
  private readonly PROGRESS_SHEET = 'upload_progress';

  // AIDEV-NOTE: Chat metadata will be stored in separate spreadsheet as requested
  private readonly CHAT_METADATA_SPREADSHEET_NAME = 'chats';
  private readonly CHAT_METADATA_SHEET = 'chats';

  constructor(private auth: OAuth2Client) {
    this.sheets = google.sheets({ version: 'v4', auth });
  }

  /**
   * Initialize the database - create or find existing spreadsheet
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Find or create the spreadsheet
      this.spreadsheetId = await this.findOrCreateSpreadsheet();
      await this.ensureSheets();
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Sheets database: ${error}`);
    }
  }

  /**
   * Find existing spreadsheet or create new one
   */
  private async findOrCreateSpreadsheet(): Promise<string> {
    const drive = google.drive({ version: 'v3', auth: this.auth });
    
    // Search for existing spreadsheet
    const searchResponse = await drive.files.list({
      q: `name='${this.SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name)'
    });

    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      const firstFile = searchResponse.data.files[0];
      if (firstFile?.id) {
        return firstFile.id;
      }
    }

    // Create new spreadsheet
    const createResponse = await this.sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: this.SPREADSHEET_NAME
        },
        sheets: [
          {
            properties: {
              title: this.UPLOADED_FILES_SHEET,
              gridProperties: { rowCount: 10000, columnCount: 8 }
            }
          },
          {
            properties: {
              title: this.PROGRESS_SHEET,
              gridProperties: { rowCount: 1000, columnCount: 7 }
            }
          }
        ]
      }
    });

    const newId = createResponse.data.spreadsheetId!;
    await this.initializeHeaders(newId);
    return newId;
  }

  /**
   * Ensure required sheets exist
   */
  private async ensureSheets(): Promise<void> {
    if (!this.spreadsheetId) throw new Error('Spreadsheet not initialized');

    const spreadsheet = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId
    });

    const sheetNames = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
    
    if (!sheetNames.includes(this.UPLOADED_FILES_SHEET)) {
      await this.addSheet(this.UPLOADED_FILES_SHEET);
    }
    
    if (!sheetNames.includes(this.PROGRESS_SHEET)) {
      await this.addSheet(this.PROGRESS_SHEET);
    }
  }

  /**
   * Add a new sheet to the spreadsheet
   */
  private async addSheet(sheetName: string): Promise<void> {
    if (!this.spreadsheetId) throw new Error('Spreadsheet not initialized');

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: {
            properties: {
              title: sheetName,
              gridProperties: { rowCount: 10000, columnCount: 10 }
            }
          }
        }]
      }
    });

    // Add headers for the new sheet
    await this.initializeHeaders(this.spreadsheetId, sheetName);
  }

  /**
   * Initialize sheet headers
   */
  private async initializeHeaders(spreadsheetId: string, sheetName?: string): Promise<void> {
    const requests = [];

    if (!sheetName || sheetName === this.UPLOADED_FILES_SHEET) {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${this.UPLOADED_FILES_SHEET}!A1:H1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['File Hash', 'File Name', 'File Path', 'File Size', 'Upload Date', 'Google ID', 'MIME Type', 'Chat ID']]
        }
      });
    }

    if (!sheetName || sheetName === this.PROGRESS_SHEET) {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${this.PROGRESS_SHEET}!A1:G1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Chat ID', 'Last Processed File', 'Total Files', 'Processed Files', 'Status', 'Last Updated', 'Error Message']]
        }
      });
    }
  }

  /**
   * Check if a file has been uploaded
   */
  async isFileUploaded(fileHash: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId!,
      range: `${this.UPLOADED_FILES_SHEET}!A:A`
    });

    const values = response.data.values || [];
    return values.some(row => row[0] === fileHash);
  }

  /**
   * Save uploaded file record
   */
  async saveUploadedFile(file: FileRecord): Promise<void> {
    await this.ensureInitialized();

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId!,
      range: `${this.UPLOADED_FILES_SHEET}!A:H`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          file.fileHash,
          file.fileName,
          file.filePath,
          file.fileSize,
          file.uploadDate,
          file.googleId,
          file.mimeType,
          file.chatId || ''
        ]]
      }
    });
  }

  /**
   * Get uploaded files for a chat
   */
  async getUploadedFiles(chatId?: string): Promise<FileRecord[]> {
    await this.ensureInitialized();

    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId!,
      range: `${this.UPLOADED_FILES_SHEET}!A2:H`
    });

    const values = response.data.values || [];
    const files: FileRecord[] = values.map(row => ({
      fileHash: row[0] || '',
      fileName: row[1] || '',
      filePath: row[2] || '',
      fileSize: parseInt(row[3]) || 0,
      uploadDate: row[4] || '',
      googleId: row[5] || '',
      mimeType: row[6] || '',
      chatId: row[7] || undefined
    }));

    if (chatId) {
      return files.filter(f => f.chatId === chatId);
    }
    
    return files;
  }

  /**
   * Get upload progress for a chat
   */
  async getProgress(chatId: string): Promise<ProgressRecord | null> {
    await this.ensureInitialized();

    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId!,
      range: `${this.PROGRESS_SHEET}!A2:G`
    });

    const values = response.data.values || [];
    const row = values.find(r => r[0] === chatId);
    
    if (!row) return null;

    return {
      chatId: row[0],
      lastProcessedFile: row[1] || '',
      totalFiles: parseInt(row[2]) || 0,
      processedFiles: parseInt(row[3]) || 0,
      status: (row[4] || 'active') as ProgressRecord['status'],
      lastUpdated: row[5] || new Date().toISOString(),
      errorMessage: row[6] || undefined
    };
  }

  /**
   * Update upload progress for a chat
   */
  async updateProgress(progress: ProgressRecord): Promise<void> {
    await this.ensureInitialized();

    // First, find if the chat already has a progress record
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId!,
      range: `${this.PROGRESS_SHEET}!A:A`
    });

    const chatIds = response.data.values || [];
    const rowIndex = chatIds.findIndex(row => row[0] === progress.chatId);

    if (rowIndex === -1) {
      // Add new progress record
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId!,
        range: `${this.PROGRESS_SHEET}!A:G`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [[
            progress.chatId,
            progress.lastProcessedFile,
            progress.totalFiles,
            progress.processedFiles,
            progress.status,
            progress.lastUpdated,
            progress.errorMessage || ''
          ]]
        }
      });
    } else {
      // Update existing record (rowIndex + 1 because of 0-based index, +1 for header)
      const updateRange = `${this.PROGRESS_SHEET}!A${rowIndex + 2}:G${rowIndex + 2}`;
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId!,
        range: updateRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            progress.chatId,
            progress.lastProcessedFile,
            progress.totalFiles,
            progress.processedFiles,
            progress.status,
            progress.lastUpdated,
            progress.errorMessage || ''
          ]]
        }
      });
    }
  }

  /**
   * Clear all data (for testing)
   */
  async clearAll(): Promise<void> {
    await this.ensureInitialized();

    await this.sheets.spreadsheets.values.clear({
      spreadsheetId: this.spreadsheetId!,
      range: `${this.UPLOADED_FILES_SHEET}!A2:H`
    });

    await this.sheets.spreadsheets.values.clear({
      spreadsheetId: this.spreadsheetId!,
      range: `${this.PROGRESS_SHEET}!A2:G`
    });
  }

  /**
   * Get database statistics
   */
  async getStatistics(): Promise<{ totalFiles: number; totalChats: number }> {
    await this.ensureInitialized();

    const filesResponse = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId!,
      range: `${this.UPLOADED_FILES_SHEET}!A2:A`
    });

    const progressResponse = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId!,
      range: `${this.PROGRESS_SHEET}!A2:A`
    });

    return {
      totalFiles: (filesResponse.data.values || []).length,
      totalChats: (progressResponse.data.values || []).length
    };
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get the spreadsheet URL for viewing in browser
   */
  getSpreadsheetUrl(): string | null {
    if (!this.spreadsheetId) return null;
    return `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`;
  }

  // AIDEV-NOTE: Chat metadata Google Sheets integration methods (TASK-023)

  /**
   * Create or find chat metadata spreadsheet in Google Drive
   * Creates spreadsheet at path: /WhatsApp Google Uploader/chats
   */
  async createChatMetadataSheet(): Promise<string> {
    const drive = google.drive({ version: 'v3', auth: this.auth });

    // AIDEV-NOTE: First, find or create the "WhatsApp Google Uploader" folder
    const parentFolderResponse = await drive.files.list({
      q: `name='WhatsApp Google Uploader' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)'
    });

    let parentFolderId: string;
    if (parentFolderResponse.data.files && parentFolderResponse.data.files.length > 0) {
      const firstFolder = parentFolderResponse.data.files[0];
      if (firstFolder?.id) {
        parentFolderId = firstFolder.id;
      } else {
        throw new Error('Found folder but no ID available');
      }
    } else {
      // Create the parent folder
      const folderResponse = await drive.files.create({
        requestBody: {
          name: 'WhatsApp Google Uploader',
          mimeType: 'application/vnd.google-apps.folder'
        }
      });
      if (!folderResponse.data.id) {
        throw new Error('Failed to create parent folder - no ID returned');
      }
      parentFolderId = folderResponse.data.id;
    }

    // AIDEV-NOTE: Search for existing chat metadata spreadsheet
    const searchResponse = await drive.files.list({
      q: `name='${this.CHAT_METADATA_SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and '${parentFolderId}' in parents and trashed=false`,
      fields: 'files(id, name)'
    });

    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      const existingFile = searchResponse.data.files[0];
      if (existingFile?.id) {
        this.chatMetadataSpreadsheetId = existingFile.id;
        return existingFile.id;
      }
    }

    // AIDEV-NOTE: Create new chat metadata spreadsheet with Portuguese headers
    const createResponse = await this.sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: this.CHAT_METADATA_SPREADSHEET_NAME
        },
        sheets: [{
          properties: {
            title: this.CHAT_METADATA_SHEET,
            gridProperties: { rowCount: 1000, columnCount: 14 }
          }
        }]
      }
    });

    if (!createResponse.data.spreadsheetId) {
      throw new Error('Failed to create chat metadata spreadsheet - no ID returned');
    }
    const newSpreadsheetId = createResponse.data.spreadsheetId;
    this.chatMetadataSpreadsheetId = newSpreadsheetId;

    // AIDEV-NOTE: Move to the correct folder
    await drive.files.update({
      fileId: newSpreadsheetId,
      addParents: parentFolderId
    });

    // AIDEV-NOTE: Initialize with Portuguese column headers
    await this.initializeChatMetadataHeaders(newSpreadsheetId);

    return newSpreadsheetId;
  }

  /**
   * Initialize chat metadata sheet with Portuguese column headers
   */
  private async initializeChatMetadataHeaders(spreadsheetId: string): Promise<void> {
    // AIDEV-NOTE: Portuguese column labels as specified in requirements
    const headers = [
      PORTUGUESE_COLUMN_LABELS.chatName,
      PORTUGUESE_COLUMN_LABELS.chatJid,
      PORTUGUESE_COLUMN_LABELS.chatType,
      PORTUGUESE_COLUMN_LABELS.msgstoreDate,
      PORTUGUESE_COLUMN_LABELS.lastSyncDate,
      PORTUGUESE_COLUMN_LABELS.lastUploadedFile,
      PORTUGUESE_COLUMN_LABELS.syncedFilesCount,
      PORTUGUESE_COLUMN_LABELS.failedUploadsCount,
      PORTUGUESE_COLUMN_LABELS.photosAlbumName,
      PORTUGUESE_COLUMN_LABELS.photosAlbumLink,
      PORTUGUESE_COLUMN_LABELS.driveDirectoryName,
      PORTUGUESE_COLUMN_LABELS.driveDirectoryLink,
      PORTUGUESE_COLUMN_LABELS.syncEnabled,
      PORTUGUESE_COLUMN_LABELS.maxMediaAgeDays
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${this.CHAT_METADATA_SHEET}!A1:N1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers]
      }
    });

    // AIDEV-NOTE: Format header row for better readability
    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          repeatCell: {
            range: {
              sheetId: 0, // First sheet
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: 14
            },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
                backgroundColor: { red: 0.8, green: 0.8, blue: 0.8 }
              }
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)'
          }
        }]
      }
    });
  }

  /**
   * Save chat metadata to Google Sheets
   */
  async saveChatMetadata(chatMetadata: ChatMetadata[]): Promise<void> {
    if (chatMetadata.length === 0) {
      console.log('ℹ️  No chat metadata to save');
      return;
    }

    // AIDEV-NOTE: Ensure chat metadata spreadsheet exists
    if (!this.chatMetadataSpreadsheetId) {
      await this.createChatMetadataSheet();
    }

    // AIDEV-NOTE: Clear existing data (except headers) and insert new data
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId: this.chatMetadataSpreadsheetId!,
      range: `${this.CHAT_METADATA_SHEET}!A2:N`
    });

    // AIDEV-NOTE: Convert chat metadata to sheet rows
    const rows = chatMetadata.map(chat => [
      chat.chatName,
      chat.chatJid,
      chat.chatType,
      chat.msgstoreDate.toISOString().split('T')[0], // Date only
      chat.lastSyncDate ? chat.lastSyncDate.toISOString().split('T')[0] : '',
      chat.lastUploadedFile || '',
      chat.syncedFilesCount,
      chat.failedUploadsCount,
      chat.photosAlbumName || '',
      chat.photosAlbumLink || '',
      chat.driveDirectoryName || '',
      chat.driveDirectoryLink || '',
      chat.syncEnabled,
      chat.maxMediaAgeDays
    ]);

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.chatMetadataSpreadsheetId!,
      range: `${this.CHAT_METADATA_SHEET}!A2:N`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: rows
      }
    });

    console.log(`✓ Saved metadata for ${chatMetadata.length} chats to Google Sheets`);
  }

  /**
   * Get chat metadata spreadsheet URL for viewing
   */
  getChatMetadataSpreadsheetUrl(): string | null {
    if (!this.chatMetadataSpreadsheetId) return null;
    return `https://docs.google.com/spreadsheets/d/${this.chatMetadataSpreadsheetId}/edit`;
  }

  /**
   * Initialize chat metadata functionality (separate from main database)
   */
  async initializeChatMetadata(): Promise<void> {
    await this.createChatMetadataSheet();
  }
}

// Export factory function
export async function createSheetsDatabase(auth: OAuth2Client): Promise<SheetsDatabase> {
  const db = new SheetsDatabase(auth);
  await db.initialize();
  return db;
}