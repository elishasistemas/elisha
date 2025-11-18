'use client'

/**
 * ChecklistRunner Component
 * Renders and manages checklist execution for an OS
 * Supports different item types: boolean, text, number, photo, signature, leitura
 */

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  MinusCircle,
  Loader2,
  Camera,
  FileSignature
} from 'lucide-react'
import { toast } from 'sonner'
import { createSupabaseBrowser } from '@/lib/supabase'
import { computeComplianceScore, validateChecklistCompletion } from '@/utils/checklist/computeComplianceScore'
import type { 
  OSChecklist, 
  ChecklistResposta, 
  ChecklistItem,
  ComplianceScore,
  StatusItem 
} from '@/types/checklist'

interface ChecklistRunnerProps {
  osId: string
  onComplete?: () => void
}

interface ChecklistData {
  osChecklist: OSChecklist
  respostas: ChecklistResposta[]
  score: ComplianceScore
  validation: {
    pode_concluir: boolean
    motivos_bloqueio: string[]
    avisos: string[]
  }
}

export function ChecklistRunner({ osId, onComplete }: ChecklistRunnerProps) {
  const [data, setData] = useState<ChecklistData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const supabase = createSupabaseBrowser()

  // Load checklist data
  useEffect(() => {
    loadChecklistData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [osId])

  const loadChecklistData = async () => {
    try {
      setLoading(true)
      
      // Get checklist snapshot
      const { data: osChecklist, error: checklistError } = await supabase
        .from('os_checklists')
        .select('*')
        .eq('os_id', osId)
        .maybeSingle()

      if (checklistError) {
        throw checklistError
      }

      if (!osChecklist) {
        // Checklist não encontrado - não é erro, apenas não foi iniciado ainda
        setData(null)
        return
      }

      // Get responses
      const { data: respostas, error: respostasError } = await supabase
        .from('checklist_respostas')
        .select('*')
        .eq('os_checklist_id', osChecklist.id)
        .order('item_ordem', { ascending: true })

      if (respostasError) {
        throw respostasError
      }

      // Compute score and validation
      const score = computeComplianceScore(
        osChecklist.template_snapshot,
        respostas || []
      )

      const validation = validateChecklistCompletion(
        osChecklist.template_snapshot,
        respostas || []
      )

      setData({
        osChecklist,
        respostas: respostas || [],
        score,
        validation
      })
    } catch (error) {
      console.error('Error loading checklist:', error)
      toast.error('Erro ao carregar checklist')
    } finally {
      setLoading(false)
    }
  }

  // Update a response item
  const updateResposta = async (
    respostaId: string,
    updates: Partial<ChecklistResposta>
  ) => {
    try {
      setSaving(prev => new Set(prev).add(respostaId))

      const response = await fetch(`/api/checklist/respostas/${respostaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Falha ao atualizar resposta')
      }

      // Reload data to get updated score
      await loadChecklistData()
      toast.success('Item atualizado')
    } catch (error) {
      console.error('Error updating resposta:', error)
      toast.error('Erro ao atualizar item')
    } finally {
      setSaving(prev => {
        const next = new Set(prev)
        next.delete(respostaId)
        return next
      })
    }
  }

  // Group items by section
  const itemsBySection = useMemo(() => {
    if (!data) return {}
    
    const sections: Record<string, Array<{ item: ChecklistItem; resposta: ChecklistResposta }>> = {}
    const itens = data.osChecklist.template_snapshot.itens || []
    
    itens.forEach((item, index) => {
      const ordem = typeof item.ordem === 'number' ? item.ordem : index + 1
      const resposta = data.respostas.find(r => r.item_ordem === ordem)
      
      if (resposta) {
        const secao = item.secao || 'Geral'
        if (!sections[secao]) {
          sections[secao] = []
        }
        sections[secao].push({ item, resposta })
      }
    })
    
    return sections
  }, [data])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Carregando checklist...</span>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Nenhum checklist encontrado para esta OS
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{data.osChecklist.template_snapshot.nome}</CardTitle>
              <CardDescription>
                Versão {data.osChecklist.template_snapshot.versao} • {data.score.total} itens
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{data.score.score}%</div>
              <div className="text-sm text-muted-foreground">Conformidade</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={data.score.score} className="h-3" />
          <div className="mt-4 grid grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-yellow-600">{data.score.items_por_status.pendente}</div>
              <div className="text-muted-foreground">Pendentes</div>
            </div>
            <div>
              <div className="font-semibold text-green-600">{data.score.items_por_status.conforme}</div>
              <div className="text-muted-foreground">Conformes</div>
            </div>
            <div>
              <div className="font-semibold text-red-600">{data.score.items_por_status.nao_conforme}</div>
              <div className="text-muted-foreground">Não Conformes</div>
            </div>
            <div>
              <div className="font-semibold text-gray-600">{data.score.items_por_status.na}</div>
              <div className="text-muted-foreground">N/A</div>
            </div>
          </div>

          {/* Validation Messages */}
          {data.validation.motivos_bloqueio.length > 0 && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <div className="flex items-start">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Não é possível concluir a OS
                  </h3>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {data.validation.motivos_bloqueio.map((motivo, i) => (
                      <li key={i}>{motivo}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {data.validation.avisos.length > 0 && (
            <div className="mt-4 rounded-md bg-yellow-50 p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Avisos</h3>
                  <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                    {data.validation.avisos.map((aviso, i) => (
                      <li key={i}>{aviso}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist Items by Section */}
      {Object.entries(itemsBySection).map(([secao, items]) => (
        <Card key={secao}>
          <CardHeader>
            <CardTitle className="text-lg">{secao}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {items.map(({ item, resposta }) => (
              <ChecklistItemRenderer
                key={resposta.id}
                item={item}
                resposta={resposta}
                onUpdate={(updates) => updateResposta(resposta.id, updates)}
                isSaving={saving.has(resposta.id)}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Item Renderer Component
interface ItemRendererProps {
  item: ChecklistItem
  resposta: ChecklistResposta
  onUpdate: (updates: Partial<ChecklistResposta>) => void
  isSaving: boolean
}

function ChecklistItemRenderer({ item, resposta, onUpdate, isSaving }: ItemRendererProps) {
  const [localValue, setLocalValue] = useState<any>(null)

  useEffect(() => {
    // Initialize local value based on type
    switch (item.tipo) {
      case 'boolean':
        setLocalValue(resposta.valor_boolean)
        break
      case 'text':
        setLocalValue(resposta.valor_text || '')
        break
      case 'number':
      case 'leitura':
        setLocalValue(resposta.valor_number)
        break
    }
  }, [resposta, item.tipo])

  const handleStatusChange = (status: StatusItem) => {
    onUpdate({ status_item: status })
  }

  const handleValueChange = () => {
    const updates: any = { status_item: 'conforme' }
    
    switch (item.tipo) {
      case 'boolean':
        updates.valor_boolean = localValue
        break
      case 'text':
        updates.valor_text = localValue
        break
      case 'number':
      case 'leitura':
        updates.valor_number = localValue ? Number(localValue) : null
        break
    }
    
    onUpdate(updates)
  }

  const StatusIcon = {
    pendente: AlertCircle,
    conforme: CheckCircle,
    nao_conforme: XCircle,
    na: MinusCircle
  }[resposta.status_item]

  const statusColor = {
    pendente: 'text-yellow-600',
    conforme: 'text-green-600',
    nao_conforme: 'text-red-600',
    na: 'text-gray-600'
  }[resposta.status_item]

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.descricao}</span>
            {item.obrigatorio && <Badge variant="outline">Obrigatório</Badge>}
            {item.critico && <Badge variant="destructive">Crítico</Badge>}
          </div>
          {item.abnt_refs && item.abnt_refs.length > 0 && (
            <div className="mt-1 text-xs text-muted-foreground">
              Ref: {item.abnt_refs.join(', ')}
            </div>
          )}
        </div>
        <StatusIcon className={`h-5 w-5 ${statusColor}`} />
      </div>

      {/* Render input based on type */}
      <div className="space-y-3">
        {item.tipo === 'boolean' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={localValue === true ? 'default' : 'outline'}
              onClick={() => {
                setLocalValue(true)
                onUpdate({ valor_boolean: true, status_item: 'conforme' })
              }}
              disabled={isSaving}
            >
              Sim / Conforme
            </Button>
            <Button
              size="sm"
              variant={localValue === false ? 'destructive' : 'outline'}
              onClick={() => {
                setLocalValue(false)
                onUpdate({ valor_boolean: false, status_item: 'nao_conforme' })
              }}
              disabled={isSaving}
            >
              Não / Não Conforme
            </Button>
          </div>
        )}

        {item.tipo === 'text' && (
          <div>
            <Textarea
              value={localValue || ''}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={handleValueChange}
              placeholder="Digite aqui..."
              disabled={isSaving}
              rows={3}
            />
          </div>
        )}

        {(item.tipo === 'number' || item.tipo === 'leitura') && (
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              value={localValue ?? ''}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={handleValueChange}
              placeholder="Valor"
              disabled={isSaving}
              className="w-32"
            />
            {item.unidade && (
              <span className="text-sm text-muted-foreground">{item.unidade}</span>
            )}
            {item.intervalo_permitido && (
              <span className="text-xs text-muted-foreground">
                (Intervalo: {item.intervalo_permitido[0]} - {item.intervalo_permitido[1]})
              </span>
            )}
          </div>
        )}

        {item.tipo === 'photo' && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={isSaving}>
              <Camera className="h-4 w-4 mr-2" />
              Adicionar Foto
            </Button>
            {item.evidencias?.fotos_min && (
              <span className="text-xs text-muted-foreground self-center">
                Mínimo: {item.evidencias.fotos_min} foto(s)
              </span>
            )}
          </div>
        )}

        {item.tipo === 'signature' && (
          <div>
            <Button size="sm" variant="outline" disabled={isSaving}>
              <FileSignature className="h-4 w-4 mr-2" />
              Adicionar Assinatura
            </Button>
          </div>
        )}

        {/* Status Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant={resposta.status_item === 'conforme' ? 'default' : 'outline'}
            onClick={() => handleStatusChange('conforme')}
            disabled={isSaving}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Conforme
          </Button>
          <Button
            size="sm"
            variant={resposta.status_item === 'nao_conforme' ? 'destructive' : 'outline'}
            onClick={() => handleStatusChange('nao_conforme')}
            disabled={isSaving}
          >
            <XCircle className="h-3 w-3 mr-1" />
            Não Conforme
          </Button>
          <Button
            size="sm"
            variant={resposta.status_item === 'na' ? 'secondary' : 'outline'}
            onClick={() => handleStatusChange('na')}
            disabled={isSaving}
          >
            <MinusCircle className="h-3 w-3 mr-1" />
            N/A
          </Button>
        </div>

        {isSaving && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
            Salvando...
          </div>
        )}
      </div>
    </div>
  )
}

