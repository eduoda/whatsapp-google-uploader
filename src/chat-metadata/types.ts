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

  // AIDEV-NOTE: Upload tracking fields (initially empty, populated during uploads)
  /** Last time this chat was synchronized with Google */
  lastSyncDate?: Date;

  /** Filename of the last file uploaded for this chat */
  lastUploadedFile?: string;

  /** Count of files successfully uploaded to Google for this chat */
  syncedFilesCount: number;

  /** Count of files that failed to upload for this chat */
  failedUploadsCount: number;

  // AIDEV-NOTE: Google service integration fields (initially empty)
  /** Name of Google Photos album created for this chat */
  photosAlbumName?: string;

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
  chatName: 'nome do chat',
  chatJid: 'jid do chat',
  chatType: 'tipo do chat',
  msgstoreDate: 'data do msgstore.db',
  lastSyncDate: 'data da ultima sincronizacao',
  lastUploadedFile: 'ultimo arquivo enviado',
  syncedFilesCount: 'quantidade de arquivos sincronizados ate o momento',
  failedUploadsCount: 'quantidade de arquivos que falharam no upload',
  photosAlbumName: 'nome do album do google photos',
  photosAlbumLink: 'link para album do google photos',
  driveDirectoryName: 'nome do diretorio do google drive',
  driveDirectoryLink: 'link para diretorio do google drive',
  syncEnabled: 'flag para saber se o grupo chat deve ou nao ser sincronizado',
  maxMediaAgeDays: 'idade maxima dos arquivos de midia para se manter no celular'
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