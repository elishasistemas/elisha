'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { LayoutDashboard, Wrench, UserCog } from 'lucide-react'
import { useAuth, useProfile } from '@/hooks/use-supabase'
import { getActiveRole, getRoles, setActiveRoleClient, type ActiveRole } from '@/utils/auth'
import { createSupabaseBrowser } from '@/lib/supabase'
import { apiClient } from '@/lib/api-client'

export function RoleSwitch() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const [pending, setPending] = useState(false)

  const roles = useMemo(() => getRoles((user as any)?.session ?? null, profile), [user, profile])
  const [active, setActive] = useState<ActiveRole | null>(null)

  useEffect(() => {
    const current = getActiveRole((user as any)?.session ?? null, profile)
    setActive(current || (roles.includes('admin') ? 'admin' : roles.includes('tecnico') ? 'tecnico' : null))
  }, [user, profile, roles])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault()
        toggle('admin')
      }
      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        toggle('supervisor')
      }
      if (e.ctrlKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault()
        toggle('tecnico')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const toggle = async (to: ActiveRole) => {
    if (pending || !roles.includes(to)) return
    if (active === to) return
    setPending(true)
    try {
      // 1) Atualiza active_role no JWT + cookie rápido
      await setActiveRoleClient(to)

      // 2) Persiste no profile para páginas que leem profile.active_role
      const supabase = createSupabaseBrowser()
      const { data: { user, session } } = await supabase.auth.getUser()
      if (user && session) {
        // Atualizar active_role via backend
        await apiClient.profiles.updateActiveRole(user.id, to, session.access_token)

        // 3) Atualiza claims e sessão para refletir nas próximas renderizações
        const response = await fetch('/api/auth/update-claims', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        })
        if (!response.ok) throw new Error('Erro ao atualizar claims')
        await supabase.auth.refreshSession()
      }

      // Feedback
      setActive(to)
      const messages = {
        admin: 'Modo Gestão: indicadores e controle completo.',
        supervisor: 'Modo Supervisor: gerenciar ordens de serviço e equipe.',
        tecnico: 'Modo Campo: suas OS do dia e checklists.',
        elisha_admin: 'Modo Super Admin'
      }
      toast.success(messages[to] || 'Modo alterado')

      // 4) Recarrega a página para aplicar menus/consultas com RLS
      setTimeout(() => { window.location.reload() }, 400)
    } catch (e) {
      toast.error('Não foi possível alternar o modo')
    } finally {
      setPending(false)
    }
  }

  if (!roles.length) return null

  const adminEnabled = roles.includes('admin')
  const supervisorEnabled = roles.includes('supervisor')
  const tecnicoEnabled = roles.includes('tecnico')
  
  // Determinar label e ícone baseado no papel ativo
  const getActiveRoleDisplay = () => {
    switch (active) {
      case 'admin':
        return { icon: LayoutDashboard, label: 'Administrador' }
      case 'supervisor':
        return { icon: UserCog, label: 'Supervisor' }
      case 'tecnico':
        return { icon: Wrench, label: 'Técnico' }
      default:
        return { icon: Wrench, label: 'Técnico' }
    }
  }
  
  const { icon: ActiveIcon, label: activeLabel } = getActiveRoleDisplay()

  return (
    <div className="flex items-center gap-1.5 pr-1">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        title={`Modo atual: ${activeLabel}`}
        className="flex-shrink-0 cursor-default"
      >
        <ActiveIcon className="h-4 w-4 mr-1" /> {activeLabel}
      </Button>
    </div>
  )
}

