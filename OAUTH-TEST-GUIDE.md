# 🔐 Google OAuth Test Guide

Este guia explica como testar a autenticação OAuth com sua conta Google real.

## 📋 Pré-requisitos

### 1. Criar Credenciais no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. No menu lateral, vá para **APIs e Serviços** > **Credenciais**
4. Clique em **+ CRIAR CREDENCIAIS** > **ID do cliente OAuth**
5. Se solicitado, configure a tela de consentimento OAuth:
   - Escolha **Externo** (para testes)
   - Preencha os campos obrigatórios
   - Adicione seu email como usuário de teste

### 2. Configurar Cliente OAuth

1. Tipo de aplicativo: **Aplicativo da Web**
2. Nome: `WhatsApp Google Uploader` (ou outro de sua preferência)
3. URIs de redirecionamento autorizados:
   ```
   http://localhost:3000/callback
   ```
4. Clique em **Criar**
5. Copie o **Client ID** e **Client Secret**

### 3. Habilitar APIs Necessárias

No Google Cloud Console, habilite:
- **Google Drive API**
- **Google Photos Library API**

Vá para **APIs e Serviços** > **Biblioteca** e busque por cada API para habilitá-las.

## 🚀 Configuração do Teste

### 1. Criar arquivo .env

```bash
cp .env.example .env
```

### 2. Editar .env com suas credenciais

```env
# Substitua com suas credenciais reais
GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret-aqui

# Mantenha esta chave segura (mude em produção)
TOKEN_ENCRYPTION_KEY=sua-chave-de-encriptacao-com-pelo-menos-32-caracteres
```

### 3. Instalar dependências (se ainda não instalou)

```bash
npm install
npm run build
```

## 🧪 Executar o Teste

### Comando:

```bash
npm run test:oauth
```

### Processo de Autenticação:

1. O script verificará suas credenciais
2. Mostrará uma URL de autenticação
3. **Abra a URL no navegador**
4. Faça login com sua conta Google
5. Conceda as permissões solicitadas:
   - Acesso ao Google Drive
   - Acesso ao Google Photos
6. Você será redirecionado para `http://localhost:3000/callback?code=XXXXX`
   
   **⚠️ IMPORTANTE:** Você verá um erro "File not found" - **ISSO É NORMAL!**
   
   Não há servidor rodando localmente. O importante é o código na URL.

7. **Copie APENAS o código** da URL:
   - O código está após `code=` e antes de `&scope`
   - Exemplo: `4/0AVMBsJgdZm1nE0qxxk2vso9QDkaYiHvp3ssywZ_7GvLQZc8Cqs7x04yDFz2gR-Q8Dx2SBA`
   
8. **Cole o código** no terminal quando solicitado
9. O script validará e salvará seus tokens

## ✅ Resultado Esperado

Se tudo funcionar corretamente, você verá:

```
✅ Authentication successful!

📊 Authentication Result:
   Access Token: ya29.a0AfH6SMB...
   Refresh Token: Present
   Expires: 2025-09-12 20:30:00
   Scopes: https://www.googleapis.com/auth/drive.file, https://www.googleapis.com/auth/photoslibrary

✅ Token retrieved: ya29.a0AfH6SMB...
✅ Token validation: Valid

📊 Final Token Status:
   Valid: true
   Expires In: 59 minutes

✨ OAuth test completed successfully!
   Your tokens are securely stored and encrypted.
   The application can now access Google Drive and Photos on your behalf.
```

## 🔒 Segurança

### Tokens Armazenados:
- Local: `.tokens/oauth-tokens.json`
- Criptografia: AES-256-GCM
- Permissões: Apenas leitura/escrita do proprietário (0o600)

### Tokens Incluem:
- **Access Token**: Para fazer chamadas à API (expira em ~1 hora)
- **Refresh Token**: Para renovar o access token automaticamente
- **Scopes**: Permissões concedidas

## 🔄 Re-autenticação

Se precisar re-autenticar:

1. Execute `npm run test:oauth` novamente
2. Quando perguntado "Do you want to re-authenticate?", digite `y`
3. Os tokens antigos serão revogados
4. Siga o processo de autenticação novamente

## ❌ Solução de Problemas

### Erro: "Missing required environment variables"
- Verifique se o arquivo `.env` existe e contém as credenciais

### Erro: "invalid_client"
- Verifique se o Client ID e Client Secret estão corretos

### Erro: "redirect_uri_mismatch"
- Certifique-se que `http://localhost:3000/callback` está configurado no Google Console

### Erro: "Failed to decrypt tokens"
- Delete o arquivo `.tokens/oauth-tokens.json` e autentique novamente

### Erro: "quota_exceeded"
- Você atingiu o limite de requisições da API
- Aguarde alguns minutos e tente novamente

## 📝 Notas Importantes

1. **Usuários de Teste**: Durante desenvolvimento, apenas emails adicionados como "Test users" no Google Console podem autenticar
2. **Publicação**: Para uso em produção, o app precisa ser verificado pelo Google
3. **Scopes Sensíveis**: Alguns scopes requerem verificação adicional do Google
4. **Rate Limits**: Google APIs têm limites de requisições por minuto/dia

## 🎯 Próximos Passos

Após testar com sucesso o OAuth:

1. Os tokens ficam salvos e criptografados
2. As outras bibliotecas (Drive, Photos) podem usar esses tokens
3. O token é renovado automaticamente quando expira
4. Você está pronto para testar upload de arquivos!

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs em `logs/uploader.log`
2. Confirme as configurações no Google Cloud Console
3. Teste com `--verbose` para mais detalhes: `NODE_ENV=debug npm run test:oauth`

---

**Importante**: Nunca commite seu arquivo `.env` com credenciais reais! O `.gitignore` já está configurado para ignorá-lo.