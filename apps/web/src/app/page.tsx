'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'
import { apiClient } from '@/lib/api-client'

export default function HomePage() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowser(), [])
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let mounted = true

    const run = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!mounted) return
        if (data.session) {
          try {
            // Verificar se é Elisha Admin (Super Admin) e se está impersonando via backend
            const profile = await apiClient.profiles.getByUserId(data.session.user.id, data.session.access_token)
            
            // Se é super admin sem impersonar, vai para /admin/companies
            // Se está impersonando ou não é super admin, vai para /dashboard
            if (profile?.is_elisha_admin && !profile.impersonating_empresa_id) {
              router.replace('/admin/companies')
            } else {
              router.replace('/dashboard')
            }
          } catch (error) {
            console.error('Erro ao buscar profile:', error)
            router.replace('/dashboard')
          }
        } else {
          router.replace('/login')
        }
      } finally {
        if (mounted) setChecking(false)
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">
          {checking ? 'Verificando sessão...' : 'Redirecionando...'}
        </p>
      </div>
    </div>
  )
}
