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
import { GoogleContactsService } from '../google-contacts/index.js';
import { OAuth2Client } from 'google-auth-library';

/**
 * Extracts chat metadata from WhatsApp msgstore.db for Google Sheets integration
 */
export class ChatMetadataExtractor {
  private config: ChatExtractorConfig;
  private mediaPath?: string;
  private googleContacts?: GoogleContactsService;

  constructor(config?: Partial<ChatExtractorConfig>, mediaPath?: string, authClient?: OAuth2Client) {
    // AIDEV-NOTE: Default to ./decrypted/msgstore.db created by decrypt command
    this.config = {
      msgstoreDbPath: config?.msgstoreDbPath || './decrypted/msgstore.db',
      defaults: { ...DEFAULT_CHAT_CONFIG, ...config?.defaults }
    };
    this.mediaPath = mediaPath;

    // Initialize Google Contacts if auth client is provided
    if (authClient) {
      this.googleContacts = new GoogleContactsService(authClient);
    }
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

      console.log('\n📱 Starting WhatsApp database analysis...');

      // Load Google Contacts FIRST if available
      if (this.googleContacts) {
        console.log('  0️⃣  Loading Google Contacts...');
        await this.googleContacts.loadContacts();
        const googleContactsCount = this.googleContacts.getCacheSize();
        console.log(`     ✓ Loaded ${googleContactsCount} contacts from Google`);
      }

      console.log('  1️⃣  Extracting chat list...');
      const rawChats = this.extractRawChatData();
      console.log(`     ✓ Found ${rawChats.length} chats (${rawChats.filter(c => c.chatType === 1).length} groups, ${rawChats.filter(c => c.chatType === 0).length} individual)`);

      const msgstoreDate = this.getMsgstoreDate();
      console.log(`     ✓ Database backup date: ${msgstoreDate.toISOString().split('T')[0]}`);

      // Extract message statistics and media counts for all chats
      console.log('\n  2️⃣  Analyzing message statistics...');
      const messageStats = this.extractMessageStatistics();
      console.log(`     ✓ Processed statistics for ${messageStats.size} chats`);

      console.log('\n  3️⃣  Counting media files in database...');
      const mediaCounts = this.extractMediaCounts();
      console.log(`     ✓ Analyzed media for ${mediaCounts.size} chats`);

      // Extract contact names from vCards
      console.log('\n  4️⃣  Extracting contact names...');
      const contactNames = this.extractContactNames();
      console.log(`     ✓ Found names for ${contactNames.size} contacts from vCards`);

      // AIDEV-NOTE: Skip file analysis as we can't reliably map files to chats without database
      // Using database media counts which are accurate per chat

      // AIDEV-NOTE: Convert raw WhatsApp data to structured ChatMetadata with stats
      console.log('\n  5️⃣  Building chat metadata...');
      let processed = 0;
      const totalChats = rawChats.length;
      const chatMetadata = rawChats.map((rawChat, index) => {
        const stats = messageStats.get(rawChat.jid);
        const dbMedia = mediaCounts.get(rawChat.jid);
        const contactName = contactNames.get(rawChat.jid);
        processed++;

        // Show progress every 1000 chats or at the end
        if (processed % 1000 === 0 || processed === totalChats) {
          process.stdout.write(`\r     ⏳ Processing: ${processed}/${totalChats} chats (${Math.round(processed/totalChats*100)}%)`);
        }

        return this.buildChatMetadata(rawChat, msgstoreDate, stats, dbMedia, contactName);
      });

      console.log(`\r     ✓ Processed all ${chatMetadata.length} chats successfully!       `);
      console.log(`\n✅ Database analysis complete!`);
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
          COALESCE(ldn.display_name, c.subject, j.raw_string) as displayName,
          CASE
            WHEN j.raw_string LIKE '%@g.us' THEN 1
            ELSE 0
          END as chatType,
          c.created_timestamp as createdTimestamp,
          c.last_message_row_id as lastMessageTimestamp
        FROM jid j
        INNER JOIN chat c ON c.jid_row_id = j._id
        LEFT JOIN lid_display_name ldn ON ldn.lid_row_id = c.jid_row_id
        WHERE j.raw_string IS NOT NULL
        AND j.raw_string != ''
        AND (j.raw_string LIKE '%@s.whatsapp.net' OR j.raw_string LIKE '%@g.us')
        AND j.raw_string NOT LIKE '%.0:%'
        AND j.raw_string NOT LIKE '%@broadcast'
        ORDER BY c.last_message_row_id DESC
      `;

      const rows = db.prepare(query).all() as any[];

      return rows.map(row => {
        let displayName = row.displayName;

        // ALWAYS prioritize Google Contacts for individual chats when available
        if (this.googleContacts && row.chatType === 0) {
          const googleName = this.googleContacts.getContactName(row.jid);
          if (googleName) {
            displayName = googleName; // Google Contacts takes priority
          }
        }

        // For groups, keep the subject from WhatsApp
        if (row.chatType === 1 && row.displayName) {
          displayName = row.displayName;
        }

        return {
          jid: row.jid,
          displayName: displayName || row.jid.split('@')[0], // Fallback to JID prefix
          chatType: row.chatType,
          createdTimestamp: row.createdTimestamp,
          lastMessageTimestamp: row.lastMessageTimestamp
        };
      });

    } finally {
      db.close();
    }
  }

  /**
   * Extract contact names from vCards in messages
   */
  private extractContactNames(): Map<string, string> {
    const dbPath = resolve(this.config.msgstoreDbPath);
    const db = Database(dbPath, { readonly: true });
    const contactMap = new Map<string, string>();

    try {
      // Query to get vCards that contain contact information
      const query = `
        SELECT DISTINCT
          mv.vcard,
          j.raw_string as jid
        FROM message_vcard mv
        INNER JOIN message m ON mv.message_row_id = m._id
        INNER JOIN chat c ON m.chat_row_id = c._id
        INNER JOIN jid j ON c.jid_row_id = j._id
        WHERE j.raw_string LIKE '%@s.whatsapp.net'
        AND mv.vcard IS NOT NULL
      `;

      const rows = db.prepare(query).all() as any[];

      rows.forEach(row => {
        // Extract phone number from vCard
        const phoneMatch = row.vcard.match(/TEL.*waid=(\d+):/);
        if (phoneMatch) {
          const phone = phoneMatch[1];
          const jid = `${phone}@s.whatsapp.net`;

          // Extract full name from vCard
          const nameMatch = row.vcard.match(/FN:([^\n\r]+)/);
          if (nameMatch && !contactMap.has(jid)) {
            contactMap.set(jid, nameMatch[1].trim());
          }
        }
      });

    } finally {
      db.close();
    }

    return contactMap;
  }

  /**
   * Extract message statistics for all chats
   */
  private extractMessageStatistics(): Map<string, any> {
    const dbPath = resolve(this.config.msgstoreDbPath);
    const db = Database(dbPath, { readonly: true });
    const statsMap = new Map<string, any>();

    try {
      process.stdout.write('     ⏳ Querying message table...');

      // Query to get message statistics per chat
      const query = `
        SELECT
          j.raw_string as jid,
          COUNT(m._id) as totalMessages,
          MIN(m.timestamp) as firstMessageTimestamp,
          MAX(m.timestamp) as lastMessageTimestamp
        FROM message m
        INNER JOIN chat c ON m.chat_row_id = c._id
        INNER JOIN jid j ON c.jid_row_id = j._id
        WHERE j.raw_string IS NOT NULL
        AND j.raw_string != ''
        AND (j.raw_string LIKE '%@s.whatsapp.net' OR j.raw_string LIKE '%@g.us')
        AND j.raw_string NOT LIKE '%.0:%'
        AND j.raw_string NOT LIKE '%@broadcast'
        GROUP BY j.raw_string
      `;

      const rows = db.prepare(query).all() as any[];
      process.stdout.write('\r     ⏳ Processing message statistics...');

      let totalMessages = 0;
      rows.forEach(row => {
        totalMessages += row.totalMessages || 0;
        statsMap.set(row.jid, {
          totalMessages: row.totalMessages || 0,
          firstMessageTimestamp: row.firstMessageTimestamp,
          lastMessageTimestamp: row.lastMessageTimestamp
        });
      });

      process.stdout.write(`\r     ✓ Found ${totalMessages.toLocaleString()} total messages across ${rows.length} chats\n`);

    } finally {
      db.close();
    }

    return statsMap;
  }

  /**
   * Extract media counts for all chats
   */
  private extractMediaCounts(): Map<string, any> {
    const dbPath = resolve(this.config.msgstoreDbPath);
    const db = Database(dbPath, { readonly: true });
    const mediaMap = new Map<string, any>();

    try {
      process.stdout.write('     ⏳ Querying media table...');

      // Query to get media counts and sizes per type for each chat
      // AIDEV-NOTE: Only count entries WITH file_path as these are the actual files on disk
      const query = `
        SELECT
          j.raw_string as jid,
          COUNT(CASE WHEN mm.mime_type LIKE 'image/%' AND mm.file_path IS NOT NULL AND mm.file_path != '' THEN 1 END) as photosCount,
          SUM(CASE WHEN mm.mime_type LIKE 'image/%' AND mm.file_path IS NOT NULL AND mm.file_path != '' THEN mm.file_size ELSE 0 END) / 1048576.0 as photosSizeMB,
          COUNT(CASE WHEN mm.mime_type LIKE 'video/%' AND mm.file_path IS NOT NULL AND mm.file_path != '' THEN 1 END) as videosCount,
          SUM(CASE WHEN mm.mime_type LIKE 'video/%' AND mm.file_path IS NOT NULL AND mm.file_path != '' THEN mm.file_size ELSE 0 END) / 1048576.0 as videosSizeMB,
          COUNT(CASE WHEN mm.mime_type LIKE 'audio/%' AND mm.file_path IS NOT NULL AND mm.file_path != '' THEN 1 END) as audiosCount,
          SUM(CASE WHEN mm.mime_type LIKE 'audio/%' AND mm.file_path IS NOT NULL AND mm.file_path != '' THEN mm.file_size ELSE 0 END) / 1048576.0 as audiosSizeMB,
          COUNT(CASE WHEN (mm.mime_type LIKE 'application/%' OR (mm.mime_type NOT LIKE 'image/%' AND mm.mime_type NOT LIKE 'video/%' AND mm.mime_type NOT LIKE 'audio/%')) AND mm.file_path IS NOT NULL AND mm.file_path != '' THEN 1 END) as documentsCount,
          SUM(CASE WHEN (mm.mime_type LIKE 'application/%' OR (mm.mime_type NOT LIKE 'image/%' AND mm.mime_type NOT LIKE 'video/%' AND mm.mime_type NOT LIKE 'audio/%')) AND mm.file_path IS NOT NULL AND mm.file_path != '' THEN mm.file_size ELSE 0 END) / 1048576.0 as documentsSizeMB,
          COUNT(CASE WHEN mm.file_path IS NOT NULL AND mm.file_path != '' THEN mm.message_row_id END) as totalMediaCount,
          SUM(CASE WHEN mm.file_path IS NOT NULL AND mm.file_path != '' AND mm.file_size IS NOT NULL THEN mm.file_size ELSE 0 END) / 1048576.0 as totalMediaSizeMB
        FROM message_media mm
        INNER JOIN chat c ON mm.chat_row_id = c._id
        INNER JOIN jid j ON c.jid_row_id = j._id
        WHERE j.raw_string IS NOT NULL
        AND j.raw_string != ''
        AND (j.raw_string LIKE '%@s.whatsapp.net' OR j.raw_string LIKE '%@g.us')
        AND j.raw_string NOT LIKE '%.0:%'
        AND j.raw_string NOT LIKE '%@broadcast'
        GROUP BY j.raw_string
      `;

      const rows = db.prepare(query).all() as any[];
      process.stdout.write('\r     ⏳ Analyzing media types...');

      let totalMedia = 0;
      let totalSizeMB = 0;
      let photos = 0, videos = 0, audios = 0, docs = 0;

      rows.forEach(row => {
        totalMedia += row.totalMediaCount || 0;
        totalSizeMB += row.totalMediaSizeMB || 0;
        photos += row.photosCount || 0;
        videos += row.videosCount || 0;
        audios += row.audiosCount || 0;
        docs += row.documentsCount || 0;

        mediaMap.set(row.jid, {
          photosCount: row.photosCount || 0,
          photosSizeMB: Math.round((row.photosSizeMB || 0) * 100) / 100,
          videosCount: row.videosCount || 0,
          videosSizeMB: Math.round((row.videosSizeMB || 0) * 100) / 100,
          audiosCount: row.audiosCount || 0,
          audiosSizeMB: Math.round((row.audiosSizeMB || 0) * 100) / 100,
          documentsCount: row.documentsCount || 0,
          documentsSizeMB: Math.round((row.documentsSizeMB || 0) * 100) / 100,
          totalMediaCount: row.totalMediaCount || 0,
          totalMediaSizeMB: Math.round((row.totalMediaSizeMB || 0) * 100) / 100
        });
      });

      process.stdout.write(`\r     ✓ Found ${totalMedia.toLocaleString()} media files (${Math.round(totalSizeMB).toLocaleString()} MB)\n`);
      console.log(`     📊 ${photos.toLocaleString()} photos, ${videos.toLocaleString()} videos, ${audios.toLocaleString()} audios, ${docs.toLocaleString()} documents`);

    } finally {
      db.close();
    }

    return mediaMap;
  }

  /**
   * Build ChatMetadata from raw WhatsApp database data
   */
  private buildChatMetadata(rawChat: RawChatData, msgstoreDate: Date, stats: any, dbMedia: any, contactName?: string): ChatMetadata {
    // Convert WhatsApp timestamps (milliseconds) to Date objects
    const convertTimestamp = (ts: number | undefined): Date | undefined => {
      return ts ? new Date(ts) : undefined;
    };

    // rawChat.displayName already has Google Contacts name if available (from extractRawChatData)
    // Only use vCard contactName if displayName is just a number
    const finalName = rawChat.displayName.match(/^\d+$/) && contactName
      ? contactName
      : rawChat.displayName;

    return {
      // AIDEV-NOTE: Core chat identification
      chatJid: rawChat.jid,
      chatName: this.cleanChatName(finalName),
      chatType: rawChat.chatType === 1 ? 'group' : 'individual',
      msgstoreDate,

      // AIDEV-NOTE: Statistics from message table
      totalMessages: stats?.totalMessages || 0,
      firstMessageDate: convertTimestamp(stats?.firstMessageTimestamp),
      lastMessageDate: convertTimestamp(stats?.lastMessageTimestamp),
      createdDate: convertTimestamp(rawChat.createdTimestamp),

      // AIDEV-NOTE: Media counts and sizes from message_media table
      totalMediaCount: dbMedia?.totalMediaCount || 0,
      totalMediaSizeMB: dbMedia?.totalMediaSizeMB || 0,
      photosCount: dbMedia?.photosCount || 0,
      photosSizeMB: dbMedia?.photosSizeMB || 0,
      videosCount: dbMedia?.videosCount || 0,
      videosSizeMB: dbMedia?.videosSizeMB || 0,
      audiosCount: dbMedia?.audiosCount || 0,
      audiosSizeMB: dbMedia?.audiosSizeMB || 0,
      documentsCount: dbMedia?.documentsCount || 0,
      documentsSizeMB: dbMedia?.documentsSizeMB || 0,
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