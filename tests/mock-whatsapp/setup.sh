#!/bin/bash

# WhatsApp Android 12+ mock structure setup
# Creates directory structure and optionally populates with sample files
# Usage: ./setup.sh [--populate]

POPULATE=false
if [ "$1" = "--populate" ]; then
    POPULATE=true
fi

# Base paths
BASE="tests/mock-whatsapp/Android/media/com.whatsapp/WhatsApp"
MEDIA="$BASE/Media"

echo "Creating WhatsApp Android 12+ directory structure..."

# Create complete directory structure
mkdir -p "$MEDIA/WhatsApp Images/"{Sent,Private}
mkdir -p "$MEDIA/WhatsApp Video/"{Sent,Private}
mkdir -p "$MEDIA/WhatsApp Audio/"{Sent,Private}
mkdir -p "$MEDIA/WhatsApp Documents/"{Sent,Private}
mkdir -p "$MEDIA/WhatsApp Voice Notes"
mkdir -p "$MEDIA/WhatsApp Animated Gifs/"{Sent,Private}
mkdir -p "$MEDIA/WhatsApp Stickers"
mkdir -p "$MEDIA/.Statuses"
mkdir -p "$BASE/Databases"
mkdir -p "$BASE/Profile Pictures"

echo "✅ Directory structure created!"

if [ "$POPULATE" = true ]; then
    echo "\n📦 Populating with sample files..."

    # Images
    echo "📸 Creating sample images..."
    curl -s -L "https://picsum.photos/1024/768" -o "$MEDIA/WhatsApp Images/IMG-20240101-WA0001.jpg"
    curl -s -L "https://picsum.photos/800/600" -o "$MEDIA/WhatsApp Images/IMG-20240102-WA0002.jpg"
    curl -s -L "https://picsum.photos/720/720" -o "$MEDIA/WhatsApp Images/Sent/IMG-20240201-WA0003.jpg"
    touch "$MEDIA/WhatsApp Images/Private/.nomedia"

    # Videos (placeholders)
    echo "🎥 Creating sample videos..."
    echo "Sample video" > "$MEDIA/WhatsApp Video/VID-20240101-WA0001.mp4"
    echo "Sent video" > "$MEDIA/WhatsApp Video/Sent/VID-20240201-WA0002.mp4"
    touch "$MEDIA/WhatsApp Video/Private/.nomedia"

    # Audio
    echo "🎵 Creating sample audio..."
    echo "Audio message" > "$MEDIA/WhatsApp Audio/AUD-20240101-WA0001.mp3"
    echo "Sent audio" > "$MEDIA/WhatsApp Audio/Sent/AUD-20240201-WA0002.mp3"
    touch "$MEDIA/WhatsApp Audio/Private/.nomedia"

    # Voice notes
    echo "🎤 Creating voice notes..."
    for i in {1..3}; do
        echo "Voice note $i" > "$MEDIA/WhatsApp Voice Notes/PTT-2024010$i-WA000$i.opus"
    done

    # Documents
    echo "📄 Creating documents..."
    echo "Meeting Notes\nDate: 2024-01-15\nTopics: Project review" > "$MEDIA/WhatsApp Documents/DOC-20240115-WA0001.txt"
    echo "Sent document" > "$MEDIA/WhatsApp Documents/Sent/DOC-20240201-WA0002.txt"
    touch "$MEDIA/WhatsApp Documents/Private/.nomedia"

    # GIFs
    echo "🎬 Creating GIFs..."
    echo "GIF animation" > "$MEDIA/WhatsApp Animated Gifs/GIF-20240101-WA0001.gif"
    echo "Sent GIF" > "$MEDIA/WhatsApp Animated Gifs/Sent/GIF-20240201-WA0002.gif"
    touch "$MEDIA/WhatsApp Animated Gifs/Private/.nomedia"

    # Stickers
    echo "🎨 Creating stickers..."
    curl -s -L "https://picsum.photos/512/512" -o "$MEDIA/WhatsApp Stickers/STK-20240101-WA0001.webp"

    # Status
    echo "📱 Creating status files..."
    touch "$MEDIA/.Statuses/.nomedia"
    curl -s -L "https://picsum.photos/720/1280" -o "$MEDIA/.Statuses/STATUS-20240101-103045.jpg"

    # Database backups
    echo "🔒 Creating database files..."
    echo "SQLite crypt14" > "$BASE/Databases/msgstore.db.crypt14"
    echo "SQLite backup" > "$BASE/Databases/msgstore-2024-01-15.1.db.crypt14"

    # Profile pictures
    echo "👤 Creating profile pictures..."
    curl -s -L "https://picsum.photos/400/400" -o "$BASE/Profile Pictures/5511999888777.jpg"

    echo "\n✅ Sample files created!"
fi

echo "\n📊 Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
find "$MEDIA" -type d -name "WhatsApp *" -o -name ".Statuses" | wc -l | xargs echo "Media folders:"
if [ "$POPULATE" = true ]; then
    find "$MEDIA" -type f ! -name ".nomedia" | wc -l | xargs echo "Sample files:"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 Path: tests/mock-whatsapp/"
