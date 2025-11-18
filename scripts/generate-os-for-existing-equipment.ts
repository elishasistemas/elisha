#!/usr/bin/env node

/**
 * Script: Gerar OS Preventivas para Equipamentos Existentes
 * 
 * Este script gera OS preventivas para equipamentos que já foram cadastrados
 * mas não têm OS preventivas criadas ainda.
 * 
 * Uso:
 *   npx tsx scripts/generate-os-for-existing-equipment.ts <empresa_id>
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
  console.log('Uso: npx tsx scripts/generate-os-for-existing-equipment.ts <empresa_id>')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function main() {
  console.log('🚀 Gerando OS preventivas para equipamentos existentes...')
  console.log(`📋 Empresa ID: ${empresaId}\n`)

  try {
    // 1. Buscar equipamentos sem OS preventivas
    const { data: equipamentos, error: equipError } = await supabase
      .from('equipamentos')
      .select(`
        id,
        nome,
        tipo,
        cliente_id,
        empresa_id,
        ativo,
        clientes!inner (
          id,
          nome,
          ativo,
          data_fim_contrato
        )
      `)
      .eq('empresa_id', empresaId)
      .eq('ativo', true)

    if (equipError) {
      console.error('❌ Erro ao buscar equipamentos:', equipError)
      process.exit(1)
    }

    if (!equipamentos || equipamentos.length === 0) {
      console.log('⚠️  Nenhum equipamento encontrado')
      process.exit(0)
    }

    console.log(`✅ Encontrados ${equipamentos.length} equipamentos\n`)

    // 2. Filtrar equipamentos de clientes ativos e sem OS preventivas
    const equipamentosParaProcessar = []
    
    for (const equip of equipamentos) {
      const cliente = equip.clientes as any
      
      // Verificar se cliente está ativo
      if (!cliente.ativo) {
        console.log(`⏭️  Pulando ${equip.nome} - Cliente inativo`)
        continue
      }

      // Verificar se contrato não vencido
      if (cliente.data_fim_contrato && new Date(cliente.data_fim_contrato) < new Date()) {
        console.log(`⏭️  Pulando ${equip.nome} - Contrato vencido`)
        continue
      }

      // Verificar se já tem OS preventiva
      const { data: osExistente } = await supabase
        .from('ordens_servico')
        .select('id')
        .eq('equipamento_id', equip.id)
        .eq('tipo', 'preventiva')
        .limit(1)
        .maybeSingle()

      if (osExistente) {
        console.log(`⏭️  Pulando ${equip.nome} - Já possui OS preventiva`)
        continue
      }

      equipamentosParaProcessar.push(equip)
    }

    console.log(`\n📦 Equipamentos para processar: ${equipamentosParaProcessar.length}\n`)

    if (equipamentosParaProcessar.length === 0) {
      console.log('✨ Todos os equipamentos já têm OS preventivas ou clientes estão inativos')
      process.exit(0)
    }

    // 3. Gerar OS preventivas
    let sucesso = 0
    let erros = 0

    for (const equip of equipamentosParaProcessar) {
      const cliente = equip.clientes as any
      
      console.log(`🔄 Processando: ${equip.nome} (${equip.tipo})...`)

      const { data: resultado, error: rpcError } = await supabase.rpc(
        'generate_preventive_os_for_equipment',
        {
          p_empresa_id: equip.empresa_id,
          p_cliente_id: equip.cliente_id,
          p_equipamento_id: equip.id,
          p_tipo_equipamento: equip.tipo
        }
      )

      if (rpcError) {
        console.error(`   ❌ Erro: ${rpcError.message}`)
        erros++
      } else {
        const osCreated = (resultado as any)?.os_created || 0
        if (osCreated > 0) {
          console.log(`   ✅ ${osCreated} OS preventiva(s) criada(s)`)
          sucesso++
        } else {
          console.log(`   ⚠️  Nenhuma OS criada (pode não haver planos preventivos para ${equip.tipo})`)
        }
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 RESUMO')
    console.log('='.repeat(50))
    console.log(`   ✅ Sucesso: ${sucesso}`)
    console.log(`   ❌ Erros: ${erros}`)
    console.log(`   📦 Total processado: ${equipamentosParaProcessar.length}`)

    if (erros > 0) {
      console.log('\n⚠️  Alguns equipamentos tiveram erros. Verifique:')
      console.log('   1. Se há planos preventivos cadastrados para os tipos de equipamento')
      console.log('   2. Se os clientes estão ativos')
      console.log('   3. Se os tipos de equipamento correspondem aos planos')
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    process.exit(1)
  }
}

main()

