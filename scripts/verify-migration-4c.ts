#!/usr/bin/env node

/**
 * 🔍 Script para Verificar se a Migration 4c foi Aplicada
 * Verifica: funções RPC, trigger e job recorrente
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
  console.log('🔍 Verificando Migration 4c no Supabase')
  console.log('========================================\n')
  console.log(`📍 URL: ${SUPABASE_URL}\n`)

  const checks = {
    funcao_calculate_date: false,
    funcao_generate_os: false,
    funcao_rollforward: false,
    trigger_equipamentos: false,
  }

  try {
    // 1. Verificar função calculate_next_preventive_date
    console.log('1️⃣ Verificando função calculate_next_preventive_date...')
    try {
      const { data, error } = await supabase.rpc('calculate_next_preventive_date', {
        p_base_date: '2025-11-06',
        p_intervalo_meses: 1,
        p_janela_dias: 7
      })

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42883') {
          console.log('   ❌ Função calculate_next_preventive_date NÃO existe')
        } else {
          throw error
        }
      } else {
        console.log(`   ✅ Função calculate_next_preventive_date EXISTE (retornou: ${data})`)
        checks.funcao_calculate_date = true
      }
    } catch (err: any) {
      if (err.message?.includes('does not exist') || err.code === '42883') {
        console.log('   ❌ Função calculate_next_preventive_date NÃO existe')
      } else {
        console.log(`   ⚠️  Erro ao verificar: ${err.message}`)
      }
    }

    // 2. Verificar função generate_preventive_os_for_equipment
    console.log('\n2️⃣ Verificando função generate_preventive_os_for_equipment...')
    try {
      const { data, error } = await supabase.rpc('generate_preventive_os_for_equipment', {
        p_empresa_id: '00000000-0000-0000-0000-000000000000' as any,
        p_cliente_id: '00000000-0000-0000-0000-000000000000' as any,
        p_equipamento_id: '00000000-0000-0000-0000-000000000000' as any,
        p_tipo_equipamento: 'ELEVADOR_ELETRICO'
      })

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42883') {
          console.log('   ❌ Função generate_preventive_os_for_equipment NÃO existe')
        } else if (error.message.includes('Empresa não encontrada') || error.message.includes('Cliente não encontrado')) {
          console.log('   ✅ Função generate_preventive_os_for_equipment EXISTE')
          checks.funcao_generate_os = true
        } else {
          throw error
        }
      } else {
        console.log('   ✅ Função generate_preventive_os_for_equipment EXISTE')
        checks.funcao_generate_os = true
      }
    } catch (err: any) {
      if (err.message?.includes('does not exist') || err.code === '42883') {
        console.log('   ❌ Função generate_preventive_os_for_equipment NÃO existe')
      } else {
        console.log(`   ⚠️  Erro ao verificar: ${err.message}`)
      }
    }

    // 3. Verificar função os_preventive_rollforward
    console.log('\n3️⃣ Verificando função os_preventive_rollforward...')
    try {
      const { data, error } = await supabase.rpc('os_preventive_rollforward')

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42883') {
          console.log('   ❌ Função os_preventive_rollforward NÃO existe')
        } else {
          throw error
        }
      } else {
        console.log('   ✅ Função os_preventive_rollforward EXISTE')
        checks.funcao_rollforward = true
      }
    } catch (err: any) {
      if (err.message?.includes('does not exist') || err.code === '42883') {
        console.log('   ❌ Função os_preventive_rollforward NÃO existe')
      } else {
        console.log(`   ⚠️  Erro ao verificar: ${err.message}`)
      }
    }

    // 4. Verificar trigger (via query direta - não há API para isso)
    console.log('\n4️⃣ Verificando trigger trg_equipamentos_generate_preventive_os...')
    console.log('   ⚠️  Não é possível verificar trigger via API REST')
    console.log('   💡 Execute no SQL Editor:')
    console.log('      SELECT tgname FROM pg_trigger WHERE tgname = \'trg_equipamentos_generate_preventive_os\';')

    // Resumo
    console.log('\n' + '='.repeat(50))
    console.log('📊 RESUMO DA VERIFICAÇÃO')
    console.log('='.repeat(50))
    console.log(`   Função calculate_next_preventive_date: ${checks.funcao_calculate_date ? '✅' : '❌'}`)
    console.log(`   Função generate_preventive_os_for_equipment: ${checks.funcao_generate_os ? '✅' : '❌'}`)
    console.log(`   Função os_preventive_rollforward: ${checks.funcao_rollforward ? '✅' : '❌'}`)
    console.log(`   Trigger: ⚠️  Verificar manualmente`)

    const allChecks = Object.values(checks).filter(v => typeof v === 'boolean')
    const passedChecks = allChecks.filter(Boolean).length
    const totalChecks = allChecks.length

    console.log(`\n   Progresso: ${passedChecks}/${totalChecks} verificações passaram`)

    if (checks.funcao_calculate_date && checks.funcao_generate_os && checks.funcao_rollforward) {
      console.log('\n✨ Migration 4c foi APLICADA (funções criadas)!')
      console.log('\n📋 Próximos passos:')
      console.log('   1. Verificar trigger manualmente no SQL Editor')
      console.log('   2. Verificar se há planos preventivos cadastrados')
      console.log('   3. Verificar se cliente está ativo')
      console.log('   4. Testar geração manual de OS')
    } else {
      console.log('\n⚠️  Migration 4c NÃO foi aplicada completamente')
      console.log('\n📋 Próximos passos:')
      console.log('   1. Aplicar migration via Supabase Dashboard:')
      console.log('      https://app.supabase.com/project/ecvjgixhcfmkdfbnueqh/sql/new')
      console.log('   2. Copiar conteúdo de:')
      console.log('      supabase/migrations/20251106000002_create_preventive_os_generation.sql')
    }

  } catch (error) {
    console.error('\n❌ Erro inesperado:', error)
    process.exit(1)
  }
}

main().catch(console.error)

