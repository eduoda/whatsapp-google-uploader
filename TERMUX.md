# WhatsApp Google Uploader - Termux Edition 📱

## Instalação Super Simples (3 passos!)

```bash
# 1. Clone e entre no diretório
git clone https://github.com/eduoda/whatsapp-google-uploader.git
cd whatsapp-google-uploader

# 2. Execute o setup
bash scripts/setup-termux.sh

# 3. Instale as dependências (apenas 3!)
npm install
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
✅ **Apenas 3 dependências** - Google APIs e mime-types  
✅ **Persistência na nuvem** - Google Sheets, não arquivos locais  
✅ **JavaScript puro** - Sem TypeScript, sem build complexo  

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

## O que foi removido?

❌ SQLite / better-sqlite3  
❌ 8 dependências desnecessárias (chalk, commander, ora, etc)  
❌ Todos os devDependencies  
❌ Build complexo com TypeScript  
❌ Hooks do git (husky)  
❌ Lerna workspaces  

## O que mantivemos?

✅ Google Auth (essencial)  
✅ Google APIs (essencial)  
✅ MIME types (identificar arquivos)  

---

**Simples assim!** 🎉