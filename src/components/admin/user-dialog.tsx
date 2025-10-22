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
import { Copy, Check } from 'lucide-react'

interface Company {
  id: string
  nome: string
}

interface UserDialogProps {
  company: Company
  onClose: () => void
}

interface InviteResult {
  token: string
  url: string
  email: string
  role: string
  empresa: string
  expires_at: string
}

export function UserDialog({ company, onClose }: UserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'admin' as 'admin' | 'gestor' | 'tecnico',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email) {
      toast.error('Email é obrigatório')
      return
    }

    try {
      setLoading(true)

      // Chamar API para criar convite
      const response = await fetch('/api/admin/create-company-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          role: formData.role,
          empresaId: company.id,
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar convite')
      }

      // Mostrar resultado com link
      setInviteResult(result.invite)
      toast.success(`Convite criado para ${formData.email}`)
    } catch (error: any) {
      console.error('[user-dialog] Erro:', error)
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
      gestor: 'Gestor',
      tecnico: 'Técnico',
    }
    return labels[role] || role
  }

  const handleClose = () => {
    setInviteResult(null)
    setFormData({ email: '', name: '', role: 'admin' })
    setCopied(false)
    onClose()
  }

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {inviteResult ? 'Convite Criado!' : 'Convidar Usuário'}
          </DialogTitle>
          <DialogDescription>
            {inviteResult 
              ? 'Copie o link abaixo e envie para o usuário'
              : <>Criar convite de acesso para <strong>{company.nome}</strong></>
            }
          </DialogDescription>
        </DialogHeader>

        {!inviteResult ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@empresa.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Papel / Função</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'admin' | 'gestor' | 'tecnico') => 
                    setFormData({ ...formData, role: value })
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">⚙️ Administrador</SelectItem>
                    <SelectItem value="gestor">👔 Gestor</SelectItem>
                    <SelectItem value="tecnico">🔧 Técnico</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.role === 'admin' && 'Acesso total ao sistema'}
                  {formData.role === 'gestor' && 'Pode gerenciar clientes, equipamentos e ordens'}
                  {formData.role === 'tecnico' && 'Pode executar e atualizar ordens de serviço'}
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
                {loading ? 'Criando...' : 'Criar Convite'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Empresa</Label>
                <p className="font-medium">{inviteResult.empresa}</p>
              </div>
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
                O link expira em 7 dias e só pode ser usado uma vez.
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

