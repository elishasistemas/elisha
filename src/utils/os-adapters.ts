/**
 * Funções adaptadoras para converter dados do Supabase
 * para os tipos dos componentes de Service Orders
 */

import type { OrdemServico } from '@/lib/supabase'
import type {
  PreventiveOSData,
  CallOSData,
  CorrectiveOSData,
  HistoryEntry,
} from '@/types/service-orders'

interface OSEnriched extends OrdemServico {
  cliente_nome?: string
  equipamento_nome?: string
  tecnico_nome?: string
}

interface StatusHistoryEntry {
  id: string
  os_id: string
  status_anterior: string | null
  status_novo: string
  changed_by: string | null
  changed_at: string
  action_type: string | null
  reason: string | null
  metadata: Record<string, any> | null
}

/**
 * Converte status do Supabase para formato legível
 */
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    novo: 'Novo',
    em_andamento: 'Em Andamento',
    aguardando_assinatura: 'Aguardando Assinatura',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
    parado: 'Parado',
    em_deslocamento: 'Em Deslocamento',
    checkin: 'Em Atendimento',
    checkout: 'Checkout',
    reaberta: 'Reaberta',
  }
  return statusMap[status] || status
}

/**
 * Converte histórico de status para formato HistoryEntry
 */
export function adaptHistoryEntries(
  history: StatusHistoryEntry[]
): HistoryEntry[] {
  return history.map((entry) => {
    const date = new Date(entry.changed_at)
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      technician: entry.metadata?.technician_name || 'Sistema',
      summary: `${entry.action_type || 'Status alterado'}: ${formatStatus(entry.status_novo)}`,
      details: entry.reason || entry.metadata?.description || '',
    }
  })
}

/**
 * Adapta OS do Supabase para PreventiveOSData
 */
export function adaptToPreventiveOSData(
  os: OSEnriched,
  history: HistoryEntry[] = []
): PreventiveOSData {
  return {
    type: 'preventiva',
    osNumber: os.numero_os || `OS-${os.id.slice(0, 8)}`,
    clientName: os.cliente_nome || 'N/A',
    equipment: os.equipamento_nome || 'N/A',
    technician: os.tecnico_nome || 'N/A',
    status: formatStatus(os.status),
    checklist: [], // Será carregado pelo ChecklistRunner
    observations: os.observacoes || undefined,
  }
}

/**
 * Adapta OS do Supabase para CallOSData
 */
export function adaptToCallOSData(
  os: OSEnriched,
  history: HistoryEntry[] = []
): CallOSData {
  return {
    type: 'chamado',
    osNumber: os.numero_os || `OS-${os.id.slice(0, 8)}`,
    clientName: os.cliente_nome || 'N/A',
    equipment: os.equipamento_nome || 'N/A',
    technician: os.tecnico_nome || 'N/A',
    status: formatStatus(os.status),
    clientDescription: os.observacoes || '',
    requesterName: os.quem_solicitou || '',
    requesterPhone: '', // Não há campo no schema atual, pode ser adicionado depois
    technicalReport: undefined, // Será carregado do banco
  }
}

/**
 * Adapta OS do Supabase para CorrectiveOSData
 */
export function adaptToCorrectiveOSData(
  os: OSEnriched,
  history: HistoryEntry[] = []
): CorrectiveOSData {
  return {
    type: 'corretiva',
    osNumber: os.numero_os || `OS-${os.id.slice(0, 8)}`,
    clientName: os.cliente_nome || 'N/A',
    equipment: os.equipamento_nome || 'N/A',
    technician: os.tecnico_nome || 'N/A',
    status: formatStatus(os.status),
    clientDescription: os.observacoes || '',
    requesterName: os.quem_solicitou || '',
    requesterPhone: '', // Não há campo no schema atual, pode ser adicionado depois
    technicalReport: undefined, // Será carregado do banco
  }
}
