'use client'

import { useAuth, useProfile } from '@/hooks/use-supabase'
import { getActiveRole } from '@/utils/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Hook para proteger rotas administrativas
 * Redireciona técnicos para /orders
 */
export function useAdminRoute() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const active = getActiveRole(null, profile)
  const router = useRouter()

  useEffect(() => {
    if (active === 'tecnico') {
      console.log('[RouteProtection] Técnico tentando acessar rota admin - redirecionando para /orders')
      router.replace('/orders')
    }
  }, [active, router])

  return {
    isTecnico: active === 'tecnico',
    isLoading: !active
  }
}

/**
 * Componente wrapper para proteger rotas administrativas
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isTecnico, isLoading } = useAdminRoute()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (isTecnico) {
    return null // Já redirecionou
  }

  return <>{children}</>
}

