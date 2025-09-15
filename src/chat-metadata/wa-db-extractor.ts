/**
 * WhatsApp Database (wa.db and msgstore.db) Chat Metadata Extractor
 * Extracts chat metadata directly from decrypted WhatsApp databases
 * AIDEV-NOTE: wa-db-extractor; uses SQLite databases for chat metadata (KISS)
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { ChatMetadata } from './types.js';

export interface WaDbChat {
  jid: string;
  displayName: string;  // Always has a value (fallback to jid if needed)
  subject?: string;
  isGroup: boolean;
  participantCount?: number;
  createdTimestamp?: number;
}

export class WaDbExtractor {
  private msgstoreDb?: Database.Database;
  private waDb?: Database.Database;

  constructor(private decryptedDir: string = './decrypted') {}

  /**
   * Connect to the decrypted databases
   */
  async connect(): Promise<boolean> {
    try {
      // Find and connect to msgstore.db
      const msgstorePath = path.join(this.decryptedDir, 'msgstore.db');
      const msgstoreFiles = fs.readdirSync(this.decryptedDir)
        .filter(f => f.startsWith('msgstore-') && f.endsWith('.db'))
        .sort()
        .reverse();

      const actualMsgstorePath = msgstoreFiles.length > 0 && msgstoreFiles[0]
        ? path.join(this.decryptedDir, msgstoreFiles[0])
        : msgstorePath;

      if (fs.existsSync(actualMsgstorePath)) {
        this.msgstoreDb = new Database(actualMsgstorePath, { readonly: true });
        console.log(`✅ Connected to: ${path.basename(actualMsgstorePath)}`);
      } else {
        console.error('❌ msgstore.db not found');
        return false;
      }

      // Connect to wa.db if available
      const waDbPath = path.join(this.decryptedDir, 'wa.db');
      if (fs.existsSync(waDbPath)) {
        this.waDb = new Database(waDbPath, { readonly: true });
        console.log(`✅ Connected to: wa.db`);
      }

      return true;
    } catch (error) {
      console.error('Failed to connect to databases:', error);
      return false;
    }
  }

  /**
   * Extract chat metadata from the databases
   */
  async extractChats(): Promise<WaDbChat[]> {
    if (!this.msgstoreDb) {
      throw new Error('Database not connected. Call connect() first.');
    }

    const chats: WaDbChat[] = [];

    try {
      // Query to get all chats with their JID information and display names
      const query = `
        SELECT
          c._id,
          c.jid_row_id,
          c.subject,
          c.created_timestamp,
          j.raw_string as jid,
          j.server,
          j.user,
          ldn.display_name as lid_display_name
        FROM chat c
        JOIN jid j ON c.jid_row_id = j._id
        LEFT JOIN lid_display_name ldn ON ldn.lid_row_id = c.jid_row_id
        WHERE j.raw_string NOT LIKE '%status@broadcast%'
        ORDER BY c._id
      `;

      const rows = this.msgstoreDb.prepare(query).all() as any[];

      for (const row of rows) {
        const isGroup = row.server === 'g.us';

        // Priority for display name:
        // 1. lid_display_name from msgstore.db
        // 2. subject (for groups)
        // 3. wa_contacts from wa.db (if available)
        // 4. phone number
        let displayName = row.lid_display_name || row.subject || '';

        // For individual chats, try to get contact name from wa.db if not found in msgstore
        if (!displayName && !isGroup && this.waDb) {
          try {
            const contactQuery = `
              SELECT display_name, wa_name
              FROM wa_contacts
              WHERE jid = ?
            `;
            const contact = this.waDb.prepare(contactQuery).get(row.jid) as any;
            if (contact) {
              displayName = contact.display_name || contact.wa_name || '';
            }
          } catch {}
        }

        // If no display name, use the phone number for individual chats
        if (!displayName && !isGroup) {
          displayName = row.user || row.jid.split('@')[0] || '';
        }

        // For groups, get participant count
        let participantCount = undefined;
        if (isGroup) {
          try {
            const countQuery = `
              SELECT COUNT(DISTINCT jid_row_id) as count
              FROM group_participant
              WHERE group_jid_row_id = ?
            `;
            const result = this.msgstoreDb.prepare(countQuery).get(row.jid_row_id) as any;
            participantCount = result?.count || 0;
          } catch {}
        }

        chats.push({
          jid: row.jid,
          displayName: displayName || row.jid.split('@')[0] || row.jid,
          subject: row.subject,
          isGroup,
          participantCount,
          createdTimestamp: row.created_timestamp
        });
      }

      console.log(`📊 Extracted ${chats.length} chats from database`);
      return chats;
    } catch (error) {
      console.error('Failed to extract chats:', error);
      throw error;
    }
  }

  /**
   * Convert WaDbChat to ChatMetadata format
   */
  toChatMetadata(chat: WaDbChat, msgstoreDate: Date): ChatMetadata {
    const chatId = chat.jid.split('@')[0];

    return {
      chatJid: chat.jid,
      chatName: chat.displayName,
      chatType: chat.isGroup ? 'group' : 'individual',
      msgstoreDate,
      totalMessages: 0,
      firstMessageDate: chat.createdTimestamp ? new Date(chat.createdTimestamp) : undefined,
      lastMessageDate: undefined,
      createdDate: chat.createdTimestamp ? new Date(chat.createdTimestamp) : undefined,
      totalMediaCount: 0,
      totalMediaSizeMB: 0,
      photosCount: 0,
      photosSizeMB: 0,
      videosCount: 0,
      videosSizeMB: 0,
      audiosCount: 0,
      audiosSizeMB: 0,
      documentsCount: 0,
      documentsSizeMB: 0,
      lastVerificationDate: undefined,
      lastSyncDate: undefined,
      lastUploadedFile: undefined,
      syncedFilesCount: 0,
      failedUploadsCount: 0,
      uploadStatus: 'Pendente',
      uploadProgress: 0,
      uploadRetryCount: 0,
      photosAlbumName: undefined,
      photosAlbumId: undefined,
      photosAlbumLink: undefined,
      driveDirectoryName: undefined,
      driveDirectoryLink: undefined,
      syncEnabled: true,
      maxMediaAgeDays: 365,
      isArchived: false
    };
  }

  /**
   * Close database connections
   */
  close() {
    if (this.msgstoreDb) {
      this.msgstoreDb.close();
    }
    if (this.waDb) {
      this.waDb.close();
    }
  }
}