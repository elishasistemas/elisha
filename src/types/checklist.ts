// Types for Checklist System

export type TipoServico = 'preventiva' | 'corretiva' | 'emergencial' | 'chamado' | 'todos'
export type OrigemChecklist = 'abnt' | 'custom' | 'elisha'
export type StatusItem = 'pendente' | 'conforme' | 'nao_conforme' | 'na'
export type TipoItem = 'boolean' | 'text' | 'number' | 'photo' | 'signature' | 'leitura'

// Item de checklist no template
export interface ChecklistItem {
  ordem: number
  secao: string
  descricao: string
  tipo: TipoItem
  obrigatorio: boolean
  critico: boolean
  abnt_refs?: string[]
  regras?: {
    visivel_se?: string | null
    alerta_se?: string | null
    bloqueia_conclusao_se?: string | null
  }
  evidencias?: {
    fotos_min?: number
    leituras?: Array<{
      campo: string
      unidade: string
      intervalo_permitido?: [number, number]
    }>
  }
  // Campos específicos para tipo 'leitura'
  unidade?: string
  intervalo_permitido?: [number, number]
}

// Template de checklist
export interface Checklist {
  id: string
  empresa_id: string
  nome: string
  tipo_servico: TipoServico
  itens: ChecklistItem[]
  versao: number
  origem: OrigemChecklist
  abnt_refs: string[]
  ativo: boolean
  created_at: string
  updated_at: string
}

// Snapshot de checklist vinculado a uma OS
export interface OSChecklist {
  id: string
  os_id: string
  checklist_id: string | null
  template_snapshot: {
    id: string
    nome: string
    tipo_servico: TipoServico
    versao: number
    itens: ChecklistItem[]
  }
  started_at: string
  completed_at: string | null
  responsavel_id: string | null
  empresa_id: string
  created_at: string
  updated_at: string
}

// Resposta de um item de checklist
export interface ChecklistResposta {
  id: string
  os_checklist_id: string | null
  os_id: string
  item_ordem: number
  descricao: string
  status_item: StatusItem
  valor_boolean: boolean | null
  valor_text: string | null
  valor_number: number | null
  observacoes: string | null
  fotos_urls: string[]
  assinatura_url: string | null
  respondido_por: string | null
  respondido_em: string | null
  created_at: string
  updated_at: string
}

// Score de compliance do checklist
export interface ComplianceScore {
  score: number
  criticos_pendentes: number
  pendencias: number
  total: number
  items_por_status: {
    pendente: number
    conforme: number
    nao_conforme: number
    na: number
  }
  peso_total: number
  peso_conforme: number
}

// DTO para criar resposta
export interface CreateRespostaDTO {
  os_checklist_id: string
  os_id: string
  item_ordem: number
  descricao: string
  status_item?: StatusItem
}

// DTO para atualizar resposta
export interface UpdateRespostaDTO {
  status_item?: StatusItem
  valor_boolean?: boolean | null
  valor_text?: string | null
  valor_number?: number | null
  observacoes?: string | null
  fotos_urls?: string[]
  assinatura_url?: string | null
  respondido_por?: string | null
  respondido_em?: string | null
}

// Resultado da validação do checklist
export interface ChecklistValidation {
  pode_concluir: boolean
  motivos_bloqueio: string[]
  avisos: string[]
  criticos_nao_conformes: Array<{
    item_ordem: number
    descricao: string
    motivo: string
  }>
  obrigatorios_sem_evidencia: Array<{
    item_ordem: number
    descricao: string
    tipo_evidencia: 'foto' | 'assinatura'
  }>
}

