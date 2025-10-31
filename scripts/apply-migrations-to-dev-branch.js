#!/usr/bin/env node

/**
 * 🔄 Script para Aplicar Migrations na Branch Dev do Supabase
 * Conecta diretamente ao banco usando credenciais da branch
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Credenciais da Branch DEV
const DEV_BRANCH = {
  host: 'db.ecvjgixhcfmkdfbnueqh.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'VbFzuClIShyLvQZyYeZxTBmiILIXSKXi',
};

// Construir connection string
const connectionString = `postgresql://${DEV_BRANCH.user}:${DEV_BRANCH.password}@${DEV_BRANCH.host}:${DEV_BRANCH.port}/${DEV_BRANCH.database}`;

async function main() {
  console.log('🔄 Aplicando Migrations na Branch DEV');
  console.log('=======================================\n');
  console.log(`📍 Host: ${DEV_BRANCH.host}`);
  console.log(`📦 Database: ${DEV_BRANCH.database}\n`);

  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`📋 ${files.length} migrations encontradas\n`);

  let applied = 0;
  let errors = 0;

  for (const file of files) {
    try {
      process.stdout.write(`📦 Aplicando: ${file}... `);

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      // Executar via Node.js com pg
      const { Client } = require('pg');
      const client = new Client({ connectionString });
      
      await client.connect();
      await client.query(sql);
      await client.end();
      
      console.log('✅');
      applied++;

    } catch (error) {
      // Tentar via arquivo temporário e supabase db execute
      try {
        const tempFile = path.join('/tmp', `migration-${Date.now()}.sql`);
        fs.writeFileSync(tempFile, fs.readFileSync(path.join(migrationsDir, file), 'utf-8'));
        
        execSync(
          `supabase db execute --db-url "${connectionString}" --file "${tempFile}"`,
          { stdio: 'pipe' }
        );
        
        fs.unlinkSync(tempFile);
        console.log('✅');
        applied++;
      } catch (cliError) {
        console.log(`⚠️  ${error.message}`);
        errors++;
      }
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
    console.log('\n💡 Dica: Verifique se:');
    console.log('   1. A branch dev está ACTIVE_HEALTHY');
    console.log('   2. O npm package "pg" está instalado: npm install pg');
    console.log('   3. Ou use: supabase db push --db-url "postgresql://..."');
    process.exit(1);
  }
}

main().catch(console.error);

