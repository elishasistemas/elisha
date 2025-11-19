#!/usr/bin/env node

/**
 * Script: Seed Preventive Plans
 * 
 * Este script insere planos preventivos por tipo de equipamento
 * conforme definido no plan.yaml usando Supabase client.
 * 
 * Uso:
 *   npx tsx scripts/seed-preventive-plans.ts <empresa_id>
 * 
 * Exemplo:
 *   npx tsx scripts/seed-preventive-plans.ts ac30ec3f-fb4a-4bf7-ba5d-a7a143ff3edb
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são necessárias')
  process.exit(1)
}

const empresaId = process.argv[2]

if (!empresaId) {
  console.error('❌ UUID da empresa é obrigatório')
  console.log('Uso: npx tsx scripts/seed-preventive-plans.ts <empresa_id>')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Planos conforme definido no plan.yaml
const planos = {
  ELEVADOR_ELETRICO: {
    mensal: { intervalo_meses: 1, janela_dias: 7 },
    trimestral: { intervalo_meses: 3, janela_dias: 14 },
    semestral: { intervalo_meses: 6, janela_dias: 14 },
    anual: { intervalo_meses: 12, janela_dias: 30 }
  },
  ELEVADOR_HIDRAULICO: {
    mensal: { intervalo_meses: 1, janela_dias: 7 },
    bimestral: { intervalo_meses: 2, janela_dias: 7 },
    trimestral: { intervalo_meses: 3, janela_dias: 14 },
    semestral: { intervalo_meses: 6, janela_dias: 14 },
    anual: { intervalo_meses: 12, janela_dias: 30 }
  },
  PLATAFORMA_VERTICAL: {
    mensal: { intervalo_meses: 1, janela_dias: 7 },
    bimestral: { intervalo_meses: 2, janela_dias: 7 },
    semestral: { intervalo_meses: 6, janela_dias: 14 },
    anual: { intervalo_meses: 12, janela_dias: 30 }
  }
}

async function main() {
  console.log('🚀 Iniciando seed de planos preventivos...')
  console.log(`📋 Empresa ID: ${empresaId}`)
  console.log(`📦 Total de tipos: ${Object.keys(planos).length}\n`)

  try {
    // Verificar se empresa existe
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id, nome')
      .eq('id', empresaId)
      .single()

    if (empresaError || !empresa) {
      console.error('❌ Empresa não encontrada:', empresaError?.message)
      process.exit(1)
    }

    console.log(`✅ Empresa encontrada: ${empresa.nome}\n`)

    // Chamar RPC para inserir planos
    const { data: resultado, error: rpcError } = await supabase.rpc(
      'upsert_preventive_plan',
      {
        p_empresa_id: empresaId,
        p_planos: planos
      }
    )

    if (rpcError) {
      console.error('❌ Erro ao inserir planos:', rpcError)
      process.exit(1)
    }

    console.log('✅ Planos inseridos com sucesso!\n')
    console.log('📊 Resumo:')
    
    if (Array.isArray(resultado)) {
      const porTipo = resultado.reduce((acc: Record<string, number>, item: any) => {
        acc[item.tipo_equipamento] = (acc[item.tipo_equipamento] || 0) + 1
        return acc
      }, {})

      Object.entries(porTipo).forEach(([tipo, count]) => {
        console.log(`   ${tipo}: ${count} planos`)
      })

      console.log(`\n   Total: ${resultado.length} planos criados/atualizados`)
    }

    // Verificar planos criados
    console.log('\n🔍 Verificando planos criados...\n')
    
    const { data: plans, error: plansError } = await supabase
      .from('preventive_plans')
      .select('id, tipo_equipamento, frequencia, intervalo_meses, janela_dias, ativo')
      .eq('empresa_id', empresaId)
      .eq('ativo', true)
      .order('tipo_equipamento', { ascending: true })
      .order('frequencia', { ascending: true })

    if (plansError) {
      console.error('⚠️  Erro ao verificar planos:', plansError.message)
    } else {
      console.log(`✅ ${plans?.length || 0} planos ativos encontrados:\n`)
      plans?.forEach((p) => {
        console.log(`   ${p.tipo_equipamento} - ${p.frequencia}: ${p.intervalo_meses} meses, janela ${p.janela_dias} dias`)
      })
    }

    console.log('\n✨ Seed concluído com sucesso!')
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    process.exit(1)
  }
}

main()

