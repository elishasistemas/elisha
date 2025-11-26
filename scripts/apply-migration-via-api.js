#!/usr/bin/env node

/**
 * 🔄 Script para Aplicar Migration via Supabase REST API
 * Usa SERVICE_ROLE_KEY para executar SQL diretamente
 */

const fs = require('fs');
const path = require('path');

async function main() {
  // Ler variáveis de ambiente
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Erro: Variáveis de ambiente obrigatórias não configuradas!');
    console.error('   Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const migrationFile = process.argv[2] || 'supabase/migrations/20251106000000_add_tipo_equipamento_to_checklists.sql';
  
  console.log('🔄 Aplicando Migration via Supabase API');
  console.log('========================================\n');
  console.log(`📍 URL: ${SUPABASE_URL}`);
  console.log(`📄 Arquivo: ${migrationFile}\n`);

  try {
    // Ler arquivo SQL
    const filePath = path.join(__dirname, '..', migrationFile);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Arquivo não encontrado: ${filePath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf-8');
    console.log(`📋 SQL carregado: ${sql.length} caracteres\n`);

    // Dividir SQL em comandos individuais (separados por ;)
    // Mas como temos funções PL/pgSQL, vamos executar tudo de uma vez
    const sqlCommands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📦 ${sqlCommands.length} comandos SQL encontrados\n`);

    // Executar via REST API usando rpc
    // Nota: Supabase não permite executar SQL arbitrário via REST API diretamente
    // Precisamos usar psql ou criar uma função temporária
    
    console.log('⚠️  Supabase REST API não suporta execução direta de SQL.');
    console.log('💡 Soluções alternativas:\n');
    console.log('   1. Use o Supabase Dashboard SQL Editor:');
    console.log(`      https://app.supabase.com/project/ecvjgixhcfmkdfbnueqh/sql/new\n`);
    console.log('   2. Use psql diretamente:');
    console.log(`      psql "postgresql://postgres:[PASSWORD]@db.ecvjgixhcfmkdfbnueqh.supabase.co:5432/postgres" -f ${migrationFile}\n`);
    console.log('   3. Use Supabase CLI:');
    console.log(`      supabase db push --linked\n`);
    
    console.log('📋 Conteúdo da migration para copiar/colar:\n');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));

  } catch (error) {
    console.error('\n❌ Erro:');
    console.error(error.message);
    process.exit(1);
  }
}

main().catch(console.error);



