'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChatBubbleEmpty } from 'iconoir-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowser(), [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const missingEnv = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Debug removido para evitar spam no console

  // Se já estiver autenticado, redireciona para o dashboard
  useEffect(() => {
    let mounted = true
    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      if (data.session) {
        router.replace('/dashboard')
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
        setError('Email ou senha inválidos.')
        return
      }

      if (data.user) {
        // Tentar redirecionamento com Next.js router
        router.replace('/dashboard')
        
        // Fallback com window.location para garantir redirecionamento
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 100)

      } else {
        setError('Erro inesperado no login.')
      }
    } catch (err) {
      setError('Ocorreu um erro ao entrar. Tente novamente.')
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
               Bem vindo de volta</h3>
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
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
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
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
