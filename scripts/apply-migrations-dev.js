#!/usr/bin/env node

/**
 * 🔄 Aplicar Migrations no Branch DEV
 * Usa a Management API do Supabase para executar SQL
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Credenciais DEV
const PROJECT_REF = 'dahfsyvxvacibowwxgns';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhaGZzeXZ4dmFjaWJvd3d4Z25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTcwNzI5MiwiZXhwIjoyMDc3MjgzMjkyfQ.90q9IK2jQCx_fXyqW0DE_yC6SPk3JO02X0AzZNh29eo';

// Pegar token de acesso pessoal do Supabase CLI
function getAccessToken() {
  try {
    const configPath = path.join(process.env.HOME, '.supabase', 'access-token');
    return fs.readFileSync(configPath, 'utf-8').trim();
  } catch (e) {
    console.error('❌ Erro: Token de acesso não encontrado');
    console.error('Execute: supabase login');
    process.exit(1);
  }
}

// Execute SQL via Management API
function executeSQL(sql, accessToken) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: JSON.parse(data) });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Main
async function main() {
  console.log('🔄 Aplicando Migrations no DEV');
  console.log('=======================================\n');
  
  const accessToken = getAccessToken();
  console.log('✅ Token de acesso carregado\n');
  
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`📋 ${files.length} migrations encontradas\n`);
  
  let applied = 0;
  let errors = 0;
  
  for (const file of files) {
    try {
      process.stdout.write(`📦 ${file}... `);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      await executeSQL(sql, accessToken);
      
      console.log('✅');
      applied++;
      
    } catch (error) {
      const msg = error.message.length > 100 
        ? error.message.substring(0, 100) + '...' 
        : error.message;
      console.log(`⚠️  ${msg}`);
      errors++;
    }
  }
  
  console.log('\n=======================================');
  console.log(`📊 Resultado:`);
  console.log(`   Total: ${files.length}`);
  console.log(`   Sucesso: ${applied}`);
  console.log(`   Erros: ${errors}\n`);
  
  if (applied > 0) {
    console.log('✅ Migrations aplicadas com sucesso!');
    console.log('\n💡 Próximo passo: node scripts/copy-prod-to-dev.js');
  } else {
    console.log('❌ Nenhuma migration foi aplicada');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err.message);
  process.exit(1);
});

