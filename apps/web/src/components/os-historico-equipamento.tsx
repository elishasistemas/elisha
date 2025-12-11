'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'
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
  const [expanded, setExpanded] = useState(true)

  const supabase = createSupabaseBrowser()

  useEffect(() => {
    const fetchHistorico = async () => {
      if (!equipamentoId) {
        setLoading(false)
        return
      }

      try {
        // Buscar OSs concluídas deste equipamento
        const { data, error } = await supabase
          .from('ordens_servico')
          .select(`
            id,
            numero_os,
            tipo,
            data_fim,
            tecnico:colaboradores!tecnico_id(nome),
            laudo:os_laudos(
              o_que_foi_feito,
              observacao
            )
          `)
          .eq('equipamento_id', equipamentoId)
          .eq('status', 'concluido')
          .order('data_fim', { ascending: false })
          .limit(10)

        if (error) throw error

        const historicoFormatado: HistoricoItem[] = (data || []).map((os: any) => ({
          id: os.id,
          data: os.data_fim ? new Date(os.data_fim).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : '',
          tecnico: (os.tecnico as any)?.nome || 'N/A',
          titulo: getTipoLabel(os.tipo),
          descricao: (os.laudo as any)?.[0]?.o_que_foi_feito || (os.laudo as any)?.[0]?.observacao || 'Sem descrição'
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
      emergencial: 'Atendimento emergencial'
    }
    return labels[tipo] || tipo
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Carregando histórico...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5" />
            <div>
              <CardTitle>Histórico do Equipamento</CardTitle>
              <p className="text-sm text-muted-foreground">
                Todas as interações anteriores com este equipamento
              </p>
            </div>
          </div>
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </CardHeader>
      {expanded && (
      <CardContent>
        {historico.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum histórico disponível para este equipamento
          </p>
        ) : (
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
        )}
      </CardContent>
      )}
    </Card>
  )
}
