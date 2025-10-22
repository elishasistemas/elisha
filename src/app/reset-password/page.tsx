'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { Session } from '@supabase/supabase-js'
import { PasswordStrength } from '@/components/password-strength'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowser()
  const [isReady, setIsReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Ensure we have a recovery session (user clicked the email link)
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setIsReady(true)
        return
      }

      // Some providers send a PASSWORD_RECOVERY event after mount
      const { data: listener } = supabase.auth.onAuthStateChange(
        (event: string, session: Session | null) => {
          if (event === 'PASSWORD_RECOVERY' && session) {
            setIsReady(true)
          }
        }
      )

      return () => listener.subscription.unsubscribe()
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
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
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        const { translateAuthErrorMessage } = await import('@/utils/auth-error-pt')
        setError(translateAuthErrorMessage(updateError))
        return
      }
      setInfo('Senha atualizada com sucesso. Redirecionando...')
      setTimeout(() => router.replace('/login'), 1200)
    } catch (e) {
      setError('Ocorreu um erro ao atualizar a senha.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isReady) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <p className="text-muted-foreground">Abra o link de recuperação enviado ao seu email.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Redefinir senha</CardTitle>
          <CardDescription>Informe a nova senha para sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a nova senha"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                required
              />
            </div>
            <div className="rounded-md border p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Senha forte — dicas rápidas:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>12+ caracteres.</li>
                <li>Misture letras, números e símbolos.</li>
                <li>Evite dados pessoais e padrões (ex.: 123456, qwerty).</li>
              </ul>
            </div>
            <PasswordStrength password={password} confirm={confirmPassword} />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {info ? <p className="text-sm text-green-600">{info}</p> : null}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Atualizando...' : 'Atualizar senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
