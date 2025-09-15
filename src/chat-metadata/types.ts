// AIDEV-NOTE: Chat metadata types for Google Sheets integration (TASK-023)
/**
 * Chat Metadata Types for WhatsApp Google Sheets Integration
 *
 * This module defines TypeScript interfaces for WhatsApp chat metadata
 * that will be stored in Google Sheets for tracking upload progress.
 *
 * @fileoverview Defines chat metadata structure with Portuguese column labels
 */

/**
 * Core chat metadata extracted from msgstore.db and used for Google Sheets tracking
 * Maps to 14 Portuguese columns as specified in TASK-023-dwarf-spec.md
 */
export interface ChatMetadata {
  // AIDEV-NOTE: Core chat identification from msgstore.db
  /** Chat JID from WhatsApp database (jid column) */
  chatJid: string;

  /** Chat display name from WhatsApp database (chat name) */
  chatName: string;

  /** Chat type: individual or group conversation */
  chatType: 'individual' | 'group';

  /** Date when msgstore.db was created/last modified */
  msgstoreDate: Date;

  // AIDEV-NOTE: Statistics metrics (extracted from msgstore.db)
  /** Total message count in the chat */
  totalMessages: number;

  /** Date/time of first message in chat */
  firstMessageDate?: Date;

  /** Date/time of last message in chat */
  lastMessageDate?: Date;

  /** Chat creation date */
  createdDate?: Date;

  // AIDEV-NOTE: File control metrics (calculated from actual files in directory)
  /** Total media files count */
  totalMediaCount: number;

  /** Total size of all media files in MB */
  totalMediaSizeMB: number;

  /** Count of photo files */
  photosCount: number;

  /** Total size of photo files in MB */
  photosSizeMB: number;

  /** Count of video files */
  videosCount: number;

  /** Total size of video files in MB */
  videosSizeMB: number;

  /** Count of audio files */
  audiosCount: number;

  /** Total size of audio files in MB */
  audiosSizeMB: number;

  /** Count of document files */
  documentsCount: number;

  /** Total size of document files in MB */
  documentsSizeMB: number;

  /** Last scan/verification timestamp */
  lastVerificationDate?: Date;

  // AIDEV-NOTE: Upload tracking fields (initially empty, populated during uploads)
  /** Last time this chat was synchronized with Google */
  lastSyncDate?: Date;

  /** Filename of the last file uploaded for this chat */
  lastUploadedFile?: string;

  /** Count of files successfully uploaded to Google for this chat */
  syncedFilesCount: number;

  /** Count of files that failed to upload for this chat */
  failedUploadsCount: number;

  /** Upload status: Pendente/Em Progresso/Completo/Erro */
  uploadStatus: 'Pendente' | 'Em Progresso' | 'Completo' | 'Erro';

  /** Upload progress percentage (0-100) */
  uploadProgress: number;

  /** Number of upload retry attempts */
  uploadRetryCount: number;

  // AIDEV-NOTE: Google service integration fields (initially empty)
  /** Name of Google Photos album created for this chat */
  photosAlbumName?: string;

  /** Google Photos album ID for quick access without searching */
  photosAlbumId?: string;

  /** Direct link to Google Photos album for this chat */
  photosAlbumLink?: string;

  /** Name of Google Drive folder created for this chat */
  driveDirectoryName?: string;

  /** Direct link to Google Drive folder for this chat */
  driveDirectoryLink?: string;

  // AIDEV-NOTE: User configuration fields with sensible defaults
  /** Whether this chat should be included in automated syncing */
  syncEnabled: boolean;

  /** Maximum age in days for media files to keep on phone (for cleanup) */
  maxMediaAgeDays: number;

  // AIDEV-NOTE: Organization and tags (user-configurable)
  /** Category: Família/Trabalho/Amigos/Clientes/Outros */
  category?: 'Família' | 'Trabalho' | 'Amigos' | 'Clientes' | 'Outros';

  /** Whether chat is archived in WhatsApp */
  isArchived: boolean;

  /** Free-form notes field for user observations */
  notes?: string;
}

/**
 * Raw chat data extracted directly from msgstore.db before processing
 * Used internally by ChatMetadataExtractor
 */
export interface RawChatData {
  /** JID (WhatsApp identifier) from jid table */
  jid: string;

  /** Display name from chat table */
  displayName: string;

  /** Chat type identifier (determines individual vs group) */
  chatType: number; // 0 = individual, 1 = group (WhatsApp database values)

  /** Creation timestamp from chat table */
  createdTimestamp?: number;

  /** Last message timestamp from chat table */
  lastMessageTimestamp?: number;
}

/**
 * Configuration for ChatMetadataExtractor
 * Allows customization of database paths and default values
 */
export interface ChatExtractorConfig {
  /** Path to decrypted msgstore.db file */
  msgstoreDbPath: string;

  /** Default values for new chat entries */
  defaults: {
    syncEnabled: boolean;
    maxMediaAgeDays: number;
    syncedFilesCount: number;
    failedUploadsCount: number;
  };
}

/**
 * Portuguese column labels for Google Sheets as specified by user
 * Maps ChatMetadata fields to Portuguese column headers
 */
