'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'
import { LogoutButton } from '@/components/admin/logout-button'
import Link from 'next/link'

/**
 * Layout para área admin (apenas Elisha admins)
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowser(), [])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  
  useEffect(() => {
    let mounted = true
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!mounted) return
        
        if (!user) {
          router.replace('/login')
          return
        }

        // Verificar se é elisha_admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_elisha_admin')
          .eq('user_id', user.id)
          .single()

        if (!profile?.is_elisha_admin) {
          router.replace('/dashboard')
          return
        }
        
        setUserEmail(user.email || '')
        setIsAuthorized(true)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    
    checkAuth()
    
    return () => {
      mounted = false
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
  
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Elisha Admin</h1>
              <p className="text-sm text-muted-foreground">
                Painel de administração
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {userEmail}
              </span>
              <LogoutButton />
            </div>
          </div>
          
          {/* Navegação */}
          <div className="flex gap-4 mt-4 border-t pt-4">
            <Link 
              href="/admin/companies" 
              className="text-sm font-medium hover:underline"
            >
              Empresas
            </Link>
            <Link 
              href="/admin/users" 
              className="text-sm font-medium hover:underline"
            >
              Usuários
            </Link>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  )
}

