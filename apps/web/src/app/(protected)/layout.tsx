'use client'

import { useEffect, useMemo, useState } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'
import { apiClient } from '@/lib/api-client'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { RoleSwitch } from '@/components/role-switch'
import { OSDock } from '@/components/os-dock'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowser(), [])

  useEffect(() => {
    let mounted = true
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        if (!session) {
          router.replace('/login')
          setHasSession(false)
        } else {
          try {
            // Verificar se é super admin SEM estar impersonando via backend
            const profile = await apiClient.profiles.getByUserId(session.user.id, session.access_token)

            // Se é super admin MAS NÃO está impersonando, redireciona para /admin/companies
            if (profile?.is_elisha_admin && !profile.impersonating_empresa_id) {
              router.replace('/admin/companies')
              return
            }
          } catch (error) {
            console.error('Erro ao buscar profile:', error)
          }

          setHasSession(true)
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    checkSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return
      if (!session) {
        setHasSession(false)
        router.replace('/login')
      } else {
        setHasSession(true)
      }
    })
    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecionando para login...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b border-muted">
            <div className="flex items-center gap-2 px-2 md:px-4 w-full justify-between">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                <RoleSwitch />
              </div>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-3 md:gap-4 p-2 md:p-4 pt-0 overflow-x-hidden">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Dock global que aparece em todas as páginas */}
      <OSDock />
    </>
  )
}
