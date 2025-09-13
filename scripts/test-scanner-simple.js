#!/usr/bin/env node

/**
 * Ultra-simple WhatsApp Scanner Test for Termux
 * KISS principle - No unnecessary dependencies
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ANSI colors (built-in, no chalk needed)
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m'
};

// Common WhatsApp paths
const WHATSAPP_PATHS = [
  '/storage/emulated/0/Android/media/com.whatsapp/WhatsApp',
  '/sdcard/Android/media/com.whatsapp/WhatsApp',
  '/storage/emulated/0/WhatsApp',
  '/sdcard/WhatsApp'
];

// Find WhatsApp directory
function findWhatsAppPath(customPath) {
  if (customPath) {
    if (fs.existsSync(customPath)) {
      return customPath;
    }
    console.log(`${colors.red}❌ Path not found: ${customPath}${colors.reset}`);
    return null;
  }

  for (const path of WHATSAPP_PATHS) {
    if (fs.existsSync(path)) {
      console.log(`${colors.green}✅ Found WhatsApp at: ${path}${colors.reset}`);
      return path;
    }
  }
  
  console.log(`${colors.red}❌ WhatsApp directory not found${colors.reset}`);
  console.log('Tried:', WHATSAPP_PATHS.join(', '));
  return null;
}

// Scan for media files
function scanMedia(whatsappPath) {
  const mediaPath = path.join(whatsappPath, 'Media');
  
  if (!fs.existsSync(mediaPath)) {
    console.log(`${colors.red}❌ Media folder not found${colors.reset}`);
    return;
  }

  console.log(`\n${colors.blue}📁 Scanning Media folder...${colors.reset}`);
  
  const stats = {
    images: 0,
    videos: 0,
    audio: 0,
    documents: 0,
    total: 0,
    totalSize: 0
  };

  const mediaDirs = fs.readdirSync(mediaPath);
  
  mediaDirs.forEach(dir => {
    const dirPath = path.join(mediaPath, dir);
    if (!fs.statSync(dirPath).isDirectory()) return;
    
    if (dir.includes('Images')) {
      const files = scanDirectory(dirPath, ['.jpg', '.jpeg', '.png', '.gif', '.webp']);
      stats.images += files.count;
      stats.totalSize += files.size;
    } else if (dir.includes('Video')) {
      const files = scanDirectory(dirPath, ['.mp4', '.3gp', '.avi', '.mkv']);
      stats.videos += files.count;
      stats.totalSize += files.size;
    } else if (dir.includes('Audio')) {
      const files = scanDirectory(dirPath, ['.mp3', '.m4a', '.opus', '.aac']);
      stats.audio += files.count;
      stats.totalSize += files.size;
    } else if (dir.includes('Documents')) {
      const files = scanDirectory(dirPath, ['.pdf', '.doc', '.docx', '.txt']);
      stats.documents += files.count;
      stats.totalSize += files.size;
    }
  });

  stats.total = stats.images + stats.videos + stats.audio + stats.documents;

  console.log(`\n${colors.green}📊 Summary:${colors.reset}`);
  console.log(`  📷 Images: ${stats.images}`);
  console.log(`  🎥 Videos: ${stats.videos}`);
  console.log(`  🎵 Audio: ${stats.audio}`);
  console.log(`  📄 Documents: ${stats.documents}`);
  console.log(`  📦 Total files: ${stats.total}`);
  console.log(`  💾 Total size: ${formatSize(stats.totalSize)}`);
}

// Scan a directory for files with specific extensions
function scanDirectory(dirPath, extensions) {
  let count = 0;
  let totalSize = 0;

  try {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile() && extensions.some(ext => file.toLowerCase().endsWith(ext))) {
        count++;
        totalSize += stat.size;
      }
    });
  } catch (e) {
    // Ignore permission errors
  }

  return { count, size: totalSize };
}

// Format file size
function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Main
async function main() {
  console.log(`${colors.blue}🚀 WhatsApp Scanner Test (Ultra-Simple Edition)${colors.reset}`);
  console.log('=' .repeat(50));
  
  const customPath = process.argv[2];
  const whatsappPath = findWhatsAppPath(customPath);
  
  if (!whatsappPath) {
    console.log(`\n${colors.yellow}💡 Tip: Make sure WhatsApp is installed and you've run:${colors.reset}`);
    console.log('  termux-setup-storage');
    process.exit(1);
  }
  
  scanMedia(whatsappPath);
  
  console.log(`\n${colors.green}✅ Test completed successfully!${colors.reset}`);
  console.log(`${colors.yellow}💡 Ready to use with Google Sheets persistence${colors.reset}`);
}

// Run
main().catch(console.error);