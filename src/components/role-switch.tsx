'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { LayoutDashboard, Wrench } from 'lucide-react'
import { useAuth, useProfile } from '@/hooks/use-supabase'
import { getActiveRole, getRoles, setActiveRoleClient, type ActiveRole } from '@/utils/auth'
import { createSupabaseBrowser } from '@/lib/supabase'

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
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ active_role: to })
          .eq('user_id', user.id)
        if (updateError) throw updateError

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
      toast.success(to === 'tecnico' ? 'Modo Campo: suas OS do dia e checklists.' : 'Modo Gestão: indicadores e controle de equipe.')

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
  const tecnicoEnabled = roles.includes('tecnico')
  const isElishaAdmin = profile?.is_elisha_admin

  // Técnicos puros (sem admin) não veem o switcher
  // Apenas super admin e admin (com ou sem técnico) podem trocar de perfil
  if (!adminEnabled && !isElishaAdmin) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={active === 'admin' ? 'default' : 'outline'}
        size="sm"
        onClick={() => toggle('admin')}
        disabled={!adminEnabled || pending}
        title="Ctrl+A"
        className={active === 'admin' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
      >
        <LayoutDashboard className="h-4 w-4 mr-1" /> Admin
      </Button>
      <Button
        variant={active === 'tecnico' ? 'default' : 'outline'}
        size="sm"
        onClick={() => toggle('tecnico')}
        disabled={!tecnicoEnabled || pending}
        title="Ctrl+T"
      >
        <Wrench className="h-4 w-4 mr-1" /> Técnico
      </Button>
    </div>
  )
}
