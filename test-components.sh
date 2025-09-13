#!/bin/bash

# Test script for WhatsApp Google Uploader Components
# Tests each component individually

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 WhatsApp Google Uploader - Test Suite${NC}"
echo "=================================================="

# Check if built
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}📦 Building project first...${NC}"
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Build failed! Run 'npm run build' to see errors${NC}"
        exit 1
    fi
fi

# Test OAuth
test_oauth() {
    echo -e "\n${BLUE}1. Testing OAuth Authentication${NC}"
    echo "--------------------------------"
    
    if [ ! -f "credentials.json" ]; then
        echo -e "${RED}❌ credentials.json not found!${NC}"
        echo -e "${YELLOW}Steps to get credentials:${NC}"
        echo "1. Go to https://console.cloud.google.com/"
        echo "2. Create or select a project"
        echo "3. Enable these APIs:"
        echo "   - Google Drive API"
        echo "   - Google Photos Library API"
        echo "4. Create OAuth 2.0 credentials"
        echo "5. Download as credentials.json"
        return 1
    fi
    
    # Create simple test
    node -e "
    const { GoogleApis } = require('./dist/google-apis/GoogleApis');
    const googleApis = new GoogleApis('credentials.json');
    googleApis.authenticate()
        .then(() => console.log('✅ OAuth working!'))
        .catch(err => console.log('❌ OAuth failed:', err.message));
    "
}

# Test Scanner
test_scanner() {
    echo -e "\n${BLUE}2. Testing WhatsApp Scanner${NC}"
    echo "----------------------------"
    
    node -e "
    const { WhatsAppScanner } = require('./dist/scanner');
    const scanner = new WhatsAppScanner();
    
    // Common paths
    const paths = [
        '/storage/emulated/0/Android/media/com.whatsapp/WhatsApp',
        '/sdcard/Android/media/com.whatsapp/WhatsApp',
        '/storage/emulated/0/WhatsApp',
        '/sdcard/WhatsApp',
        './test-whatsapp' // For testing
    ];
    
    let found = false;
    for (const path of paths) {
        const fs = require('fs');
        if (fs.existsSync(path)) {
            console.log('✅ Found WhatsApp at:', path);
            scanner.discoverChats(path)
                .then(chats => console.log('   Found', chats.length, 'chats'))
                .catch(err => console.log('❌ Scan failed:', err.message));
            found = true;
            break;
        }
    }
    
    if (!found) {
        console.log('⚠️ WhatsApp directory not found');
        console.log('   Expected locations:', paths.join(', '));
    }
    "
}

# Test Google Drive
test_drive() {
    echo -e "\n${BLUE}3. Testing Google Drive Upload${NC}"
    echo "-------------------------------"
    
    # Create test file
    echo "Test upload at $(date)" > test-drive.txt
    
    node -e "
    const { GoogleApis } = require('./dist/google-apis/GoogleApis');
    const googleApis = new GoogleApis('credentials.json');
    
    googleApis.authenticate()
        .then(() => googleApis.uploadToDrive('test-drive.txt', 'WhatsApp-Test'))
        .then(result => {
            if (result && result.id) {
                console.log('✅ Drive upload working!');
                console.log('   File ID:', result.id);
            } else {
                console.log('⚠️ Upload returned no ID');
            }
        })
        .catch(err => console.log('❌ Drive upload failed:', err.message));
    " 2>/dev/null
}

# Test Google Photos
test_photos() {
    echo -e "\n${BLUE}4. Testing Google Photos Upload${NC}"
    echo "--------------------------------"
    
    # Create minimal test image (1x1 pixel JPEG)
    node -e "
    const fs = require('fs');
    const minimalJpeg = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
        0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C,
        0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0xFF, 0xD9
    ]);
    fs.writeFileSync('test-photo.jpg', minimalJpeg);
    " 2>/dev/null
    
    node -e "
    const { GoogleApis } = require('./dist/google-apis/GoogleApis');
    const googleApis = new GoogleApis('credentials.json');
    
    googleApis.authenticate()
        .then(() => googleApis.uploadToPhotos('test-photo.jpg', 'WhatsApp-Test'))
        .then(result => {
            if (result && result.id) {
                console.log('✅ Photos upload working!');
                console.log('   Media item ID:', result.id);
            } else {
                console.log('⚠️ Upload returned no ID');
            }
        })
        .catch(err => {
            console.log('❌ Photos upload failed:', err.message);
            if (err.message.includes('403')) {
                console.log('   Enable Photos API at:');
                console.log('   https://console.cloud.google.com/apis/library/photoslibrary.googleapis.com');
            }
        });
    " 2>/dev/null
}

# Run all tests
echo -e "${YELLOW}Running tests...${NC}\n"

test_oauth
test_scanner
test_drive
test_photos

echo -e "\n${GREEN}=================================================="
echo -e "Tests complete! Check results above.${NC}"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "• If OAuth fails, check credentials.json"
echo "• If Scanner fails on Termux, run: termux-setup-storage"
echo "• If Photos fails with 403, enable Photos API in Google Console"
echo "• Run individual tests with: node test-all.js"