#!/bin/bash

echo "Creating WhatsApp Android 12+ directory structure and populating with sample files..."

# Create complete directory structure
mkdir -p "Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Images/"{Sent,Private}
mkdir -p "Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Video/"{Sent,Private}
mkdir -p "Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Audio/"{Sent,Private}
mkdir -p "Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Documents/"{Sent,Private}
mkdir -p "Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Voice Notes"
mkdir -p "Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Animated Gifs/"{Sent,Private}
mkdir -p "Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Stickers"
mkdir -p "Android/media/com.whatsapp/WhatsApp/Media/.Statuses"
mkdir -p "Android/media/com.whatsapp/WhatsApp/Databases"
mkdir -p "Android/media/com.whatsapp/WhatsApp/Profile Pictures"

# Base path
BASE="Android/media/com.whatsapp/WhatsApp/Media"

# Download sample images from Lorem Picsum (reliable free image service)
echo "📸 Downloading sample images..."
curl -s -L "https://picsum.photos/1024/768" -o "$BASE/WhatsApp Images/IMG-20240101-WA0001.jpg"
curl -s -L "https://picsum.photos/1920/1080" -o "$BASE/WhatsApp Images/IMG-20240102-WA0002.jpg"
curl -s -L "https://picsum.photos/800/600" -o "$BASE/WhatsApp Images/IMG-20240103-WA0003.jpg"
curl -s -L "https://picsum.photos/1200/900" -o "$BASE/WhatsApp Images/IMG-20240105-WA0004.jpg"
curl -s -L "https://picsum.photos/640/480" -o "$BASE/WhatsApp Images/IMG-20240110-WA0005.jpg"
curl -s -L "https://picsum.photos/1024/1024" -o "$BASE/WhatsApp Images/IMG-20240112-WA0006.jpg"
curl -s -L "https://picsum.photos/720/1280" -o "$BASE/WhatsApp Images/IMG-20240115-WA0007.jpg"
curl -s -L "https://picsum.photos/1280/720" -o "$BASE/WhatsApp Images/IMG-20240118-WA0008.jpg"
curl -s -L "https://picsum.photos/1080/1920" -o "$BASE/WhatsApp Images/IMG-20240120-WA0009.jpg"
curl -s -L "https://picsum.photos/2048/1536" -o "$BASE/WhatsApp Images/IMG-20240125-WA0010.jpg"

# Sent images
curl -s -L "https://picsum.photos/1024/1024" -o "$BASE/WhatsApp Images/Sent/IMG-20240201-WA0011.jpg"
curl -s -L "https://picsum.photos/720/720" -o "$BASE/WhatsApp Images/Sent/IMG-20240205-WA0012.jpg"
curl -s -L "https://picsum.photos/1080/1080" -o "$BASE/WhatsApp Images/Sent/IMG-20240210-WA0013.jpg"

# Private images
curl -s -L "https://picsum.photos/800/800" -o "$BASE/WhatsApp Images/Private/IMG-20240301-WA0014.jpg"
touch "$BASE/WhatsApp Images/Private/.nomedia"

# Create sample video files (placeholders with metadata)
echo "🎥 Creating sample video files..."
for i in {1..5}; do
    echo "Sample WhatsApp Video $i - Duration: 0:3$i" > "$BASE/WhatsApp Video/VID-2024010$i-WA000$i.mp4"
done
echo "Sent video file" > "$BASE/WhatsApp Video/Sent/VID-20240210-WA0006.mp4"
touch "$BASE/WhatsApp Video/Private/.nomedia"

# Create audio files
echo "🎵 Creating sample audio files..."
for i in {1..3}; do
    echo "WhatsApp Audio Message $i" > "$BASE/WhatsApp Audio/AUD-2024030$i-WA000$i.mp3"
done
echo "Sent audio" > "$BASE/WhatsApp Audio/Sent/AUD-20240310-WA0004.mp3"
touch "$BASE/WhatsApp Audio/Private/.nomedia"

# Create voice notes (WhatsApp uses .opus format)
echo "🎤 Creating voice notes..."
for i in {1..8}; do
    echo "PTT Voice Note $i" > "$BASE/WhatsApp Voice Notes/PTT-2024040$i-WA000$i.opus"
done

# Create documents
echo "📄 Creating sample documents..."
# Simple PDF structure
echo "%PDF-1.4
%âÿÿÿ
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 50 >>
stream
BT /F1 12 Tf 100 700 Td (WhatsApp Document) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000015 00000 n
0000000068 00000 n
0000000125 00000 n
0000000229 00000 n
trailer << /Size 5 /Root 1 0 R >>
startxref
344
%%EOF" > "$BASE/WhatsApp Documents/DOC-20240501-WA0001.pdf"

# Text files
echo "Meeting Notes - Q1 2024
===============================
Date: January 15, 2024
Attendees: Team A, Team B
Topics:
- Project timeline review
- Budget allocation for Q1
- Resource planning updates
- Risk assessment
- Next steps and action items" > "$BASE/WhatsApp Documents/DOC-20240115-WA0002.txt"

