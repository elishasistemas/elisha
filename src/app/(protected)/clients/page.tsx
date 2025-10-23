'use client'

import { useMemo, useState } from 'react'
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
import { useEmpresas, useClientes, useAuth, useProfile } from '@/hooks/use-supabase'
import { isAdmin } from '@/utils/auth'
import { ClientDialog } from '@/components/client-dialog'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Cliente } from '@/lib/supabase'

export default function ClientsPage() {
  const { empresas, loading: empresasLoading, error: empresasError } = useEmpresas()
  const empresaId = empresas[0]?.id
  const { clientes, loading, error, deleteCliente } = useClientes(empresaId)
  const { user, session } = useAuth()
  const { profile } = useProfile(user?.id)
  const canAdmin = isAdmin(session, profile)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const isLoading = empresasLoading || loading
  const hasError = empresasError || error

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter((c) => {
      return (
        (c.nome_local || '').toLowerCase().includes(q) ||
        (c.cnpj || '').toLowerCase().includes(q) ||
        (c.responsavel_nome || '').toLowerCase().includes(q) ||
        (c.responsavel_telefone || '').toLowerCase().includes(q) ||
        (c.responsavel_email || '').toLowerCase().includes(q)
      )
    })
  }, [clientes, search])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  const pageRows = filtered.slice(start, end)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleDelete = async () => {
    if (!clienteToDelete) return

    try {
      const result = await deleteCliente(clienteToDelete.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Cliente excluído com sucesso!')
        handleRefresh()
      }
    } catch (error) {
      toast.error('Erro ao excluir cliente')
    } finally {
      setDeleteDialogOpen(false)
      setClienteToDelete(null)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerencie clientes e contratos</p>
        </div>
        {empresaId && canAdmin && (
          <ClientDialog empresaId={empresaId} onSuccess={handleRefresh} />
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Lista de Clientes</CardTitle>
              <CardDescription>{total} {search ? 'resultado(s)' : 'registros'}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar por nome, CNPJ ou contato"
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
              <p className="mb-4">Nenhum cliente {search ? 'encontrado' : 'cadastrado'}</p>
              {empresaId && canAdmin && (
                <ClientDialog empresaId={empresaId} onSuccess={handleRefresh} />
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status do Contrato</TableHead>
                  <TableHead className="w-[70px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome_local}</TableCell>
                    <TableCell>{c.cnpj}</TableCell>
                    <TableCell>{c.responsavel_nome || '-'}</TableCell>
                    <TableCell>{c.responsavel_telefone || c.responsavel_email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={c.status_contrato === 'ativo' ? 'default' : c.status_contrato === 'em_renovacao' ? 'secondary' : 'outline'}>
                        {c.status_contrato === 'ativo' ? 'Ativo' : c.status_contrato === 'em_renovacao' ? 'Em Renovação' : 'Encerrado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                            <ClientDialog
                            empresaId={empresaId!}
                            cliente={c}
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
                              setClienteToDelete(c)
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
                Mostrando {Math.min(end, total)} de {total}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <strong>{clienteToDelete?.nome_local}</strong>?
              Esta ação não pode ser desfeita e todos os equipamentos e ordens de serviço
              relacionados também serão excluídos.
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
