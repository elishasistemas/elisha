'use client'

import { useMemo, useState, useEffect } from 'react'
import { useAdminRoute } from '@/utils/route-protection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { useEmpresas, useColaboradores, useAuth, useProfile } from '@/hooks/use-supabase'
import { isAdmin } from '@/utils/auth'
import { TechnicianDialog } from '@/components/technician-dialog'
import { MoreHorizontal, Pencil, Trash2, UserCheck, UserX } from 'lucide-react'
import { toast } from 'sonner'
import type { Colaborador } from '@/lib/supabase'

// Função para formatar telefone com máscara
const formatPhoneDisplay = (phone: string | null | undefined) => {
  if (!phone) return '-'
  const numbers = phone.replace(/\D/g, '')
  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)})${numbers.slice(2, 7)}-${numbers.slice(7)}`
  }
  return phone
}

export default function TechniciansPage() {
  useAdminRoute() // Protege a rota - redireciona técnicos e supervisores
  
  const { user, session } = useAuth()
  const { profile } = useProfile(user?.id)
  
  // Determinar empresa ativa (impersonation ou empresa do perfil)
  const empresaId = profile?.impersonating_empresa_id || profile?.empresa_id || undefined
  
  // Estados (declarar antes de usar)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [colaboradorToDelete, setColaboradorToDelete] = useState<Colaborador | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'inativos'>('ativos')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [viewTec, setViewTec] = useState<Colaborador | null>(null)
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [search])
  
  // Hooks que dependem dos estados
  const { empresas, loading: empresasLoading, error: empresasError } = useEmpresas()
  const { colaboradores, loading, error, toggleAtivoColaborador, deleteColaborador } = useColaboradores(empresaId, { search: debouncedSearch, refreshKey })
  const canAdmin = isAdmin(session, profile)

  const isLoading = empresasLoading || loading
  const hasError = empresasError || error

  const filtered = useMemo(() => {
    let list = colaboradores
    
    // Filtrar por status apenas (busca já vem filtrada do backend)
    if (statusFilter === 'ativos') {
      list = list.filter(c => c.ativo)
    } else if (statusFilter === 'inativos') {
      list = list.filter(c => !c.ativo)
    }
    
    return list
  }, [colaboradores, statusFilter])

  const total = useMemo(() => filtered.filter(c => c.ativo).length, [filtered])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  const pageRows = filtered.slice(start, end)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleToggleAtivo = async (colaborador: Colaborador) => {
    try {
      // Se estiver desativando, mostrar confirmação
      if (colaborador.ativo) {
        const confirmacao = window.confirm(
          `Tem certeza que deseja desativar o técnico ${colaborador.nome}?\n\n` +
          'O sistema verificará se há ordens de serviço atribuídas.'
        )
        if (!confirmacao) return
      }

      const result = await toggleAtivoColaborador(colaborador.id, !colaborador.ativo) as any
      if (result.error) {
        if (result.hasActiveOS) {
          // Erro crítico: técnico possui OSs ativas - BLOQUEAR desativação
          toast.error('Desativação bloqueada', {
            duration: 10000,
            description: result.error,
          })
          // Mostrar também um alert para garantir visibilidade
          alert(
            `⚠️ DESATIVAÇÃO BLOQUEADA\n\n${result.error}\n\n` +
            'Ação necessária: Finalize ou reatribua estas ordens de serviço antes de desativar o técnico.'
          )
        } else {
          toast.error(result.error, { duration: 5000 })
        }
      } else {
        // Se desativou um técnico e o filtro está em "ativos", mudar para "todos"
        if (colaborador.ativo && statusFilter === 'ativos') {
          setStatusFilter('todos')
        }
        toast.success(colaborador.ativo ? 'Técnico desativado com sucesso' : 'Técnico ativado com sucesso')
        handleRefresh()
      }
    } catch (error) {
      toast.error('Erro ao alterar status do técnico')
    }
  }

  const handleDelete = async () => {
    if (!colaboradorToDelete) return

    try {
      const result = await deleteColaborador(colaboradorToDelete.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Técnico excluído com sucesso!')
        handleRefresh()
      }
    } catch (error) {
      toast.error('Erro ao excluir técnico')
    } finally {
      setDeleteDialogOpen(false)
      setColaboradorToDelete(null)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Técnicos</h1>
          <p className="text-muted-foreground">Gestão de equipe técnica</p>   
        </div>
        {empresaId && canAdmin && (
          <TechnicianDialog empresaId={empresaId} onSuccess={handleRefresh} />
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Lista de Técnicos</CardTitle>
              <CardDescription>{total} ativos</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(v: any) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativos">Ativos</SelectItem>
                  <SelectItem value="inativos">Inativos</SelectItem>
                  <SelectItem value="todos">Todos</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Buscar por nome, função ou WhatsApp"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-[260px]"
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
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="mb-4">Nenhum técnico encontrado</p>
              {empresaId && canAdmin && (
                <TechnicianDialog empresaId={empresaId} onSuccess={handleRefresh} />
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => setViewTec(t)}>
                    <TableCell className="font-medium">{t.nome}</TableCell>
                    <TableCell>{t.funcao || '-'}</TableCell>
                    <TableCell>{formatPhoneDisplay(t.telefone)}</TableCell>
                    <TableCell>{formatPhoneDisplay(t.whatsapp_numero)}</TableCell>
                    <TableCell>
                      <Badge variant={t.ativo ? 'default' : 'outline'}>
                        {t.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
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
                          {canAdmin && (
                            <TechnicianDialog
                            empresaId={empresaId!}
                            colaborador={t}
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
                            <DropdownMenuItem onSelect={() => handleToggleAtivo(t)}>
                              {t.ativo ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          {canAdmin && (
                            <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => {
                              setColaboradorToDelete(t)
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
                ))}
              </TableBody>
            </Table>
          )}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <div>
                Mostrando {Math.min(end, filtered.length)} de {filtered.length}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Anterior
                </Button>
                <span>Página {currentPage} de {totalPages}</span>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {viewTec && empresaId && (
        <TechnicianDialog
          key={viewTec.id}
          empresaId={empresaId}
          colaborador={viewTec}
          mode="view"
          hideTrigger
          defaultOpen
          onOpenChange={(o) => { if (!o) setViewTec(null) }}
          onSuccess={() => { setViewTec(null); handleRefresh() }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o técnico <strong>{colaboradorToDelete?.nome}</strong>?
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
    </div>
  )
}
