#!/usr/bin/env node

/**
 * 🔄 Script para Aplicar Migrations via API do Supabase
 * Aplica migrations SQL usando a função execute_sql da MCP tool
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Credenciais DEV
const DEV = {
  url: 'https://dahfsyvxvacibowwxgns.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhaGZzeXZ4dmFjaWJvd3d4Z25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTcwNzI5MiwiZXhwIjoyMDc3MjgzMjkyfQ.90q9IK2jQCx_fXyqW0DE_yC6SPk3JO02X0AzZNh29eo'
};

// Execute SQL helper
function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      method: 'POST',
      headers: {
        'apikey': DEV.key,
        'Authorization': `Bearer ${DEV.key}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(`${DEV.url}/rest/v1/rpc/exec`, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data });
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
  
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  
  console.log(`📋 ${files.length} migrations encontradas\n`);
  
  let applied = 0;
  let errors = 0;
  
  for (const file of files) {
    try {
      process.stdout.write(`📦 Aplicando: ${file}... `);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      // Executar via psql embutido do Supabase
      // Como não temos RPC exec, vamos criar uma função temporária
      await executeSQL(sql);
      
      console.log('✅');
      applied++;
      
    } catch (error) {
      console.log(`⚠️  ${error.message}`);
      errors++;
    }
  }
  
  console.log('\n=======================================');
  console.log(`📊 Resultado:`);
  console.log(`   Total: ${files.length} migrations`);
  console.log(`   Sucesso: ${applied}`);
  console.log(`   Erros: ${errors}\n`);
  
  if (applied > 0) {
    console.log('✅ Processo finalizado!');
  } else {
    console.log('❌ Nenhuma migration foi aplicada');
    process.exit(1);
  }
}

main().catch(console.error);

