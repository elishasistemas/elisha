'use client'

import { useAuth, useProfile } from '@/hooks/use-supabase'
import { getActiveRole } from '@/utils/auth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Hook para proteger rotas administrativas
 * Redireciona técnicos para /orders
 * Redireciona supervisores para /orders se tentarem acessar rotas administrativas
 */
export function useAdminRoute() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const active = getActiveRole(null, profile)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (active === 'tecnico') {
      console.log('[RouteProtection] Técnico tentando acessar rota admin - redirecionando para /orders')
      router.replace('/orders')
    }
    
    // Supervisor tem acesso limitado - apenas ordens de serviço e relatórios (não acessa cadastros)
    if (active === 'supervisor') {
      const supervisorAllowedRoutes = [
        '/orders',           // Acessa e atende ordens de serviço
        '/reports',          // Acessa relatórios
        '/service-orders',   // Histórico de ordens de serviço
        '/os/',              // Detalhes de ordem de serviço individual
        '/dashboard'         // Dashboard (visualização)
      ]
      
      const isAllowed = supervisorAllowedRoutes.some(route => pathname?.startsWith(route))
      
      if (!isAllowed) {
        console.log('[RouteProtection] Supervisor tentando acessar rota não permitida - redirecionando para /orders')
        router.replace('/orders')
      }
    }
  }, [active, router, pathname])

  return {
    isTecnico: active === 'tecnico',
    isSupervisor: active === 'supervisor',
    isLoading: !active
  }
}

/**
 * Componente wrapper para proteger rotas administrativas
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isTecnico, isSupervisor, isLoading } = useAdminRoute()

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

  if (isSupervisor) {
    return null // Já redirecionou se necessário
  }

  return <>{children}</>
}

