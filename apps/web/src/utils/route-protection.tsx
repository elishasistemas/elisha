'use client'

import { useAuth, useProfile } from '@/hooks/use-supabase'
import { getActiveRole } from '@/utils/auth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Hook para proteger rotas administrativas
 * 
 * ADMIN: Acesso total
 *   - Dashboard (análise de negócios)
 *   - Ordens de Serviço (geração e gestão)
 *   - Clientes (cadastro e gestão)
 *   - Técnicos (cadastro e gestão)
 *   - Equipamentos (cadastro e gestão)
 *   - Checklists (criação e gestão de templates)
 *   - Relatórios e dados totais do negócio
 * 
 * SUPERVISOR: Acesso operacional limitado
 *   - Dashboard (visualização)
 *   - Ordens de Serviço (acessa, cria e atende)
 *   - Checklists (visualiza e preenche)
 *   - Relatórios (visualização)
 *   - NÃO acessa: Cadastros (clientes, técnicos, equipamentos)
 * 
 * TÉCNICO: Acesso apenas execução
 *   - Dashboard (visualização básica)
 *   - Ordens de Serviço (atende ordens atribuídas)
 *   - NÃO acessa: Cadastros, relatórios gerenciais, criação de OS
 */
export function useAdminRoute() {
  const { user, session } = useAuth()
  const { profile } = useProfile(user?.id)
  const active = getActiveRole(session, profile)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (active === 'tecnico') {
      console.log('[RouteProtection] Técnico tentando acessar rota admin - redirecionando para /orders')
      router.replace('/orders')
    }
    
    // Supervisor tem acesso operacional limitado - pode acessar OS, Dashboard e Checklists
    // NÃO pode acessar cadastros (clientes, técnicos, equipamentos)
    if (active === 'supervisor') {
      const supervisorAllowedRoutes = [
        '/dashboard',        // Dashboard (visualização)
        '/orders',           // Acessa, cria e atende ordens de serviço
        '/checklists',       // Visualiza e preenche checklists
        '/reports',          // Acessa relatórios (quando implementado)
        '/service-orders',   // Histórico de ordens de serviço
        '/os/',              // Detalhes de ordem de serviço individual
      ]
      
      const isAllowed = supervisorAllowedRoutes.some(route => pathname?.startsWith(route))
      
      if (!isAllowed) {
        console.log('[RouteProtection] Supervisor tentando acessar rota não permitida (cadastros) - redirecionando para /orders')
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

  if (isTecnico || isSupervisor) {
    return null // Já redirecionou
  }

  return <>{children}</>
}

