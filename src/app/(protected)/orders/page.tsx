'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Clock, CheckCircle, AlertCircle, ArrowUp, ArrowRight, ArrowDown, PauseCircle } from 'lucide-react'
import { useEmpresas, useClientes, useOrdensServico, useColaboradores } from '@/hooks/use-supabase'

const statusConfig = {
  parado: {
    label: 'Parado',
    variant: 'destructive' as const,
    icon: PauseCircle,
    className: 'bg-red-600 text-white hover:bg-red-700'
  },
  novo: {
    label: 'Nova',
    variant: 'default' as const,
    icon: AlertCircle,
    className: 'bg-blue-500 text-white hover:bg-blue-600'
  },
  em_andamento: { 
    label: 'Em Andamento', 
    variant: 'secondary' as const, 
    icon: Clock,
    className: 'bg-yellow-500 text-white hover:bg-yellow-600'
  },
  aguardando_assinatura: {
    label: 'Aguardando Assinatura',
    variant: 'secondary' as const,
    icon: Clock,
    className: 'bg-orange-500 text-white hover:bg-orange-600'
  },
  concluido: { 
    label: 'Concluída', 
    variant: 'secondary' as const, 
    icon: CheckCircle,
    className: 'bg-green-500 text-white hover:bg-green-600'
  },
  cancelado: { 
    label: 'Cancelada', 
    variant: 'outline' as const, 
    icon: AlertCircle,
    className: 'bg-red-500 text-white hover:bg-red-600'
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function OrdersPage() {
  const [ordenacao, setOrdenacao] = useState('prioridade') // prioridade, data, status
  const { empresas, loading: empresasLoading, error: empresasError } = useEmpresas()
  const empresaId = empresas[0]?.id
  const { clientes, loading: clientesLoading, error: clientesError } = useClientes(empresaId)
  const { colaboradores, loading: colLoading, error: colError } = useColaboradores(empresaId)
  const { ordens, loading, error } = useOrdensServico(empresaId)

  const isLoading = empresasLoading || clientesLoading || colLoading || loading
  const hasError = empresasError || clientesError || colError || error

  // Ordenar ordens
  const ordensOrdenadas = useMemo(() => {
    // Função auxiliar para calcular peso da prioridade
    const getPrioridadePeso = (ordem: typeof ordens[0]) => {
      // OS paradas têm prioridade máxima
      if (ordem.status === 'parado') return 0
      
      // Depois vem a prioridade da OS
      if (ordem.prioridade === 'alta') return 1
      if (ordem.prioridade === 'media') return 2
      return 3 // baixa
    }

    // Aplicar ordenação
    return [...ordens].sort((a, b) => {
      if (ordenacao === 'prioridade') {
        const pesoA = getPrioridadePeso(a)
        const pesoB = getPrioridadePeso(b)
        
        if (pesoA !== pesoB) return pesoA - pesoB
        
        // Se tiverem o mesmo peso, ordenar por data (mais recente primeiro)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      
      if (ordenacao === 'data') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      
      if (ordenacao === 'status') {
        // Parado > Novo > Em andamento > Aguardando > Concluído > Cancelado
        const statusOrdem = ['parado', 'novo', 'em_andamento', 'aguardando_assinatura', 'concluido', 'cancelado']
        return statusOrdem.indexOf(a.status) - statusOrdem.indexOf(b.status)
      }
      
      return 0
    })
  }, [ordens, ordenacao])

  const total = useMemo(() => ordensOrdenadas.length, [ordensOrdenadas.length])

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full py-4 ">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
          <p className="text-muted-foreground">Crie, acompanhe e finalize ordens</p>
        </div>  
        <Button disabled>Nova Ordem</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Ordens</CardTitle>
              <CardDescription>{total} registros</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Ordenar por:</span>
              <Select value={ordenacao} onValueChange={setOrdenacao}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prioridade">Prioridade</SelectItem>
                  <SelectItem value="data">Data (Recente)</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              Carregando...
            </div>
          ) : hasError ? (
            <div className="text-destructive">{hasError}</div>
          ) : ordens.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">Nenhuma ordem encontrada</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número OS</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordensOrdenadas.map((ordem) => {
                  const status = statusConfig[ordem.status as keyof typeof statusConfig] || statusConfig.novo
                  const cliente = clientes.find(c => c.id === ordem.cliente_id)
                  const tecnico = colaboradores.find(t => t.id === ordem.tecnico_id)
                  return (
                    <TableRow key={ordem.id}>
                      <TableCell className="font-medium">{ordem.numero_os || ordem.id.slice(0, 8)}</TableCell>
                      <TableCell>{cliente?.nome_local || 'Cliente não encontrado'}</TableCell>
                      <TableCell>{tecnico?.nome || 'Não atribuído'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {ordem.tipo === 'preventiva' ? 'Preventiva' : ordem.tipo === 'corretiva' ? 'Corretiva' : ordem.tipo === 'emergencial' ? 'Emergencial' : ordem.tipo === 'chamado' ? 'Chamado' : ordem.tipo}
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex align-middle items-center justify-center cursor-help">
                                {ordem.prioridade === 'alta' ? (
                                  <ArrowUp className="h-4 w-4 text-red-500" />
                                ) : ordem.prioridade === 'media' ? (
                                  <ArrowRight className="h-4 w-4 text-yellow-500" />
                                ) : (
                                  <ArrowDown className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{ordem.prioridade === 'alta' ? 'Alta' : ordem.prioridade === 'media' ? 'Média' : 'Baixa'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {status.label}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(ordem.created_at)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

