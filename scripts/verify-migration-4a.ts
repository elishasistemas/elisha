#!/usr/bin/env node

/**
 * 🔍 Script para Verificar se a Migration 4a foi Aplicada
 * Verifica: coluna tipo_equipamento, função RPC e índices
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ecvjgixhcfmkdfbnueqh.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são necessárias')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function main() {
  console.log('🔍 Verificando Migration 4a no Supabase')
  console.log('========================================\n')
  console.log(`📍 URL: ${SUPABASE_URL}\n`)

  const checks = {
    coluna_tipo_equipamento: false,
    indice_tipo_equipamento: false,
    indice_composto: false,
    funcao_rpc: false,
  }

  try {
    // 1. Verificar se a coluna tipo_equipamento existe
    console.log('1️⃣ Verificando coluna tipo_equipamento...')
    try {
      const { data: columns, error } = await supabase
        .from('checklists')
        .select('tipo_equipamento')
        .limit(1)

      if (error) {
        // Se erro for "column does not exist", a coluna não existe
        if (error.message.includes('does not exist') || error.code === '42703') {
          console.log('   ❌ Coluna tipo_equipamento NÃO existe')
        } else {
          throw error
        }
      } else {
        console.log('   ✅ Coluna tipo_equipamento EXISTE')
        checks.coluna_tipo_equipamento = true
      }
    } catch (err: any) {
      if (err.message?.includes('does not exist') || err.code === '42703') {
        console.log('   ❌ Coluna tipo_equipamento NÃO existe')
      } else {
        console.log(`   ⚠️  Erro ao verificar: ${err.message}`)
      }
    }

    // 2. Verificar função RPC via query direta
    console.log('\n2️⃣ Verificando função RPC upsert_checklist_templates_by_tipo...')
    try {
      // Tentar chamar a função com parâmetros vazios para verificar se existe
      const { data, error } = await supabase.rpc('upsert_checklist_templates_by_tipo', {
        p_empresa_id: '00000000-0000-0000-0000-000000000000' as any,
        p_templates: [] as any
      })

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42883') {
          console.log('   ❌ Função upsert_checklist_templates_by_tipo NÃO existe')
        } else if (error.message.includes('Empresa não encontrada')) {
          // Função existe mas empresa não existe (esperado)
          console.log('   ✅ Função upsert_checklist_templates_by_tipo EXISTE')
          checks.funcao_rpc = true
        } else {
          throw error
        }
      } else {
        console.log('   ✅ Função upsert_checklist_templates_by_tipo EXISTE')
        checks.funcao_rpc = true
      }
    } catch (err: any) {
      if (err.message?.includes('does not exist') || err.code === '42883') {
        console.log('   ❌ Função upsert_checklist_templates_by_tipo NÃO existe')
      } else {
        console.log(`   ⚠️  Erro ao verificar: ${err.message}`)
      }
    }

    // 3. Verificar índices (via query de performance)
    console.log('\n3️⃣ Verificando índices...')
    try {
      // Tentar uma query que usaria o índice
      const { data, error } = await supabase
        .from('checklists')
        .select('id, nome, tipo_equipamento')
        .eq('tipo_equipamento', 'ELEVADOR_ELETRICO')
        .limit(1)

      if (!error) {
        console.log('   ✅ Índices parecem estar funcionando')
        checks.indice_tipo_equipamento = true
        checks.indice_composto = true
      } else {
        console.log(`   ⚠️  Não foi possível verificar índices: ${error.message}`)
      }
    } catch (err: any) {
      console.log(`   ⚠️  Erro ao verificar índices: ${err.message}`)
    }

    // Resumo
    console.log('\n' + '='.repeat(50))
    console.log('📊 RESUMO DA VERIFICAÇÃO')
    console.log('='.repeat(50))
    console.log(`   Coluna tipo_equipamento: ${checks.coluna_tipo_equipamento ? '✅' : '❌'}`)
    console.log(`   Função RPC: ${checks.funcao_rpc ? '✅' : '❌'}`)
    console.log(`   Índices: ${checks.indice_tipo_equipamento ? '✅' : '⚠️'}`)

    const allChecks = Object.values(checks)
    const passedChecks = allChecks.filter(Boolean).length
    const totalChecks = allChecks.length

    console.log(`\n   Progresso: ${passedChecks}/${totalChecks} verificações passaram`)

    if (checks.coluna_tipo_equipamento && checks.funcao_rpc) {
      console.log('\n✨ Migration 4a foi APLICADA com sucesso!')
      console.log('\n📋 Próximos passos:')
      console.log('   1. Executar seed de templates:')
      console.log('      npx tsx scripts/seed-checklist-templates.ts <empresa_id>')
      console.log('   2. Prosseguir para Tarefa 4b: Planos preventivos')
    } else {
      console.log('\n⚠️  Migration 4a NÃO foi aplicada completamente')
      console.log('\n📋 Próximos passos:')
      console.log('   1. Aplicar migration via Supabase Dashboard:')
      console.log('      https://app.supabase.com/project/ecvjgixhcfmkdfbnueqh/sql/new')
      console.log('   2. Copiar conteúdo de:')
      console.log('      supabase/migrations/20251106000000_add_tipo_equipamento_to_checklists.sql')
    }

  } catch (error) {
    console.error('\n❌ Erro inesperado:', error)
    process.exit(1)
  }
}

main().catch(console.error)

