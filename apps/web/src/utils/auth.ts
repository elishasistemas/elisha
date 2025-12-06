import type { Session } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase'

export type ActiveRole = 'admin' | 'supervisor' | 'tecnico' | 'elisha_admin'

interface UserMetadata {
  active_role?: ActiveRole;
  roles?: string[];
  role?: string;
}

export function getActiveRole(session?: Session | null, profile?: Profile | null): ActiveRole | null {
  // Prioridade: app_metadata (JWT) > profile > cookie (apenas se tiver session)
  const appMeta = (session?.user?.app_metadata || {}) as UserMetadata
  const userMeta = (session?.user?.user_metadata || {}) as UserMetadata
  
  const fromAppMeta = appMeta.active_role
  const fromUserMeta = userMeta.active_role
  const fromProfile = (profile?.active_role as ActiveRole | null) ?? null
  
  // Só usar cookie se tiver session válida (evita usar cookie obsoleto)
  const fromCookie = (session && typeof document !== 'undefined')
    ? (matchCookie('active_role') as ActiveRole | null)
    : null
    
  const result = fromAppMeta || fromUserMeta || fromProfile || fromCookie || null
  
  return result
}

export function getRoles(session?: Session | null, profile?: Profile | null): string[] {
  const meta = (session?.user?.user_metadata || {}) as UserMetadata
  const r: unknown = meta.roles || profile?.roles
  if (Array.isArray(r)) return r as string[]
  const single = profile?.role || meta.role
  return single ? [String(single)] : []
}

export function isAdmin(session?: Session | null, profile?: Profile | null) {
  // Simplificado: usar apenas active_role, que é o campo autoritativo
  const active = getActiveRole(session, profile)
  return active === 'admin'
}

export function isTecnico(session?: Session | null, profile?: Profile | null) {
  const active = getActiveRole(session, profile)
  return active === 'tecnico'
}

export function isSupervisor(session?: Session | null, profile?: Profile | null) {
  const active = getActiveRole(session, profile)
  return active === 'supervisor'
}

export function isElishaAdmin(session?: Session | null, profile?: Profile | null) {
  return profile?.is_elisha_admin === true
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

