/**
 * Google Sheets Database Implementation
 * Uses Google Sheets as a cloud-based database for persistence
 */

import { google, sheets_v4 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { ChatMetadata, PORTUGUESE_COLUMN_LABELS, ChatFileInfo } from '../chat-metadata/types.js';

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

    // AIDEV-NOTE: Create new chat metadata spreadsheet with Portuguese headers and documentation
    const createResponse = await this.sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: this.CHAT_METADATA_SPREADSHEET_NAME
        },
        sheets: [
          {
            properties: {
              title: this.CHAT_METADATA_SHEET,
              gridProperties: { rowCount: 1000, columnCount: 33 }
            }
          },
          {
            properties: {
              title: 'Documentação',
              gridProperties: { rowCount: 50, columnCount: 3 }
            }
          }
        ]
      }
    });

    if (!createResponse.data.spreadsheetId) {
      throw new Error('Failed to create chat metadata spreadsheet - no ID returned');
    }
    const newSpreadsheetId = createResponse.data.spreadsheetId;
    this.chatMetadataSpreadsheetId = newSpreadsheetId;

    // AIDEV-NOTE: Get the actual sheet ID from the created spreadsheet (TASK-023 fix)
    const sheetId = createResponse.data.sheets?.[0]?.properties?.sheetId;
    if (sheetId === undefined || sheetId === null) {
      throw new Error('Failed to get sheet ID from created spreadsheet');
    }

    // AIDEV-NOTE: Move to the correct folder
    await drive.files.update({
      fileId: newSpreadsheetId,
      addParents: parentFolderId
    });

    // AIDEV-NOTE: Initialize with Portuguese column headers, passing the actual sheet ID
    await this.initializeChatMetadataHeaders(newSpreadsheetId, sheetId);

    // AIDEV-NOTE: Initialize documentation sheet with column descriptions
    await this.initializeDocumentationSheet(newSpreadsheetId);

    return newSpreadsheetId;
  }

  /**
   * Initialize chat metadata sheet with Portuguese column headers
   */
  private async initializeChatMetadataHeaders(spreadsheetId: string, sheetId: number): Promise<void> {
    // AIDEV-NOTE: Portuguese column labels with enhanced columns
    const headers = [
      // Identificação
      PORTUGUESE_COLUMN_LABELS.chatName,
      PORTUGUESE_COLUMN_LABELS.chatJid,
      PORTUGUESE_COLUMN_LABELS.chatType,
      PORTUGUESE_COLUMN_LABELS.msgstoreDate,
      // Estatísticas
      PORTUGUESE_COLUMN_LABELS.totalMessages,
      PORTUGUESE_COLUMN_LABELS.firstMessageDate,
      PORTUGUESE_COLUMN_LABELS.lastMessageDate,
      PORTUGUESE_COLUMN_LABELS.createdDate,
      // Controle de Arquivos
      PORTUGUESE_COLUMN_LABELS.totalMediaCount,
      PORTUGUESE_COLUMN_LABELS.totalMediaSizeMB,
      PORTUGUESE_COLUMN_LABELS.photosCount,
      PORTUGUESE_COLUMN_LABELS.photosSizeMB,
      PORTUGUESE_COLUMN_LABELS.videosCount,
      PORTUGUESE_COLUMN_LABELS.videosSizeMB,
      PORTUGUESE_COLUMN_LABELS.audiosCount,
      PORTUGUESE_COLUMN_LABELS.audiosSizeMB,
      PORTUGUESE_COLUMN_LABELS.documentsCount,
      PORTUGUESE_COLUMN_LABELS.documentsSizeMB,
      PORTUGUESE_COLUMN_LABELS.lastVerificationDate,
      // Status de Sincronização
      PORTUGUESE_COLUMN_LABELS.lastSyncDate,
      PORTUGUESE_COLUMN_LABELS.lastUploadedFile,
      PORTUGUESE_COLUMN_LABELS.syncedFilesCount,
      PORTUGUESE_COLUMN_LABELS.failedUploadsCount,
      PORTUGUESE_COLUMN_LABELS.uploadStatus,
      PORTUGUESE_COLUMN_LABELS.uploadProgress,
      PORTUGUESE_COLUMN_LABELS.uploadRetryCount,
      // Google Services
      PORTUGUESE_COLUMN_LABELS.photosAlbumName,
      PORTUGUESE_COLUMN_LABELS.photosAlbumLink,
      PORTUGUESE_COLUMN_LABELS.driveDirectoryName,
      PORTUGUESE_COLUMN_LABELS.driveDirectoryLink,
      // Configurações
      PORTUGUESE_COLUMN_LABELS.syncEnabled,
      PORTUGUESE_COLUMN_LABELS.maxMediaAgeDays,
      // Organização
      PORTUGUESE_COLUMN_LABELS.category,
      PORTUGUESE_COLUMN_LABELS.isArchived,
      PORTUGUESE_COLUMN_LABELS.notes
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${this.CHAT_METADATA_SHEET}!A1:AK1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers]
      }
    });
  }

  /**
   * Initialize documentation sheet with column descriptions
   * AIDEV-NOTE: Creates a documentation sheet explaining each column
   */
  private async initializeDocumentationSheet(spreadsheetId: string): Promise<void> {
    const documentation = [
      ['Coluna', 'Tipo', 'Descrição'],
      ['', '', ''],
      ['--- IDENTIFICAÇÃO ---', '', ''],
      ['Nome do Chat', 'Texto', 'Nome do contato ou grupo conforme aparece no WhatsApp'],
      ['ID WhatsApp (JID)', 'Texto', 'Identificador único do chat no sistema WhatsApp'],
      ['Tipo (Individual/Grupo)', 'Texto', 'Se é conversa individual ou grupo'],
      ['Data do Backup', 'Data', 'Data quando o backup msgstore.db foi criado'],
      ['', '', ''],
      ['--- ESTATÍSTICAS ---', '', ''],
      ['Total de Mensagens', 'Número', 'Quantidade total de mensagens no chat'],
      ['Primeira Mensagem', 'Data/Hora', 'Data e hora da primeira mensagem do chat'],
      ['Última Mensagem', 'Data/Hora', 'Data e hora da última mensagem do chat'],
      ['Data de Criação', 'Data', 'Quando o chat/grupo foi criado'],
      ['', '', ''],
      ['--- CONTROLE DE ARQUIVOS ---', '', ''],
      ['Total de Mídias', 'Número', 'Quantidade total de arquivos de mídia'],
      ['Tamanho Total (MB)', 'Número', 'Espaço total ocupado pelos arquivos em megabytes'],
      ['Qtd Fotos', 'Número', 'Quantidade de fotos no chat'],
      ['Qtd Vídeos', 'Número', 'Quantidade de vídeos no chat'],
      ['Qtd Áudios', 'Número', 'Quantidade de áudios no chat'],
      ['Qtd Documentos', 'Número', 'Quantidade de documentos no chat'],
      ['Última Verificação', 'Data/Hora', 'Quando foi feita a última varredura de arquivos'],
      ['', '', ''],
      ['--- STATUS DE SINCRONIZAÇÃO ---', '', ''],
      ['Última Sincronização', 'Data/Hora', 'Última vez que os arquivos foram sincronizados'],
      ['Último Arquivo Enviado', 'Texto', 'Nome do último arquivo enviado para o Google'],
      ['Arquivos Sincronizados', 'Número', 'Quantidade de arquivos já enviados'],
      ['Falhas de Upload', 'Número', 'Quantidade de arquivos que falharam no envio'],
      ['Status de Upload', 'Texto', 'Pendente/Em Progresso/Completo/Erro'],
      ['Progresso (%)', 'Percentual', 'Percentual de arquivos já enviados (0-100)'],
      ['Tentativas de Upload', 'Número', 'Contador de tentativas com falha'],
      ['', '', ''],
      ['--- GOOGLE SERVICES ---', '', ''],
      ['Álbum Google Photos', 'Texto', 'Nome do álbum criado no Google Photos'],
      ['Link do Álbum', 'URL', 'Link direto para o álbum no Google Photos'],
      ['Pasta Google Drive', 'Texto', 'Nome da pasta criada no Google Drive'],
      ['Link da Pasta', 'URL', 'Link direto para a pasta no Google Drive'],
      ['', '', ''],
      ['--- CONFIGURAÇÕES ---', '', ''],
      ['Sincronização Ativa', 'Sim/Não', 'Se o chat deve ser sincronizado automaticamente'],
      ['Retenção (dias)', 'Número', 'Quantos dias manter arquivos antigos (padrão: 90)'],
      ['', '', ''],
      ['--- ORGANIZAÇÃO ---', '', ''],
      ['Categoria', 'Lista', 'Família/Trabalho/Amigos/Clientes/Outros'],
      ['Arquivado', 'Sim/Não', 'Se o chat está arquivado no WhatsApp'],
      ['Observações', 'Texto', 'Campo livre para anotações do usuário']
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Documentação!A1:C46',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: documentation
      }
    });
  }

  /**
   * Read existing chat metadata from Google Sheets
   * AIDEV-NOTE: Reads current data to preserve user settings and sync status
   */
  private async readExistingChatMetadata(): Promise<Map<string, any>> {
    const existingData = new Map<string, any>();

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.chatMetadataSpreadsheetId!,
        range: `${this.CHAT_METADATA_SHEET}!A2:AK`
      });

      const rows = response.data.values || [];

      // AIDEV-NOTE: Map existing data by chatJid (column B, index 1)
      rows.forEach(row => {
        if (row[1]) { // chatJid
          existingData.set(row[1], {
            // AIDEV-NOTE: preserve-edited-name; preserve manually edited chat name from column A
            chatName: row[0] || '', // Column A - chat name that may have been edited
            // Preserve sync status (columns 16-22)
            lastSyncDate: row[15] || '',
            lastUploadedFile: row[16] || '',
            syncedFilesCount: parseInt(row[17]) || 0,
            failedUploadsCount: parseInt(row[18]) || 0,
            uploadStatus: row[19] || 'Pendente',
            uploadProgress: parseInt(row[20]) || 0,
            uploadRetryCount: parseInt(row[21]) || 0,
            // Preserve Google services (columns 23-26)
            photosAlbumName: row[22] || '',
            photosAlbumLink: row[23] || '',
            driveDirectoryName: row[24] || '',
            driveDirectoryLink: row[25] || '',
            // Preserve user settings (columns 27-28)
            syncEnabled: row[26] === 'true' || row[26] === true,
            maxMediaAgeDays: parseInt(row[27]) || 90,
            // Preserve organization (columns 29-31)
            category: row[28] || '',
            isArchived: row[29] === 'true' || row[29] === true,
            notes: row[30] || ''
          });
        }
      });
    } catch (error) {
      // If sheet doesn't exist or error reading, return empty map
      console.log('No existing data to preserve');
    }

    return existingData;
  }

  /**
   * Merge new chat metadata with existing preserving important fields
   * AIDEV-NOTE: Intelligent merge that updates stats but preserves user data
   */
  private mergeWithExisting(newChat: ChatMetadata, existing: any): ChatMetadata {
    return {
      ...newChat,
      // AIDEV-NOTE: manual-name-edit; preserve manually edited chat name if it exists
      chatName: existing?.chatName || newChat.chatName,
      // Preserve sync status if exists
      lastSyncDate: existing?.lastSyncDate ? new Date(existing.lastSyncDate) : undefined,
      lastUploadedFile: existing?.lastUploadedFile || newChat.lastUploadedFile,
      syncedFilesCount: existing?.syncedFilesCount || newChat.syncedFilesCount,
      failedUploadsCount: existing?.failedUploadsCount || newChat.failedUploadsCount,
      uploadStatus: existing?.uploadStatus || newChat.uploadStatus,
      uploadProgress: existing?.uploadProgress || newChat.uploadProgress,
      uploadRetryCount: existing?.uploadRetryCount || newChat.uploadRetryCount,
      // Preserve Google services
      photosAlbumName: existing?.photosAlbumName || newChat.photosAlbumName,
      photosAlbumLink: existing?.photosAlbumLink || newChat.photosAlbumLink,
      driveDirectoryName: existing?.driveDirectoryName || newChat.driveDirectoryName,
      driveDirectoryLink: existing?.driveDirectoryLink || newChat.driveDirectoryLink,
      // Preserve user settings
      syncEnabled: existing?.syncEnabled !== undefined ? existing.syncEnabled : newChat.syncEnabled,
      maxMediaAgeDays: existing?.maxMediaAgeDays || newChat.maxMediaAgeDays,
      // Preserve organization
      category: existing?.category || newChat.category,
      isArchived: existing?.isArchived !== undefined ? existing.isArchived : newChat.isArchived,
      notes: existing?.notes || newChat.notes
    };
  }

  /**
   * Save chat metadata to Google Sheets
   */
  async saveChatMetadata(chatMetadata: ChatMetadata[]): Promise<void> {
    if (chatMetadata.length === 0) {
      console.log('ℹ️  No chat metadata to save');
      return;
    }

    console.log('\n☁️  Saving to Google Sheets...');

    // AIDEV-NOTE: Ensure chat metadata spreadsheet exists
    if (!this.chatMetadataSpreadsheetId) {
      console.log('  📄 Creating new spreadsheet...');
      await this.createChatMetadataSheet();
    }

    // AIDEV-NOTE: Read existing data to preserve user settings and sync status
    console.log('  📖 Reading existing data to preserve user settings...');
    const existingData = await this.readExistingChatMetadata();

    // AIDEV-NOTE: Merge new data with existing preserving important fields
    console.log('  🔄 Merging with existing data...');
    const mergedMetadata = chatMetadata.map(chat => {
      const existing = existingData.get(chat.chatJid);
      return existing ? this.mergeWithExisting(chat, existing) : chat;
    });

    // AIDEV-NOTE: Clear and rewrite with merged data (extended range for new columns)
    console.log('  🧹 Clearing old data...');
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId: this.chatMetadataSpreadsheetId!,
      range: `${this.CHAT_METADATA_SHEET}!A2:AK`
    });

    // AIDEV-NOTE: Convert merged metadata to sheet rows with all enhanced columns
    const rows = mergedMetadata.map(chat => [
      // Identificação
      chat.chatName,
      chat.chatJid,
      chat.chatType,
      chat.msgstoreDate.toISOString().split('T')[0],
      // Estatísticas
      chat.totalMessages,
      chat.firstMessageDate ? chat.firstMessageDate.toISOString() : '',
      chat.lastMessageDate ? chat.lastMessageDate.toISOString() : '',
      chat.createdDate ? chat.createdDate.toISOString() : '',
      // Controle de Arquivos
      chat.totalMediaCount,
      chat.totalMediaSizeMB,
      chat.photosCount,
      chat.photosSizeMB,
      chat.videosCount,
      chat.videosSizeMB,
      chat.audiosCount,
      chat.audiosSizeMB,
      chat.documentsCount,
      chat.documentsSizeMB,
      chat.lastVerificationDate ? chat.lastVerificationDate.toISOString() : '',
      // Status de Sincronização
      chat.lastSyncDate ? chat.lastSyncDate.toISOString() : '',
      chat.lastUploadedFile || '',
      chat.syncedFilesCount,
      chat.failedUploadsCount,
      chat.uploadStatus,
      chat.uploadProgress,
      chat.uploadRetryCount,
      // Google Services
      chat.photosAlbumName || '',
      chat.photosAlbumLink || '',
      chat.driveDirectoryName || '',
      chat.driveDirectoryLink || '',
      // Configurações
      chat.syncEnabled,
      chat.maxMediaAgeDays,
      // Organização
      chat.category || '',
      chat.isArchived,
      chat.notes || ''
    ]);

    console.log(`  ✍️  Writing ${rows.length} rows to spreadsheet...`);

    // Write in batches to show progress
    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, Math.min(i + batchSize, rows.length));
      process.stdout.write(`\r  ⏳ Uploading: ${Math.min(i + batchSize, rows.length)}/${rows.length} chats (${Math.round(Math.min(i + batchSize, rows.length)/rows.length*100)}%)`);

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.chatMetadataSpreadsheetId!,
        range: `${this.CHAT_METADATA_SHEET}!A2:AK`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: batch
        }
      });
    }

    console.log(`\r  ✅ Successfully saved ${mergedMetadata.length} chats to Google Sheets!              `);
    console.log(`     📊 ${existingData.size} existing chats preserved with their settings`);
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

  /**
   * Update Google Photos album info for a specific chat
   * AIDEV-NOTE: Updates album ID and link to avoid re-searching on next upload
   */
  async updateChatAlbumInfo(chatJid: string, albumId: string, albumName: string): Promise<void> {
    if (!this.chatMetadataSpreadsheetId) {
      console.warn('Chat metadata spreadsheet not initialized');
      return;
    }

    try {
      // Get all chats to find the row for this JID
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.chatMetadataSpreadsheetId,
        range: `${this.CHAT_METADATA_SHEET}!B:B` // Column B has JIDs
      });

      const jids = response.data.values || [];
      const rowIndex = jids.findIndex(row => row[0] === chatJid);

      if (rowIndex === -1) {
        console.warn(`Chat ${chatJid} not found in spreadsheet`);
        return;
      }

      // Update album name (column AA) and link (column AB)
      const actualRow = rowIndex + 1; // +1 because spreadsheet is 1-indexed
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.chatMetadataSpreadsheetId,
        range: `${this.CHAT_METADATA_SHEET}!AA${actualRow}:AB${actualRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            `${albumName}|${albumId}`, // Store ID with name
            `https://photos.google.com/album/${albumId}` // Album link
          ]]
        }
      });

      console.log(`✓ Updated album info for chat ${chatJid}`);
    } catch (error) {
      console.error('Failed to update chat album info:', error);
    }
  }

  /**
   * Update Google Drive folder info for a specific chat
   * AIDEV-NOTE: Updates folder ID and link to avoid re-searching on next upload
   */
  async updateChatDriveInfo(chatJid: string, folderId: string, folderName: string): Promise<void> {
    if (!this.chatMetadataSpreadsheetId) {
      console.warn('Chat metadata spreadsheet not initialized');
      return;
    }

    try {
      // Get all chats to find the row for this JID
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.chatMetadataSpreadsheetId,
        range: `${this.CHAT_METADATA_SHEET}!B:B` // Column B has JIDs
      });

      const jids = response.data.values || [];
      const rowIndex = jids.findIndex(row => row[0] === chatJid);

      if (rowIndex === -1) {
        console.warn(`Chat ${chatJid} not found in spreadsheet`);
        return;
      }

      // Update folder name (column AC) and link (column AD)
      const actualRow = rowIndex + 1; // +1 because spreadsheet is 1-indexed
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.chatMetadataSpreadsheetId,
        range: `${this.CHAT_METADATA_SHEET}!AC${actualRow}:AD${actualRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            `${folderName}|${folderId}`, // Store ID with name
            `https://drive.google.com/drive/folders/${folderId}` // Folder link
          ]]
        }
      });

      console.log(`✓ Updated Drive folder info for chat ${chatJid}`);
    } catch (error) {
      console.error('Failed to update chat Drive info:', error);
    }
  }

  /**
   * Get Google Photos album ID and Drive folder ID for a chat
   * AIDEV-NOTE: Retrieves stored IDs to avoid API calls
   */
  async getChatGoogleInfo(chatJid: string): Promise<{ albumId?: string; folderId?: string } | null> {
    if (!this.chatMetadataSpreadsheetId) {
      return null;
    }

    try {
      // Get all chats to find the row for this JID
      // AIDEV-NOTE: jid-lookup-fix; fetch B:AD to get JID and album/folder info
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.chatMetadataSpreadsheetId,
        range: `${this.CHAT_METADATA_SHEET}!B:AD` // B=JID, AA=album, AC=folder
      });

      const rows = response.data.values || [];
      // AIDEV-NOTE: row-reordering-support; use JID lookup instead of position
      const chatRow = rows.find(row => row[0] === chatJid); // Column B is index 0 when fetching B:AD

      if (!chatRow) {
        return null;
      }

      const result: { albumId?: string; folderId?: string } = {};

      // Extract album ID from column AA (26th letter = index 25 from B)
      // When fetching B:AD, column AA is at index 25 (B=0, C=1... AA=25)
      if (chatRow[25]) {
        const albumData = chatRow[25].split('|');
        if (albumData.length > 1) {
          result.albumId = albumData[1];
        }
      }

      // Extract folder ID from column AC (28th letter = index 27 from B)
      // When fetching B:AD, column AC is at index 27 (B=0, C=1... AC=27)
      if (chatRow[27]) {
        const folderData = chatRow[27].split('|');
        if (folderData.length > 1) {
          result.folderId = folderData[1];
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to get chat Google info:', error);
      return null;
    }
  }

  // AIDEV-NOTE: Per-Chat Google Sheets Integration (TASK-025)
  // Methods for creating individual chat file tracking spreadsheets

  /**
   * Portuguese column headers for per-chat file tracking sheets
   * Maps exactly to ChatFileInfo interface as specified in TASK-025
   * AIDEV-NOTE: Album/folder info stored in main chats table, not here (TASK-023)
   */
  private readonly CHAT_FILE_COLUMNS = [
    'id do arquivo',                 // messageId
    'nome do arquivo',              // fileName
    'tipo de arquivo',              // mediaType
    'tamanho do arquivo',           // size/actualSize
    'hash do arquivo',              // fileHash (TASK-030: SHA-256 for duplicate detection)
    'data da mensagem',             // messageTimestamp
    'remetente',                    // senderJid
    'status do upload',             // uploadStatus
    'data do upload',               // uploadDate
    'arquivo deletado do celular',  // fileDeletedFromPhone
    'ultima mensagem de erro',      // uploadError
    'tentativas de upload',         // uploadAttempts
    'link do arquivo/midia'         // file/media link (populated during upload)
  ];

  /**
   * Create or find per-chat file tracking spreadsheet
   * Creates spreadsheet at path: /WhatsApp Google Uploader/[chat_name]_[JID]
   * @param chatJid Chat JID (e.g. "5511999999999@s.whatsapp.net")
   * @param chatName Chat display name for sheet naming
   * @returns Spreadsheet ID
   */
  async createChatFileSheet(chatJid: string, chatName: string): Promise<string> {
    const drive = google.drive({ version: 'v3', auth: this.auth });

    // AIDEV-NOTE: Find or create the "WhatsApp Google Uploader" parent folder
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

    // AIDEV-NOTE: Generate sheet name from chat name and JID
    const sheetName = this.sanitizeChatSheetName(chatName, chatJid);

    // AIDEV-NOTE: Search for existing chat file spreadsheet
    const searchResponse = await drive.files.list({
      q: `name='${sheetName}' and mimeType='application/vnd.google-apps.spreadsheet' and '${parentFolderId}' in parents and trashed=false`,
      fields: 'files(id, name)'
    });

    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      const existingFile = searchResponse.data.files[0];
      if (existingFile?.id) {
        return existingFile.id;
      }
    }

    // AIDEV-NOTE: Create new chat file tracking spreadsheet
    const createResponse = await this.sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: sheetName
        },
        sheets: [
          {
            properties: {
              title: 'Arquivos',
              gridProperties: { rowCount: 10000, columnCount: 13 }
            }
          }
        ]
      }
    });

    if (!createResponse.data.spreadsheetId) {
      throw new Error('Failed to create chat file spreadsheet - no ID returned');
    }
    const newSpreadsheetId = createResponse.data.spreadsheetId;

    // AIDEV-NOTE: Move to the correct folder
    await drive.files.update({
      fileId: newSpreadsheetId,
      addParents: parentFolderId
    });

    // AIDEV-NOTE: Initialize with Portuguese column headers
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: newSpreadsheetId,
      range: 'Arquivos!A1:M1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [this.CHAT_FILE_COLUMNS]
      }
    });

    return newSpreadsheetId;
  }

  /**
   * Save chat files to per-chat spreadsheet
   * Creates/updates spreadsheet with file tracking data
   * @param chatJid Chat JID for sheet identification
   * @param chatName Chat display name for sheet naming
   * @param files Array of ChatFileInfo to save
   */
  async saveChatFiles(chatJid: string, chatName: string, files: ChatFileInfo[]): Promise<void> {
    if (files.length === 0) {
      console.log(`ℹ️  No files to save for chat: ${chatName}`);
      return;
    }

    // AIDEV-NOTE: Create or get existing spreadsheet
    const spreadsheetId = await this.createChatFileSheet(chatJid, chatName);

    // AIDEV-NOTE: Read existing data to avoid duplicates and preserve user edits
    const existingData = await this.readExistingChatFiles(spreadsheetId);

    // AIDEV-NOTE: Merge new files with existing, updating by messageId
    const mergedFiles = this.mergeChatFiles(files, existingData);

    // AIDEV-NOTE: Clear and rewrite with merged data
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Arquivos!A2:M'
    });

    // AIDEV-NOTE: Convert ChatFileInfo to sheet rows
    const rows = mergedFiles.map(file => this.transformChatFileToRow(file));

    await this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Arquivos!A2:M',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: rows
      }
    });

    console.log(`✓ Updated ${mergedFiles.length} files for chat: ${chatName} (${existingData.size} existing preserved)`);
  }

  /**
   * Update upload status for a specific file in chat spreadsheet
   * @param chatJid Chat JID
   * @param chatName Chat display name
   * @param fileId Message ID of the file
   * @param status New upload status and tracking info
   */
  async updateFileUploadStatus(
    chatJid: string,
    chatName: string,
    fileId: string,
    status: {
      uploadStatus: 'pending' | 'uploaded' | 'failed' | 'skipped';
      uploadDate?: Date;
      uploadError?: string;
      uploadAttempts?: number;
      directoryName?: string;
      directoryLink?: string;
      fileLink?: string;
      fileDeletedFromPhone?: boolean;
    }
  ): Promise<void> {
    try {
      // AIDEV-NOTE: Get or create spreadsheet
      const spreadsheetId = await this.createChatFileSheet(chatJid, chatName);

      // AIDEV-NOTE: Find the row for this file ID
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Arquivos!A:A'
      });

      const fileIds = response.data.values || [];
      const rowIndex = fileIds.findIndex(row => row[0] === fileId);

      if (rowIndex === -1) {
        console.warn(`File ID ${fileId} not found in chat ${chatName} spreadsheet`);
        return;
      }

      // AIDEV-NOTE: Update specific columns (H-M) for upload tracking (TASK-030: updated after hash column insertion)
      const updateRow = rowIndex + 1; // Convert to 1-based index
      const updateRange = `Arquivos!H${updateRow}:M${updateRow}`;

      const updateValues = [
        status.uploadStatus || 'pending',                              // H: status do upload
        status.uploadDate ? status.uploadDate.toISOString() : '',     // I: data do upload
        status.fileDeletedFromPhone || false,                         // J: arquivo deletado do celular
        status.uploadError || '',                                      // K: ultima mensagem de erro
        status.uploadAttempts || 0,                                    // L: tentativas de upload
        status.fileLink || ''                                          // M: link do arquivo/midia
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: updateRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [updateValues]
        }
      });

      console.log(`✓ Updated upload status for file ${fileId} in chat: ${chatName}`);

    } catch (error) {
      console.error(`Failed to update upload status for file ${fileId}:`, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Get chat file spreadsheet URL for viewing
   * @param chatJid Chat JID
   * @param chatName Chat display name
   * @returns Spreadsheet URL or null if not found
   */
  async getChatFileSheetUrl(chatJid: string, chatName: string): Promise<string | null> {
    try {
      const spreadsheetId = await this.createChatFileSheet(chatJid, chatName);
      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    } catch (error) {
      console.error(`Failed to get chat file sheet URL:`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Sanitize chat name and JID for Google Sheets filename
   * @param chatName Chat display name
   * @param chatJid Chat JID
   * @returns Sanitized sheet name
   */
  private sanitizeChatSheetName(chatName: string, chatJid: string): string {
    // AIDEV-NOTE: Clean chat name for filename compatibility
    const cleanChatName = chatName
      .trim()
      .replace(/[\\/*?:"<>|]/g, '_')  // Replace invalid filename chars
      .replace(/\s+/g, ' ')            // Collapse multiple spaces
      .substring(0, 50);               // Limit length

    // AIDEV-NOTE: Extract just the number/ID part from JID for brevity
    const cleanJid = chatJid.split('@')[0]; // e.g. "5511999999999@s.whatsapp.net" -> "5511999999999"

    return `${cleanChatName}_${cleanJid}`;
  }

  /**
   * Transform ChatFileInfo to spreadsheet row format
   * @param file ChatFileInfo to transform
   * @returns Array of values for spreadsheet row
   */
  private transformChatFileToRow(file: ChatFileInfo): any[] {
    return [
      file.messageId,                                                 // A: id do arquivo
      file.fileName,                                                  // B: nome do arquivo
      file.mediaType,                                                 // C: tipo de arquivo
      file.actualSize || file.size || 0,                             // D: tamanho do arquivo
      file.fileHash || '',                                            // E: hash do arquivo (TASK-030)
      file.messageTimestamp.toISOString(),                           // F: data da mensagem
      file.senderJid || 'Você',                                      // G: remetente ("Você" for outgoing)
      file.uploadStatus,                                              // H: status do upload
      file.uploadDate ? file.uploadDate.toISOString() : '',          // I: data do upload
      file.fileDeletedFromPhone,                                      // J: arquivo deletado do celular
      file.uploadError || '',                                         // K: ultima mensagem de erro
      file.uploadAttempts,                                            // L: tentativas de upload
      ''                                                              // M: link do arquivo/midia (populated during upload)
    ];
  }

  /**
   * Read existing chat files from spreadsheet to preserve user edits
   * @param spreadsheetId Spreadsheet ID to read from
   * @returns Map of messageId -> existing row data
   */
  async readExistingChatFiles(spreadsheetId: string): Promise<Map<string, any>> {
    const existingData = new Map<string, any>();

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Arquivos!A2:M'
      });

      const rows = response.data.values || [];

      // AIDEV-NOTE: Map existing data by messageId (column A, index 0)
      // Column mapping after TASK-030 hash addition:
      // A(0): messageId, B(1): fileName, C(2): mediaType, D(3): size
      // E(4): hash, F(5): messageTimestamp, G(6): senderJid
      // H(7): uploadStatus, I(8): uploadDate, J(9): fileDeletedFromPhone
      // K(10): uploadError, L(11): uploadAttempts, M(12): fileLink
      rows.forEach(row => {
        if (row[0]) { // messageId
          existingData.set(row[0], {
            // Preserve file hash and upload tracking columns
            fileHash: row[4] || '', // E: hash do arquivo (index 4)
            uploadStatus: row[7] || 'pending', // H: status do upload (index 7)
            uploadDate: row[8] || '', // I: data do upload (index 8)
            fileDeletedFromPhone: row[9] === 'true' || row[9] === true, // J: arquivo deletado (index 9)
            uploadError: row[10] || '', // K: ultima mensagem de erro (index 10)
            uploadAttempts: parseInt(row[11]) || 0, // L: tentativas de upload (index 11)
            fileLink: row[12] || '' // M: link do arquivo/midia (index 12)
          });
        }
      });
    } catch (error) {
      // If sheet doesn't exist or error reading, return empty map
      console.log('No existing data to preserve for chat file sheet');
    }

    return existingData;
  }

  /**
   * Merge new chat files with existing data preserving upload tracking
   * @param newFiles New ChatFileInfo array from database
   * @param existingData Existing data from spreadsheet
   * @returns Merged ChatFileInfo array
   */
  private mergeChatFiles(newFiles: ChatFileInfo[], existingData: Map<string, any>): ChatFileInfo[] {
    return newFiles.map(file => {
      const existing = existingData.get(file.messageId);
      if (!existing) {
        return file; // New file, use as-is
      }

      // AIDEV-NOTE: Merge with existing upload tracking data and file hash (TASK-030)
      return {
        ...file,
        // Preserve file hash if available (TASK-030: SHA-256 for duplicate detection)
        fileHash: existing.fileHash || file.fileHash,
        // Preserve upload tracking from existing data
        uploadStatus: (existing.uploadStatus as ChatFileInfo['uploadStatus']) || file.uploadStatus,
        uploadDate: existing.uploadDate ? new Date(existing.uploadDate) : file.uploadDate,
        uploadError: existing.uploadError || file.uploadError,
        uploadAttempts: existing.uploadAttempts || file.uploadAttempts,
        fileDeletedFromPhone: existing.fileDeletedFromPhone !== undefined ? existing.fileDeletedFromPhone : file.fileDeletedFromPhone
      };
    });
  }
}

// Export factory function
export async function createSheetsDatabase(auth: OAuth2Client): Promise<SheetsDatabase> {
  const db = new SheetsDatabase(auth);
  await db.initialize();
  return db;
}