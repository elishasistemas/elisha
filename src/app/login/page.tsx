'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChatBubbleEmpty } from 'iconoir-react'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowser(), [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const missingEnv = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Debug removido para evitar spam no console

  // Se já estiver autenticado, redireciona para o dashboard ou admin/companies
  useEffect(() => {
    let mounted = true
    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      if (data.session) {
        // Verificar se é Elisha Admin (Super Admin) e se está impersonando
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_elisha_admin, impersonating_empresa_id')
          .eq('user_id', data.session.user.id)
          .single()
        
        // Se é super admin sem impersonar, vai para /admin/companies
        // Se está impersonando ou não é super admin, vai para /dashboard
        if (profile?.is_elisha_admin && !profile.impersonating_empresa_id) {
          router.replace('/admin/companies')
        } else {
          router.replace('/dashboard')
        }
      }
    }
    check()
    return () => {
      mounted = false
    }
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('[LOGIN] Auth error:', signInError.message)
        setError(`Erro ao fazer login: ${signInError.message}`)
        return
      }

      if (data.user) {
        // Telemetry: login bem-sucedido (não bloqueante)
        fetch('/api/telemetry/logsnag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: 'auth',
            event: 'Login Success',
            icon: '🔐',
            tags: { method: 'password' },
          }),
        }).catch(() => {})
        // Verificar se é Elisha Admin (Super Admin) e se está impersonando
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_elisha_admin, impersonating_empresa_id')
          .eq('user_id', data.user.id)
          .single()
        
        // Se é super admin sem impersonar, vai para /admin/companies
        // Se está impersonando ou não é super admin, vai para /dashboard
        const redirectPath = (profile?.is_elisha_admin && !profile.impersonating_empresa_id) 
          ? '/admin/companies' 
          : '/dashboard'
        
        // Tentar redirecionamento com Next.js router
        router.replace(redirectPath)
        
        // Fallback com window.location para garantir redirecionamento
        setTimeout(() => {
          window.location.href = redirectPath
        }, 100)

      } else {
        setError('Erro inesperado no login.')
      }
    } catch (err) {
      console.error('[LOGIN] Unexpected error:', err instanceof Error ? err.message : err)
      
      let errorMessage = 'Ocorreu um erro ao entrar. Tente novamente.'
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = 'Erro de conexão. Verifique sua internet.'
        } else if (err.message.includes('ERR_NAME_NOT_RESOLVED')) {
          errorMessage = 'Erro de conexão com Supabase.'
        } else {
          errorMessage = `Erro: ${err.message}`
        }
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setError(null)
    setInfo(null)
    if (!email) {
      setError('Informe seu email para recuperar a senha.')
      return
    }
    try {
      const redirectTo = `${window.location.origin}/reset-password`
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })
      if (resetError) {
        setError('Não foi possível enviar o email de recuperação.')
        return
      }
      setInfo('Enviamos um email com instruções para redefinir sua senha.')
    } catch (e) {
      setError('Ocorreu um erro ao solicitar a recuperação de senha.')
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-background">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <img
              src="/logo-completa.svg"
              alt="Elisha Logo"
              className="inset-0 h-[32px]" />
              <p>· Administrador</p>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">

            <div>

              <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight pb-8">
               Bem vindo de volta </h3>
              {missingEnv ? (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  Configuração do Supabase ausente. Defina as variáveis
                  <code className="mx-1">NEXT_PUBLIC_SUPABASE_URL</code> e
                  <code className="mx-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> em <code>.env.local</code> e reinicie o servidor.
                </div>
              ) : null}
              <form className="space-y-8" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Esqueceu sua senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {error ? (
                  <p className="text-sm text-destructive">{error}</p>
                ) : null}
                {info ? (
                  <p className="text-sm text-green-600">{info}</p>
                ) : null}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/bg.svg"
          alt="Background"
          className="absolute inset-0 h-full w-full object-cover object-center 
                     dark:brightness-[0.2] dark:grayscale
                     lg:object-left xl:object-center 2xl:object-center
                     transition-all duration-300"
        />
      </div>
    </div>
  )
}
