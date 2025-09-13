#!/data/data/com.termux/files/usr/bin/bash

# Simplified setup script for Termux environment
# This script prepares the Termux environment for WhatsApp Google Uploader

echo "🚀 WhatsApp Google Uploader - Termux Setup"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Update packages
echo -e "${YELLOW}📦 Atualizando pacotes do Termux...${NC}"
pkg update -y

# Step 2: Install only Node.js (required)
echo -e "${YELLOW}📦 Instalando Node.js...${NC}"
pkg install -y nodejs

# Step 3: Clean up any old npm config
echo -e "${YELLOW}🧹 Limpando configurações antigas...${NC}"

# Remove deprecated python config from .npmrc if it exists
if [ -f ~/.npmrc ] && grep -q "python" ~/.npmrc 2>/dev/null; then
    sed -i '/python=/d' ~/.npmrc
    echo -e "${GREEN}✅ Removida configuração deprecada do .npmrc${NC}"
fi

# Step 4: Check WhatsApp directory
echo -e "${YELLOW}📁 Verificando diretório do WhatsApp...${NC}"

# Check Android 11+ paths first
WHATSAPP_PATH=""
if [ -d "/storage/emulated/0/Android/media/com.whatsapp/WhatsApp" ]; then
    WHATSAPP_PATH="/storage/emulated/0/Android/media/com.whatsapp/WhatsApp"
    echo -e "${GREEN}✅ WhatsApp encontrado (Android 11+): $WHATSAPP_PATH${NC}"
elif [ -d "/sdcard/Android/media/com.whatsapp/WhatsApp" ]; then
    WHATSAPP_PATH="/sdcard/Android/media/com.whatsapp/WhatsApp"
    echo -e "${GREEN}✅ WhatsApp encontrado (Android 11+): $WHATSAPP_PATH${NC}"
elif [ -d "/storage/emulated/0/WhatsApp" ]; then
    WHATSAPP_PATH="/storage/emulated/0/WhatsApp"
    echo -e "${GREEN}✅ WhatsApp encontrado (legado): $WHATSAPP_PATH${NC}"
elif [ -d "/sdcard/WhatsApp" ]; then
    WHATSAPP_PATH="/sdcard/WhatsApp"
    echo -e "${GREEN}✅ WhatsApp encontrado (legado): $WHATSAPP_PATH${NC}"
else
    echo -e "${YELLOW}⚠️ Diretório do WhatsApp não encontrado${NC}"
    echo "Por favor, certifique-se de ter o WhatsApp instalado"
    echo "e ter dado permissão de armazenamento ao Termux:"
    echo ""
    echo "  termux-setup-storage"
    echo ""
    echo "Caminhos verificados:"
    echo "  - /storage/emulated/0/Android/media/com.whatsapp/WhatsApp (Android 11+)"
    echo "  - /storage/emulated/0/WhatsApp (Android 10 e anteriores)"
fi

# Step 5: Check storage permissions
if [ ! -d "$HOME/storage" ]; then
    echo -e "${YELLOW}📱 Configurando acesso ao armazenamento...${NC}"
    termux-setup-storage
    echo "Por favor, aceite a permissão de armazenamento e execute este script novamente"
    exit 1
fi

echo -e "${GREEN}✅ Ambiente Termux preparado!${NC}"
echo ""
echo "Agora instale as dependências:"
echo "  npm install --omit=optional --omit=dev"
echo ""
echo "Depois teste o scanner:"
if [ -n "$WHATSAPP_PATH" ]; then
    echo "  npm run test:scanner -- \"$WHATSAPP_PATH\""
else
    echo "  npm run test:scanner"
fi
echo ""
echo "💡 Dicas:"
echo "  • Use --omit=optional para pular sqlite3 e outras dependências nativas"
echo "  • Use --omit=dev para pular dependências de desenvolvimento"
echo "  • Se ainda houver erro, use: npm install --force --omit=optional --omit=dev"
