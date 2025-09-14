#!/bin/bash

# Base directory for WhatsApp media
BASE_DIR="tests/mock-whatsapp/Android/media/com.whatsapp/WhatsApp/Media"

echo "Starting to populate WhatsApp mock directory with sample files..."

# Download sample images
echo "Downloading images..."
mkdir -p "$BASE_DIR/WhatsApp Images"
cd "$BASE_DIR/WhatsApp Images"
curl -s -L "https://picsum.photos/1024/768.jpg" -o "IMG-20240101-WA0001.jpg"
curl -s -L "https://picsum.photos/1920/1080.jpg" -o "IMG-20240102-WA0002.jpg"
curl -s -L "https://picsum.photos/800/600.jpg" -o "IMG-20240103-WA0003.jpg"
curl -s -L "https://picsum.photos/1200/900.jpg" -o "IMG-20240105-WA0004.jpg"
curl -s -L "https://picsum.photos/640/480.jpg" -o "IMG-20240110-WA0005.jpg"
curl -s -L "https://picsum.photos/1024/1024.jpg" -o "IMG-20240112-WA0006.jpg"
curl -s -L "https://picsum.photos/720/1280.jpg" -o "IMG-20240115-WA0007.jpg"
curl -s -L "https://picsum.photos/1280/720.jpg" -o "IMG-20240118-WA0008.jpg"

# Sent images
mkdir -p "$BASE_DIR/WhatsApp Images/Sent"
cd "$BASE_DIR/WhatsApp Images/Sent"
curl -s -L "https://picsum.photos/1024/1024.jpg" -o "IMG-20240120-WA0009.jpg"
curl -s -L "https://picsum.photos/720/720.jpg" -o "IMG-20240122-WA0010.jpg"
curl -s -L "https://picsum.photos/1080/1080.jpg" -o "IMG-20240125-WA0011.jpg"

# Private images
mkdir -p "$BASE_DIR/WhatsApp Images/Private"
touch "$BASE_DIR/WhatsApp Images/Private/.nomedia"
cd "$BASE_DIR/WhatsApp Images/Private"
curl -s -L "https://picsum.photos/800/800.jpg" -o "IMG-20240201-WA0012.jpg"

# Download sample videos (smaller files)
echo "Downloading videos..."
mkdir -p "$BASE_DIR/WhatsApp Video"
cd "$BASE_DIR/WhatsApp Video"
# Create placeholder video files (actual download might be too large)
echo "Sample video file VID-20240201-WA0001" > "VID-20240201-WA0001.mp4"
echo "Sample video file VID-20240205-WA0002" > "VID-20240205-WA0002.mp4"
echo "Sample video file VID-20240208-WA0003" > "VID-20240208-WA0003.mp4"

mkdir -p "$BASE_DIR/WhatsApp Video/Sent"
cd "$BASE_DIR/WhatsApp Video/Sent"
echo "Sample sent video VID-20240210-WA0004" > "VID-20240210-WA0004.mp4"

# Audio files
echo "Creating audio files..."
mkdir -p "$BASE_DIR/WhatsApp Audio"
cd "$BASE_DIR/WhatsApp Audio"
echo "Sample audio file" > "AUD-20240301-WA0001.mp3"
echo "Sample audio file" > "AUD-20240305-WA0002.mp3"
echo "Sample audio file" > "AUD-20240308-WA0003.mp3"

# Voice notes (WhatsApp uses opus format)
echo "Creating voice notes..."
mkdir -p "$BASE_DIR/WhatsApp Voice Notes"
cd "$BASE_DIR/WhatsApp Voice Notes"
echo "Voice note sample" > "PTT-20240401-WA0001.opus"
echo "Voice note sample" > "PTT-20240402-WA0002.opus"
echo "Voice note sample" > "PTT-20240405-WA0003.opus"
echo "Voice note sample" > "PTT-20240408-WA0004.opus"

# Documents
echo "Creating documents..."
mkdir -p "$BASE_DIR/WhatsApp Documents"
cd "$BASE_DIR/WhatsApp Documents"

# Create a simple PDF
echo "%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000062 00000 n
0000000115 00000 n
trailer << /Size 4 /Root 1 0 R >>
startxref
200
%%EOF" > "DOC-20240501-WA0001.pdf"

