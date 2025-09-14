// AIDEV-NOTE: WhatsApp chat metadata extraction from msgstore.db (TASK-023)
/**
 * WhatsApp Chat Metadata Extractor
 *
 * This module extracts chat metadata from decrypted WhatsApp msgstore.db
 * files and prepares it for Google Sheets integration.
 *
 * @fileoverview Provides ChatMetadataExtractor class for reading WhatsApp database
 */

import Database from 'better-sqlite3';
import { existsSync, statSync } from 'fs';
import { join, resolve } from 'path';
import {
  ChatMetadata,
  RawChatData,
  ChatExtractorConfig,
  DEFAULT_CHAT_CONFIG
} from './types.js';

/**
 * Extracts chat metadata from WhatsApp msgstore.db for Google Sheets integration
 */
export class ChatMetadataExtractor {
  private config: ChatExtractorConfig;

  constructor(config?: Partial<ChatExtractorConfig>) {
    // AIDEV-NOTE: Default to ./decrypted/msgstore.db created by decrypt command
    this.config = {
      msgstoreDbPath: config?.msgstoreDbPath || './decrypted/msgstore.db',
      defaults: { ...DEFAULT_CHAT_CONFIG, ...config?.defaults }
    };
  }

  /**
   * Extract chat metadata from msgstore.db
   * @returns Array of chat metadata or empty array if database unavailable
   */
  async extractChatMetadata(): Promise<ChatMetadata[]> {
    try {
      // AIDEV-NOTE: Check if msgstore.db exists before attempting to read
      if (!this.isDatabaseAvailable()) {
        console.warn('⚠️  msgstore.db not found. Run "npm run decrypt" first to decrypt WhatsApp database.');
        console.warn('   Continuing with file scan only...');
        return [];
      }

      const rawChats = this.extractRawChatData();
      const msgstoreDate = this.getMsgstoreDate();

      // AIDEV-NOTE: Convert raw WhatsApp data to structured ChatMetadata
      const chatMetadata = rawChats.map(rawChat => this.buildChatMetadata(rawChat, msgstoreDate));

      console.log(`✓ Extracted metadata for ${chatMetadata.length} chats from msgstore.db`);
      return chatMetadata;

    } catch (error) {
      // AIDEV-NOTE: Graceful degradation - don't fail entire scan if database read fails
      console.warn('⚠️  Error reading msgstore.db:', error instanceof Error ? error.message : 'Unknown error');
      console.warn('   Continuing with file scan only...');
      return [];
    }
  }

  /**
   * Check if msgstore.db database is available and accessible
   */
  private isDatabaseAvailable(): boolean {
    const dbPath = resolve(this.config.msgstoreDbPath);
    return existsSync(dbPath);
  }

  /**
   * Get the modification date of msgstore.db file
   */
  private getMsgstoreDate(): Date {
    try {
      const dbPath = resolve(this.config.msgstoreDbPath);
      const stats = statSync(dbPath);
      return stats.mtime; // Use modification time as msgstore date
    } catch (error) {
      // AIDEV-NOTE: Fallback to current date if file stats unavailable
      return new Date();
    }
  }

  /**
   * Extract raw chat data from WhatsApp msgstore.db
   */
  private extractRawChatData(): RawChatData[] {
    const dbPath = resolve(this.config.msgstoreDbPath);
    const db = Database(dbPath, { readonly: true });

    try {
      // AIDEV-NOTE: Query WhatsApp database structure - chat and jid tables
      // WhatsApp stores chat info across multiple tables:
      // - jid: Contains JID identifiers (raw_string)
      // - chat: Contains chat metadata, subject (chat name), and timestamps
      const query = `
        SELECT DISTINCT
          j.raw_string as jid,
          COALESCE(c.subject, j.raw_string) as displayName,
          CASE
            WHEN j.raw_string LIKE '%@g.us' THEN 1
            ELSE 0
          END as chatType,
          c.created_timestamp as createdTimestamp,
          c.last_message_row_id as lastMessageTimestamp
        FROM jid j
        LEFT JOIN chat c ON c.jid_row_id = j._id
        WHERE j.raw_string IS NOT NULL
        AND j.raw_string != ''
        AND (j.raw_string LIKE '%@s.whatsapp.net' OR j.raw_string LIKE '%@g.us')
        AND c.subject IS NOT NULL
        ORDER BY c.last_message_row_id DESC
      `;

      const rows = db.prepare(query).all() as any[];

      return rows.map(row => ({
        jid: row.jid,
        displayName: row.displayName || row.jid.split('@')[0], // Fallback to JID prefix
        chatType: row.chatType,
        createdTimestamp: row.createdTimestamp,
        lastMessageTimestamp: row.lastMessageTimestamp
      }));

    } finally {
      db.close();
    }
  }

