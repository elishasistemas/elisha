'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { Building2, AlertTriangle, Plus, Clock, CheckCircle, AlertCircle, ArrowUp, ArrowRight, ArrowDown, PhoneIncoming, Calendar, PauseCircle } from 'lucide-react'
import { useAuth, useProfile, useEmpresas, useClientes, useOrdensServico, useColaboradores } from '@/hooks/use-supabase'
import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

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

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [periodoDias, setPeriodoDias] = useState('7')
  const [periodosChamados, setPeriodosChamados] = useState('7')
  const [ordenacao, setOrdenacao] = useState('prioridade') // prioridade, data, status
  
  // Buscar perfil primeiro para determinar empresa correta
  const { profile } = useProfile(user?.id)
  
  // Determinar empresa ativa (impersonation ou empresa do perfil)
  const empresaAtiva = profile?.impersonating_empresa_id || profile?.empresa_id || undefined
  
  const { empresas, loading: empresasLoading } = useEmpresas()
  const { clientes, loading: clientesLoading } = useClientes(empresaAtiva)
  const { ordens, loading: ordensLoading } = useOrdensServico(empresaAtiva)
  const { colaboradores, loading: colaboradoresLoading } = useColaboradores(empresaAtiva)
  
  // Detectar se é técnico
  const isTecnico = profile?.active_role === 'tecnico'
  const tecnicoId = profile?.tecnico_id

  // Calcular data inicial baseada no período selecionado
  const dataInicial = useMemo(() => {
    const hoje = new Date()
    const dias = parseInt(periodoDias)
    const data = new Date(hoje)
    data.setDate(hoje.getDate() - dias + 1)
    data.setHours(0, 0, 0, 0)
    return data
  }, [periodoDias])

  // Filtrar e ordenar ordens pelo período
  const ordensFiltradas = useMemo(() => {
    let filtradas = ordens.filter(ordem => {
      const dataOrdem = new Date(ordem.created_at)
      return dataOrdem >= dataInicial
    })
    
    // Se for técnico, filtrar apenas suas OS
    if (isTecnico && tecnicoId) {
      filtradas = filtradas.filter(ordem => ordem.tecnico_id === tecnicoId)
    }

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
    return [...filtradas].sort((a, b) => {
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
  }, [ordens, dataInicial, ordenacao])

  // Preparar dados para o gráfico (últimos 7 dias)
  const chartData = useMemo(() => {
    const dias = parseInt(periodoDias)
    const hoje = new Date()
    const data: Array<{
      date: string
      abertas: number
      concluidas: number
    }> = []

    for (let i = dias - 1; i >= 0; i--) {
      const dia = new Date(hoje)
      dia.setDate(hoje.getDate() - i)
      dia.setHours(0, 0, 0, 0)
      
      const diaStr = dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      
      const ordensNoDia = ordensFiltradas.filter(ordem => {
        const dataOrdem = new Date(ordem.created_at)
        dataOrdem.setHours(0, 0, 0, 0)
        return dataOrdem.getTime() === dia.getTime()
      })

      const abertas = ordensNoDia.filter(o => o.status === 'novo' || o.status === 'em_andamento').length
      const concluidas = ordensNoDia.filter(o => o.status === 'concluido').length

      data.push({
        date: diaStr,
        abertas,
        concluidas
      })
    }

    return data
  }, [ordensFiltradas, periodoDias])

  // Calcular data inicial para chamados
  const dataInicialChamados = useMemo(() => {
    const hoje = new Date()
    const dias = parseInt(periodosChamados)
    const data = new Date(hoje)
    data.setDate(hoje.getDate() - dias + 1)
    data.setHours(0, 0, 0, 0)
    return data
  }, [periodosChamados])

  // Filtrar chamados pelo período
  const chamadosFiltrados = useMemo(() => {
    return ordens.filter(ordem => {
      const dataOrdem = new Date(ordem.created_at)
      return ordem.tipo === 'chamado' && dataOrdem >= dataInicialChamados
    })
  }, [ordens, dataInicialChamados])

  // Preparar dados para o gráfico de chamados
  const chartDataChamados = useMemo(() => {
    const dias = parseInt(periodosChamados)
    const hoje = new Date()
    const data: Array<{
      date: string
      abertos: number
      fechados: number
    }> = []

    for (let i = dias - 1; i >= 0; i--) {
      const dia = new Date(hoje)
      dia.setDate(hoje.getDate() - i)
      dia.setHours(0, 0, 0, 0)
      
      const diaStr = dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      
      const chamadosNoDia = chamadosFiltrados.filter(ordem => {
        const dataOrdem = new Date(ordem.created_at)
        dataOrdem.setHours(0, 0, 0, 0)
        return dataOrdem.getTime() === dia.getTime()
      })

      const abertos = chamadosNoDia.filter(o => 
        o.status === 'novo' || o.status === 'em_andamento' || o.status === 'parado'
      ).length
      const fechados = chamadosNoDia.filter(o => 
        o.status === 'concluido' || o.status === 'cancelado'
      ).length

      data.push({
        date: diaStr,
        abertos,
        fechados
      })
    }

    return data
  }, [chamadosFiltrados, periodosChamados])

  // Estatísticas dos indicadores
  const stats = useMemo(() => {
    // Indicador 1: Chamados Abertos vs Fechados
    const chamadosAbertos = chamadosFiltrados.filter(o => 
      o.status === 'novo' || o.status === 'em_andamento' || o.status === 'parado'
    ).length
    const chamadosFechados = chamadosFiltrados.filter(o => 
      o.status === 'concluido' || o.status === 'cancelado'
    ).length

    // Indicador 2: Preventivas Programadas do Dia
    const hoje = new Date().toISOString().split('T')[0]
    let preventivasHoje = ordens.filter(o => 
      o.tipo === 'preventiva' && o.data_programada === hoje
    )
    
    // Se for técnico, filtrar apenas suas OS
    if (isTecnico && tecnicoId) {
      preventivasHoje = preventivasHoje.filter(o => o.tecnico_id === tecnicoId)
    }
    const preventivasProgramadas = preventivasHoje.length
    const preventivasConcluidas = preventivasHoje.filter(o => o.status === 'concluido').length
    const percentualConcluidas = preventivasProgramadas > 0 
      ? Math.round((preventivasConcluidas / preventivasProgramadas) * 100) 
      : 0

    // Indicador 3: Elevadores Parados (Acumulativo)
    const elevadoresParados = ordens.filter(o => o.status === 'parado').length

    return {
      chamadosAbertos,
      chamadosFechados,
      preventivasProgramadas,
      preventivasConcluidas,
      percentualConcluidas,
      elevadoresParados
    }
  }, [chamadosFiltrados, ordens])

  const isLoading = empresasLoading || ordensLoading || clientesLoading || colaboradoresLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const chartConfig = {
    abertas: {
      label: "OS Abertas",
      color: "#10b981", // emerald-500
    },
    concluidas: {
      label: "OS Concluídas",
      color: "#34d399", // emerald-400
    },
  }

  const chartConfigChamados = {
    abertos: {
      label: "Chamados Abertos",
      color: "#34d399", // emerald-400
    },
    fechados: {
      label: "Chamados Fechados",
      color:"oklch(0.60 0.13 163)", // emerald-600
    },
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full py-4">
      {/* Header com Filtro Inline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className='flex items-center gap-2'>
          <h2 className='text-2xl font-medium'>Bem vindo de volta</h2>
        </div>
        <Button onClick={() => router.push('/orders?new=true')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Chamado
        </Button>
      </div>

      {/* Cards de Indicadores */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {/* Card 1: Chamados Abertos vs Fechados */}
        <Card className="shadow-none gap-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                  <PhoneIncoming className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-base font-semibold">Chamados</CardTitle>
              </div>
              <Select value={periodosChamados} onValueChange={setPeriodosChamados}>
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="15">15 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total no período</p>
              <div className="text-3xl font-medium">{stats.chamadosAbertos + stats.chamadosFechados}</div>
            </div>
            <ChartContainer config={chartConfigChamados} className="h-[120px] w-full">
              <BarChart data={chartDataChamados} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => value}
                />
                <Bar
                  dataKey="abertos"
                  fill="var(--color-abertos)"
                  radius={[0, 0, 4, 4]}
                  stackId="a"
                />
                <Bar
                  dataKey="fechados"
                  fill="var(--color-fechados)"
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return `Data: ${value}`
                      }}
                    />
                  }
                  cursor={false}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Card 2: Preventivas Programadas do Dia */}
        <Card className="shadow-none gap-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardTitle className="text-base font-semibold">Preventivas Hoje</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 justify-between flex-col h-full flex">
            <div>
              <p className="text-xs text-muted-foreground">Programadas</p>
              <div className="text-3xl font-medium">{stats.preventivasProgramadas}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Concluídas</span>
                <span className="font-medium">{stats.preventivasConcluidas}/{stats.preventivasProgramadas}</span>
              </div>
              <Progress value={stats.percentualConcluidas} className="h-2 [&>[data-slot=progress-indicator]]:bg-emerald-500" />
              <p className="text-xs text-muted-foreground text-right">
                {stats.percentualConcluidas}% concluído
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Elevadores Parados (Acumulativo) */}
        <Card className="shadow-none gap-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold">Elevadores Parados</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 justify-between flex-col h-full flex">
            <div>
              <p className="text-xs text-muted-foreground">Total de equipamentos parados</p>
              <div className="text-3xl font-medium">{stats.elevadoresParados}</div>
            </div>
            <div className="space-y-2 pt-2">
              {stats.elevadoresParados > 0 ? (
                <>
                  <Badge className="text-xs">
                    Atenção Necessária
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {stats.elevadoresParados} {stats.elevadoresParados === 1 ? 'elevador parado' : 'elevadores parados'} aguardando atendimento
                  </p>
                </>
              ) : (
                <>
                  <Badge variant="secondary" className="text-xs">
                    Todos Operacionais
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Nenhum equipamento parado
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Ordens de Serviço Recentes */}
      <Card className="shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ordens de Serviço Recentes</CardTitle>
              <CardDescription>
                Lista das últimas ordens de serviço criadas no período selecionado
              </CardDescription>
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
          {ordensFiltradas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma ordem de serviço encontrada no período selecionado
            </div>
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
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordensFiltradas.slice(0, 10).map((ordem) => {
                  const status = statusConfig[ordem.status as keyof typeof statusConfig] || statusConfig.novo
                  const cliente = clientes.find(c => c.id === ordem.cliente_id)
                  const tecnico = colaboradores.find(t => t.id === ordem.tecnico_id)
                  
                  return (
                    <TableRow key={ordem.id}>
                      <TableCell className="font-medium">
                        {ordem.numero_os || ordem.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>{cliente?.nome_local || 'Cliente não encontrado'}</TableCell>
                      <TableCell>{tecnico?.nome || 'Não atribuído'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {ordem.tipo === 'preventiva' ? 'Preventiva' : 
                         ordem.tipo === 'corretiva' ? 'Corretiva' : 
                         ordem.tipo === 'emergencial' ? 'Emergencial' : 
                         ordem.tipo === 'chamado' ? 'Chamado' : ordem.tipo}
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
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                          Ver Detalhes
                        </Button>
                      </TableCell>
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
