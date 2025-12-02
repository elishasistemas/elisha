'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createSupabaseBrowser } from '@/lib/supabase'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { User } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { dataCache } from '@/lib/cache'

interface RoleSwitcherProps {
  className?: string
}

export function RoleSwitcher({ className }: RoleSwitcherProps) {
  const [switching, setSwitching] = useState(false)
  const { user, profile } = useAuth()
  const supabase = createSupabaseBrowser()

  const currentRole = profile?.active_role || null
  const availableRoles = profile?.roles || []

  const handleSwitch = async (newRole: string) => {
    if (newRole === currentRole) return

    try {
      setSwitching(true)

      const { data: { user, session } } = await supabase.auth.getUser()
      if (!user || !session) {
        toast.error('Sessão expirada. Redirecionando para login...')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
        return
      }

      // Atualizar active_role no profile via backend
      await apiClient.profiles.updateActiveRole(user.id, newRole, session.access_token)

      // Chamar API para atualizar JWT claims
      const response = await fetch('/api/auth/update-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar claims')
      }

      // Refresh session para pegar novo JWT
      await supabase.auth.refreshSession()

      toast.success(`Mudou para: ${getRoleLabel(newRole)}`)

      // Recarregar página para aplicar novo RLS
      setTimeout(() => {
        window.location.reload()
      }, 500)

    } catch (error) {
      console.error('Erro ao trocar role:', error)
      toast.error('Erro ao trocar perfil')
    } finally {
      setSwitching(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: '👔 Admin',
      tecnico: '🔧 Técnico',
    }
    return labels[role] || role
  }

  // Só mostra se houver múltiplos roles
  if (availableRoles.length <= 1) {
    return null
  }

  return (
    <div className={className}>
      <Select
        value={currentRole || undefined}
        onValueChange={handleSwitch}
        disabled={switching}
      >
        <SelectTrigger className="w-[180px]">
          <User className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Selecione o modo">
            {currentRole ? getRoleLabel(currentRole) : 'Selecione'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableRoles.map((role) => (
            <SelectItem key={role} value={role}>
              {getRoleLabel(role)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

