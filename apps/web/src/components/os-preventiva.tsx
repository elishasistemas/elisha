'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { toast } from 'sonner'
import { 
  CheckCircle2,
  XCircle,
  MinusCircle,
  Camera,
  Video,
  Mic,
  FileText
} from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { useDebounce } from '@/hooks/use-debounce'
import { OSProximosPassos } from './os-proximos-passos'
import { OSHistoricoEquipamento } from './os-historico-equipamento'

interface OSPreventivaProps {
  osId: string
  empresaId: string
  osData: any
}

interface ChecklistItem {
  id: string
  descricao: string
  status: 'conforme' | 'nao_conforme' | 'na' | null
  ordem: number
}

interface Evidencia {
  id: string
  tipo: 'foto' | 'video' | 'audio' | 'nota'
  storage_path?: string
  conteudo?: string
  created_at: string
}

export function OSPreventiva({ osId, empresaId, osData }: OSPreventivaProps) {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [observacoes, setObservacoes] = useState('')
  const [evidencias, setEvidencias] = useState<Evidencia[]>([])
  const [loading, setLoading] = useState(true)
  const [savingObservacoes, setSavingObservacoes] = useState(false)

  const supabase = createSupabaseBrowser()

  // Debounce das observações para autosave
  const debouncedObservacoes = useDebounce(observacoes, 2000)

  // =====================================================
  // Carregar dados iniciais
  // =====================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar checklist items
        const { data: checklistData } = await supabase
          .from('os_checklist_items')
          .select('*')
          .eq('os_id', osId)
          .order('ordem', { ascending: true })

        if (checklistData && checklistData.length > 0) {
          setChecklistItems(checklistData)
        } else {
          // Carregar checklist padrão do equipamento/tipo
          // Por enquanto, usar checklist fixo como exemplo
          setChecklistItems([
            { id: '1', descricao: 'Verificar condições de segurança do local', status: null, ordem: 1 },
            { id: '2', descricao: 'Conferir identificação do equipamento', status: null, ordem: 2 },
            { id: '3', descricao: 'Testar funcionamento antes da manutenção', status: null, ordem: 3 },
            { id: '4', descricao: 'Utilizar EPIs adequados', status: null, ordem: 4 },
            { id: '5', descricao: 'Documentar estado inicial com fotos', status: null, ordem: 5 },
            { id: '6', descricao: 'Realizar manutenção conforme procedimento', status: null, ordem: 6 },
            { id: '7', descricao: 'Testar funcionamento após manutenção', status: null, ordem: 7 },
            { id: '8', descricao: 'Limpar área de trabalho', status: null, ordem: 8 },
            { id: '9', descricao: 'Obter assinatura do cliente', status: null, ordem: 9 }
          ])
        }

        // Buscar observações do laudo
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token
        
        if (token) {
          const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
          const response = await fetch(`${BACKEND_URL}/api/v1/ordens-servico/${osId}/laudo`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const laudoData = await response.json()
            if (laudoData?.observacao) {
              setObservacoes(laudoData.observacao)
            }
          }
        }

        // Buscar evidências
        const { data: evidenciasData } = await supabase
          .from('os_evidencias')
          .select('*')
          .eq('os_id', osId)
          .order('created_at', { ascending: false })

        if (evidenciasData) {
          setEvidencias(evidenciasData)
        }
      } catch (error) {
        console.error('[preventiva] Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [osId, supabase])

  // =====================================================
  // Autosave das observações (debounced)
  // =====================================================
  useEffect(() => {
    const saveObservacoes = async () => {
      if (!debouncedObservacoes || loading) return

      setSavingObservacoes(true)

      try {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token
        
        if (!token) throw new Error('Não autenticado')
        
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        
        // Verificar se já existe laudo
        const checkResponse = await fetch(`${BACKEND_URL}/api/v1/ordens-servico/${osId}/laudo`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        const laudoExistente = checkResponse.ok ? await checkResponse.json() : null
        
        const method = laudoExistente?.id ? 'PATCH' : 'POST'
        const url = laudoExistente?.id 
          ? `${BACKEND_URL}/api/v1/ordens-servico/${osId}/laudo/${laudoExistente.id}`
          : `${BACKEND_URL}/api/v1/ordens-servico/${osId}/laudo`
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ observacao: debouncedObservacoes })
        })
        
        if (!response.ok) throw new Error('Erro ao salvar observações')
        console.log('[preventiva] Observações salvas automaticamente')
      } catch (error) {
        console.error('[preventiva] Erro ao salvar observações:', error)
      } finally {
        setSavingObservacoes(false)
      }
    }

    saveObservacoes()
  }, [debouncedObservacoes, loading, osId, empresaId, supabase])

  // =====================================================
  // Atualizar status do checklist item
  // =====================================================
  const handleChecklistItemStatus = async (itemId: string, status: 'conforme' | 'nao_conforme' | 'na') => {
    try {
      setChecklistItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, status } : item
        )
      )

      // Salvar no banco
      const { error } = await supabase
        .from('os_checklist_items')
        .upsert({
          id: itemId,
          os_id: osId,
          empresa_id: empresaId,
          descricao: checklistItems.find(i => i.id === itemId)?.descricao || '',
          status,
          ordem: checklistItems.find(i => i.id === itemId)?.ordem || 0
        })

      if (error) throw error
    } catch (error) {
      console.error('[preventiva] Erro ao atualizar checklist:', error)
      toast.error('Erro ao atualizar checklist')
    }
  }

  // =====================================================
  // Upload de evidências (placeholder)
  // =====================================================
  const handleUploadEvidencia = async (tipo: 'foto' | 'video' | 'audio' | 'nota') => {
    toast.info(`Upload de ${tipo} em desenvolvimento`)
  }

  // Calcular progresso do checklist
  const itemsRespondidos = checklistItems.filter(item => item.status !== null).length
  const totalItems = checklistItems.length
  const itemsConformes = checklistItems.filter(item => item.status === 'conforme').length

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Seção 1: Checklist de Atendimento */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Checklist de Atendimento
              </CardTitle>
            </div>
            <Badge variant="outline">
              {itemsRespondidos}/{totalItems} conforme
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Marque cada item conforme as normas e boas práticas da empresa
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm flex-1">{item.descricao}</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={item.status === 'conforme' ? 'default' : 'outline'}
                  onClick={() => handleChecklistItemStatus(item.id, 'conforme')}
                  className="gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Conforme
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={item.status === 'nao_conforme' ? 'destructive' : 'outline'}
                  onClick={() => handleChecklistItemStatus(item.id, 'nao_conforme')}
                  className="gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  Não Conforme
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={item.status === 'na' ? 'secondary' : 'outline'}
                  onClick={() => handleChecklistItemStatus(item.id, 'na')}
                  className="gap-1"
                >
                  <MinusCircle className="w-4 h-4" />
                  N/A
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Seção 2: Observações e Evidências */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              2
            </div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Observações
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              placeholder="Observações sobre a manutenção preventiva..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Evidências (Fotos, Vídeos, Áudios)</p>
            <div className="grid grid-cols-4 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-20 flex-col"
                onClick={() => handleUploadEvidencia('foto')}
              >
                <Camera className="w-5 h-5 mb-1" />
                <span className="text-xs">Foto</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-20 flex-col"
                onClick={() => handleUploadEvidencia('video')}
              >
                <Video className="w-5 h-5 mb-1" />
                <span className="text-xs">Vídeo</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-20 flex-col"
                onClick={() => handleUploadEvidencia('audio')}
              >
                <Mic className="w-5 h-5 mb-1" />
                <span className="text-xs">Áudio</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-20 flex-col"
                onClick={() => handleUploadEvidencia('nota')}
              >
                <FileText className="w-5 h-5 mb-1" />
                <span className="text-xs">Nota</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {evidencias.length > 0 ? `${evidencias.length} evidência(s) adicionada(s)` : 'Nenhuma evidência adicionada ainda'}
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Salvamento automático a cada 2 segundos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Seção 3: Próximos Passos */}
      <OSProximosPassos osId={osId} empresaId={empresaId} />

      {/* Seção 4: Histórico do Equipamento */}
      <OSHistoricoEquipamento equipamentoId={osData?.equipamento_id} />
    </div>
  )
}