echo "Invoice #INV-2024-0023
Company XYZ Ltd.
Date: February 1, 2024
Amount: \$1,500.00
Description: Professional Services - January 2024" > "$BASE/WhatsApp Documents/DOC-20240201-WA0003.txt"

echo "Sent Document - Contract" > "$BASE/WhatsApp Documents/Sent/DOC-20240301-WA0004.txt"
touch "$BASE/WhatsApp Documents/Private/.nomedia"

# Download small animated GIFs
echo "🎬 Downloading sample GIFs..."
# Using placeholder GIF files for now
echo "GIF Animation 1" > "$BASE/WhatsApp Animated Gifs/GIF-20240601-WA0001.gif"
echo "GIF Animation 2" > "$BASE/WhatsApp Animated Gifs/GIF-20240605-WA0002.gif"
echo "Sent GIF" > "$BASE/WhatsApp Animated Gifs/Sent/GIF-20240610-WA0003.gif"
touch "$BASE/WhatsApp Animated Gifs/Private/.nomedia"

# Create sticker files (WebP format)
echo "🎨 Creating sticker files..."
curl -s -L "https://picsum.photos/512/512" -o "$BASE/WhatsApp Stickers/STK-20240701-WA0001.webp"
curl -s -L "https://picsum.photos/512/512" -o "$BASE/WhatsApp Stickers/STK-20240705-WA0002.webp"
curl -s -L "https://picsum.photos/512/512" -o "$BASE/WhatsApp Stickers/STK-20240710-WA0003.webp"

# Status/Stories (24-hour temporary media)
echo "📱 Creating status files..."
touch "$BASE/.Statuses/.nomedia"
curl -s -L "https://picsum.photos/720/1280" -o "$BASE/.Statuses/STATUS-20240801-103045.jpg"
curl -s -L "https://picsum.photos/720/1280" -o "$BASE/.Statuses/STATUS-20240801-142312.jpg"
curl -s -L "https://picsum.photos/720/1280" -o "$BASE/.Statuses/STATUS-20240802-091523.jpg"
echo "Status Video" > "$BASE/.Statuses/STATUS-20240802-153022.mp4"

# Create database backup files (encrypted)
echo "🔒 Creating database files..."
echo "SQLite format 3 - Encrypted WhatsApp Database (crypt14)" > "Android/media/com.whatsapp/WhatsApp/Databases/msgstore.db.crypt14"
echo "SQLite format 3 - Backup 2024-01-15" > "Android/media/com.whatsapp/WhatsApp/Databases/msgstore-2024-01-15.1.db.crypt14"
echo "SQLite format 3 - Backup 2024-01-10" > "Android/media/com.whatsapp/WhatsApp/Databases/msgstore-2024-01-10.1.db.crypt14"
echo "SQLite format 3 - Backup 2024-01-05" > "Android/media/com.whatsapp/WhatsApp/Databases/msgstore-2024-01-05.1.db.crypt14"

# Profile pictures
echo "👤 Downloading profile pictures..."
curl -s -L "https://picsum.photos/400/400" -o "Android/media/com.whatsapp/WhatsApp/Profile Pictures/5511999888777.jpg"
curl -s -L "https://picsum.photos/400/400" -o "Android/media/com.whatsapp/WhatsApp/Profile Pictures/5511888777666.jpg"
curl -s -L "https://picsum.photos/400/400" -o "Android/media/com.whatsapp/WhatsApp/Profile Pictures/5511777666555.jpg"
curl -s -L "https://picsum.photos/400/400" -o "Android/media/com.whatsapp/WhatsApp/Profile Pictures/5511666555444.jpg"

echo ""
echo "✅ WhatsApp mock directory structure created successfully!"
echo ""
echo "📊 Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📸 Images: $(find "$BASE/WhatsApp Images" -name "*.jpg" 2>/dev/null | wc -l) files"
echo "🎥 Videos: $(find "$BASE/WhatsApp Video" -name "*.mp4" 2>/dev/null | wc -l) files"
echo "🎵 Audio: $(find "$BASE/WhatsApp Audio" -name "*.mp3" 2>/dev/null | wc -l) files"
echo "🎤 Voice Notes: $(find "$BASE/WhatsApp Voice Notes" -name "*.opus" 2>/dev/null | wc -l) files"
echo "📄 Documents: $(find "$BASE/WhatsApp Documents" -type f 2>/dev/null | wc -l) files"
echo "🎬 GIFs: $(find "$BASE/WhatsApp Animated Gifs" -name "*.gif" 2>/dev/null | wc -l) files"
echo "🎨 Stickers: $(find "$BASE/WhatsApp Stickers" -name "*.webp" 2>/dev/null | wc -l) files"
echo "📱 Status: $(find "$BASE/.Statuses" -type f ! -name ".nomedia" 2>/dev/null | wc -l) files"
echo "🔒 Databases: $(find "Android/media/com.whatsapp/WhatsApp/Databases" -name "*.crypt14" 2>/dev/null | wc -l) files"
echo "👤 Profile Pictures: $(find "Android/media/com.whatsapp/WhatsApp/Profile Pictures" -name "*.jpg" 2>/dev/null | wc -l) files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 Root path: tests/mock-whatsapp/Android/media/com.whatsapp/"