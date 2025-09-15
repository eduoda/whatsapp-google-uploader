# Habilitando Google Contacts (People API)

## Passos para habilitar a API:

1. **Acesse o Google Cloud Console**
   - https://console.cloud.google.com/

2. **Selecione seu projeto**
   - Use o mesmo projeto onde você configurou as credenciais OAuth

3. **Habilite a People API**
   - Vá para: **APIs & Services** → **Library**
   - Pesquise por: **"People API"**
   - Clique em **People API**
   - Clique em **ENABLE**

4. **Verifique as APIs habilitadas**
   Você deve ter estas 4 APIs habilitadas:
   - ✅ Google Drive API
   - ✅ Google Photos Library API
   - ✅ Google Sheets API
   - ✅ People API (nova)

5. **Re-autentique o aplicativo**
   ```bash
   # Remova o token antigo
   rm tokens/google-tokens.json

   # Execute a autenticação novamente
   npm run auth
   ```

6. **Teste**
   ```bash
   npm run scan
   ```

   Agora deve aparecer:
   ```
   📱 Loading contacts from Google Contacts...
   ✅ Loaded XXX contacts from Google
   ```

## Troubleshooting

Se aparecer erro 403:
- Verifique se a People API está habilitada
- Verifique se você está usando o projeto correto
- Aguarde alguns minutos após habilitar (pode demorar para propagar)

Se não carregar contatos:
- Verifique se você tem contatos salvos no Google Contacts
- Acesse https://contacts.google.com para verificar

## Permissões

A aplicação solicita apenas permissão de LEITURA:
- `https://www.googleapis.com/auth/contacts.readonly`
- Não pode modificar ou deletar contatos
- Apenas lê nomes e números de telefone