# WhatsApp Google Uploader - Termux Edition 📱

## Instalação Super Simples (3 passos!)

```bash
# 1. Clone e entre no diretório
git clone https://github.com/eduoda/whatsapp-google-uploader.git
cd whatsapp-google-uploader

# 2. Execute o setup
bash scripts/setup-termux.sh

# 3. Instale as dependências de produção
npm install --production
```

## Testar Scanner

```bash
# Teste automático (detecta WhatsApp)
npm run test:scanner

# Ou especifique o caminho
npm run test:scanner -- "/storage/emulated/0/Android/media/com.whatsapp/WhatsApp"
```

## Por que funciona no Termux?

✅ **ZERO compilação nativa** - Sem SQLite, sem node-gyp  
✅ **Dependências mínimas** - Apenas o essencial para funcionar  
✅ **Persistência na nuvem** - Google Sheets, não arquivos locais  
✅ **Scripts inteligentes** - Hooks que não falham se faltam ferramentas  
✅ **Um só package.json** - Funciona em Linux, macOS, Windows e Termux  

## Problemas Comuns

### "WhatsApp directory not found"
```bash
# Execute isto primeiro:
termux-setup-storage
# Aceite a permissão no Android
```

### "Permission denied"
- Certifique-se que o WhatsApp está instalado
- Verifique se deu permissão de armazenamento ao Termux

## Principios KISS & YAGNI

- **K**eep **I**t **S**imple, **S**tupid - Sem complexidade desnecessária
- **Y**ou **A**ren't **G**onna **N**eed **I**t - Apenas o essencial

## Como funciona?

### Scripts Inteligentes
```bash
# Hooks que não falham se ferramentas não existem
"prepare": "which husky > /dev/null 2>&1 && husky install || true"
"postinstall": "which tsc > /dev/null 2>&1 && npm run build:packages || true"
```

### Dependências Essenciais
- ✅ **google-auth-library** - Autenticação OAuth2
- ✅ **googleapis** - APIs do Google Drive/Photos/Sheets
- ✅ **mime-types** - Identificar tipos de arquivo

### O que removemos?
- ❌ **SQLite** - Usamos Google Sheets
- ❌ **Dependências UI** - chalk, ora, commander (desnecessário para MVP)
- ❌ **Package.termux.json** - Um só package.json para todos!  

---

**Simples assim!** 🎉