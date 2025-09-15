// AIDEV-NOTE: Analyzes actual WhatsApp media files in directories for chat metadata
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export interface MediaFileStats {
  photosCount: number;
  photosSizeMB: number;
  videosCount: number;
  videosSizeMB: number;
  audiosCount: number;
  audiosSizeMB: number;
  documentsCount: number;
  documentsSizeMB: number;
  totalMediaCount: number;
  totalMediaSizeMB: number;
}

/**
 * Analyzes actual WhatsApp media files in the file system
 */
export class MediaFileAnalyzer {
  private readonly mediaPath: string;

  constructor(mediaPath?: string) {
    // Try different possible WhatsApp media paths
    const possiblePaths = [
      mediaPath ? join(mediaPath, 'Media') : null,
      process.env.WHATSAPP_PATH ? join(process.env.WHATSAPP_PATH, 'Media') : null,
      './Android/media/com.whatsapp/WhatsApp/Media',
      './WhatsApp/Media',
      './Media/WhatsApp Media',
      './tests/mock-whatsapp/Android/media/com.whatsapp/WhatsApp/Media'
    ].filter(Boolean) as string[];

    // Find the first existing path
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        this.mediaPath = path;
        console.log(`     📁 Using media path: ${this.mediaPath}`);
        return;
      }
    }

    // Default to first option if none exist
    this.mediaPath = possiblePaths[0] || './Media';
    console.log(`     ⚠️  Using default media path: ${this.mediaPath}`);
  }

  /**
   * Analyze all media files and group by chat JID
   */
  async analyzeMediaByChat(): Promise<Map<string, MediaFileStats>> {
    const chatMediaStats = new Map<string, MediaFileStats>();

    if (!existsSync(this.mediaPath)) {
      process.stdout.write(`\r     ⚠️  Media directory not found: ${this.mediaPath}                    \n`);
      return chatMediaStats;
    }

    // Scan each media type directory with progress
    process.stdout.write('     📷 Scanning WhatsApp Images...');
    const photoStats = this.scanDirectory('WhatsApp Images', ['jpg', 'jpeg', 'png', 'gif', 'webp']);
    process.stdout.write(`\r     ✓ Found ${photoStats.length.toLocaleString()} photos                        \n`);

    process.stdout.write('     🎥 Scanning WhatsApp Video...');
    const videoStats = this.scanDirectory('WhatsApp Video', ['mp4', 'avi', 'mkv', 'mov', '3gp']);
    process.stdout.write(`\r     ✓ Found ${videoStats.length.toLocaleString()} videos                        \n`);

    process.stdout.write('     🎵 Scanning WhatsApp Audio...');
    const audioStats = this.scanDirectory('WhatsApp Audio', ['opus', 'mp3', 'm4a', 'wav', 'aac', 'ogg']);
    process.stdout.write(`\r     ✓ Found ${audioStats.length.toLocaleString()} audio files                   \n`);

    process.stdout.write('     🎤 Scanning WhatsApp Voice Notes...');
    const voiceStats = this.scanDirectory('WhatsApp Voice Notes', ['opus', 'mp3', 'm4a']);
    process.stdout.write(`\r     ✓ Found ${voiceStats.length.toLocaleString()} voice notes                   \n`);

    process.stdout.write('     📄 Scanning WhatsApp Documents...');
    const docStats = this.scanDirectory('WhatsApp Documents', ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip']);
    process.stdout.write(`\r     ✓ Found ${docStats.length.toLocaleString()} documents                      \n`);

    // Combine all stats by chat JID
    const allFiles = [
      ...photoStats.map(f => ({ ...f, type: 'photo' })),
      ...videoStats.map(f => ({ ...f, type: 'video' })),
      ...audioStats.map(f => ({ ...f, type: 'audio' })),
      ...voiceStats.map(f => ({ ...f, type: 'audio' })), // Voice notes count as audio
      ...docStats.map(f => ({ ...f, type: 'document' }))
    ];

    // Process files with progress indicator
    const totalToProcess = allFiles.length;
    let processed = 0;

    process.stdout.write(`     ⏳ Processing ${totalToProcess.toLocaleString()} files...`);

    // Group by chat JID (extracted from filename)
    allFiles.forEach((file, index) => {
      processed++;

      // Update progress every 100 files or at the end
      if (processed % 100 === 0 || processed === totalToProcess) {
        const percent = Math.round((processed / totalToProcess) * 100);
        process.stdout.write(`\r     ⏳ Processing files: ${processed.toLocaleString()}/${totalToProcess.toLocaleString()} (${percent}%)`);
      }

      const chatJid = this.extractChatJidFromFilename(file.name);
      if (!chatJid) return; // Skip files without identifiable chat

      if (!chatMediaStats.has(chatJid)) {
        chatMediaStats.set(chatJid, {
          photosCount: 0,
          photosSizeMB: 0,
          videosCount: 0,
          videosSizeMB: 0,
          audiosCount: 0,
          audiosSizeMB: 0,
          documentsCount: 0,
          documentsSizeMB: 0,
          totalMediaCount: 0,
          totalMediaSizeMB: 0
        });
      }

      const stats = chatMediaStats.get(chatJid)!;
      const sizeMB = file.size / (1024 * 1024);

      // Update counts and sizes by type
      switch (file.type) {
        case 'photo':
          stats.photosCount++;
          stats.photosSizeMB += sizeMB;
          break;
        case 'video':
          stats.videosCount++;
          stats.videosSizeMB += sizeMB;
          break;
        case 'audio':
          stats.audiosCount++;
          stats.audiosSizeMB += sizeMB;
          break;
        case 'document':
          stats.documentsCount++;
          stats.documentsSizeMB += sizeMB;
          break;
      }

      stats.totalMediaCount++;
      stats.totalMediaSizeMB += sizeMB;
    });

    // Round all sizes to 2 decimal places
    chatMediaStats.forEach(stats => {
      stats.photosSizeMB = Math.round(stats.photosSizeMB * 100) / 100;
      stats.videosSizeMB = Math.round(stats.videosSizeMB * 100) / 100;
      stats.audiosSizeMB = Math.round(stats.audiosSizeMB * 100) / 100;
      stats.documentsSizeMB = Math.round(stats.documentsSizeMB * 100) / 100;
      stats.totalMediaSizeMB = Math.round(stats.totalMediaSizeMB * 100) / 100;
    });

    // Summary statistics
    let totalFiles = 0;
    let totalSize = 0;
    let photos = 0, videos = 0, audios = 0, docs = 0;

    chatMediaStats.forEach(stats => {
      totalFiles += stats.totalMediaCount;
      totalSize += stats.totalMediaSizeMB;
      photos += stats.photosCount;
      videos += stats.videosCount;
      audios += stats.audiosCount;
      docs += stats.documentsCount;
    });

    process.stdout.write(`\r     ✓ Processed ${totalFiles.toLocaleString()} files successfully!                              \n`);
    console.log(`     📊 Summary: ${photos.toLocaleString()} photos, ${videos.toLocaleString()} videos, ${audios.toLocaleString()} audios, ${docs.toLocaleString()} documents`);
    console.log(`     💾 Total size: ${Math.round(totalSize).toLocaleString()} MB across ${chatMediaStats.size} chats`);

    return chatMediaStats;
  }

  /**
   * Scan a specific media directory and return file info
   */
  private scanDirectory(subDir: string, extensions: string[]): Array<{name: string, size: number}> {
    const dirPath = join(this.mediaPath, subDir);
    const files: Array<{name: string, size: number}> = [];

    if (!existsSync(dirPath)) {
      // Log when directory doesn't exist
      if (subDir === 'WhatsApp Images') {
        console.log(`     ❌ Directory not found: ${dirPath}`);
      }
      return files;
    }

    try {
      const entries = readdirSync(dirPath);

      for (const entry of entries) {
        const fullPath = join(dirPath, entry);
        const stats = statSync(fullPath);

        if (stats.isFile()) {
          const ext = entry.split('.').pop()?.toLowerCase();
          if (ext && extensions.includes(ext)) {
            files.push({
              name: entry,
              size: stats.size
            });
          }
        }
      }
    } catch (error) {
      console.warn(`     ⚠️  Error scanning ${subDir}:`, error);
    }

    return files;
  }

  /**
   * Extract chat JID from WhatsApp media filename
   * WhatsApp filenames typically include sender phone number
   */
  private extractChatJidFromFilename(filename: string): string | null {
    // Pattern 1: Files from individual chats (e.g., "IMG-20210101-WA0001.jpg")
    // These don't have chat ID in filename, would need message database to map

    // Pattern 2: Some files may have phone numbers
    const phoneMatch = filename.match(/(\d{10,15})/);
    if (phoneMatch) {
      return `${phoneMatch[1]}@s.whatsapp.net`;
    }

    // For now, return a generic "unknown" chat for files we can't identify
    // In a real implementation, we'd need to cross-reference with message database
    return 'unknown@chat';
  }

  /**
   * Get a default stats object with zeros
   */
  static getEmptyStats(): MediaFileStats {
    return {
      photosCount: 0,
      photosSizeMB: 0,
      videosCount: 0,
      videosSizeMB: 0,
      audiosCount: 0,
      audiosSizeMB: 0,
      documentsCount: 0,
      documentsSizeMB: 0,
      totalMediaCount: 0,
      totalMediaSizeMB: 0
    };
  }
}