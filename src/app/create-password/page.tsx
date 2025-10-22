'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'iconoir-react'
import { PasswordStrength } from '@/components/password-strength'

function CreatePasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseBrowser()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const checkToken = async () => {
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      
      if (accessToken && refreshToken) {
        try {
          // Definir a sessão com os tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            setError('Link inválido ou expirado.')
            return
          }

          if (data.user) {
            setIsValidToken(true)
            setUserEmail(data.user.email || '')
          }
        } catch (err) {
          setError('Erro ao validar o link.')
        }
      } else {
        setError('Link inválido. Verifique o email enviado.')
      }
    }

    checkToken()
  }, [searchParams, supabase.auth])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setIsLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        const { translateAuthErrorMessage } = await import('@/utils/auth-error-pt')
        setError(translateAuthErrorMessage(updateError))
        return
      }

      // Redirecionar para o dashboard após sucesso
      router.replace('/dashboard')
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Validando Link</CardTitle>
            <CardDescription>
              Verificando o link de acesso...
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => router.replace('/login')} className="w-full">
                  Voltar ao Login
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Criar Senha
          </CardTitle>
          <CardDescription>
            Bem-vindo à Elisha! Crie sua senha para acessar o sistema.
            <br />
            <strong>Email:</strong> {userEmail}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <PasswordStrength password={password} confirm={confirmPassword} />
            <div className="rounded-md border p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Senha forte — dicas rápidas:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>12+ caracteres.</li>
                <li>Misture letras, números e símbolos.</li>
                <li>Evite dados pessoais e padrões (ex.: 123456, qwerty).</li>
              </ul>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Criando senha...' : 'Criar Senha e Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CreatePasswordPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <CreatePasswordContent />
    </Suspense>
  )
}
