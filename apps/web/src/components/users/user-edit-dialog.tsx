'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

interface User {
  id: string
  username?: string
  nome?: string
  email?: string
  telefone?: string
  whatsapp_numero?: string
  funcao?: string
  role: string
}

interface UserEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  empresaId: string
  empresaNome: string
  onUserUpdated?: () => void
}

export function UserEditDialog({
  open,
  onOpenChange,
  user,
  empresaId,
  empresaNome,
  onUserUpdated
}: UserEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    username: '',
    nome: '',
    email: '',
    telefone: '',
    whatsapp: '',
    funcao: '',
    role: 'tecnico' as 'admin' | 'supervisor' | 'tecnico',
    password: '',
    confirmPassword: ''
  })

  // Preencher form quando user muda
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        nome: user.nome || '',
        email: user.email || '',
        telefone: user.telefone || '',
        whatsapp: user.whatsapp_numero || '',
        funcao: user.funcao || '',
        role: user.role as 'admin' | 'supervisor' | 'tecnico',
        password: '',
        confirmPassword: ''
      })
    }
  }, [user])

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
  }

  const handlePhoneChange = (field: 'telefone' | 'whatsapp', value: string) => {
    setFormData({ ...formData, [field]: formatPhone(value) })
  }

  const validateForm = () => {
    if (!formData.username.trim()) {
      toast.error('Nome de usuário é obrigatório')
      return false
    }

    if (formData.username.length < 3) {
      toast.error('Nome de usuário deve ter no mínimo 3 caracteres')
      return false
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(formData.username)) {
      toast.error('Nome de usuário pode conter apenas letras, números, ponto, hífen e underline')
      return false
    }

    if (!formData.nome.trim()) {
      toast.error('Nome completo é obrigatório')
      return false
    }

    if (!formData.email.trim()) {
      toast.error('Email é obrigatório')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Email inválido')
      return false
    }

    // Validar senha apenas se foi fornecida
    if (formData.password) {
      if (formData.password.length < 8) {
        toast.error('Senha deve ter no mínimo 8 caracteres')
        return false
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error('As senhas não coincidem')
        return false
      }
    }

    if (formData.role === 'tecnico' && !formData.whatsapp.trim()) {
      toast.error('WhatsApp é obrigatório para técnicos')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !user) return

    try {
      setLoading(true)

      const requestBody: any = {
        username: formData.username.toLowerCase().trim(),
        nome: formData.nome.trim(),
        email: formData.email.toLowerCase().trim(),
        telefone: formData.telefone || null,
        whatsapp: formData.whatsapp || null,
        funcao: formData.funcao || null,
        role: formData.role
      }

      // Incluir senha apenas se foi fornecida
      if (formData.password) {
        requestBody.password = formData.password
      }

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar usuário')
      }

      toast.success(`Usuário ${formData.username} atualizado com sucesso!`)

      onUserUpdated?.()
      onOpenChange(false)

    } catch (error: any) {
      console.error('[UserEditDialog] Erro:', error)
      toast.error(error.message || 'Erro ao atualizar usuário')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Edite as informações do usuário em <strong>{empresaNome}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username e Role */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                Nome de Usuário <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                required
                disabled={loading}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Apenas letras, números, ponto, hífen e underline
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">
                Perfil de Acesso <span className="text-destructive">*</span>
              </Label>
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
            </div>
          </div>

          {/* Senha (opcional) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                Nova Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={loading}
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Deixe em branco para manter a senha atual</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirmar Nova Senha
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  disabled={loading}
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Nome e Email */}
          <div className="space-y-2">
            <Label htmlFor="nome">
              Nome Completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
              required
              disabled={loading}
            />
          </div>

          {/* Telefone e WhatsApp */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handlePhoneChange('telefone', e.target.value)}
                disabled={loading}
                maxLength={15}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">
                WhatsApp {formData.role === 'tecnico' && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => handlePhoneChange('whatsapp', e.target.value)}
                required={formData.role === 'tecnico'}
                disabled={loading}
                maxLength={15}
              />
            </div>
          </div>

          {/* Função/Cargo */}
          <div className="space-y-2">
            <Label htmlFor="funcao">Função/Cargo</Label>
            <Input
              id="funcao"
              value={formData.funcao}
              onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Atualizar Usuário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}