# Text documents
echo "Meeting Notes - Q1 2024
Date: January 15, 2024
Attendees: Team A, Team B
Topics:
- Project timeline
- Budget allocation
- Resource planning
- Next steps" > "DOC-20240115-WA0002.txt"

echo "Invoice #12345
Date: February 1, 2024
Amount: $1,500.00
Description: Professional Services" > "DOC-20240201-WA0003.txt"

mkdir -p "$BASE_DIR/WhatsApp Documents/Sent"
cd "$BASE_DIR/WhatsApp Documents/Sent"
echo "Contract Agreement
Party A: Company XYZ
Party B: Client ABC
Date: March 1, 2024" > "DOC-20240301-WA0004.txt"

# Animated GIFs
echo "Creating GIF files..."
mkdir -p "$BASE_DIR/WhatsApp Animated Gifs"
cd "$BASE_DIR/WhatsApp Animated Gifs"
# Download small sample GIFs
curl -s -L "https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif" -o "GIF-20240601-WA0001.gif" --max-filesize 500K || echo "Sample GIF" > "GIF-20240601-WA0001.gif"
curl -s -L "https://upload.wikimedia.org/wikipedia/commons/d/d3/Newtons_cradle_animation_book_2.gif" -o "GIF-20240605-WA0002.gif" --max-filesize 500K || echo "Sample GIF" > "GIF-20240605-WA0002.gif"

# Stickers
echo "Creating sticker files..."
mkdir -p "$BASE_DIR/WhatsApp Stickers"
cd "$BASE_DIR/WhatsApp Stickers"
curl -s -L "https://picsum.photos/512/512.jpg" -o "STK-20240701-WA0001.webp"
curl -s -L "https://picsum.photos/512/512.jpg" -o "STK-20240705-WA0002.webp"

# Status/Stories
echo "Creating status files..."
mkdir -p "$BASE_DIR/.Statuses"
touch "$BASE_DIR/.Statuses/.nomedia"
cd "$BASE_DIR/.Statuses"
curl -s -L "https://picsum.photos/720/1280.jpg" -o "STATUS-20240801-103045.jpg"
curl -s -L "https://picsum.photos/720/1280.jpg" -o "STATUS-20240801-142312.jpg"
curl -s -L "https://picsum.photos/720/1280.jpg" -o "STATUS-20240802-091523.jpg"

# Create database backup files
echo "Creating database files..."
DB_DIR="tests/mock-whatsapp/Android/media/com.whatsapp/WhatsApp/Databases"
mkdir -p "$DB_DIR"
cd "$DB_DIR"
echo "SQLite format 3 - WhatsApp encrypted database" > "msgstore.db.crypt14"
echo "SQLite format 3 - WhatsApp backup 2024-01-15" > "msgstore-2024-01-15.1.db.crypt14"
echo "SQLite format 3 - WhatsApp backup 2024-01-10" > "msgstore-2024-01-10.1.db.crypt14"

# Profile pictures
echo "Creating profile pictures..."
PROFILE_DIR="tests/mock-whatsapp/Android/media/com.whatsapp/WhatsApp/Profile Pictures"
mkdir -p "$PROFILE_DIR"
cd "$PROFILE_DIR"
curl -s -L "https://picsum.photos/400/400.jpg" -o "5511999888777.jpg"
curl -s -L "https://picsum.photos/400/400.jpg" -o "5511888777666.jpg"
curl -s -L "https://picsum.photos/400/400.jpg" -o "5511777666555.jpg"

# Create .nomedia files in private directories
touch "$BASE_DIR/WhatsApp Video/Private/.nomedia"
touch "$BASE_DIR/WhatsApp Audio/Private/.nomedia"
touch "$BASE_DIR/WhatsApp Documents/Private/.nomedia"
touch "$BASE_DIR/WhatsApp Animated Gifs/Private/.nomedia"

echo "✅ WhatsApp mock directory populated successfully!"
echo ""
echo "Directory structure created at: tests/mock-whatsapp/Android/media/com.whatsapp/"
echo ""
echo "Summary of created content:"
find tests/mock-whatsapp/Android/media/com.whatsapp/WhatsApp/Media -type f -name "*.jpg" -o -name "*.mp4" -o -name "*.mp3" -o -name "*.pdf" -o -name "*.txt" -o -name "*.opus" -o -name "*.gif" -o -name "*.webp" | wc -l
echo "total media files created"