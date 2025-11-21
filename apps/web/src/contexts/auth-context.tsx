'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'
import { dataCache } from '@/lib/cache'

interface Profile {
  user_id: string
  empresa_id: string | null
  active_role: string | null
  roles: string[] | null
  tecnico_id: string | null
  is_elisha_admin: boolean
  impersonating_empresa_id: string | null
  [key: string]: any
}


interface AuthContextData {
  user: User | null
  profile: Profile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextData>({
  user: null,
  profile: null,
  loading: true
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    let mounted = true

    // Carregar usuário e perfil uma única vez
    async function loadAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!mounted) return
        
        setUser(user)

        if (!user) {
          setLoading(false)
          return
        }
        
        // Usar dedupe para evitar múltiplas requisições
        const profileData = await dataCache.dedupe(`profile:${user.id}`, async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

          if (error) throw error
          return data
        })

        if (mounted) {
          setProfile(profileData)
          setLoading(false)
        }
      } catch (error) {
        console.error('[AuthProvider] Erro ao carregar dados:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadAuth()

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user || null)
        if (session?.user) {
          loadAuth()
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        dataCache.invalidateAll()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
