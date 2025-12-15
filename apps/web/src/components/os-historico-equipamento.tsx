'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'

interface OSHistoricoEquipamentoProps {
  equipamentoId?: string
}

interface HistoricoItem {
  id: string
  data: string
  tecnico: string
  titulo: string
  descricao: string
}

export function OSHistoricoEquipamento({ equipamentoId }: OSHistoricoEquipamentoProps) {
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createSupabaseBrowser()

  useEffect(() => {
    const fetchHistorico = async () => {
      if (!equipamentoId) {
        setLoading(false)
        return
      }

      try {
        // Buscar OSs concluídas deste equipamento via API
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token
        if (!token) {
          setLoading(false)
          return
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/equipamentos/${equipamentoId}/historico?limit=10`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        )

        if (!response.ok) throw new Error('Erro ao buscar histórico')

        const data = await response.json()

        const historicoFormatado: HistoricoItem[] = (data || []).map((os: any) => ({
          id: os.id,
          data: os.data_fim ? new Date(os.data_fim).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : '',
          tecnico: os.tecnico_nome || 'N/A',
          titulo: getTipoLabel(os.tipo),
          descricao: os.o_que_foi_feito || os.observacao || os.observacoes_os || 'Sem descrição'
        }))

        setHistorico(historicoFormatado)
      } catch (error) {
        console.error('[historico-equipamento] Erro ao carregar histórico:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistorico()
  }, [equipamentoId, supabase])

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      preventiva: 'Manutenção preventiva realizada',
      corretiva: 'Correção realizada',
      chamado: 'Atendimento de chamado',
      emergencial: 'Atendimento emergencial',
      corretiva_programada: 'Corretiva Programada'
    }
    return labels[tipo] || tipo
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Carregando histórico...
      </div>
    )
  }

  if (historico.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Nenhum histórico disponível para este equipamento
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {historico.map((item) => (
        <div key={item.id} className="space-y-1">
          <p className="text-sm font-medium">{item.data}</p>
          <p className="text-xs text-muted-foreground">Técnico: {item.tecnico}</p>
          <p className="font-medium">{item.titulo}</p>
          <p className="text-sm text-muted-foreground">{item.descricao}</p>
        </div>
      ))}
    </div>
  )
}
