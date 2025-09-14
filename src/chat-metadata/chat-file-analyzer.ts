// AIDEV-NOTE: Per-chat media file analyzer for TASK-024
/**
 * Chat File Analyzer - Extract media files for specific chat
 *
 * This module analyzes WhatsApp msgstore.db to extract media file information
 * for a specific chat JID, matching files to filesystem for upload tracking.
 *
 * @fileoverview Provides ChatFileAnalyzer class for per-chat file analysis
 */

import Database from 'better-sqlite3';
import { existsSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { ChatFileInfo } from './types.js';
import { WhatsAppScanner } from '../scanner/index.js';

/**
 * Analyzer for extracting media files from specific WhatsApp chats
 * Combines database extraction with filesystem matching
 */
export class ChatFileAnalyzer {
  private dbPath: string;
  private whatsappPath?: string;
  private scanner?: WhatsAppScanner;

  /**
   * Create chat file analyzer
   * @param dbPath Path to decrypted msgstore.db file (defaults to ./decrypted/msgstore.db)
   * @param whatsappPath Path to WhatsApp directory (optional, will auto-detect)
   */
  constructor(dbPath?: string, whatsappPath?: string) {
    this.dbPath = dbPath || './decrypted/msgstore.db';
    this.whatsappPath = whatsappPath;
  }

  /**
   * Analyze media files for a specific chat JID
   * @param chatJid WhatsApp chat JID (e.g. "5511999999999@s.whatsapp.net")
   * @returns Array of chat file information with filesystem matching
   */
  async analyzeChat(chatJid: string): Promise<ChatFileInfo[]> {
    // AIDEV-NOTE: Validate inputs and database availability
    if (!chatJid || chatJid.trim() === '') {
      throw new Error('Chat JID is required');
    }

    if (!this.isDatabaseAvailable()) {
      throw new Error(`Database not found at: ${resolve(this.dbPath)}. Run "npm run decrypt" first.`);
    }

    try {
      // AIDEV-NOTE: Extract media messages for the specific chat
      const rawMediaMessages = this.extractMediaMessagesForChat(chatJid);

      if (rawMediaMessages.length === 0) {
        console.log(`No media messages found for chat: ${chatJid}`);
        return [];
      }

      console.log(`Found ${rawMediaMessages.length} media messages for chat: ${chatJid}`);

      // AIDEV-NOTE: Convert raw database data to ChatFileInfo with filesystem matching
      const chatFiles: ChatFileInfo[] = [];

      for (const rawMessage of rawMediaMessages) {
        const chatFileInfo = await this.buildChatFileInfo(rawMessage, chatJid);
        if (chatFileInfo) {
          chatFiles.push(chatFileInfo);
        }
      }

      // AIDEV-NOTE: Sort by message timestamp (chronological order)
      chatFiles.sort((a, b) => a.messageTimestamp.getTime() - b.messageTimestamp.getTime());

      console.log(`✓ Analyzed ${chatFiles.length} media files for chat (${chatFiles.filter(f => f.fileExists).length} found on filesystem)`);

      return chatFiles;

    } catch (error) {
      throw new Error(`Failed to analyze chat ${chatJid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get chat display name for a JID (for user-friendly output)
   * @param chatJid Chat JID to get name for
   * @returns Chat display name or JID if name not found
   */
  async getChatName(chatJid: string): Promise<string> {
    if (!this.isDatabaseAvailable()) {
      return chatJid; // Fallback to JID
    }

    try {
      const db = Database(this.dbPath, { readonly: true });

      try {
        // AIDEV-NOTE: Get chat name from chat table via jid lookup
        const result = db.prepare(`
          SELECT COALESCE(c.subject, j.raw_string) as chat_name
          FROM jid j
          LEFT JOIN chat c ON c.jid_row_id = j._id
          WHERE j.raw_string = ?
        `).get(chatJid) as any;

        return result?.chat_name || chatJid;
      } finally {
        db.close();
      }
    } catch (error) {
      console.warn(`Warning: Could not get chat name for ${chatJid}:`, error instanceof Error ? error.message : 'Unknown error');
      return chatJid; // Fallback to JID
    }
  }

  /**
   * Check if database is available and accessible
   */
  private isDatabaseAvailable(): boolean {
    const fullPath = resolve(this.dbPath);
    return existsSync(fullPath);
  }

  /**
   * Extract raw media message data for specific chat from database
   * @param chatJid Chat JID to extract messages for
   * @returns Array of raw message data with media information
   */
  private extractMediaMessagesForChat(chatJid: string): any[] {
    const db = Database(this.dbPath, { readonly: true });

    try {
      // AIDEV-NOTE: Query to get media messages for specific chat
      // Joins: message_media -> message -> chat -> jid to get chat JID
      // Also gets sender information for outgoing vs incoming messages
      const query = `
        SELECT
          m._id as messageId,
          m.timestamp,
          m.from_me,
          m.sender_jid_row_id,
          mm.file_path,
          mm.file_size,
          mm.mime_type,
          mm.media_name,
          mm.media_caption,
          chat_j.raw_string as chatJid,
          sender_j.raw_string as senderJid
        FROM message_media mm
        JOIN message m ON mm.message_row_id = m._id
        JOIN chat c ON m.chat_row_id = c._id
        JOIN jid chat_j ON c.jid_row_id = chat_j._id
        LEFT JOIN jid sender_j ON m.sender_jid_row_id = sender_j._id
        WHERE chat_j.raw_string = ?
          AND mm.file_path IS NOT NULL
          AND mm.file_path != ''
        ORDER BY m.timestamp ASC
      `;

      const rows = db.prepare(query).all(chatJid) as any[];

      console.log(`Database query found ${rows.length} media messages for chat: ${chatJid}`);

      return rows;

    } finally {
      db.close();
    }
  }

  /**
   * Build ChatFileInfo from raw database message data with filesystem matching
   * @param rawMessage Raw message data from database
   * @param chatJid Chat JID for validation
   * @returns ChatFileInfo with filesystem information or null if invalid
   */
  private async buildChatFileInfo(rawMessage: any, chatJid: string): Promise<ChatFileInfo | null> {
    try {
      // AIDEV-NOTE: Extract file name from file path
      const filePath = rawMessage.file_path;
      if (!filePath) {
        return null; // Skip messages without file paths
      }

      // Extract filename from path (e.g., "Media/WhatsApp Images/IMG-20160229-WA0000.jpg" -> "IMG-20160229-WA0000.jpg")
      const fileName = filePath.split('/').pop() || filePath;

      // AIDEV-NOTE: Determine media type from MIME type or file extension
      const mediaType = this.determineMediaType(rawMessage.mime_type, fileName);

      // AIDEV-NOTE: Match file to filesystem
      const filesystemInfo = await this.matchFileToFilesystem(fileName, filePath);

      // AIDEV-NOTE: Build complete ChatFileInfo object
      const chatFileInfo: ChatFileInfo = {
        // Database info
        messageId: rawMessage.messageId.toString(),
        chatJid: chatJid,
        senderJid: rawMessage.from_me ? undefined : rawMessage.senderJid, // Only set for incoming messages
        messageTimestamp: new Date(rawMessage.timestamp), // WhatsApp timestamps are in milliseconds

        // File info from database
        fileName: fileName,
        mediaType: mediaType,
        size: rawMessage.file_size || undefined,
        mimeType: rawMessage.mime_type || undefined,
        caption: rawMessage.media_caption || undefined,

        // Filesystem matching results
        filePath: filesystemInfo.fullPath,
        fileExists: filesystemInfo.exists,
        actualSize: filesystemInfo.actualSize,

        // Upload tracking (default values for Google Sheets)
        uploadStatus: 'pending',
        uploadDate: undefined,
        uploadError: undefined,
        uploadAttempts: 0,
        fileDeletedFromPhone: false
      };

      return chatFileInfo;

    } catch (error) {
      console.warn(`Warning: Could not process message ${rawMessage.messageId}:`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Determine media type from MIME type and filename
   * @param mimeType MIME type from database
   * @param fileName File name for extension-based detection
   * @returns Media type classification
   */
  private determineMediaType(mimeType?: string, fileName?: string): 'photo' | 'video' | 'document' | 'audio' {
    // AIDEV-NOTE: Primary classification by MIME type
    if (mimeType) {
      if (mimeType.startsWith('image/')) return 'photo';
      if (mimeType.startsWith('video/')) return 'video';
      if (mimeType.startsWith('audio/')) return 'audio';
      // Everything else is document by default
      return 'document';
    }

    // AIDEV-NOTE: Fallback classification by file extension
    if (fileName) {
      const extension = fileName.toLowerCase().split('.').pop() || '';

      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'photo';
      if (['mp4', 'avi', 'mov', '3gp', 'mkv', 'webm'].includes(extension)) return 'video';
      if (['mp3', 'ogg', 'aac', 'm4a', 'wav', 'opus'].includes(extension)) return 'audio';
    }

    // AIDEV-NOTE: Default to document for unknown types
    return 'document';
  }

  /**
   * Match database file information to actual filesystem
   * @param fileName File name from database
   * @param dbFilePath File path from database
   * @returns Filesystem matching information
   */
  private async matchFileToFilesystem(fileName: string, dbFilePath: string): Promise<{
    fullPath?: string;
    exists: boolean;
    actualSize?: number;
  }> {
    try {
      // AIDEV-NOTE: Get WhatsApp path if not set
      if (!this.whatsappPath) {
        if (!this.scanner) {
          this.scanner = new WhatsAppScanner();
        }
        this.whatsappPath = await this.scanner.detectWhatsAppPath() || '';
      }

      if (!this.whatsappPath) {
        return { exists: false }; // WhatsApp directory not found
      }

      // AIDEV-NOTE: Try different file path combinations
      const possiblePaths = [
        // 1. Original database path relative to WhatsApp directory
        join(this.whatsappPath, dbFilePath),
        // 2. Just the filename in media directories (fallback)
        join(this.whatsappPath, 'Media', 'WhatsApp Images', fileName),
        join(this.whatsappPath, 'Media', 'WhatsApp Video', fileName),
        join(this.whatsappPath, 'Media', 'WhatsApp Audio', fileName),
        join(this.whatsappPath, 'Media', 'WhatsApp Documents', fileName),
        join(this.whatsappPath, 'Media', 'WhatsApp Voice Notes', fileName)
      ];

      // AIDEV-NOTE: Check each possible path
      for (const fullPath of possiblePaths) {
        if (existsSync(fullPath)) {
          try {
            const stats = statSync(fullPath);
            return {
              fullPath: fullPath,
              exists: true,
              actualSize: stats.size
            };
          } catch (error) {
            // File exists but can't get stats, still count as found
            return {
              fullPath: fullPath,
              exists: true,
              actualSize: undefined
            };
          }
        }
      }

      // AIDEV-NOTE: File not found on filesystem
      return { exists: false };

    } catch (error) {
      console.warn(`Warning: Error matching file ${fileName}:`, error instanceof Error ? error.message : 'Unknown error');
      return { exists: false };
    }
  }

  /**
   * Validate database and provide helpful error message
   * @returns Validation result with success flag and message
   */
  validateDatabase(): { isValid: boolean; message: string } {
    if (!this.isDatabaseAvailable()) {
      return {
        isValid: false,
        message: `Database not found at: ${resolve(this.dbPath)}\nRun "npm run decrypt" first to decrypt WhatsApp database.`
      };
    }

    try {
      // AIDEV-NOTE: Test database access and table existence
      const db = Database(this.dbPath, { readonly: true });

      try {
        // Check for required tables
        const tables = ['message', 'message_media', 'chat', 'jid'];
        for (const tableName of tables) {
          const result = db.prepare('SELECT name FROM sqlite_master WHERE type = ? AND name = ?').get('table', tableName);
          if (!result) {
            return {
              isValid: false,
              message: `Database missing required table "${tableName}". May not be a valid WhatsApp msgstore.db file.`
            };
          }
        }

        return { isValid: true, message: 'Database is valid and ready for chat analysis.' };
      } finally {
        db.close();
      }
    } catch (error) {
      return {
        isValid: false,
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get database path being used
   */
  getDbPath(): string {
    return resolve(this.dbPath);
  }
}