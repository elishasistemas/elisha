'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { LayoutDashboard, Wrench } from 'lucide-react'
import { useAuth, useProfile } from '@/hooks/use-supabase'
import { getActiveRole, getRoles, setActiveRoleClient, type ActiveRole } from '@/utils/auth'

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
      await setActiveRoleClient(to)
      setActive(to)
      if (to === 'tecnico') {
        toast.success('Modo Campo: suas OS do dia e checklists.')
      } else {
        toast.success('Modo Gestão: indicadores e controle de equipe.')
      }
    } catch (e) {
      toast.error('Não foi possível alternar o modo')
    } finally {
      setPending(false)
    }
  }

  if (!roles.length) return null

  const adminEnabled = roles.includes('admin')
  const tecnicoEnabled = roles.includes('tecnico')

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={active === 'admin' ? 'default' : 'outline'}
        size="sm"
        onClick={() => toggle('admin')}
        disabled={!adminEnabled || pending}
        title="Ctrl+A"
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
        <Wrench className="h-4 w-4 mr-1" /> Campo
      </Button>
    </div>
  )
}

