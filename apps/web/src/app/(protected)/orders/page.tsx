'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Clock, CheckCircle, AlertCircle, ArrowUp, ArrowRight, ArrowDown, PauseCircle, MoreHorizontal, Pencil, Trash2, RefreshCw, FileSignature, Check } from 'lucide-react'
import { useEmpresas, useClientes, useOrdensServico, useColaboradores, useEquipamentos, useAuth, useProfile } from '@/hooks/use-supabase'
import { createSupabaseBrowser } from '@/lib/supabase'
import { useSearchParams, useRouter } from 'next/navigation'
import { getActiveRole, isAdmin, isTecnico } from '@/utils/auth'
import { OrderDialog } from '@/components/order-dialog'
import { SignatureDialog } from '@/components/signature-dialog'
import { toast } from 'sonner'
import type { OrdemServico } from '@/lib/supabase'

const statusConfig = {
  parado: {
    label: 'Parado',
    variant: 'destructive' as const,
    icon: PauseCircle,
    className: 'bg-red-600 text-white hover:bg-red-700'
  },
  novo: {
    label: 'Aberta',
    variant: 'default' as const,
    icon: AlertCircle,
    className: 'bg-blue-500 text-white hover:bg-blue-600'
  },
  em_deslocamento: {
    label: 'Em Deslocamento',
    variant: 'secondary' as const,
    icon: Clock,
    className: 'bg-purple-500 text-white hover:bg-purple-600'
  },
  checkin: {
    label: 'No Local',
    variant: 'secondary' as const,
    icon: CheckCircle,
    className: 'bg-indigo-500 text-white hover:bg-indigo-600'
  },
  em_andamento: {
    label: 'Em Andamento',
    variant: 'secondary' as const,
    icon: Clock,
    className: 'bg-yellow-500 text-white hover:bg-yellow-600'
  },
  checkout: {
    label: 'Finalizado',
    variant: 'secondary' as const,
    icon: CheckCircle,
    className: 'bg-teal-500 text-white hover:bg-teal-600'
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
  },
  reaberta: {
    label: 'Reaberta',
    variant: 'secondary' as const,
    icon: RefreshCw,
    className: 'bg-amber-500 text-white hover:bg-amber-600'
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
  const searchParams = useSearchParams()
  const router = useRouter()
  const newParam = searchParams?.get('new')
  const [ordenacao, setOrdenacao] = useState('prioridade') // prioridade, data, status
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ordemToDelete, setOrdemToDelete] = useState<OrdemServico | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filtroTecnico, setFiltroTecnico] = useState<'todas' | 'sem_tecnico' | 'minhas'>('todas')

  const { user, session } = useAuth()
  const { profile } = useProfile(user?.id)

  // Determinar empresa ativa (impersonation ou empresa do perfil)
  const empresaId = profile?.impersonating_empresa_id || profile?.empresa_id || undefined

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [search])
  const { empresas, loading: empresasLoading, error: empresasError } = useEmpresas()
  const active = getActiveRole(session, profile)
  const canAdmin = isAdmin(session, profile)
  const canTecnico = isTecnico(session, profile)
  const { clientes, loading: clientesLoading, error: clientesError } = useClientes(empresaId)
  const { colaboradores, loading: colLoading, error: colError } = useColaboradores(empresaId)
  const clienteId = clientes[0]?.id
  const { equipamentos, loading: equipLoading } = useEquipamentos(clienteId)
  const orderBy = ordenacao === 'data' ? 'created_at' : (ordenacao === 'status' ? 'status' : 'prioridade')

  // REGRA: Todos os técnicos da empresa veem TODAS as OSs
  // Após aceitar, a OS fica exclusiva do técnico que aceitou
  // Outros técnicos veem apenas o status (não podem editar/aceitar OSs atribuídas)
  const { ordens, loading, error, deleteOrdem, count } = useOrdensServico(empresaId, {
    page,
    pageSize,
    search: debouncedSearch,
    orderBy: orderBy as any,
    // NÃO filtra por tecnicoId - todos veem todas as OSs
    refreshKey,
  })

  const isLoading = empresasLoading || clientesLoading || colLoading || loading || equipLoading
  const hasError = empresasError || clientesError || colError || error

  // Filtrar ordens com base no filtro de técnico
  const ordensFiltradas = ordens.filter((ordem) => {
    if (filtroTecnico === 'sem_tecnico') {
      return !ordem.tecnico_id
    }
    if (filtroTecnico === 'minhas' && canTecnico) {
      return ordem.tecnico_id === profile?.tecnico_id
    }
    return true // 'todas'
  })

  // OS abertas para aceitar/recusar (apenas chamados sem técnico)
  const ordensAbertas = ordens.filter(o =>
    o.tipo === 'chamado' &&
    (o.status === 'novo' || o.status === 'parado') &&
    !o.tecnico_id
  )

  const [viewOrder, setViewOrder] = useState<OrdemServico | null>(null)
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false)
  const [ordemToFinalize, setOrdemToFinalize] = useState<OrdemServico | null>(null)

  const [openCreate, setOpenCreate] = useState(false)
  // Abre automaticamente o diálogo de criação quando new=true
  useEffect(() => {
    if (newParam === 'true' && empresaId && clientes.length > 0 && canAdmin) {
      setOpenCreate(true)
    }
  }, [newParam, empresaId, clientes.length, canAdmin])

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const supabase = createSupabaseBrowser()

  const canAcceptOrDecline = (ordem: OrdemServico) => {
    const statusOk = ordem.status === 'novo' || ordem.status === 'parado'
    if (!statusOk) return false
    if (canAdmin) return true
    if (canTecnico) {
      // técnico pode aceitar se não tem técnico atribuído ou se é o próprio
      return !ordem.tecnico_id || ordem.tecnico_id === (profile?.tecnico_id || '')
    }
    return false
  }

  const handleAccept = async (ordem: OrdemServico) => {
    try {
      const { data, error } = await supabase.rpc('os_accept', { p_os_id: ordem.id })
      if (error) throw error
      const result = data as { success: boolean; error?: string; message?: string }
      if (!result?.success) {
        toast.error(result?.message || result?.error || 'Erro ao aceitar OS')
        return
      }
      toast.success(result?.message || 'OS aceita com sucesso')
      handleRefresh()
    } catch (e) {
      console.error('[handleAccept] Erro:', e)
      toast.error(e instanceof Error ? e.message : 'Erro ao aceitar OS')
    }
  }

  const handleFinalizeWithSignature = async (signatureDataUrl: string, clientName: string, clientEmail?: string) => {
    if (!ordemToFinalize) return

    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) {
        throw new Error('Usuário não autenticado')
      }

      // Finalizar OS via backend
      const response = await fetch(`${BACKEND_URL}/api/v1/ordens-servico/${ordemToFinalize.id}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assinatura_cliente: signatureDataUrl,
          nome_cliente_assinatura: clientName,
          email_cliente_assinatura: clientEmail || null,
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao finalizar OS')
      }

      // Se tiver email, enviar por email (implementar endpoint depois)
      if (clientEmail) {
        try {
          await fetch(`${BACKEND_URL}/api/v1/ordens-servico/${ordemToFinalize.id}/send-completed`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email: clientEmail })
          })
        } catch (emailError) {
          console.error('Erro ao enviar email:', emailError)
          // Não bloqueia a finalização se falhar o envio do email
        }
      }

      toast.success('OS finalizada com sucesso!')
      setSignatureDialogOpen(false)
      setOrdemToFinalize(null)
      handleRefresh()
    } catch (error) {
      console.error('Erro ao finalizar OS:', error)
      throw error
    }
  }

  const openFinalizeDialog = (ordem: OrdemServico) => {
    setOrdemToFinalize(ordem)
    setSignatureDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!ordemToDelete) return

    try {
      const result = await deleteOrdem(ordemToDelete.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Ordem de serviço excluída com sucesso!')
        handleRefresh()
      }
    } catch (error) {
      toast.error('Erro ao excluir ordem')
    } finally {
      setDeleteDialogOpen(false)
      setOrdemToDelete(null)
    }
  }

  const total = count || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const startIdx = total > 0 ? (page - 1) * pageSize + 1 : 0
  const endIdx = Math.min(page * pageSize, total)

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto w-full py-2 md:py-4 px-2 md:px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Ordens de Serviço</h1>
          <p className="text-sm md:text-base text-muted-foreground">Crie, acompanhe e finalize ordens</p>
        </div>
        {empresaId && clientes.length > 0 && canAdmin && (
          <OrderDialog
            empresaId={empresaId}
            clientes={clientes}
            colaboradores={colaboradores}
            defaultOpen={openCreate}
            defaultTipo={'chamado'}
            onSuccess={() => { handleRefresh(); setOpenCreate(false) }}
          />
        )}
      </div>

      {/* Seção de Chamados (OS Abertas para aceitar/recusar) */}
      {ordensAbertas.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Chamados</CardTitle>
                <CardDescription>Ordens disponíveis para aceitar ou recusar</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-2 md:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordensAbertas.slice(0, 10).map((ordem) => {
                    const cliente = clientes.find(c => c.id === ordem.cliente_id)
                    const status = statusConfig[ordem.status as keyof typeof statusConfig] || statusConfig.novo
                    return (
                      <TableRow key={ordem.id}>
                        <TableCell className="font-medium">
                          {ordem.numero_os || `#${ordem.id.slice(0, 8)}`}
                        </TableCell>
                        <TableCell>{cliente?.nome_local || 'Cliente'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">-</TableCell>
                        <TableCell className="capitalize">{ordem.tipo}</TableCell>
                        <TableCell>
                          {ordem.prioridade === 'alta' && <Badge variant="destructive" className="gap-1 capitalize"><ArrowUp className="h-3 w-3" />{ordem.prioridade}</Badge>}
                          {ordem.prioridade === 'media' && <Badge variant="secondary" className="gap-1 capitalize"><ArrowRight className="h-3 w-3" />{ordem.prioridade}</Badge>}
                          {ordem.prioridade === 'baixa' && <Badge variant="outline" className="gap-1 capitalize"><ArrowDown className="h-3 w-3" />{ordem.prioridade}</Badge>}
                        </TableCell>
                        <TableCell>
                          <Badge className={status.className}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(ordem.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleAccept(ordem); }}
                            disabled={!canAcceptOrDecline(ordem)}
                            variant="default"
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            <Check className="h-4 w-4 mr-1" /> Aceitar
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <CardTitle>Lista de Ordens</CardTitle>
              <CardDescription className="text-sm">
                {ordensFiltradas.length} {search ? 'resultado(s)' : 'registros'}
                {filtroTecnico === 'sem_tecnico' && ' sem técnico'}
                {filtroTecnico === 'minhas' && ' atribuídas a você'}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline">Filtrar:</span>
                <Select value={filtroTecnico} onValueChange={(v: 'todas' | 'sem_tecnico' | 'minhas') => setFiltroTecnico(v)}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas OSs</SelectItem>
                    <SelectItem value="sem_tecnico">Sem Técnico</SelectItem>
                    {canTecnico && <SelectItem value="minhas">Minhas OSs</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline">Ordenar:</span>
                <Select value={ordenacao} onValueChange={setOrdenacao}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prioridade">Prioridade</SelectItem>
                    <SelectItem value="data">Data</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Buscar OS..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="flex-1 sm:w-[200px] md:w-[280px]"
              />
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
                <SelectTrigger className="w-full sm:w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10/pág</SelectItem>
                  <SelectItem value="20">20/pág</SelectItem>
                  <SelectItem value="50">50/pág</SelectItem>
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
          ) : ordensFiltradas.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {filtroTecnico === 'sem_tecnico' ? 'Nenhuma OS sem técnico atribuído' :
                filtroTecnico === 'minhas' ? 'Você não tem OSs atribuídas' :
                  'Nenhuma ordem encontrada'}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 md:mx-0">
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
                    <TableHead className="w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordensFiltradas.map((ordem) => {
                    const status = statusConfig[ordem.status as keyof typeof statusConfig] || statusConfig.novo
                    const cliente = clientes.find(c => c.id === ordem.cliente_id)
                    const tecnico = colaboradores.find(t => t.id === ordem.tecnico_id)

                    // Debug: Verificar inconsistências
                    if (ordem.status === 'em_andamento' && !ordem.tecnico_id) {
                      console.warn('[OrdersPage] OS com status em_andamento mas sem técnico:', {
                        id: ordem.id,
                        numero_os: ordem.numero_os,
                        status: ordem.status,
                        tecnico_id: ordem.tecnico_id
                      })
                    }

                    return (
                      <TableRow key={ordem.id} className="cursor-pointer" onClick={() => setViewOrder(ordem)}>
                        <TableCell className="font-medium">
                          {ordem.numero_os ? (
                            ordem.numero_os
                          ) : (
                            <span className="text-muted-foreground text-xs font-mono">{ordem.id.slice(0, 8)}</span>
                          )}
                        </TableCell>
                        <TableCell>{cliente?.nome_local || 'Cliente não encontrado'}</TableCell>
                        <TableCell>{tecnico?.nome || 'Não atribuído'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {ordem.tipo === 'preventiva' ? 'Preventiva' : ordem.tipo === 'corretiva' ? 'Corretiva' : ordem.tipo === 'emergencial' ? 'Emergencial' : ordem.tipo === 'chamado' ? 'Chamado' : ordem.tipo}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
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
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => setViewOrder(ordem)}>
                                Ver Detalhes
                              </DropdownMenuItem>
                              {(() => {
                                return null
                              })()}
                              {(canAdmin || canTecnico) && canAcceptOrDecline(ordem) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleAccept(ordem) }}>
                                    Aceitar
                                  </DropdownMenuItem>
                                </>
                              )}
                              {/* Opção de finalizar para técnicos com OS não finalizada */}
                              {canTecnico && ordem.tecnico_id === profile?.tecnico_id && !['concluido', 'cancelado'].includes(ordem.status) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); router.push(`/os/${ordem.id}/full`) }}>
                                    <FileSignature className="mr-2 h-4 w-4" />
                                    {ordem.status === 'novo' ? 'Aceitar e Iniciar' : ordem.status === 'em_deslocamento' ? 'Iniciar Atendimento' : 'Continuar Atendimento'}
                                  </DropdownMenuItem>
                                </>
                              )}
                              {canAdmin && (
                                <>
                                  <DropdownMenuSeparator />
                                  <OrderDialog
                                    empresaId={empresaId!}
                                    ordem={ordem}
                                    clientes={clientes}
                                    equipamentos={equipamentos}
                                    colaboradores={colaboradores}
                                    mode="edit"
                                    onSuccess={handleRefresh}
                                    trigger={
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Editar
                                      </DropdownMenuItem>
                                    }
                                  />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onSelect={() => {
                                      setOrdemToDelete(ordem)
                                      setDeleteDialogOpen(true)
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-sm text-muted-foreground">
              <div className="text-center sm:text-left">
                {startIdx}-{endIdx} de {total}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <span className="hidden sm:inline">Anterior</span>
                  <span className="sm:hidden">←</span>
                </Button>
                <span className="whitespace-nowrap text-xs sm:text-sm">Pág {page}/{totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  <span className="hidden sm:inline">Próxima</span>
                  <span className="sm:hidden">→</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {viewOrder && empresaId && (
        <OrderDialog
          key={viewOrder.id}
          empresaId={empresaId}
          ordem={viewOrder}
          clientes={clientes}
          colaboradores={colaboradores}
          mode="view"
          canEdit={canAdmin}
          hideTrigger
          defaultOpen
          onOpenChange={(o) => { if (!o) setViewOrder(null) }}
          onSuccess={() => { setViewOrder(null); handleRefresh() }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a ordem de serviço <strong>{ordemToDelete?.numero_os || ordemToDelete?.id.slice(0, 8)}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Assinatura para Finalização */}
      <SignatureDialog
        open={signatureDialogOpen}
        onOpenChange={setSignatureDialogOpen}
        onSubmit={handleFinalizeWithSignature}
        requireEmail
      />
    </div>
  )
}
