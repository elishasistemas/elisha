'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'

interface UserRoleData {
  activeRole: string | null
  availableRoles: string[]
  isAdmin: boolean
  isTecnico: boolean
  tecnicoId: string | null
  loading: boolean
}

/**
 * Hook para acessar informações do role ativo do usuário
 * 
 * @example
 * const { activeRole, isAdmin, isTecnico } = useActiveRole()
 * 
 * if (isAdmin) {
 *   // Mostrar controles de admin
 * }
 */
export function useActiveRole(): UserRoleData {
  const [data, setData] = useState<UserRoleData>({
    activeRole: null,
    availableRoles: [],
    isAdmin: false,
    isTecnico: false,
    tecnicoId: null,
    loading: true
  })

  const supabase = createSupabaseBrowser()

  useEffect(() => {
    async function loadRoleData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setData({
            activeRole: null,
            availableRoles: [],
            isAdmin: false,
            isTecnico: false,
            tecnicoId: null,
            loading: false
          })
          return
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('active_role, roles, tecnico_id')
          .eq('id', user.id)
          .single()

        if (error || !profile) {
          console.error('[useActiveRole] Erro ao carregar profile:', error)
          setData(prev => ({ ...prev, loading: false }))
          return
        }

        setData({
          activeRole: profile.active_role,
          availableRoles: profile.roles || [],
          isAdmin: profile.active_role === 'admin',
          isTecnico: profile.active_role === 'tecnico',
          tecnicoId: profile.tecnico_id,
          loading: false
        })

      } catch (error) {
        console.error('[useActiveRole] Erro:', error)
        setData(prev => ({ ...prev, loading: false }))
      }
    }

    loadRoleData()

    // Recarregar quando houver mudança na sessão
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadRoleData()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return data
}

/**
 * Hook para verificar se o usuário tem uma permissão específica
 * 
 * @example
 * const canEdit = useHasPermission('admin')
 * 
 * return (
 *   <Button disabled={!canEdit}>Editar</Button>
 * )
 */
export function useHasPermission(requiredRole: string | string[]): boolean {
  const { activeRole, availableRoles, loading } = useActiveRole()

  if (loading) return false

  const required = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

  // Verifica se o role ativo está entre os requeridos
  if (activeRole && required.includes(activeRole)) {
    return true
  }

  // Verifica se o usuário tem algum dos roles requeridos
  return availableRoles.some(role => required.includes(role))
}

/**
 * Hook para verificar se o usuário pode acessar um recurso específico
 * 
 * @example
 * const canAccessOS = useCanAccessOS(osId)
 */
export function useCanAccessOS(osId: string | null): boolean {
  const { isAdmin, isTecnico, tecnicoId } = useActiveRole()
  const [canAccess, setCanAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    if (!osId) {
      setCanAccess(false)
      setLoading(false)
      return
    }

    // Admin tem acesso a tudo
    if (isAdmin) {
      setCanAccess(true)
      setLoading(false)
      return
    }

    // Técnico só tem acesso às suas OS
    if (isTecnico && tecnicoId) {
      async function checkAccess() {
        const { data } = await supabase
          .from('ordens_servico')
          .select('id')
          .eq('id', osId)
          .eq('tecnico_id', tecnicoId)
          .maybeSingle()

        setCanAccess(!!data)
        setLoading(false)
      }

      checkAccess()
    } else {
      setCanAccess(false)
      setLoading(false)
    }
  }, [osId, isAdmin, isTecnico, tecnicoId, supabase])

  return canAccess
}

