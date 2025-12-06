#!/usr/bin/env node

/**
 * 🔄 Script para Aplicar Migration de Restrição de OS
 * Aplica a migration que restringe UPDATE/INSERT/DELETE de OSs apenas para admins
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis de ambiente não configuradas');
    console.error('Certifique-se de ter NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local');
    process.exit(1);
  }

  console.log('🔄 Aplicando Migration: Restringir OS para Admins');
  console.log('=====================================================\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`📄 Migration: 20251206000000_restrict_os_update_to_admins.sql\n`);

  try {
    // Ler arquivo SQL
    const filePath = path.join(__dirname, '..', 'supabase', 'migrations', '20251206000000_restrict_os_update_to_admins.sql');
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Arquivo não encontrado: ${filePath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf-8');
    console.log(`📋 Tamanho do SQL: ${sql.length} caracteres\n`);

    // Criar cliente Supabase com service role
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('⚙️  Executando migration...\n');
    
    // Executar SQL via RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Se não tiver a função exec_sql, tentar via REST API direto
      console.log('⚠️  Função exec_sql não disponível, tentando método alternativo...\n');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ query: sql })
      });

      if (!response.ok) {
        throw new Error(`Erro ao executar SQL: ${response.status} ${response.statusText}`);
      }
    }

    console.log('✅ Migration aplicada com sucesso!\n');
    console.log('📋 Políticas RLS atualizadas:');
    console.log('   ✓ SELECT: Todos os usuários da empresa podem VER OSs');
    console.log('   ✓ INSERT: Apenas admins podem CRIAR OSs');
    console.log('   ✓ UPDATE: Apenas admins podem EDITAR OSs');
    console.log('   ✓ DELETE: Apenas admins podem DELETAR OSs\n');
    console.log('💡 Técnicos usam RPCs para aceitar/recusar OSs (os_accept, os_decline)');

  } catch (error) {
    console.error('\n❌ Erro ao aplicar migration:', error.message);
    console.error('\n📝 Execute manualmente no SQL Editor do Supabase Dashboard:');
    console.error(`   ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/sql/new`);
    process.exit(1);
  }
}

main();