export const PORTUGUESE_COLUMN_LABELS = {
  // Identificação
  chatName: 'Nome do Chat',
  chatJid: 'ID WhatsApp (JID)',
  chatType: 'Tipo (Individual/Grupo)',
  msgstoreDate: 'Data do Backup',

  // Estatísticas
  totalMessages: 'Total de Mensagens',
  firstMessageDate: 'Primeira Mensagem',
  lastMessageDate: 'Última Mensagem',
  createdDate: 'Data de Criação',

  // Controle de Arquivos
  totalMediaCount: 'Total de Mídias',
  totalMediaSizeMB: 'Tamanho Total (MB)',
  photosCount: 'Qtd Fotos',
  photosSizeMB: 'Tamanho Total Fotos (MB)',
  videosCount: 'Qtd Vídeos',
  videosSizeMB: 'Tamanho Total Vídeos (MB)',
  audiosCount: 'Qtd Áudios',
  audiosSizeMB: 'Tamanho Total Áudios (MB)',
  documentsCount: 'Qtd Documentos',
  documentsSizeMB: 'Tamanho Total Documentos (MB)',
  lastVerificationDate: 'Última Verificação',

  // Status de Sincronização
  lastSyncDate: 'Última Sincronização',
  lastUploadedFile: 'Último Arquivo Enviado',
  syncedFilesCount: 'Arquivos Sincronizados',
  failedUploadsCount: 'Falhas de Upload',
  uploadStatus: 'Status de Upload',
  uploadProgress: 'Progresso (%)',
  uploadRetryCount: 'Tentativas de Upload',

  // Google Services
  photosAlbumName: 'Álbum Google Photos',
  photosAlbumLink: 'Link do Álbum',
  driveDirectoryName: 'Pasta Google Drive',
  driveDirectoryLink: 'Link da Pasta',

  // Configurações
  syncEnabled: 'Sincronização Ativa',
  maxMediaAgeDays: 'Retenção (dias)',

  // Organização
  category: 'Categoria',
  isArchived: 'Arquivado',
  notes: 'Observações'
} as const;

/**
 * Default configuration values for chat metadata extraction
 */
export const DEFAULT_CHAT_CONFIG: ChatExtractorConfig['defaults'] = {
  syncEnabled: true,
  maxMediaAgeDays: 90, // 3 months default retention
  syncedFilesCount: 0,
  failedUploadsCount: 0
};

// AIDEV-NOTE: ChatFileInfo interface for TASK-024 per-chat file analysis
/**
 * Information about a specific media file from a chat
 * Used for per-chat file analysis and Google Sheets upload tracking
 */
export interface ChatFileInfo {
  // Database info from messages table
  /** Message ID from WhatsApp database */
  messageId: string;

  /** Chat JID this file belongs to */
  chatJid: string;

  /** JID of the sender (optional - could be outgoing message) */
  senderJid?: string;

  /** Timestamp when message was sent */
  messageTimestamp: Date;

  // File info from messages.data JSON blob
  /** File name extracted from WhatsApp message data */
  fileName: string;

  /** Media type classification */
  mediaType: 'photo' | 'video' | 'document' | 'audio';

  /** File size from database (optional) */
  size?: number;

  /** MIME type from database (optional) */
  mimeType?: string;

  /** Message caption/text (optional) */
  caption?: string;

  // Filesystem matching results
  /** Full path to actual file if found on filesystem */
  filePath?: string;

  /** Whether file exists on filesystem */
  fileExists: boolean;

  /** Actual file size from filesystem (if file exists) */
  actualSize?: number;

  /** SHA-256 hash of file content for duplicate detection */
  fileHash?: string;

  // Upload tracking columns (for Google Sheets)
  /** Current upload status */
  uploadStatus: 'pending' | 'uploaded' | 'failed' | 'skipped';

  /** Date when file was uploaded (if uploaded) */
  uploadDate?: Date;

  /** Error message from failed upload attempt */
  uploadError?: string;

  /** Number of upload attempts made */
  uploadAttempts: number;

  /** Whether file has been deleted from phone after upload */
  fileDeletedFromPhone: boolean;
}

// AIDEV-NOTE: Per-Chat Sheets Manager interfaces for TASK-025
/**
 * Interface for per-chat Google Sheets management
 * Provides methods for creating and updating chat-specific file tracking sheets
 */
export interface PerChatSheetsManager {
  // Main operations
  createChatFileSheet(chatJid: string, chatName: string): Promise<string>;
  saveChatFiles(chatJid: string, chatName: string, files: ChatFileInfo[]): Promise<void>;
  getChatFileSheetUrl(chatJid: string, chatName: string): Promise<string | null>;

  // File tracking
  updateFileUploadStatus(
    chatJid: string,
    chatName: string,
    fileId: string,
    status: UploadStatusUpdate
  ): Promise<void>;
}

/**
 * Upload status update information for file tracking
 */
export interface UploadStatusUpdate {
  uploadStatus: 'pending' | 'uploaded' | 'failed' | 'skipped';
  uploadDate?: Date;
  uploadError?: string;
  uploadAttempts?: number;
  directoryName?: string;
  directoryLink?: string;
  fileLink?: string;
  fileDeletedFromPhone?: boolean;
}