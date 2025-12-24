'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useZonas, useAuth, useProfile, useColaboradores } from '@/hooks/use-supabase'
import { isAdmin, isSupervisor } from '@/utils/auth'
import { ZonaDialog } from '@/components/zona-dialog'
import { MoreHorizontal, Pencil, Trash2, MapPin, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Zona } from '@/lib/supabase'

export default function ZonasPage() {
    const { user, session } = useAuth()
    const { profile } = useProfile(user?.id)

    // Determinar empresa ativa (impersonation ou empresa do perfil)
    const empresaId = profile?.impersonating_empresa_id || profile?.empresa_id || undefined

    const [refreshKey, setRefreshKey] = useState(0)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [zonaToEdit, setZonaToEdit] = useState<Zona | null>(null)
    const [zonaToDelete, setZonaToDelete] = useState<Zona | null>(null)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [search, setSearch] = useState('')

    const { zonas, loading, deleteZona } = useZonas(empresaId, { refreshKey })
    const { colaboradores } = useColaboradores(empresaId)

    const canManage = isAdmin(session, profile) || isSupervisor(session, profile)

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return zonas
        return zonas.filter((z) => {
            const tecnico = colaboradores.find(c => c.id === z.tecnico_responsavel_id)
            return (
                z.nome.toLowerCase().includes(q) ||
                (tecnico?.nome || '').toLowerCase().includes(q)
            )
        })
    }, [zonas, search, colaboradores])

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1)
    }

    const handleDelete = async () => {
        if (!zonaToDelete) return

        try {
            const result = await deleteZona(zonaToDelete.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Zona excluída com sucesso!')
                handleRefresh()
            }
        } catch (error) {
            toast.error('Erro ao excluir zona')
        } finally {
            setDeleteDialogOpen(false)
            setZonaToDelete(null)
        }
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto w-full py-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl font-bold">Zonas</h1>
                    </div>
                    <p className="text-muted-foreground">Gerencie as regiões de atendimento e seus responsáveis</p>
                </div>
                {empresaId && canManage && (
                    <Button onClick={() => { setZonaToEdit(null); setIsCreateDialogOpen(true) }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Zona
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <CardTitle>Lista de Zonas</CardTitle>
                            <CardDescription>{filtered.length} {search ? 'resultado(s)' : 'registros'}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Buscar por nome ou técnico..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-[300px]"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-10 text-muted-foreground">
                            Carregando...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <p className="mb-4">Nenhuma zona {search ? 'encontrada' : 'cadastrada'}</p>
                            {empresaId && canManage && !search && (
                                <Button onClick={() => setIsCreateDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Criar minha primeira zona
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Técnico Responsável</TableHead>
                                    <TableHead className="w-[100px]">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((z) => {
                                    const tecnico = colaboradores.find(c => c.id === z.tecnico_responsavel_id)
                                    return (
                                        <TableRow key={z.id}>
                                            <TableCell className="font-medium">{z.nome}</TableCell>
                                            <TableCell>{tecnico?.nome || '-'}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => { setZonaToEdit(z); setIsCreateDialogOpen(true) }}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => { setZonaToDelete(z); setDeleteDialogOpen(true) }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {empresaId && (
                <ZonaDialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                    empresaId={empresaId}
                    colaboradores={colaboradores}
                    zona={zonaToEdit}
                    onSuccess={handleRefresh}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir a zona <strong>{zonaToDelete?.nome}</strong>?
                            Os clientes vinculados a esta zona ficarão "Sem zona". Esta ação não pode ser desfeita.
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
