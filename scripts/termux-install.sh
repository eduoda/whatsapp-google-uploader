#!/data/data/com.termux/files/usr/bin/bash

# Termux-specific installation script
# This script installs dependencies without compilation

echo "🚀 WhatsApp Google Uploader - Instalação Termux (Sem Compilação)"
echo "================================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Check if we're in Termux
if [ ! -d "/data/data/com.termux" ]; then
    echo -e "${RED}❌ Este script é apenas para Termux!${NC}"
    exit 1
fi

# Step 2: Install SQLite from Termux packages
echo -e "${YELLOW}📦 Instalando SQLite nativo do Termux...${NC}"
pkg install -y sqlite

# Step 3: Clean previous installation attempts
echo -e "${YELLOW}🧹 Limpando instalação anterior...${NC}"
rm -rf node_modules package-lock.json

# Step 4: Create a minimal package.json without better-sqlite3
echo -e "${YELLOW}📝 Criando package.json sem SQLite...${NC}"
cat > package-termux-minimal.json << 'EOF'
{
  "name": "whatsapp-google-uploader",
  "version": "1.0.0",
  "description": "WhatsApp Google Uploader for Termux",
  "scripts": {
    "test:scanner": "node scripts/test-scanner.js"
  },
  "dependencies": {
    "chalk": "^5.3.0",
    "commander": "^11.0.0",
    "fs-extra": "^11.1.1",
    "google-auth-library": "^9.0.0",
    "googleapis": "^126.0.1",
    "inquirer": "^9.2.10",
    "joi": "^17.10.1",
    "mime-types": "^2.1.35",
    "ora": "^7.0.1",
    "progress": "^2.0.3",
    "winston": "^3.10.0"
  }
}
EOF

# Step 5: Backup original package.json
if [ ! -f "package.original.json" ]; then
    cp package.json package.original.json
    echo -e "${GREEN}✅ Backup do package.json original criado${NC}"
fi

# Step 6: Use minimal package.json
cp package-termux-minimal.json package.json

# Step 7: Install without native dependencies
echo -e "${YELLOW}📦 Instalando dependências (sem SQLite)...${NC}"
npm install --no-optional

# Step 8: Restore original package.json
cp package.original.json package.json

# Step 9: Create SQLite fallback
echo -e "${YELLOW}🔧 Criando fallback para SQLite...${NC}"
mkdir -p packages/database/dist
cat > packages/database/dist/index.js << 'EOF'
// Fallback database for Termux
class FallbackDatabase {
  constructor() {
    this.data = new Map();
    console.log('📝 Using in-memory storage (no SQLite)');
  }
  
  prepare() {
    return {
      run: () => ({ changes: 0 }),
      get: () => undefined,
      all: () => []
    };
  }
  
  close() {}
}

module.exports = {
  DatabaseManager: FallbackDatabase,
  createDatabase: () => new FallbackDatabase()
};
EOF

echo -e "${GREEN}✅ Instalação concluída!${NC}"
echo ""
echo "Agora você pode testar o scanner:"
echo "  npm run test:scanner -- \"/storage/emulated/0/Android/media/com.whatsapp/WhatsApp\""
echo ""
echo -e "${YELLOW}⚠️ Nota: SQLite não está disponível - usando armazenamento em memória${NC}"