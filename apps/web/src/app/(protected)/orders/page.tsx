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
import { Clock, CheckCircle, AlertCircle, ArrowUp, ArrowRight, ArrowDown, PauseCircle, MoreHorizontal, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { useEmpresas, useClientes, useOrdensServico, useColaboradores, useEquipamentos, useAuth, useProfile } from '@/hooks/use-supabase'
import { createSupabaseBrowser } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { getActiveRole, isAdmin, isTecnico } from '@/utils/auth'
import { OrderDialog } from '@/components/order-dialog'
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
    label: 'Nova',
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
  const newParam = searchParams?.get('new')
  const [ordenacao, setOrdenacao] = useState('prioridade') // prioridade, data, status
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ordemToDelete, setOrdemToDelete] = useState<OrdemServico | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
  const [ordemToDecline, setOrdemToDecline] = useState<OrdemServico | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  
  const { user, session } = useAuth()
  const { profile } = useProfile(user?.id)
  
  // Determinar empresa ativa (impersonation ou empresa do perfil)
  const empresaId = profile?.impersonating_empresa_id || profile?.empresa_id || undefined
  
  const { empresas, loading: empresasLoading, error: empresasError } = useEmpresas()
  const active = getActiveRole(session, profile)
  const canAdmin = isAdmin(session, profile)
  const canTecnico = isTecnico(session, profile)
  const { clientes, loading: clientesLoading, error: clientesError } = useClientes(empresaId)
  const { colaboradores, loading: colLoading, error: colError } = useColaboradores(empresaId)
  const clienteId = clientes[0]?.id
  const { equipamentos, loading: equipLoading } = useEquipamentos(clienteId)
  const orderBy = ordenacao === 'data' ? 'created_at' : (ordenacao === 'status' ? 'status' : 'prioridade')
  const { ordens, loading, error, deleteOrdem, count } = useOrdensServico(empresaId, {
    page,
    pageSize,
    search,
    orderBy: orderBy as any,
    tecnicoId: canTecnico ? (profile?.tecnico_id ?? undefined) : undefined,
    refreshKey,
  })

  const isLoading = empresasLoading || clientesLoading || colLoading || loading || equipLoading
  const hasError = empresasError || clientesError || colError || error
  const [viewOrder, setViewOrder] = useState<OrdemServico | null>(null)

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
      toast.error(e instanceof Error ? e.message : 'Erro ao aceitar OS')
    }
  }

  const openDecline = (ordem: OrdemServico) => {
    setOrdemToDecline(ordem)
    setDeclineReason('')
    setDeclineDialogOpen(true)
  }

  const handleConfirmDecline = async () => {
    if (!ordemToDecline) return
    try {
      const { data, error } = await supabase.rpc('os_decline', { p_os_id: ordemToDecline.id, p_reason: declineReason || null })
      if (error) throw error
      const result = data as { success: boolean; error?: string; message?: string }
      if (!result?.success) {
        toast.error(result?.message || result?.error || 'Erro ao recusar OS')
        return
      }
      toast.success(result?.message || 'OS recusada com sucesso')
      setDeclineDialogOpen(false)
      setOrdemToDecline(null)
      setDeclineReason('')
      handleRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao recusar OS')
    }
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
    <div className="space-y-6 max-w-7xl mx-auto w-full py-4 ">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
          <p className="text-muted-foreground">Crie, acompanhe e finalize ordens</p>
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Lista de Ordens</CardTitle>
              <CardDescription>{total} {search ? 'resultado(s)' : 'registros'}</CardDescription>
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
              <Input
                placeholder="Buscar número, tipo, status"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-[280px]"
              />
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Por página" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / página</SelectItem>
                  <SelectItem value="20">20 / página</SelectItem>
                  <SelectItem value="50">50 / página</SelectItem>
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
                  <TableHead className="w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordens.map((ordem) => {
                  const status = statusConfig[ordem.status as keyof typeof statusConfig] || statusConfig.novo
                  const cliente = clientes.find(c => c.id === ordem.cliente_id)
                  const tecnico = colaboradores.find(t => t.id === ordem.tecnico_id)
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
                          {(canAdmin || canTecnico) && canAcceptOrDecline(ordem) && (
                            <>
                              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleAccept(ordem) }}>
                                Aceitar
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openDecline(ordem) }}>
                                Recusar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {canAdmin && (
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
                            )}
                            {canAdmin && (
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
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          {total > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <div>
                Mostrando {startIdx}-{endIdx} de {total}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Anterior
                </Button>
                <span>Página {page} de {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Próxima
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

      {/* Decline Dialog */}
      <AlertDialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recusar OS</AlertDialogTitle>
            <AlertDialogDescription>
              Informe um motivo (opcional) para a recusa da ordem <strong>{ordemToDecline?.numero_os || ordemToDecline?.id.slice(0, 8)}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2">
            <Input placeholder="Motivo (opcional)" value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeclineDialogOpen(false); setOrdemToDecline(null); setDeclineReason('') }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDecline} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirmar Recusa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
