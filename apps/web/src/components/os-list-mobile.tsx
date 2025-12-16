'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  User, 
  Building2,
  ChevronRight,
  Play,
  Eye
} from 'lucide-react'
import type { OrdemServico } from '@/lib/supabase'

interface OSListMobileProps {
  ordens: OrdemServico[]
  clientes: Array<{ id: string; nome_local: string; zona_id?: string | null }>
  colaboradores: Array<{ id: string; nome: string }>
  zonas?: Array<{ id: string; nome: string }>
  onViewOrder: (ordem: OrdemServico) => void
  onAcceptOrder?: (ordem: OrdemServico) => void
  onStartOrder?: (ordem: OrdemServico) => void
  canAccept?: boolean
  isLoading?: boolean
  emptyMessage?: string
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  parado: {
    label: 'Parado',
    color: 'text-red-700',
    bgColor: 'bg-red-100 border-red-200',
    icon: AlertCircle
  },
  novo: {
    label: 'Aberta',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 border-blue-200',
    icon: AlertCircle
  },
  em_deslocamento: {
    label: 'Em Deslocamento',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100 border-purple-200',
    icon: Clock
  },
  checkin: {
    label: 'Em Atendimento',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100 border-indigo-200',
    icon: CheckCircle
  },
  em_andamento: {
    label: 'Em Andamento',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100 border-indigo-200',
    icon: Clock
  },
  aguardando_assinatura: {
    label: 'Aguardando Assinatura',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100 border-orange-200',
    icon: Clock
  },
  concluido: {
    label: 'Concluída',
    color: 'text-green-700',
    bgColor: 'bg-green-100 border-green-200',
    icon: CheckCircle
  },
  cancelado: {
    label: 'Cancelada',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100 border-gray-200',
    icon: AlertCircle
  }
}

const prioridadeConfig: Record<string, { label: string; color: string }> = {
  urgente: { label: '🔴 Urgente', color: 'text-red-600' },
  alta: { label: '🟠 Alta', color: 'text-orange-600' },
  media: { label: '🟡 Média', color: 'text-yellow-600' },
  baixa: { label: '🟢 Baixa', color: 'text-green-600' }
}

const tipoConfig: Record<string, { label: string; color: string }> = {
  preventiva: { label: 'Preventiva', color: 'bg-blue-500' },
  corretiva: { label: 'Corretiva', color: 'bg-orange-500' },
  chamado: { label: 'Chamado', color: 'bg-purple-500' },
  emergencial: { label: 'Emergencial', color: 'bg-red-500' },
  corretiva_programada: { label: 'Corr. Programada', color: 'bg-yellow-500' }
}

export function OSListMobile({
  ordens,
  clientes,
  colaboradores,
  zonas = [],
  onViewOrder,
  onAcceptOrder,
  onStartOrder,
  canAccept = false,
  isLoading = false,
  emptyMessage = 'Nenhuma OS encontrada'
}: OSListMobileProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (ordens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4">
      {ordens.map((ordem) => {
        const cliente = clientes.find(c => c.id === ordem.cliente_id)
        const zona = zonas.find(z => z.id === cliente?.zona_id)
        const tecnico = colaboradores.find(t => t.id === ordem.tecnico_id)
        const status = statusConfig[ordem.status] || statusConfig.novo
        const prioridade = prioridadeConfig[ordem.prioridade || 'media']
        const tipo = tipoConfig[ordem.tipo || 'corretiva']
        const StatusIcon = status.icon

        const canStart = ordem.status === 'novo' && !ordem.tecnico_id && canAccept
        const isInProgress = ['em_deslocamento', 'checkin', 'em_andamento'].includes(ordem.status)

        return (
          <Card 
            key={ordem.id} 
            className={`overflow-hidden transition-all active:scale-[0.98] ${
              isInProgress ? 'border-l-4 border-l-primary shadow-md' : ''
            }`}
          >
            <CardContent className="p-0">
              {/* Header com número e status */}
              <div className={`px-4 py-3 flex items-center justify-between ${status.bgColor} border-b`}>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">
                    {ordem.numero_os || `#${ordem.id.slice(0, 6)}`}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${tipo.color}`} title={tipo.label}></div>
                </div>
                <Badge variant="outline" className={`${status.color} ${status.bgColor} border-0 text-xs font-medium`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              </div>

              {/* Conteúdo principal */}
              <div className="px-4 py-3 space-y-2">
                {/* Cliente */}
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium line-clamp-1 block">
                      {cliente?.nome_local || 'Cliente não encontrado'}
                    </span>
                    {zona && (
                      <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {zona.nome}
                      </span>
                    )}
                  </div>
                </div>

                {/* Técnico */}
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600">
                    {tecnico?.nome || (canStart ? 'Disponível para aceitar' : 'Não atribuído')}
                  </span>
                </div>

                {/* Data e Prioridade */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(ordem.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className={prioridade.color}>{prioridade.label}</span>
                </div>

                {/* Tipo de OS */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full text-white ${tipo.color}`}>
                    {tipo.label}
                  </span>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="px-4 py-3 bg-gray-50 border-t flex gap-2">
                {canStart && onAcceptOrder ? (
                  <Button 
                    onClick={(e) => { e.stopPropagation(); onAcceptOrder(ordem); }}
                    className="flex-1 h-11"
                    size="lg"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Aceitar OS
                  </Button>
                ) : isInProgress && onStartOrder ? (
                  <Button 
                    onClick={(e) => { e.stopPropagation(); onStartOrder(ordem); }}
                    className="flex-1 h-11"
                    size="lg"
                  >
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Continuar
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); onViewOrder(ordem); }}
                    className="flex-1 h-11"
                    size="lg"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
