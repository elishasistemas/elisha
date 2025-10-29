#!/usr/bin/env node

/**
 * 🔄 Script para Copiar Dados de PROD para DEV
 * Copia dados via API REST do Supabase
 */

const https = require('https');

// Credenciais
const PROD = {
  url: 'https://wkccxgeevizhxmclvsnz.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrY2N4Z2Vldml6aHhtY2x2c256Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI4Nzk0NiwiZXhwIjoyMDc1ODYzOTQ2fQ.gJUu8PTqjJ25ArkCGlxPpAWumOeGXZQ_5ZGIdEgJugE'
};

const DEV = {
  url: 'https://dahfsyvxvacibowwxgns.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhaGZzeXZ4dmFjaWJvd3d4Z25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTcwNzI5MiwiZXhwIjoyMDc3MjgzMjkyfQ.90q9IK2jQCx_fXyqW0DE_yC6SPk3JO02X0AzZNh29eo'
};

// Tabelas na ordem de dependência
const TABLES = [
  'empresas',
  'profiles',
  'colaboradores',
  'clientes',
  'equipamentos',
  'checklists',
  'checklist_items',
  'ordens_servico',
  'os_status_history',
  'os_evidencias',
  'os_laudos',
  'os_checklists',
  'os_checklist_items'
];

// Fetch helper
function fetchData(env, table) {
  return new Promise((resolve, reject) => {
    const url = `${env.url}/rest/v1/${table}?select=*`;
    
    https.get(url, {
      headers: {
        'apikey': env.key,
        'Authorization': `Bearer ${env.key}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Insert helper
function insertData(env, table, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'apikey': env.key,
        'Authorization': `Bearer ${env.key}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Prefer': 'resolution=ignore-duplicates'
      }
    };
    
    const req = https.request(`${env.url}/rest/v1/${table}`, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Main
async function main() {
  console.log('🔄 Copiando Dados de PROD → DEV');
  console.log('=======================================\n');
  
  let totalCopied = 0;
  
  for (const table of TABLES) {
    try {
      process.stdout.write(`📦 Copiando ${table}... `);
      
      // Buscar dados de PROD
      const data = await fetchData(PROD, table);
      
      if (!data || data.length === 0) {
        console.log('⚪ Vazio');
        continue;
      }
      
      // Inserir em DEV
      await insertData(DEV, table, data);
      
      console.log(`✅ ${data.length} registros`);
      totalCopied += data.length;
      
    } catch (error) {
      console.log(`⚠️  Erro: ${error.message}`);
    }
  }
  
  console.log('\n=======================================');
  console.log(`✅ Cópia concluída! Total: ${totalCopied} registros\n`);
  
  // Verificar dados em DEV
  console.log('📊 Verificando dados copiados:\n');
  
  for (const table of ['empresas', 'profiles', 'colaboradores', 'clientes', 'ordens_servico']) {
    try {
      const data = await fetchData(DEV, table);
      console.log(`  ${table}: ${data.length} registros`);
    } catch(e) {
      console.log(`  ${table}: Erro ao verificar`);
    }
  }
  
  console.log('\n🎉 Processo finalizado!');
  console.log('\n💡 Agora você pode fazer login com:');
  console.log('   Email: iverson.ux@gmail.com');
  console.log('   Senha: (a mesma de prod)\n');
}

main().catch(console.error);

