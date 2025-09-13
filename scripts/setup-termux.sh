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
pkg install -y python-distutils-extra || true

# Alternative: Install setuptools which includes distutils
pip install setuptools || true

# Step 4: Set npm config for Termux
echo -e "${YELLOW}⚙️ Configurando npm para Termux...${NC}"
npm config set python python3
npm config set node-gyp $(npm prefix -g)/lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js

# Step 5: Create directory for WhatsApp if needed
echo -e "${YELLOW}📁 Verificando diretório do WhatsApp...${NC}"
if [ ! -d "/storage/emulated/0/WhatsApp" ] && [ ! -d "/sdcard/WhatsApp" ]; then
    echo -e "${YELLOW}⚠️ Diretório do WhatsApp não encontrado${NC}"
    echo "Por favor, certifique-se de ter o WhatsApp instalado"
    echo "e ter dado permissão de armazenamento ao Termux:"
    echo ""
    echo "  termux-setup-storage"
    echo ""
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