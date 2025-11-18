#!/usr/bin/env node

/**
 * 🔄 Script para Aplicar uma Migration Específica na Branch Dev
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Credenciais da Branch DEV (do script existente)
const DEV_BRANCH = {
  host: 'db.ecvjgixhcfmkdfbnueqh.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'VbFzuClIShyLvQZyYeZxTBmiILIXSKXi',
};

const connectionString = `postgresql://${DEV_BRANCH.user}:${DEV_BRANCH.password}@${DEV_BRANCH.host}:${DEV_BRANCH.port}/${DEV_BRANCH.database}`;

async function main() {
  const migrationFile = process.argv[2] || 'supabase/migrations/20251106000000_add_tipo_equipamento_to_checklists.sql';
  
  console.log('🔄 Aplicando Migration na Branch DEV');
  console.log('=====================================\n');
  console.log(`📍 Host: ${DEV_BRANCH.host}`);
  console.log(`📦 Database: ${DEV_BRANCH.database}`);
  console.log(`📄 Arquivo: ${migrationFile}\n`);

  try {
    // Ler arquivo SQL
    const filePath = path.join(__dirname, '..', migrationFile);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Arquivo não encontrado: ${filePath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf-8');
    console.log(`📋 Tamanho do SQL: ${sql.length} caracteres\n`);

    // Conectar e executar
    console.log('🔌 Conectando ao banco...');
    const client = new Client({ connectionString });
    await client.connect();
    console.log('✅ Conectado!\n');

    console.log('⚙️  Executando migration...');
    await client.query(sql);
    console.log('✅ Migration aplicada com sucesso!\n');

    await client.end();

    // Verificar se a migration foi aplicada
    console.log('🔍 Verificando aplicação...');
    const verifyClient = new Client({ connectionString });
    await verifyClient.connect();
    
    // Verificar se a coluna existe
    const { rows: columnCheck } = await verifyClient.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'checklists' 
        AND column_name = 'tipo_equipamento'
    `);

    // Verificar se a função existe
    const { rows: functionCheck } = await verifyClient.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_name = 'upsert_checklist_templates_by_tipo'
    `);

    await verifyClient.end();

    console.log('\n📊 Verificação:');
    console.log(`   ✅ Coluna tipo_equipamento: ${columnCheck.length > 0 ? 'EXISTE' : 'NÃO ENCONTRADA'}`);
    console.log(`   ✅ Função upsert_checklist_templates_by_tipo: ${functionCheck.length > 0 ? 'EXISTE' : 'NÃO ENCONTRADA'}`);

    if (columnCheck.length > 0 && functionCheck.length > 0) {
      console.log('\n✨ Migration aplicada e verificada com sucesso!');
    } else {
      console.log('\n⚠️  Migration aplicada mas verificação encontrou problemas');
    }

  } catch (error) {
    console.error('\n❌ Erro ao aplicar migration:');
    console.error(error.message);
    if (error.code) {
      console.error(`   Código: ${error.code}`);
    }
    process.exit(1);
  }
}

main().catch(console.error);



