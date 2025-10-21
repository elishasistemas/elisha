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

interface Company {
  id: string
  nome: string
}

interface UserDialogProps {
  company: Company
  onClose: () => void
}

export function UserDialog({ company, onClose }: UserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'gestor' as 'gestor' | 'tecnico',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.name) {
      toast.error('Email e nome são obrigatórios')
      return
    }

    try {
      setLoading(true)

      // Chamar API para criar usuário
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
        throw new Error(result.error || 'Erro ao criar usuário')
      }

      toast.success(`Convite enviado para ${formData.email}`)
      onClose()
    } catch (error: any) {
      console.error('[user-dialog] Erro:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Usuário</DialogTitle>
            <DialogDescription>
              Criar primeiro usuário para <strong>{company.nome}</strong>
            </DialogDescription>
          </DialogHeader>

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
              />
              <p className="text-xs text-muted-foreground">
                Um convite será enviado para este email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Papel</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'gestor' | 'tecnico') => 
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gestor">
                    👔 Gestor (Acesso completo)
                  </SelectItem>
                  <SelectItem value="tecnico">
                    🔧 Técnico (Acesso limitado)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                O primeiro usuário geralmente é um Gestor
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Enviar Convite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

