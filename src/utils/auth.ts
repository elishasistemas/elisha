import type { Session } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase'

export type ActiveRole = 'gestor' | 'tecnico'

export function getActiveRole(session?: Session | null, profile?: Profile | null): ActiveRole | null {
  const meta = session?.user?.user_metadata as any
  const fromMeta = meta?.active_role as ActiveRole | undefined
  const fromProfile = (profile?.active_role as ActiveRole | null) ?? null
  const fromCookie = typeof document !== 'undefined'
    ? (matchCookie('active_role') as ActiveRole | null)
    : null
  return (fromMeta as ActiveRole) || fromProfile || fromCookie || null
}

export function getRoles(session?: Session | null, profile?: Profile | null): string[] {
  const meta = session?.user?.user_metadata as any
  const r: unknown = meta?.roles || profile?.roles
  if (Array.isArray(r)) return r as string[]
  const single = profile?.role || meta?.role
  return single ? [String(single)] : []
}

export function isGestor(session?: Session | null, profile?: Profile | null) {
  const roles = getRoles(session, profile)
  const active = getActiveRole(session, profile)
  return roles.includes('gestor') && active === 'gestor'
}

export function isTecnico(session?: Session | null, profile?: Profile | null) {
  const roles = getRoles(session, profile)
  const active = getActiveRole(session, profile)
  return roles.includes('tecnico') && active === 'tecnico'
}

export async function setActiveRoleClient(role: ActiveRole) {
  await fetch('/api/session/active-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role })
  })
  // Also set a non-HTTPOnly cookie for quick client checks
  if (typeof document !== 'undefined') {
    document.cookie = `active_role=${role}; path=/; SameSite=Lax`
  }
}

function matchCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : null
}

