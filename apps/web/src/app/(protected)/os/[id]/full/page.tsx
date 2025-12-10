'use client'

import { useEffect, useState, useMemo } from 'react'
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
  User,
  Building2,
  Wrench,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import type { OrdemServico } from '@/lib/supabase'
import { OSChamadoCorretiva } from '@/components/os-chamado-corretiva'
import { OSPreventiva } from '@/components/os-preventiva'

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
  const [loading, setLoading] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const supabase = createSupabaseBrowser()

  // Encontrar o timestamp do evento "em_deslocamento"
  const emDeslocamentoTimestamp = useMemo(() => {
    const event = statusHistory.find(
      h => h.status_novo === 'em_deslocamento' && h.action_type === 'accept'
    )
    return event ? new Date(event.changed_at) : null
  }, [statusHistory])

  // Calcular tempo decorrido desde "em_deslocamento"
  const tempoDecorrido = useMemo(() => {
    if (!emDeslocamentoTimestamp) {
      return null
    }

    const diff = currentTime.getTime() - emDeslocamentoTimestamp.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    const tempo = {
      hours: hours % 24,
      minutes: minutes % 60,
      seconds: seconds % 60,
      total_seconds: seconds
    }
    
    return tempo
  }, [emDeslocamentoTimestamp, currentTime])

  // Buscar OS e histórico
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
          const [clienteRes, equipamentoRes, tecnicoRes] = await Promise.all([
            osData.cliente_id 
              ? supabase.from('clientes').select('nome').eq('id', osData.cliente_id).single()
              : Promise.resolve({ data: null }),
            osData.equipamento_id
              ? supabase.from('equipamentos').select('nome').eq('id', osData.equipamento_id).single()
              : Promise.resolve({ data: null }),
            osData.tecnico_id
              ? supabase.from('colaboradores').select('nome').eq('id', osData.tecnico_id).single()
              : Promise.resolve({ data: null })
          ])

          setOs({
            ...osData,
            cliente_nome: clienteRes.data?.nome,
            equipamento_nome: equipamentoRes.data?.nome,
            tecnico_nome: tecnicoRes.data?.nome
          })
        }

        // Buscar histórico de status
        const { data: historyData, error: historyError } = await supabase
          .from('os_status_history')
          .select('*')
          .eq('os_id', osId)
          .order('changed_at', { ascending: false })

        if (historyError) {
          console.error('[os-full] Erro ao buscar histórico:', historyError)
          throw historyError
        }

        setStatusHistory(historyData || [])
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

  // Atualizar tempo a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Modo minimizado (salvar no localStorage e voltar para dashboard)
  useEffect(() => {
    if (isMinimized && os && emDeslocamentoTimestamp) {
      // Salvar estado no localStorage
      localStorage.setItem('os_dock', JSON.stringify({
        os_id: os.id,
        numero_os: os.numero_os,
        tempo_inicio: emDeslocamentoTimestamp.toISOString(),
        minimized_at: new Date().toISOString()
      }))
      
      // Disparar evento customizado para atualizar o dock global
      window.dispatchEvent(new CustomEvent('os-dock-updated'))
      
      // Voltar para o dashboard
      router.push('/dashboard')
    }
  }, [isMinimized, os, emDeslocamentoTimestamp, router])

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

      toast.success(result.message || 'Check-in realizado com sucesso!')
      
      // Atualizar estado local da OS
      setOs(prev => prev ? { ...prev, status: 'checkin' } : null)

    } catch (error) {
      console.error('[os-full] Erro ao fazer check-in:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer check-in')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4 text-muted-foreground" />
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

  // Modo full-screen (sobrepõe tudo, incluindo sidebar)
  return (
    <div className="fixed inset-0 z-[9999] bg-background p-4 md:p-8 overflow-auto">
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

        {/* Cronômetro principal */}
        {tempoDecorrido && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 animate-pulse" />
                Tempo em Deslocamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-6xl font-bold tabular-nums text-center">
                {String(tempoDecorrido.hours).padStart(2, '0')}:
                {String(tempoDecorrido.minutes).padStart(2, '0')}:
                {String(tempoDecorrido.seconds).padStart(2, '0')}
              </div>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Início: {emDeslocamentoTimestamp?.toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Área de Atendimento (aparece após check-in) */}
      {os.status === 'checkin' && (
        <div className="max-w-5xl mx-auto mb-6">
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Área de Atendimento
              </CardTitle>
              <CardDescription>
                Você realizou o check-in com sucesso. Agora você pode iniciar o atendimento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium mb-1">💡 Próximos passos:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>1. Preencha o laudo técnico abaixo</li>
                  <li>2. Registre evidências (fotos, vídeos, áudios)</li>
                  <li>3. Ao finalizar, faça checkout</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Checklist + Laudo + Evidências (aparece após check-in) */}
      {os.status === 'checkin' && os.empresa_id && (
        <div className="max-w-5xl mx-auto">
          {os.tipo === 'preventiva' ? (
            <OSPreventiva 
              osId={os.id} 
              empresaId={os.empresa_id}
              osData={os}
            />
          ) : (
            <OSChamadoCorretiva 
              osId={os.id} 
              empresaId={os.empresa_id}
              osData={os}
            />
          )}
        </div>
      )}

      {/* Informações da OS */}
      <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2">
        {/* Card da OS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{os.numero_os}</span>
              <Badge variant="default">{os.status}</Badge>
            </CardTitle>
            <CardDescription>
              Tipo: {os.tipo} | Prioridade: {os.prioridade}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Cliente</p>
                <p className="text-sm text-muted-foreground">{os.cliente_nome || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Wrench className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Equipamento</p>
                <p className="text-sm text-muted-foreground">{os.equipamento_nome || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
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

            {os.status === 'checkin' && (
              <div className="space-y-2">
                <Button
                  onClick={() => toast.info('Checklist em desenvolvimento (Tarefa 4)')}
                  className="w-full"
                  size="lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Iniciar Checklist
                </Button>
              </div>
            )}

            {/* Placeholder para outras ações */}
            <div className="text-sm text-muted-foreground text-center pt-4">
              {os.status === 'em_deslocamento' && 'Ao chegar no local, faça o check-in.'}
              {os.status === 'checkin' && 'Após check-in, inicie o checklist de serviço.'}
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
                {statusHistory.map((history, index) => (
                  <div
                    key={history.id}
                    className="flex items-start gap-3 pb-3 border-b last:border-0"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{history.status_novo}</Badge>
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
  )
}

