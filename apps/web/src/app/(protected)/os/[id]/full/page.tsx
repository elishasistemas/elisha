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
import { OSHistoricoEquipamento } from '@/components/os-historico-equipamento'
import { useAuth } from '@/contexts/auth-context'


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

// Função para traduzir status para português
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'novo': 'Aberta',
    'em_deslocamento': 'Em Deslocamento',
    'checkin': 'No Local',
    'em_andamento': 'Em Andamento',
    'checkout': 'Finalizado',
    'aguardando_assinatura': 'Aguardando Assinatura',
    'concluido': 'Concluída',
    'cancelado': 'Cancelada',
    'parado': 'Parado',
    'reaberta': 'Reaberta'
  }
  return labels[status] || status
}

// Função para traduzir tipo de OS para português
const getTipoLabel = (tipo: string): string => {
  const labels: Record<string, string> = {
    'preventiva': 'Preventiva',
    'corretiva': 'Corretiva',
    'chamado': 'Chamado',
    'emergencial': 'Emergencial',
    'corretiva_programada': 'Corretiva Programada'
  }
  return labels[tipo] || tipo
}

export default function OSFullScreenPage() {
  const router = useRouter()
  const params = useParams()
  const osId = (params?.id as string) || ''

  const [os, setOs] = useState<OSEnriched | null>(null)
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [historyExpanded, setHistoryExpanded] = useState(true) // Histórico de alterações expandido por padrão
  const [equipmentHistoryExpanded, setEquipmentHistoryExpanded] = useState(false) // Histórico de equipamento retraído por padrão

  const supabase = createSupabaseBrowser()
  const { profile } = useAuth()

  // Verificar se o usuário logado é o técnico atribuído à OS
  const isAssignedTechnician = os?.tecnico_id && profile?.tecnico_id && os.tecnico_id === profile.tecnico_id



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

  // Helper para formatar labels de status
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      'checkin': 'Em Atendimento',
      'em_deslocamento': 'Em Deslocamento',
      'em_andamento': 'Em Andamento',
      'concluida': 'Concluída',
      'cancelada': 'Cancelada',
      'pendente': 'Pendente',
      'agendada': 'Agendada',
      'corretiva_prograama': 'Corretiva Programada'
    }
    return labels[status] || status
  }

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
                        os.tipo === 'corretiva_programada' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200' :
                          'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200'
                }
              >
                {getTipoLabel(os.tipo || '')}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
              >
                {os.status === 'em_deslocamento' ? 'Em Deslocamento' :
                  os.status === 'checkin' ? 'Em Atendimento' :
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

        {/* Cronômetro e Ações lado a lado (apenas durante deslocamento) */}
        {os.status === 'em_deslocamento' && tempoDecorrido && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cronômetro */}
            <Card className="border-2 border-primary">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-4 h-4 animate-pulse" />
                  Tempo em Deslocamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold tabular-nums text-center">
                  {String(tempoDecorrido.hours).padStart(2, '0')}:
                  {String(tempoDecorrido.minutes).padStart(2, '0')}:
                  {String(tempoDecorrido.seconds).padStart(2, '0')}
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  Início: {emDeslocamentoTimestamp?.toLocaleTimeString('pt-BR')}
                </p>
              </CardContent>
            </Card>

            {/* Card de ações */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ações</CardTitle>
                <CardDescription className="text-xs">Próximos passos</CardDescription>
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
                <div className="text-xs text-muted-foreground text-center">
                  Ao chegar no local, inicie o atendimento.
                </div>
              </CardContent>
            </Card>
          </div>
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

        {/* Histórico do Equipamento - Disponível para todos, retraído por padrão */}
        {os.equipamento_id && (
          <Card>
            <CardHeader className="cursor-pointer" onClick={() => setEquipmentHistoryExpanded(!equipmentHistoryExpanded)}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Histórico do Equipamento
                  </CardTitle>
                  <CardDescription>Clique para consultar manutenções anteriores</CardDescription>
                </div>
                {equipmentHistoryExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
            {equipmentHistoryExpanded && (
              <CardContent>
                <OSHistoricoEquipamento equipamentoId={os.equipamento_id} />
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}

