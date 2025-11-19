/**
 * Utility: Compute Compliance Score
 * Calculates compliance score based on checklist responses
 */

import type { ChecklistItem, ChecklistResposta, ComplianceScore } from '@/types/checklist'

/**
 * Get base weight for item type
 */
function getBaseWeight(tipo: string): number {
  const weights: Record<string, number> = {
    boolean: 1,
    text: 1,
    number: 2,
    leitura: 2,
    photo: 2,
    signature: 2
  }
  return weights[tipo] || 1
}

/**
 * Compute compliance score for a checklist
 * 
 * @param templateSnapshot - The immutable snapshot with items
 * @param respostas - Array of responses for the checklist items
 * @returns ComplianceScore object
 */
export function computeComplianceScore(
  templateSnapshot: { itens: ChecklistItem[] },
  respostas: ChecklistResposta[]
): ComplianceScore {
  const itens = templateSnapshot.itens || []
  
  // Initialize counters
  let peso_total = 0
  let peso_conforme = 0
  let criticos_pendentes = 0
  let pendencias = 0
  
  const items_por_status = {
    pendente: 0,
    conforme: 0,
    nao_conforme: 0,
    na: 0
  }

  // Create a map of responses by item order
  const respostaMap = new Map<number, ChecklistResposta>()
  respostas.forEach(resp => {
    respostaMap.set(resp.item_ordem, resp)
  })

  // Calculate score for each item
  itens.forEach((item, index) => {
    const ordem = typeof item.ordem === 'number' ? item.ordem : index + 1
    const resposta = respostaMap.get(ordem)
    
    // Calculate weight
    let peso = getBaseWeight(item.tipo)
    if (item.critico) {
      peso += 2 // Critical items have +2 weight
    }
    
    peso_total += peso
    
    // Get status (default to pendente if no response)
    const status = resposta?.status_item || 'pendente'
    items_por_status[status]++
    
    // Calculate conforme weight
    if (status === 'conforme') {
      peso_conforme += peso
    } else if (status === 'na') {
      // N/A items don't count against the score
      peso_conforme += peso
    }
    
    // Count pendencias
    if (status === 'pendente') {
      pendencias++
      if (item.critico) {
        criticos_pendentes++
      }
    } else if (status === 'nao_conforme' && item.critico) {
      criticos_pendentes++
    }
  })

  // Calculate final score (0-100)
  const score = peso_total > 0 ? Math.round((peso_conforme / peso_total) * 100) : 0

  return {
    score,
    criticos_pendentes,
    pendencias,
    total: itens.length,
    items_por_status,
    peso_total,
    peso_conforme
  }
}

/**
 * Validate if checklist can be completed (for OS conclusion)
 * 
 * @param templateSnapshot - The immutable snapshot with items
 * @param respostas - Array of responses for the checklist items
 * @returns Object with validation result
 */
export function validateChecklistCompletion(
  templateSnapshot: { itens: ChecklistItem[] },
  respostas: ChecklistResposta[]
): {
  pode_concluir: boolean
  motivos_bloqueio: string[]
  avisos: string[]
} {
  const itens = templateSnapshot.itens || []
  const motivos_bloqueio: string[] = []
  const avisos: string[] = []

  // Create a map of responses by item order
  const respostaMap = new Map<number, ChecklistResposta>()
  respostas.forEach(resp => {
    respostaMap.set(resp.item_ordem, resp)
  })

  itens.forEach((item, index) => {
    const ordem = typeof item.ordem === 'number' ? item.ordem : index + 1
    const resposta = respostaMap.get(ordem)
    const status = resposta?.status_item || 'pendente'

    // Check critical non-conformities
    if (item.critico && status === 'nao_conforme') {
      motivos_bloqueio.push(
        `Item crítico não conforme: "${item.descricao}" (${item.secao})`
      )
    }

    // Check critical pending items
    if (item.critico && status === 'pendente') {
      motivos_bloqueio.push(
        `Item crítico pendente: "${item.descricao}" (${item.secao})`
      )
    }

    // Check required photo evidence
    const fotos_min = item.evidencias?.fotos_min || 0
    if (fotos_min > 0 && item.obrigatorio) {
      const fotos_count = resposta?.fotos_urls?.length || 0
      if (fotos_count < fotos_min) {
        motivos_bloqueio.push(
          `Item obrigatório sem evidência fotográfica: "${item.descricao}" (mínimo ${fotos_min} foto(s))`
        )
      }
    }

    // Check required signature
    if (item.tipo === 'signature' && item.obrigatorio && !resposta?.assinatura_url) {
      motivos_bloqueio.push(
        `Assinatura obrigatória pendente: "${item.descricao}"`
      )
    }

    // Warnings for non-critical pending items
    if (!item.critico && status === 'pendente' && item.obrigatorio) {
      avisos.push(
        `Item obrigatório pendente: "${item.descricao}" (${item.secao})`
      )
    }
  })

  return {
    pode_concluir: motivos_bloqueio.length === 0,
    motivos_bloqueio,
    avisos
  }
}

