#!/usr/bin/env node

/**
 * 🔄 Forçar Aplicação de Migrations
 * Conecta via Postgres e aplica todas as migrations
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração DEV
const connectionString = 'postgresql://postgres.evxrdxhtzcdpvkrytbtk:OBjqodVqobvaRPnrslQwihFlxPLBvsOm@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

async function main() {
  console.log('🔄 Aplicando Migrations no DEV via Postgres');
  console.log('=======================================\n');
  
  const client = new Client({ connectionString });
  
  try {
    console.log('📡 Conectando ao banco...');
    await client.connect();
    console.log('✅ Conectado!\n');
    
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
        
        await client.query(sql);
        
        console.log('✅');
        applied++;
        
      } catch (error) {
        const msg = error.message.length > 80 
          ? error.message.substring(0, 80) + '...' 
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
      console.log('✅ Migrations aplicadas!');
      console.log('\n💡 Próximo passo: node scripts/copy-prod-to-dev.js');
    }
    
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();