  /**
   * Build ChatMetadata from raw WhatsApp database data
   */
  private buildChatMetadata(rawChat: RawChatData, msgstoreDate: Date): ChatMetadata {
    return {
      // AIDEV-NOTE: Core chat identification
      chatJid: rawChat.jid,
      chatName: this.cleanChatName(rawChat.displayName),
      chatType: rawChat.chatType === 1 ? 'group' : 'individual',
      msgstoreDate,

      // AIDEV-NOTE: Statistics - will be populated from msgstore.db queries
      totalMessages: 0,
      firstMessageDate: undefined,
      lastMessageDate: undefined,
      createdDate: undefined,

      // AIDEV-NOTE: File control - will be populated from media scan
      totalMediaCount: 0,
      totalMediaSizeMB: 0,
      photosCount: 0,
      videosCount: 0,
      audiosCount: 0,
      documentsCount: 0,
      lastVerificationDate: new Date(),

      // AIDEV-NOTE: Upload tracking fields - initially empty/zero
      lastSyncDate: undefined,
      lastUploadedFile: undefined,
      syncedFilesCount: this.config.defaults.syncedFilesCount,
      failedUploadsCount: this.config.defaults.failedUploadsCount,
      uploadStatus: 'Pendente',
      uploadProgress: 0,
      uploadRetryCount: 0,

      // AIDEV-NOTE: Google service integration - initially empty
      photosAlbumName: undefined,
      photosAlbumLink: undefined,
      driveDirectoryName: undefined,
      driveDirectoryLink: undefined,

      // AIDEV-NOTE: User configuration with sensible defaults
      syncEnabled: this.config.defaults.syncEnabled,
      maxMediaAgeDays: this.config.defaults.maxMediaAgeDays,

      // AIDEV-NOTE: Organization - defaults
      category: undefined,
      isArchived: false,
      notes: undefined
    };
  }

  /**
   * Clean and sanitize chat names for display
   */
  private cleanChatName(displayName: string): string {
    // AIDEV-NOTE: Basic sanitization for Google Sheets compatibility
    return displayName
      .trim()
      .replace(/[\r\n\t]/g, ' ') // Replace newlines/tabs with spaces
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .substring(0, 100); // Limit length for sheets
  }

  /**
   * Get database path being used
   */
  getDbPath(): string {
    return resolve(this.config.msgstoreDbPath);
  }

  /**
   * Check if database exists and provide helpful error message
   */
  validateDatabase(): { isValid: boolean; message: string } {
    if (!this.isDatabaseAvailable()) {
      return {
        isValid: false,
        message: `Database not found at: ${this.getDbPath()}\nRun "npm run decrypt" first to decrypt WhatsApp database.`
      };
    }

    try {
      // AIDEV-NOTE: Quick test to ensure database is readable and has expected structure
      const db = Database(this.config.msgstoreDbPath, { readonly: true });
      const result = db.prepare('SELECT name FROM sqlite_master WHERE type = ? AND name = ?').get('table', 'jid');
      db.close();

      if (!result) {
        return {
          isValid: false,
          message: 'Database exists but missing expected "jid" table. May not be a valid WhatsApp msgstore.db file.'
        };
      }

      return { isValid: true, message: 'Database is valid and ready to use.' };
    } catch (error) {
      return {
        isValid: false,
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// AIDEV-NOTE: Export ChatFileAnalyzer for TASK-024
export { ChatFileAnalyzer } from './chat-file-analyzer.js';

// AIDEV-NOTE: Export types for use in other modules
export * from './types.js';