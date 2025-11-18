'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, X } from 'lucide-react'
import { toast } from 'sonner'
import { RoleSwitcher } from '@/components/role-switcher'

export function ImpersonationBanner() {
  const [impersonating, setImpersonating] = useState<{
    empresaId: string
    empresaNome: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    async function checkImpersonation() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('impersonating_empresa_id')
        .eq('user_id', user.id)
        .single()

      if (profile?.impersonating_empresa_id) {
        // Buscar nome da empresa
        const { data: empresa } = await supabase
          .from('empresas')
          .select('nome')
          .eq('id', profile.impersonating_empresa_id)
          .single()

        if (empresa) {
          setImpersonating({
            empresaId: profile.impersonating_empresa_id,
            empresaNome: empresa.nome
          })
        }
      }
    }

    checkImpersonation()
  }, [supabase])

  const handleStopImpersonation = async () => {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch('/api/admin/stop-impersonation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      if (!response.ok) {
        throw new Error('Erro ao sair do modo impersonation')
      }

      // Refresh session
      await supabase.auth.refreshSession()

      toast.success('Saiu do modo impersonation')

      // Voltar para painel admin
      setTimeout(() => {
        window.location.href = '/admin/companies'
      }, 500)

    } catch (error: any) {
      console.error('[stop-impersonation] Erro:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!impersonating) return null

  return (
    <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950 mb-4">
      <Eye className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <span>
            <strong>Modo Impersonation:</strong> Você está visualizando como{' '}
            <strong>{impersonating.empresaNome}</strong>
          </span>
          <RoleSwitcher className="ml-4" />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleStopImpersonation}
          disabled={loading}
        >
          <X className="mr-2 h-4 w-4" />
          {loading ? 'Saindo...' : 'Sair'}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

