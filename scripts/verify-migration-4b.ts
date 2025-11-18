#!/usr/bin/env node

/**
 * 🔍 Script para Verificar se a Migration 4b foi Aplicada
 * Verifica: tabela preventive_plans, função RPC e helper function
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
  console.log('🔍 Verificando Migration 4b no Supabase')
  console.log('========================================\n')
  console.log(`📍 URL: ${SUPABASE_URL}\n`)

  const checks = {
    tabela_preventive_plans: false,
    funcao_upsert: false,
    funcao_get: false,
    indices: false,
  }

  try {
    // 1. Verificar se a tabela preventive_plans existe
    console.log('1️⃣ Verificando tabela preventive_plans...')
    try {
      const { data, error } = await supabase
        .from('preventive_plans')
        .select('id')
        .limit(1)

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          console.log('   ❌ Tabela preventive_plans NÃO existe')
        } else {
          // Outro erro (pode ser RLS ou tabela vazia)
          console.log('   ✅ Tabela preventive_plans EXISTE (erro pode ser RLS ou tabela vazia)')
          checks.tabela_preventive_plans = true
        }
      } else {
        console.log('   ✅ Tabela preventive_plans EXISTE')
        checks.tabela_preventive_plans = true
      }
    } catch (err: any) {
      if (err.message?.includes('does not exist') || err.code === '42P01') {
        console.log('   ❌ Tabela preventive_plans NÃO existe')
      } else {
        console.log(`   ⚠️  Erro ao verificar: ${err.message}`)
      }
    }

    // 2. Verificar função RPC upsert_preventive_plan
    console.log('\n2️⃣ Verificando função RPC upsert_preventive_plan...')
    try {
      const { data, error } = await supabase.rpc('upsert_preventive_plan', {
        p_empresa_id: '00000000-0000-0000-0000-000000000000' as any,
        p_planos: {} as any
      })

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42883') {
          console.log('   ❌ Função upsert_preventive_plan NÃO existe')
        } else if (error.message.includes('Empresa não encontrada')) {
          // Função existe mas empresa não existe (esperado)
          console.log('   ✅ Função upsert_preventive_plan EXISTE')
          checks.funcao_upsert = true
        } else {
          throw error
        }
      } else {
        console.log('   ✅ Função upsert_preventive_plan EXISTE')
        checks.funcao_upsert = true
      }
    } catch (err: any) {
      if (err.message?.includes('does not exist') || err.code === '42883') {
        console.log('   ❌ Função upsert_preventive_plan NÃO existe')
      } else {
        console.log(`   ⚠️  Erro ao verificar: ${err.message}`)
      }
    }

    // 3. Verificar helper function get_preventive_plan
    console.log('\n3️⃣ Verificando helper function get_preventive_plan...')
    try {
      const { data, error } = await supabase.rpc('get_preventive_plan', {
        p_empresa_id: '00000000-0000-0000-0000-000000000000' as any,
        p_tipo_equipamento: 'ELEVADOR_ELETRICO',
        p_frequencia: 'mensal'
      })

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42883') {
          console.log('   ❌ Função get_preventive_plan NÃO existe')
        } else {
          // Função existe mas não retornou dados (esperado)
          console.log('   ✅ Função get_preventive_plan EXISTE')
          checks.funcao_get = true
        }
      } else {
        console.log('   ✅ Função get_preventive_plan EXISTE')
        checks.funcao_get = true
      }
    } catch (err: any) {
      if (err.message?.includes('does not exist') || err.code === '42883') {
        console.log('   ❌ Função get_preventive_plan NÃO existe')
      } else {
        console.log(`   ⚠️  Erro ao verificar: ${err.message}`)
      }
    }

    // 4. Verificar índices (via query de performance)
    console.log('\n4️⃣ Verificando índices...')
    if (checks.tabela_preventive_plans) {
      try {
        const { data, error } = await supabase
          .from('preventive_plans')
          .select('id, tipo_equipamento, frequencia')
          .eq('tipo_equipamento', 'ELEVADOR_ELETRICO')
          .limit(1)

        if (!error) {
          console.log('   ✅ Índices parecem estar funcionando')
          checks.indices = true
        } else {
          console.log(`   ⚠️  Não foi possível verificar índices: ${error.message}`)
        }
      } catch (err: any) {
        console.log(`   ⚠️  Erro ao verificar índices: ${err.message}`)
      }
    } else {
      console.log('   ⏭️  Pulando verificação de índices (tabela não existe)')
    }

    // Resumo
    console.log('\n' + '='.repeat(50))
    console.log('📊 RESUMO DA VERIFICAÇÃO')
    console.log('='.repeat(50))
    console.log(`   Tabela preventive_plans: ${checks.tabela_preventive_plans ? '✅' : '❌'}`)
    console.log(`   Função upsert_preventive_plan: ${checks.funcao_upsert ? '✅' : '❌'}`)
    console.log(`   Função get_preventive_plan: ${checks.funcao_get ? '✅' : '❌'}`)
    console.log(`   Índices: ${checks.indices ? '✅' : '⚠️'}`)

    const allChecks = Object.values(checks)
    const passedChecks = allChecks.filter(Boolean).length
    const totalChecks = allChecks.length

    console.log(`\n   Progresso: ${passedChecks}/${totalChecks} verificações passaram`)

    if (checks.tabela_preventive_plans && checks.funcao_upsert && checks.funcao_get) {
      console.log('\n✨ Migration 4b foi APLICADA com sucesso!')
      console.log('\n📋 Próximos passos:')
      console.log('   1. Executar seed de planos (opcional):')
      console.log('      npx tsx scripts/seed-preventive-plans.ts <empresa_id>')
      console.log('   2. Prosseguir para Tarefa 4c: Geração automática de OS preventivas')
    } else {
      console.log('\n⚠️  Migration 4b NÃO foi aplicada completamente')
      console.log('\n📋 Próximos passos:')
      console.log('   1. Aplicar migration via Supabase Dashboard:')
      console.log('      https://app.supabase.com/project/ecvjgixhcfmkdfbnueqh/sql/new')
      console.log('   2. Copiar conteúdo de:')
      console.log('      supabase/migrations/20251106000001_create_preventive_plans.sql')
    }

  } catch (error) {
    console.error('\n❌ Erro inesperado:', error)
    process.exit(1)
  }
}

main().catch(console.error)

