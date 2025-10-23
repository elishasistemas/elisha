"use client"

import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Trash2, Edit, UserPlus, RefreshCw } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  nome: string | null
  empresa_id: string | null
  empresa_nome?: string
  roles: string[]
  active_role: string
  is_elisha_admin: boolean
  created_at: string
}

interface Invite {
  id: string
  email: string
  role: string
  status: string
  empresa_id: string
  empresa_nome?: string
  created_at: string
  expires_at: string
}

interface Empresa {
  id: string
  nome: string
}

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [search, setSearch] = useState('')
  const [filterEmpresa, setFilterEmpresa] = useState<string>('all')
  
  // Edit user dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [editForm, setEditForm] = useState({
    nome: '',
    empresa_id: '',
    role: '',
    is_elisha_admin: false
  })

  // Invite user dialog
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'admin',
    empresa_id: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const supabase = createSupabaseBrowser()

    try {
      // Buscar todas as empresas
      const { data: empresasData } = await supabase
        .from('empresas')
        .select('id, nome')
        .order('nome')

      setEmpresas(empresasData || [])

      // Buscar todos os usuários via API
      const usersResponse = await fetch('/api/admin/users')
      if (!usersResponse.ok) {
        console.error('Erro ao buscar usuários')
        toast.error('Erro ao carregar usuários')
      } else {
        const usersData = await usersResponse.json()
        const usersWithEmpresas = usersData.map((user: any) => {
          const empresa = empresasData?.find((e: any) => e.id === user.empresa_id)
          return {
            ...user,
            empresa_nome: empresa?.nome || 'Sem empresa'
          }
        })
        setUsers(usersWithEmpresas)
      }

      // Buscar convites pendentes
      const { data: invitesData, error: invitesError } = await supabase
        .from('invites')
        .select('id, email, role, status, empresa_id, created_at, expires_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (invitesError) {
        console.error('Erro ao buscar convites:', invitesError)
      } else {
        const invitesWithEmpresas = (invitesData || []).map((invite: any) => {
          const empresa = empresasData?.find((e: any) => e.id === invite.empresa_id)
          return {
            ...invite,
            empresa_nome: empresa?.nome || 'Sem empresa'
          }
        })
        setInvites(invitesWithEmpresas)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user)
    setEditForm({
      nome: user.nome || '',
      empresa_id: user.empresa_id || '',
      role: user.active_role || 'admin',
      is_elisha_admin: user.is_elisha_admin || false
    })
    setEditDialogOpen(true)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar usuário')
      }

      toast.success('Usuário atualizado com sucesso!')
      setEditDialogOpen(false)
      loadData()
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error)
      toast.error(error.message || 'Erro ao atualizar usuário')
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${userEmail}?`)) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao excluir usuário')
      }

      toast.success('Usuário excluído com sucesso!')
      loadData()
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error)
      toast.error(error.message || 'Erro ao excluir usuário')
    }
  }

  const handleInviteUser = async () => {
    if (!inviteForm.email || !inviteForm.name || !inviteForm.empresa_id) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const response = await fetch('/api/admin/create-company-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteForm.email,
          name: inviteForm.name,
          role: inviteForm.role,
          empresaId: inviteForm.empresa_id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao convidar usuário')
      }

      toast.success('Convite enviado com sucesso!')
      setInviteDialogOpen(false)
      setInviteForm({ email: '', name: '', role: 'admin', empresa_id: '' })
      loadData()
    } catch (error: any) {
      console.error('Erro ao convidar:', error)
      toast.error(error.message || 'Erro ao enviar convite')
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('Tem certeza que deseja revogar este convite?')) return

    const supabase = createSupabaseBrowser()

    try {
      const { error } = await supabase
        .from('invites')
        .update({ status: 'revoked' })
        .eq('id', inviteId)

      if (error) throw error

      toast.success('Convite revogado!')
      loadData()
    } catch (error: any) {
      console.error('Erro ao revogar convite:', error)
      toast.error(error.message || 'Erro ao revogar convite')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.nome || '').toLowerCase().includes(search.toLowerCase())
    
    const matchesEmpresa = 
      filterEmpresa === 'all' || 
      user.empresa_id === filterEmpresa ||
      (filterEmpresa === 'none' && !user.empresa_id)

    return matchesSearch && matchesEmpresa
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie todos os usuários e convites do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="size-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="size-4 mr-2" />
            Convidar Usuário
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por email ou nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as empresas</SelectItem>
            <SelectItem value="none">Sem empresa</SelectItem>
            {empresas.map(empresa => (
              <SelectItem key={empresa.id} value={empresa.id}>
                {empresa.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de Usuários */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.nome || '-'}</TableCell>
                  <TableCell>{user.empresa_nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.active_role}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.is_elisha_admin ? (
                      <Badge>Super Admin</Badge>
                    ) : (
                      <Badge variant="secondary">Usuário</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Convites Pendentes */}
      {invites.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Convites Pendentes ({invites.length})</h2>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">{invite.email}</TableCell>
                    <TableCell>{invite.empresa_nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{invite.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(invite.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeInvite(invite.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Revogar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Dialog: Editar Usuário */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere as informações do usuário {editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome</Label>
              <Input
                id="edit-nome"
                value={editForm.nome}
                onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-empresa">Empresa</Label>
              <Select
                value={editForm.empresa_id}
                onValueChange={(value) => setEditForm({ ...editForm, empresa_id: value })}
              >
                <SelectTrigger id="edit-empresa">
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem empresa</SelectItem>
                  {empresas.map(empresa => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="elisha_admin">Elisha Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-is-admin"
                checked={editForm.is_elisha_admin}
                onChange={(e) => setEditForm({ ...editForm, is_elisha_admin: e.target.checked })}
                className="size-4"
              />
              <Label htmlFor="edit-is-admin" className="cursor-pointer">
                É Super Admin (Elisha Admin)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Convidar Usuário */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Novo Usuário</DialogTitle>
            <DialogDescription>
              Envie um convite para um novo usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Email *</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="usuario@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="invite-name">Nome *</Label>
              <Input
                id="invite-name"
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label htmlFor="invite-empresa">Empresa *</Label>
              <Select
                value={inviteForm.empresa_id}
                onValueChange={(value) => setInviteForm({ ...inviteForm, empresa_id: value })}
              >
                <SelectTrigger id="invite-empresa">
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map(empresa => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInviteUser}>Enviar Convite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

