/**
 * Script: Seed Checklist Templates by Equipment Type
 * 
 * Este script insere templates de checklist por tipo de equipamento
 * conforme definido no plan.yaml usando Supabase MCP.
 * 
 * Uso:
 *   npx tsx scripts/seed-checklist-templates.ts <empresa_id>
 * 
 * Exemplo:
 *   npx tsx scripts/seed-checklist-templates.ts ac30ec3f-fb4a-4bf7-ba5d-a7a143ff3edb
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
  console.log('Uso: npx tsx scripts/seed-checklist-templates.ts <empresa_id>')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Templates conforme definido no plan.yaml
const templates = [
  {
    tipo_equipamento: 'ELEVADOR_ELETRICO',
    norma_base: ['NBR 16083', 'NBR 16858-1', 'NBR 16858-7', 'NM 313'],
    ciclos: {
      mensal: {
        itens: [
          'Funcionamento das botoeiras de cabine',
          'Funcionamento das botoeiras de pavimento',
          'Iluminacao da cabine e ventilador',
          'Sistema de alarme e interfone',
          'Nivelamento entre andares dentro da tolerancia da norma',
          'Ausencia de ruidos, vibracoes ou trancos anormais',
          'Lubrificacao de guias',
          'Funcionamento das portas de pavimento e cabina',
          'Limpeza do poco'
        ]
      },
      trimestral: {
        itens: [
          'Limpeza de quadro de comando eletrico; conexoes firmes e aterramento correto',
          'Reaperto de conexoes e conferencias de aterramento',
          'Limpeza da casa de maquinas e conferencia de iluminacao',
          'Cabos de tracao e polias sem desgaste ou desfiamento',
          'Verificacao do limitador de velocidade e freio de emergencia',
          'Teste dos intertravamentos das portas de pavimento',
          'Limpeza de contatos de portas de pavimento'
        ]
      },
      semestral: {
        itens: [
          'Inspecao detalhada no operador de portas',
          'Limpeza e lubrificacao do operador de portas',
          'Verificacao da estrutura da cabine e contrapeso',
          'Teste dos dispositivos de parada e fim de curso'
        ]
      },
      anual: {
        itens: [
          'Ensaios de seguranca do freio de emergencia',
          'Auditoria anual de conformidade e emissao de relatorio tecnico'
        ]
      }
    }
  },
  {
    tipo_equipamento: 'ELEVADOR_HIDRAULICO',
    norma_base: ['NBR 16083', 'NBR 16858-2', 'NBR 16858-7', 'NM 313'],
    ciclos: {
      mensal: {
        itens: [
          'Funcionamento das botoeiras de cabine',
          'Funcionamento das botoeiras de pavimento',
          'Iluminacao da cabine e ventilador',
          'Sistema de alarme e interfone',
          'Nivelamento entre andares dentro da tolerancia da norma',
          'Ausencia de ruidos, vibracoes ou trancos anormais',
          'Lubrificacao de guias',
          'Funcionamento das portas de pavimento e cabina',
          'Limpeza do poco'
        ]
      },
      bimestral: {
        itens: [
          'Nivel e qualidade do oleo hidraulico dentro da faixa',
          'Ausencia de vazamentos em mangueiras, conexoes e cilindros',
          'Bombas e valvulas sem ruido excessivo',
          'Funcionamento das botoeiras e alarmes de cabine',
          'Limpeza geral da casa de maquinas',
          'Teste do dispositivo de descida de emergencia'
        ]
      },
      trimestral: {
        itens: [
          'Inspecao detalhada no operador de portas',
          'Limpeza e lubrificacao do operador de portas',
          'Verificacao da estrutura da cabine e contrapeso',
          'Teste dos dispositivos de parada e fim de curso'
        ]
      },
      semestral: {
        itens: [
          'Verificacao do pistao quanto a corrosao ou empeno',
          'Inspecao estrutural do cilindro e guias do pistao',
          'Teste das valvulas de seguranca e travas hidraulicas',
          'Inspecao do quadro eletrico e aterramento',
          'Teste do sistema de parada e freio de seguranca'
        ]
      },
      anual: {
        itens: [
          'Ensaios de seguranca do freio de emergencia',
          'Auditoria anual de conformidade e emissao de relatorio tecnico'
        ]
      }
    }
  },
  {
    tipo_equipamento: 'PLATAFORMA_VERTICAL',
    norma_base: ['NBR 9050', 'NBR ISO 9386-1'],
    ciclos: {
      mensal: {
        itens: [
          'Verificar comandos de subida e descida na cabine',
          'Verificar comandos de subida e descida no pavimento',
          'Testar botao de parada de emergencia e alarme sonoro',
          'Conferir estado estrutural: trincas, corrosao, fixacoes',
          'Conferir guarda-corpos e fechamento lateral ate 1,10 m',
          'Verificar sinalizacao visual e tatil conforme NBR 9050'
        ]
      },
      bimestral: {
        itens: [
          'Inspecionar sistema hidraulico: mangueiras, cilindros, conexoes',
          'Conferir nivel e contaminacao do fluido hidraulico',
          'Verificar comunicacao de auxilio: interfone ou botao',
          'Verificar nivelamento da plataforma em todos os andares'
        ]
      },
      semestral: {
        itens: [
          'Testar travas de seguranca e antiqueda',
          'Conferir freios, rodas ou estabilizadores quando aplicavel',
          'Verificar sinalizacao de area de embarque e desembarque',
          'Verificar aterramento e quadro eletrico'
        ]
      }
    }
  }
]

async function main() {
  console.log('🚀 Iniciando seed de templates de checklist...')
  console.log(`📋 Empresa ID: ${empresaId}`)
  console.log(`📦 Total de templates: ${templates.length} tipos de equipamento\n`)

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

    // Chamar RPC para inserir templates
    const { data: resultado, error: rpcError } = await supabase.rpc(
      'upsert_checklist_templates_by_tipo',
      {
        p_empresa_id: empresaId,
        p_templates: templates
      }
    )

    if (rpcError) {
      console.error('❌ Erro ao inserir templates:', rpcError)
      process.exit(1)
    }

    console.log('✅ Templates inseridos com sucesso!\n')
    console.log('📊 Resumo:')
    
    if (Array.isArray(resultado)) {
      const porTipo = resultado.reduce((acc: Record<string, number>, item: any) => {
        acc[item.tipo_equipamento] = (acc[item.tipo_equipamento] || 0) + 1
        return acc
      }, {})

      Object.entries(porTipo).forEach(([tipo, count]) => {
        console.log(`   ${tipo}: ${count} templates`)
      })

      console.log(`\n   Total: ${resultado.length} templates criados/atualizados`)
    }

    // Verificar templates criados
    console.log('\n🔍 Verificando templates criados...\n')
    
    const { data: checklists, error: checklistsError } = await supabase
      .from('checklists')
      .select('id, nome, tipo_equipamento, tipo_servico, versao, ativo')
      .eq('empresa_id', empresaId)
      .eq('origem', 'elisha')
      .not('tipo_equipamento', 'is', null)
      .order('tipo_equipamento', { ascending: true })
      .order('nome', { ascending: true })

    if (checklistsError) {
      console.error('⚠️  Erro ao verificar templates:', checklistsError.message)
    } else {
      console.log(`✅ ${checklists?.length || 0} templates encontrados:\n`)
      checklists?.forEach((c) => {
        console.log(`   ${c.nome} (v${c.versao}) - ${c.tipo_equipamento}`)
      })
    }

    console.log('\n✨ Seed concluído com sucesso!')
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    process.exit(1)
  }
}

main()



