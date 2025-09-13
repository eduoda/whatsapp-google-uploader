#!/usr/bin/env node

/**
 * Convert .env file to credentials.json format
 * Use this if you have credentials in .env and need credentials.json
 */

const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '.env');
const credentialsPath = path.join(__dirname, 'credentials.json');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found');
  process.exit(1);
}

if (fs.existsSync(credentialsPath)) {
  console.log('⚠️  credentials.json already exists');
  console.log('Remove it first if you want to convert from .env');
  process.exit(1);
}

// Parse .env
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim();
    env[key.trim()] = value;
  }
});

// Check required fields
if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
  console.log('❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env');
  process.exit(1);
}

// Extract project ID from client ID (usually format: 123456789-xxx.apps.googleusercontent.com)
const projectId = env.GOOGLE_PROJECT_ID || 'whatsapp-uploader';

// Create credentials.json
const credentials = {
  installed: {
    client_id: env.GOOGLE_CLIENT_ID,
    project_id: projectId,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uris: ["http://localhost"]
  }
};

// Write credentials.json
fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));

console.log('✅ Created credentials.json from .env');
console.log('');
console.log('📝 Next steps:');
console.log('1. You can now remove .env file (credentials are in credentials.json)');
console.log('2. Run: npm test');
console.log('3. Add credentials.json to .gitignore (already done)');
console.log('');
console.log('⚠️  IMPORTANT: Never commit credentials.json to git!');