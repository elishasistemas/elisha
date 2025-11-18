/**
 * Service: Start Checklist for OS
 * Creates an immutable snapshot of a checklist template and pre-populates responses
 * Idempotent: returns existing snapshot if already created for the OS
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { ChecklistItem } from '@/types/checklist'

export type StartChecklistParams = {
  osId: string
  checklistId: string
}

export type StartChecklistResult = {
  id: string
  os_id: string
  template_snapshot: {
    id: string
    nome: string
    tipo_servico: string
    versao: number
    itens: ChecklistItem[]
  }
}

export async function startChecklistForOS(
  params: StartChecklistParams,
  supabase: SupabaseClient
): Promise<StartChecklistResult> {
  const { osId, checklistId } = params

  // 0) Check if snapshot already exists (idempotent)
  const { data: existing, error: existingError } = await supabase
    .from('os_checklists')
    .select('id, os_id, template_snapshot')
    .eq('os_id', osId)
    .maybeSingle()

  if (existingError) {
    throw new Error(`Erro ao verificar checklist existente: ${existingError.message}`)
  }

  if (existing) {
    return existing as StartChecklistResult
  }

  // 1) Load template from database
  const { data: template, error: templateError } = await supabase
    .from('checklists')
    .select('id, nome, tipo_servico, versao, itens, empresa_id')
    .eq('id', checklistId)
    .eq('ativo', true)
    .single()

  if (templateError || !template) {
    throw new Error(`Template não encontrado ou inativo: ${templateError?.message}`)
  }

  // 2) Create immutable snapshot
  const snapshot = {
    id: template.id,
    nome: template.nome,
    tipo_servico: template.tipo_servico,
    versao: template.versao,
    itens: template.itens as ChecklistItem[]
  }

  const { data: osChecklist, error: snapshotError } = await supabase
    .from('os_checklists')
    .insert({
      os_id: osId,
      checklist_id: template.id,
      template_snapshot: snapshot,
      empresa_id: template.empresa_id
    })
    .select('id, os_id, template_snapshot')
    .single()

  if (snapshotError || !osChecklist) {
    throw new Error(`Erro ao criar snapshot: ${snapshotError?.message}`)
  }

  // 3) Pre-populate responses (all items start as 'pendente')
  const itens = snapshot.itens ?? []
  const respostas = itens.map((item, index) => ({
    os_checklist_id: osChecklist.id,
    os_id: osId,
    item_ordem: typeof item.ordem === 'number' ? item.ordem : index + 1,
    descricao: item.descricao ?? `Item ${index + 1}`,
    status_item: 'pendente'
  }))

  if (respostas.length > 0) {
    const { error: respostasError } = await supabase
      .from('checklist_respostas')
      .insert(respostas)

    if (respostasError) {
      throw new Error(`Erro ao criar respostas: ${respostasError.message}`)
    }
  }

  return osChecklist as StartChecklistResult
}

