'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export default function DebugLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const router = useRouter()
  const supabase = createSupabaseBrowser()

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`])
  }

  useEffect(() => {
    let mounted = true
    addDebugInfo('Iniciando verificação de sessão')
    
    const checkSession = async () => {
      try {
        addDebugInfo('Chamando supabase.auth.getSession()')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        addDebugInfo(`Resposta getSession: ${JSON.stringify({ session: !!session, error })}`)
        
        if (!mounted) return
        
        if (error) {
          addDebugInfo(`Erro na sessão: ${error.message}`)
          setHasSession(false)
          router.replace('/login')
        } else if (!session) {
          addDebugInfo('Nenhuma sessão encontrada, redirecionando para login')
          setHasSession(false)
          router.replace('/login')
        } else {
          addDebugInfo(`Sessão encontrada: ${session.user?.email}`)
          setHasSession(true)
        }
      } catch (err) {
        addDebugInfo(`Erro no checkSession: ${err}`)
        setHasSession(false)
        router.replace('/login')
      } finally {
        if (mounted) {
          addDebugInfo('Finalizando checkSession')
          setIsLoading(false)
        }
      }
    }
    
    checkSession()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      addDebugInfo(`Auth state change: ${event}, session: ${!!session}`)
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
          <p className="text-muted-foreground">Verificando sessão...</p>
          <div className="mt-4 text-xs text-left max-w-md mx-auto">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            {debugInfo.map((info, i) => (
              <div key={i} className="text-muted-foreground">{info}</div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecionando para login...</p>
          <div className="mt-4 text-xs text-left max-w-md mx-auto">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            {debugInfo.map((info, i) => (
              <div key={i} className="text-muted-foreground">{info}</div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
