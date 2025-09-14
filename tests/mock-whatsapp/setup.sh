#!/bin/bash

# Android 12+ WhatsApp directory structure
# Path: /storage/emulated/0/Android/media/com.whatsapp/WhatsApp/Media/

BASE_DIR="tests/mock-whatsapp/Android/media/com.whatsapp/WhatsApp/Media"

# Create directory structure
mkdir -p "$BASE_DIR/WhatsApp Images"
mkdir -p "$BASE_DIR/WhatsApp Images/Sent"
mkdir -p "$BASE_DIR/WhatsApp Images/Private"
mkdir -p "$BASE_DIR/WhatsApp Video" 
mkdir -p "$BASE_DIR/WhatsApp Video/Sent"
mkdir -p "$BASE_DIR/WhatsApp Video/Private"
mkdir -p "$BASE_DIR/WhatsApp Audio"
mkdir -p "$BASE_DIR/WhatsApp Audio/Sent"
mkdir -p "$BASE_DIR/WhatsApp Audio/Private"
mkdir -p "$BASE_DIR/WhatsApp Documents"
mkdir -p "$BASE_DIR/WhatsApp Documents/Sent"
mkdir -p "$BASE_DIR/WhatsApp Documents/Private"
mkdir -p "$BASE_DIR/WhatsApp Voice Notes"
mkdir -p "$BASE_DIR/WhatsApp Animated Gifs"
mkdir -p "$BASE_DIR/WhatsApp Animated Gifs/Sent"
mkdir -p "$BASE_DIR/WhatsApp Animated Gifs/Private"
mkdir -p "$BASE_DIR/WhatsApp Stickers"
mkdir -p "$BASE_DIR/.Statuses"

# Create Databases directory (backup files)
mkdir -p "tests/mock-whatsapp/Android/media/com.whatsapp/WhatsApp/Databases"

# Create Profile Photos directory
mkdir -p "tests/mock-whatsapp/Android/media/com.whatsapp/WhatsApp/Profile Pictures"

echo "WhatsApp Android 12+ directory structure created successfully!"
