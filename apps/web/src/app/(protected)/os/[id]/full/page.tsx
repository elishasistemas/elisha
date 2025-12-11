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
  AlertCircle,
  ChevronDown,
  ChevronUp
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
  const [historyExpanded, setHistoryExpanded] = useState(true)

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
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token
        
        if (!token) throw new Error('Não autenticado')
        
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const response = await fetch(`${BACKEND_URL}/api/v1/ordens-servico/${osId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) throw new Error('Erro ao buscar OS')
        
        const osData = await response.json()

        if (osData) {

          // Buscar dados relacionados via backend
          const [clienteRes, equipamentoRes, tecnicoRes] = await Promise.all([
            osData.cliente_id 
              ? fetch(`${BACKEND_URL}/api/v1/clientes/${osData.cliente_id}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                }).then(async r => {
                  if (!r.ok) {
                    return null
                  }
                  const data = await r.json()
                  return data
                })
              : Promise.resolve(null),
            osData.equipamento_id
              ? fetch(`${BACKEND_URL}/api/v1/equipamentos/${osData.equipamento_id}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                }).then(async r => {
                  if (!r.ok) {
                    return null
                  }
                  const data = await r.json()
                  return data
                })
              : Promise.resolve(null),
            osData.tecnico_id
              ? fetch(`${BACKEND_URL}/api/v1/colaboradores/${osData.tecnico_id}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                }).then(async r => {
                  if (!r.ok) {
                    return null
                  }
                  const data = await r.json()
                  return data
                })
              : Promise.resolve(null)
          ])

          // Montar nome do equipamento a partir dos campos disponíveis
          let equipamentoNome = null
          if (equipamentoRes) {
            equipamentoNome = equipamentoRes.nome || 
                            equipamentoRes.tag ||
                            (equipamentoRes.tipo && equipamentoRes.modelo 
                              ? `${equipamentoRes.tipo} ${equipamentoRes.modelo}` 
                              : null) ||
                            equipamentoRes.tipo ||
                            equipamentoRes.descricao ||
                            'Equipamento'
          }

          const osEnriched = {
            ...osData,
            cliente_nome: clienteRes?.nome || clienteRes?.nome_local || null,
            equipamento_nome: equipamentoNome,
            tecnico_nome: tecnicoRes?.nome || null
          }

          setOs(osEnriched)
        }

        // Buscar histórico de status via backend
        const historyResponse = await fetch(`${BACKEND_URL}/api/v1/ordens-servico/${osId}/history`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json()
          setStatusHistory(historyData || [])
        } else {
        }
      } catch (error) {
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
        toast.error(errorMsg)
        return
      }

      toast.success(result.message || 'Check-in realizado com sucesso!')
      
      // Atualizar estado local da OS
      setOs(prev => prev ? { ...prev, status: 'checkin' } : null)

    } catch (error) {
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
    <div className="fixed inset-0 z-[9999] bg-background overflow-auto">
      {/* Header fixo no topo com fundo branco */}
      <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4">
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

          {/* Informações da OS no header */}
          <div className="space-y-3">
            {/* Número da OS e Status */}
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{os.numero_os}</h2>
              <Badge 
                variant="secondary" 
                className={
                  os.tipo === 'corretiva' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200' :
                  os.tipo === 'preventiva' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200' :
                  os.tipo === 'chamado' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200' :
                  'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200'
                }
              >
                {os.tipo === 'preventiva' ? 'Preventiva' : 
                 os.tipo === 'corretiva' ? 'Corretiva' : 
                 os.tipo === 'chamado' ? 'Chamado' : 
                 os.tipo}
              </Badge>
              <Badge 
                variant="secondary"
                className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
              >
                {os.status === 'em_deslocamento' ? 'Em Deslocamento' :
                 os.status === 'checkin' ? 'No Local' :
                 os.status === 'em_andamento' ? 'Em Andamento' :
                 os.status}
              </Badge>
            </div>

            {/* Cliente, Equipamento e Técnico */}
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Cliente: <span className="text-foreground">{os.cliente_nome || 'N/A'}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Equipamento: <span className="text-foreground">{os.equipamento_nome || 'N/A'}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Técnico: <span className="text-foreground">{os.tecnico_nome || 'N/A'}</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal com padding */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* Cronômetro principal (apenas durante deslocamento) */}
        {os.status === 'em_deslocamento' && tempoDecorrido && (
          <Card className="border-2 border-primary mb-6">
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

        {/* Checklist + Laudo + Evidências (aparece após check-in ou em_andamento) */}
        {['checkin', 'em_andamento'].includes(os.status) && os.empresa_id && (
          <>
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
          </>
        )}

        {/* Card de ações - apenas durante deslocamento */}
        {os.status === 'em_deslocamento' && (
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
              <CardDescription>Próximos passos do atendimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleCheckin}
                className="w-full"
                size="lg"
              >
                <MapPin className="w-5 h-5 mr-2" />
                Iniciar Atendimento
              </Button>
              <div className="text-sm text-muted-foreground text-center pt-4">
                Ao chegar no local, inicie o atendimento.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Histórico da OS */}
        {statusHistory.length > 0 && (
          <Card>
            <CardHeader className="cursor-pointer" onClick={() => setHistoryExpanded(!historyExpanded)}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Histórico da OS</CardTitle>
                  <CardDescription>Timeline de mudanças da OS</CardDescription>
                </div>
                {historyExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
            {historyExpanded && (
            <CardContent>
              <div className="space-y-3">
                {statusHistory
                  .filter((history, index, self) => 
                    // Remover duplicados
                    index === self.findIndex(h => 
                      h.status_novo === history.status_novo && 
                      h.action_type === history.action_type &&
                      Math.abs(new Date(h.changed_at).getTime() - new Date(history.changed_at).getTime()) < 1000
                    )
                  )
                  .map((history) => (
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
            )}
          </Card>
        )}
      </div>
    </div>
  )
}

