#!/usr/bin/env node

/**
 * 🔄 Script para Aguardar DNS e Aplicar Migrations na Branch Dev
 * Monitora o DNS até resolver e então aplica as migrations
 */

const { execSync } = require('child_process');
const dns = require('dns').promises;
const fs = require('fs');
const path = require('path');

// Configurações
const DEV_BRANCH = {
  host: 'db.ecvjgixhcfmkdfbnueqh.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'VbFzuClIShyLvQZyYeZxTBmiILIXSKXi',
  id: 'ecvjgixhcfmkdfbnueqh',
  projectRef: 'wkccxgeevizhxmclvsnz',
};

const MAX_RETRIES = 60; // 30 minutos (30 segundos * 60)
const RETRY_INTERVAL = 30000; // 30 segundos

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Verificar se DNS resolve
async function checkDNS() {
  try {
    await dns.lookup(DEV_BRANCH.host);
    return true;
  } catch (error) {
    return false;
  }
}

// Verificar status da branch via Supabase CLI
function checkBranchStatus() {
  try {
    const output = execSync(
      `supabase branches get dev --project-ref ${DEV_BRANCH.projectRef}`,
      { encoding: 'utf-8' }
    );
    return output.includes('ACTIVE_HEALTHY');
  } catch (error) {
    return false;
  }
}

// Aplicar migrations
async function applyMigrations() {
  log('\n🚀 Aplicando Migrations...', 'cyan');
  log('=' .repeat(50), 'cyan');

  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  log(`\n📋 ${files.length} migrations encontradas\n`, 'blue');

  let applied = 0;
  let errors = 0;

  // Usar pg para conectar
  const { Client } = require('pg');
  const connectionString = `postgresql://${DEV_BRANCH.user}:${DEV_BRANCH.password}@${DEV_BRANCH.host}:${DEV_BRANCH.port}/${DEV_BRANCH.database}`;

  for (const file of files) {
    try {
      process.stdout.write(`📦 ${file}... `);

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      const client = new Client({ connectionString });
      await client.connect();
      await client.query(sql);
      await client.end();

      log('✅', 'green');
      applied++;

    } catch (error) {
      log(`❌ ${error.message}`, 'red');
      errors++;
    }
  }

  log('\n' + '='.repeat(50), 'cyan');
  log(`\n📊 Resultado:`, 'blue');
  log(`   Total: ${files.length} migrations`, 'blue');
  log(`   Sucesso: ${applied}`, 'green');
  log(`   Erros: ${errors}`, errors > 0 ? 'red' : 'blue');

  return { applied, errors };
}

// Main
async function main() {
  log('\n🔍 Aguardando DNS Propagar...', 'yellow');
  log('=' .repeat(50), 'yellow');
  log(`\n📍 Host: ${DEV_BRANCH.host}`, 'cyan');
  log(`⏱️  Max tentativas: ${MAX_RETRIES} (${(MAX_RETRIES * RETRY_INTERVAL) / 60000} minutos)`, 'cyan');
  log(`⏰ Intervalo: ${RETRY_INTERVAL / 1000} segundos\n`, 'cyan');

  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    
    process.stdout.write(`[${timestamp}] Tentativa ${attempt}/${MAX_RETRIES}... `);

    // Verificar DNS
    const dnsOk = await checkDNS();
    
    if (dnsOk) {
      log('✅ DNS OK!', 'green');
      
      // Verificar status da branch
      process.stdout.write('Verificando status da branch... ');
      const branchOk = checkBranchStatus();
      
      if (branchOk) {
        log('✅ Branch ACTIVE_HEALTHY!', 'green');
        
        // Aplicar migrations
        const { applied, errors } = await applyMigrations();
        
        if (errors === 0 && applied > 0) {
          log('\n✅ Migrations aplicadas com sucesso!', 'green');
          process.exit(0);
        } else {
          log('\n⚠️  Algumas migrations falharam. Verifique os erros acima.', 'yellow');
          process.exit(1);
        }
      } else {
        log('⚠️  Branch não está ACTIVE_HEALTHY', 'yellow');
      }
    } else {
      log('⏳ DNS ainda não resolveu', 'yellow');
    }

    if (attempt < MAX_RETRIES) {
      log(`   Aguardando ${RETRY_INTERVAL / 1000}s para próxima tentativa...`, 'cyan');
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
    }
  }

  log('\n❌ Timeout: DNS não resolveu após todas as tentativas', 'red');
  log('\n💡 Dica: Você pode aplicar as migrations manualmente:', 'yellow');
  log('   1. Via Dashboard: https://supabase.com/dashboard/project/ecvjgixhcfmkdfbnueqh/editor', 'cyan');
  log('   2. Via CLI: supabase db push --db-url "postgresql://..."', 'cyan');
  log('   3. Aguardar mais tempo e rodar este script novamente\n', 'cyan');
  
  process.exit(1);
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  log('\n\n⚠️  Script interrompido pelo usuário', 'yellow');
  process.exit(0);
});

main().catch(error => {
  log(`\n❌ Erro: ${error.message}`, 'red');
  process.exit(1);
});

