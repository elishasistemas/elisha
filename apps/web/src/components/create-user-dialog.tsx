'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Copy, Check, UserPlus } from 'iconoir-react'
import { createSupabaseBrowser } from '@/lib/supabase'

interface CreateUserDialogProps {
  empresaId: string
  onUserCreated?: () => void
}

interface InviteResult {
  token: string
  url: string
  email: string
  role: string
  empresa: string
  expires_at: string
}

export function CreateUserDialog({ empresaId, onUserCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'tecnico' as 'admin' | 'supervisor' | 'tecnico',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email) {
      toast.error('Email é obrigatório')
      return
    }

    // Validação básica de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('E-mail inválido')
      return
    }

    try {
      setLoading(true)

      // Pegar user ID do usuário logado
      const supabase = createSupabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      const createdBy = user?.id || undefined

      // Chamar API para criar usuário
      const response = await fetch('/api/admin/create-company-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          name: formData.name.trim(),
          role: formData.role,
          empresaId: empresaId,
          created_by: createdBy
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar usuário')
      }

      // Verificar se result.invite existe
      if (!result.invite) {
        toast.error('Erro: Resposta da API inválida')
        return
      }

      // Mostrar resultado com link
      setInviteResult(result.invite)
      toast.success(`Usuário criado! Convite enviado para ${formData.email}`)
      onUserCreated?.()
    } catch (error: any) {
      console.error('[create-user-dialog] Erro:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!inviteResult) return
    
    try {
      await navigator.clipboard.writeText(inviteResult.url)
      setCopied(true)
      toast.success('Link copiado!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Erro ao copiar link')
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      supervisor: 'Supervisor',
      tecnico: 'Técnico',
    }
    return labels[role] || role
  }

  const handleClose = () => {
    setOpen(false)
    // Reset form após fechar
    setTimeout(() => {
      setInviteResult(null)
      setFormData({ email: '', name: '', role: 'tecnico' })
      setCopied(false)
    }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Criar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {inviteResult ? 'Usuário Criado!' : 'Criar Novo Usuário'}
          </DialogTitle>
          <DialogDescription>
            {inviteResult 
              ? 'Convite criado! Copie o link abaixo e envie para o colaborador.'
              : 'Preencha os dados do novo colaborador da empresa.'
            }
          </DialogDescription>
        </DialogHeader>

        {!inviteResult ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  E-mail do colaborador <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="colaborador@empresa.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome do colaborador (opcional)</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Papel / Função</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'admin' | 'supervisor' | 'tecnico') => 
                    setFormData({ ...formData, role: value })
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">⚙️ Administrador</SelectItem>
                    <SelectItem value="supervisor">👔 Supervisor</SelectItem>
                    <SelectItem value="tecnico">🔧 Técnico</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.role === 'admin' && 'Acesso total ao sistema da empresa'}
                  {formData.role === 'supervisor' && 'Gerencia ordens de serviço e equipe'}
                  {formData.role === 'tecnico' && 'Acesso apenas às suas ordens de serviço'}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">E-mail convidado</Label>
                <p className="font-medium">{inviteResult.email}</p>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Papel</Label>
                <p className="font-medium">{getRoleLabel(inviteResult.role)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Link do convite</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={inviteResult.url}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                O link expira em 7 dias. Envie para o colaborador completar o cadastro.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" onClick={handleClose}>
                Fechar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
