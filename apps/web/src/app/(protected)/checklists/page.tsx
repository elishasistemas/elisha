'use client'

// Force rebuild - Vercel cache issue
import React, { useState } from 'react'
import { useAdminRoute } from '@/utils/route-protection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CheckSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  MoreHorizontal,
  FileText,
  Loader2
} from 'lucide-react'
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
import { ChecklistDialog } from '@/components/checklist-dialog'
import { ChecklistViewDialog } from '@/components/checklist-view-dialog'
import { useAuth, useEmpresas, useProfile, useChecklists } from '@/hooks/use-supabase'
import { isAdmin } from '@/utils/auth'
import { toast } from 'sonner'
import type { Checklist } from '@/types/checklist'

const tipoServicoLabels = {
  preventiva: 'Preventiva',
  corretiva: 'Corretiva',
  emergencial: 'Emergencial',
  chamado: 'Chamado',
  todos: 'Todos os Tipos'
}

const origemLabels = {
  abnt: 'ABNT',
  custom: 'Personalizado',
  elisha: 'Elisha Padrão'
}

const origemColors = {
  abnt: 'bg-purple-100 text-purple-800',
  custom: 'bg-blue-100 text-blue-800',
  elisha: 'bg-green-100 text-green-800'
}

export default function ChecklistsPage() {
  // Proteger rota: apenas admin pode acessar
  const { isTecnico } = useAdminRoute()
  
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [checklistToDelete, setChecklistToDelete] = useState<Checklist | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [viewChecklist, setViewChecklist] = useState<Checklist | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  
  const { user, session } = useAuth()
  const { profile } = useProfile(user?.id)
  
  // Determinar empresa ativa (impersonation ou empresa do perfil)
  const empresaId = profile?.impersonating_empresa_id || profile?.empresa_id || undefined
  
  const { loading: empresasLoading } = useEmpresas()
  const canAdmin = isAdmin(session, profile)

  // Usar hook useChecklists
  const { 
    checklists, 
    loading, 
    count: totalCount,
    deleteChecklist,
    updateChecklist,
    createChecklist 
  } = useChecklists(empresaId, { page, pageSize, search, refreshKey })

  // Refresh helper
  const loadChecklists = () => {
    setRefreshKey(prev => prev + 1)
  }

  // Derived: filtered + paginated
  const total = totalCount
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const startIdx = total > 0 ? (page - 1) * pageSize + 1 : 0
  const endIdx = Math.min(page * pageSize, total)

  // Delete checklist
  const handleDelete = async () => {
    if (!checklistToDelete) return
    
    try {
      setDeleting(true)
      const { error } = await deleteChecklist(checklistToDelete.id)
      
      if (error) throw new Error(error)
      
      toast.success('Checklist excluído com sucesso')
      loadChecklists()
    } catch (error) {
      console.error('Error deleting checklist:', error)
      toast.error('Erro ao excluir checklist')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setChecklistToDelete(null)
    }
  }

  // Duplicate checklist
  const handleDuplicate = async (checklist: Checklist) => {
    try {
      const { error } = await createChecklist({
        empresa_id: checklist.empresa_id,
        nome: `${checklist.nome} (Cópia)`,
        tipo_servico: checklist.tipo_servico,
        itens: checklist.itens,
        versao: 1,
        origem: checklist.origem,
        abnt_refs: checklist.abnt_refs,
        ativo: true
      })
      
      if (error) throw new Error(error)
      
      toast.success('Checklist duplicado com sucesso')
      loadChecklists()
    } catch (error) {
      console.error('Error duplicating checklist:', error)
      toast.error('Erro ao duplicar checklist')
    }
  }

  // Toggle active status
  const handleToggleActive = async (checklist: Checklist) => {
    try {
      const { error } = await updateChecklist(checklist.id, { ativo: !checklist.ativo })
      
      if (error) throw new Error(error)
      
      toast.success(checklist.ativo ? 'Checklist desativado' : 'Checklist ativado')
      loadChecklists()
    } catch (error) {
      console.error('Error toggling checklist:', error)
      toast.error('Erro ao atualizar checklist')
    }
  }

  if (empresasLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Se for técnico, não renderiza nada (já redirecionou)
  if (isTecnico) {
    return null
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Checklists</h1>
          <p className="text-muted-foreground">
            Gerencie templates de checklist para ordens de serviço
          </p>
        </div>
        {empresaId && canAdmin && (
          <ChecklistDialog 
            empresaId={empresaId} 
            onSuccess={loadChecklists}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Templates de Checklist</CardTitle>
              <CardDescription>
                {total} template(s) {search ? `filtrado(s)` : `cadastrado(s)`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar por nome, tipo, origem"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
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
          {checklists.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum checklist {search ? 'encontrado para a busca' : 'cadastrado'}</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro template de checklist para começar
              </p>
              {empresaId && canAdmin && (
                <ChecklistDialog 
                  empresaId={empresaId} 
                  onSuccess={loadChecklists}
                  trigger={
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Checklist
                    </Button>
                  }
                />
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo de Serviço</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checklists.map((checklist) => (
                  <TableRow key={checklist.id} className="cursor-pointer" onClick={() => setViewChecklist(checklist)}>
                    <TableCell className="font-medium">{checklist.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {tipoServicoLabels[checklist.tipo_servico as keyof typeof tipoServicoLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={origemColors[checklist.origem as keyof typeof origemColors]}>
                        {origemLabels[checklist.origem as keyof typeof origemLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {Array.isArray(checklist.itens) ? checklist.itens.length : 0} item(ns)
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      v{checklist.versao}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={checklist.ativo ? 'default' : 'secondary'}
                        className={checklist.ativo ? 'bg-green-500 hover:bg-green-600' : ''}
                      >
                        {checklist.ativo ? 'Ativo' : 'Inativo'}
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
                            <ChecklistDialog
                            empresaId={empresaId!}
                            checklist={checklist}
                            mode="edit"
                            onSuccess={loadChecklists}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            }
                            />
                          )}
                          {canAdmin && (
                            <DropdownMenuItem onClick={() => handleDuplicate(checklist)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>
                          )}
                          {canAdmin && (
                            <DropdownMenuItem onClick={() => handleToggleActive(checklist)}>
                              <FileText className="mr-2 h-4 w-4" />
                              {checklist.ativo ? 'Desativar' : 'Ativar'}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {canAdmin && (
                            <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => {
                              setChecklistToDelete(checklist)
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
          {/* Pagination controls */}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o checklist <strong>{checklistToDelete?.nome}</strong>?
              <br /><br />
              Esta ação não pode ser desfeita. As ordens de serviço que já usam este checklist 
              não serão afetadas (elas mantêm o snapshot).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {viewChecklist && (
        <ChecklistViewDialog
          key={viewChecklist.id}
          checklist={viewChecklist}
          defaultOpen
          hideTrigger
          onOpenChange={(o) => { if (!o) setViewChecklist(null) }}
        />
      )}
    </div>
  )
}
