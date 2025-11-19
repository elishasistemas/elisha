'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Minimize2, 
  MapPin, 
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import type { OrdemServico } from '@/lib/supabase'
import { PreventiveOS, CallOS, CorrectiveOS } from '@/components/service-orders'
import { 
  adaptToPreventiveOSData, 
  adaptToCallOSData, 
  adaptToCorrectiveOSData,
  adaptHistoryEntries,
  formatStatus
} from '@/utils/os-adapters'
import type { 
  PreventiveOSData, 
  CallOSData, 
  CorrectiveOSData,
  ElevatorState,
  HistoryEntry 
} from '@/types/service-orders'

interface StatusHistory {
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

interface OSEnriched extends OrdemServico {
  cliente_nome?: string
  equipamento_nome?: string
  tecnico_nome?: string
}

export default function OSFullScreenPage() {
  const router = useRouter()
  const params = useParams()
  const osId = params.id as string

  const [os, setOs] = useState<OSEnriched | null>(null)
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([])
  const [equipmentHistory, setEquipmentHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)

  const supabase = createSupabaseBrowser()

  // Buscar OS, histórico e histórico do equipamento
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Buscar OS
        const { data: osData, error: osError } = await supabase
          .from('ordens_servico')
          .select('*')
          .eq('id', osId)
          .single()

        if (osError) throw osError

        if (osData) {
          // Buscar dados relacionados separadamente
          const [clienteRes, equipamentoRes, tecnicoRes] = await Promise.allSettled([
            osData.cliente_id 
              ? supabase.from('clientes').select('nome').eq('id', osData.cliente_id).maybeSingle()
              : Promise.resolve({ data: null, error: null }),
            osData.equipamento_id
              ? supabase.from('equipamentos').select('nome').eq('id', osData.equipamento_id).maybeSingle()
              : Promise.resolve({ data: null, error: null }),
            osData.tecnico_id
              ? supabase.from('colaboradores').select('nome').eq('id', osData.tecnico_id).maybeSingle()
              : Promise.resolve({ data: null, error: null })
          ])

          // Extrair dados dos resultados de Promise.allSettled
          const clienteData = clienteRes.status === 'fulfilled' ? clienteRes.value : { data: null, error: null }
          const equipamentoData = equipamentoRes.status === 'fulfilled' ? equipamentoRes.value : { data: null, error: null }
          const tecnicoData = tecnicoRes.status === 'fulfilled' ? tecnicoRes.value : { data: null, error: null }

          const enrichedOs = {
            ...osData,
            cliente_nome: clienteData.data?.nome,
            equipamento_nome: equipamentoData.data?.nome,
            tecnico_nome: tecnicoData.data?.nome
          }

          setOs(enrichedOs)

          // Buscar histórico do equipamento (outras OS do mesmo equipamento)
          if (osData.equipamento_id) {
            const { data: equipHistory, error: equipError } = await supabase
              .from('ordens_servico')
              .select(`
                id,
                numero_os,
                tipo,
                status,
                data_abertura,
                data_fim,
                tecnico_id,
                colaboradores!ordens_servico_tecnico_id_fkey(nome)
              `)
              .eq('equipamento_id', osData.equipamento_id)
              .neq('id', osId) // Excluir a OS atual
              .order('data_abertura', { ascending: false })
              .limit(10) // Últimas 10 OS do equipamento

            if (!equipError && equipHistory) {
              const adaptedHistory: HistoryEntry[] = equipHistory.map((entry: any) => {
                const date = new Date(entry.data_abertura)
                const endDate = entry.data_fim ? new Date(entry.data_fim) : null
                return {
                  date: date.toLocaleDateString('pt-BR'),
                  time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                  technician: entry.colaboradores?.nome || 'N/A',
                  summary: `${entry.tipo} - ${formatStatus(entry.status)}`,
                  details: `OS: ${entry.numero_os || entry.id.slice(0, 8)}${endDate ? ` | Concluída em ${endDate.toLocaleDateString('pt-BR')}` : ''}`,
                }
              })
              setEquipmentHistory(adaptedHistory)
            }
          }
        }

        // Buscar histórico de status
        const { data: historyData, error: historyError } = await supabase
          .from('os_status_history')
          .select('*')
          .eq('os_id', osId)
          .order('changed_at', { ascending: false })

        if (historyError) {
          console.error('[os-full] Erro ao buscar histórico:', historyError)
          // Não quebra a aplicação se falhar
        } else {
          setStatusHistory(historyData || [])
        }
      } catch (error) {
        console.error('[os-full] Erro ao carregar dados:', error)
        toast.error('Erro ao carregar OS')
      } finally {
        setLoading(false)
      }
    }

    if (osId) {
      fetchData()
    }

    // Configurar Realtime para mudanças na OS
    const channel = supabase
      .channel(`os-${osId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ordens_servico',
          filter: `id=eq.${osId}`
        },
        (payload: any) => {
          console.log('[os-full] Realtime update:', payload)
          if (payload.eventType === 'UPDATE' && payload.new) {
            setOs(prev => prev ? { ...prev, ...payload.new } : null)
            toast.success('OS atualizada em tempo real')
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'os_status_history',
          filter: `os_id=eq.${osId}`
        },
        (payload: any) => {
          console.log('[os-full] Novo status:', payload)
          if (payload.new) {
            setStatusHistory(prev => [payload.new as StatusHistory, ...prev])
            toast.info(`Status alterado: ${(payload.new as any).status_novo}`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [osId, supabase])

  // Modo minimizado (salvar no localStorage e voltar para dashboard)
  useEffect(() => {
    if (isMinimized && os) {
      // Salvar estado no localStorage
      const emDeslocamentoEvent = statusHistory.find(
        h => h.status_novo === 'em_deslocamento' && h.action_type === 'accept'
      )
      
      if (emDeslocamentoEvent) {
      localStorage.setItem('os_dock', JSON.stringify({
        os_id: os.id,
        numero_os: os.numero_os,
          tempo_inicio: emDeslocamentoEvent.changed_at,
        minimized_at: new Date().toISOString()
      }))
      
      // Disparar evento customizado para atualizar o dock global
      window.dispatchEvent(new CustomEvent('os-dock-updated'))
      }
      
      // Voltar para o dashboard
      router.push('/dashboard')
    }
  }, [isMinimized, os, statusHistory, router])

  // Handler para Check-in
  const handleCheckin = async () => {
    if (!os) return

    try {
      setLoading(true)
      
      // Opcional: Capturar geolocalização
      let location = null
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 0
            })
          })
          
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toISOString()
          }
          
          console.log('[os-full] Localização capturada:', location)
        } catch (geoError) {
          console.warn('[os-full] Não foi possível obter localização:', geoError)
          // Continua mesmo sem localização
        }
      }

      // Chamar RPC os_checkin
      const { data, error } = await supabase.rpc('os_checkin', {
        p_os_id: os.id,
        p_location: location
      })

      if (error) throw error

      const result = data as { success: boolean; error?: string; message?: string; data?: any }

      if (!result.success) {
        const errorMsg = result.message || result.error || 'Erro ao fazer check-in'
        console.error('[os-full] os_checkin failed:', result)
        toast.error(errorMsg)
        return
      }

      console.log('[os-full] Check-in realizado com sucesso:', result)
      toast.success(result.message || 'Check-in realizado com sucesso!')
      
      // Atualizar estado local da OS
      setOs(prev => prev ? { ...prev, status: 'checkin' } : null)

      // Recarregar histórico
      const { data: historyData } = await supabase
        .from('os_status_history')
        .select('*')
        .eq('os_id', osId)
        .order('changed_at', { ascending: false })

      if (historyData) {
        setStatusHistory(historyData)
      }

    } catch (error) {
      console.error('[os-full] Erro ao fazer check-in:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer check-in')
    } finally {
      setLoading(false)
    }
  }

  // Handler para Checkout (será implementado na Tarefa 5)
  const handleCheckout = async (
    elevatorState: ElevatorState,
    clientName: string,
    signature?: string
  ) => {
    if (!os || !os.empresa_id) return

    try {
      setLoading(true)

      // TODO: Implementar RPC os_checkout na Tarefa 5
      // Por enquanto, apenas toast
      toast.info('Checkout será implementado na Tarefa 5')
      
      console.log('[os-full] Checkout:', {
        osId: os.id,
        elevatorState,
        clientName,
        signature: signature ? 'assinada' : 'não assinada'
      })

      // TODO: Chamar RPC os_checkout quando disponível
      // const { data, error } = await supabase.rpc('os_checkout', {
      //   p_os_id: os.id,
      //   p_estado: elevatorState,
      //   p_cliente_nome: clientName,
      //   p_cliente_assinatura: signature
      // })

    } catch (error) {
      console.error('[os-full] Erro ao fazer checkout:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer checkout')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !os) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Carregando OS...</p>
        </div>
      </div>
    )
  }

  if (!os) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              OS não encontrada
            </CardTitle>
            <CardDescription>
              A ordem de serviço solicitada não foi encontrada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard')} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Converter histórico de status para HistoryEntry
  const adaptedHistory = adaptHistoryEntries(statusHistory)

  // Renderizar componente correto baseado no tipo
  const renderOSComponent = () => {
    if (!os || !os.empresa_id) {
      return null
    }

    // Status que devem mostrar os componentes do Figma Make
    // Para OS aceitas, sempre mostrar o componente Figma se tiver técnico atribuído
    const statusesComComponente = ['checkin', 'checkout', 'em_andamento', 'aguardando_assinatura', 'em_deslocamento']
    const deveMostrarComponente = statusesComComponente.includes(os.status) && os.tecnico_id !== null

    // Se não deve mostrar componente, retorna null (mostra a tela de deslocamento ou inicial)
    if (!deveMostrarComponente) {
      return null
    }

    switch (os.tipo) {
      case 'preventiva':
        const preventiveData = adaptToPreventiveOSData(os, equipmentHistory)
        return (
          <PreventiveOS
            osId={os.id}
            empresaId={os.empresa_id}
            data={preventiveData}
            history={equipmentHistory}
            onCheckout={handleCheckout}
          />
        )
      
      case 'chamado':
        const callData = adaptToCallOSData(os, equipmentHistory)
        return (
          <CallOS
            osId={os.id}
            empresaId={os.empresa_id}
            data={callData}
            history={equipmentHistory}
            onCheckout={handleCheckout}
          />
        )
      
      case 'corretiva':
        const correctiveData = adaptToCorrectiveOSData(os, equipmentHistory)
        return (
          <CorrectiveOS
            osId={os.id}
            empresaId={os.empresa_id}
            data={correctiveData}
            history={equipmentHistory}
            onCheckout={handleCheckout}
          />
        )
      
      default:
        return (
          <Card className="max-w-5xl mx-auto">
            <CardHeader>
              <CardTitle>Tipo de OS não suportado</CardTitle>
              <CardDescription>
                O tipo "{os.tipo}" ainda não tem componente específico implementado.
              </CardDescription>
            </CardHeader>
          </Card>
        )
    }
  }

  // Modo full-screen (sobrepõe tudo, incluindo sidebar)
  const osComponent = renderOSComponent()
  
  return (
    <div className="fixed inset-0 z-[9999] bg-background overflow-auto">
      {/* Renderizar componente de OS se deve mostrar componente do Figma Make */}
      {osComponent ? (
        osComponent
      ) : (
        /* Tela de deslocamento (antes do check-in) */
        <div className="p-4 md:p-8">
      {/* Header com controles */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsMinimized(true)}
              variant="outline"
              size="sm"
            >
              <Minimize2 className="w-4 h-4 mr-2" />
              Minimizar
            </Button>
          </div>
        </div>
      </div>

      {/* Informações da OS */}
      <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2">
        {/* Card da OS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{os.numero_os}</span>
                  <Badge variant="default">{formatStatus(os.status)}</Badge>
            </CardTitle>
            <CardDescription>
              Tipo: {os.tipo} | Prioridade: {os.prioridade}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div>
                <p className="text-sm font-medium">Cliente</p>
                <p className="text-sm text-muted-foreground">{os.cliente_nome || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div>
                <p className="text-sm font-medium">Equipamento</p>
                <p className="text-sm text-muted-foreground">{os.equipamento_nome || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div>
                <p className="text-sm font-medium">Técnico</p>
                <p className="text-sm text-muted-foreground">{os.tecnico_nome || 'N/A'}</p>
              </div>
            </div>

            {os.observacoes && (
              <div>
                <p className="text-sm font-medium mb-1">Observações</p>
                <p className="text-sm text-muted-foreground">{os.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de ações */}
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
            <CardDescription>Próximos passos do atendimento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {os.status === 'em_deslocamento' && (
              <Button
                onClick={handleCheckin}
                className="w-full"
                size="lg"
              >
                <MapPin className="w-5 h-5 mr-2" />
                Check-in (Chegada)
              </Button>
            )}

                <div className="text-sm text-muted-foreground text-center pt-4">
                  {os.status === 'em_deslocamento' && (
                    <p>Ao chegar no local, faça o check-in para iniciar o atendimento.</p>
                  )}
                  {os.status !== 'em_deslocamento' && os.status !== 'checkin' && (
                    <p>Status atual: {formatStatus(os.status)}</p>
                  )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de status */}
      {statusHistory.length > 0 && (
        <div className="max-w-5xl mx-auto mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Status</CardTitle>
              <CardDescription>Timeline de mudanças da OS</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                    {statusHistory.map((history) => (
                  <div
                    key={history.id}
                    className="flex items-start gap-3 pb-3 border-b last:border-0"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{formatStatus(history.status_novo)}</Badge>
                        {history.action_type && (
                          <span className="text-xs text-muted-foreground">
                            ({history.action_type})
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(history.changed_at).toLocaleString('pt-BR')}
                      </p>
                      {history.reason && (
                        <p className="text-sm mt-1">Motivo: {history.reason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}