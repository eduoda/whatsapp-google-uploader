#!/data/data/com.termux/files/usr/bin/bash

# Setup script for Termux environment
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

# Step 2: Install required packages
echo -e "${YELLOW}📦 Instalando dependências do sistema...${NC}"
pkg install -y nodejs python git build-essential

# Step 3: Install Python distutils (fix for node-gyp)
echo -e "${YELLOW}🐍 Instalando Python distutils...${NC}"
#pkg install -y python-distutils-extra || true

# Alternative: Install setuptools which includes distutils
pip install setuptools || true

# Step 4: Set environment for node-gyp (if needed)
echo -e "${YELLOW}⚙️ Configurando ambiente para Termux...${NC}"

# Set Python environment variable for node-gyp
export PYTHON=python3
export PYTHON3=python3

# Add to .bashrc for permanent configuration
if ! grep -q "export PYTHON=python3" ~/.bashrc 2>/dev/null; then
    echo "export PYTHON=python3" >> ~/.bashrc
    echo "export PYTHON3=python3" >> ~/.bashrc
    echo -e "${GREEN}✅ Variáveis de ambiente adicionadas ao .bashrc${NC}"
fi

# Remove deprecated python config from .npmrc if it exists
if [ -f ~/.npmrc ] && grep -q "python" ~/.npmrc 2>/dev/null; then
    sed -i '/python=/d' ~/.npmrc
    echo -e "${YELLOW}Removida configuração deprecada do .npmrc${NC}"
fi

echo -e "${GREEN}✅ Configuração do Python para node-gyp definida${NC}"

# Step 5: Create directory for WhatsApp if needed
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

# Step 6: Check storage permissions
if [ ! -d "$HOME/storage" ]; then
    echo -e "${YELLOW}📱 Configurando acesso ao armazenamento...${NC}"
    termux-setup-storage
    echo "Por favor, aceite a permissão de armazenamento e execute este script novamente"
    exit 1
fi

echo -e "${GREEN}✅ Ambiente Termux preparado!${NC}"
echo ""
echo "Agora execute:"
echo "  npm run install:termux"
echo ""
if [ -n "$WHATSAPP_PATH" ]; then
    echo "Para testar o scanner com o caminho detectado:"
    echo "  npm run test:scanner -- \"$WHATSAPP_PATH\""
    echo ""
fi
