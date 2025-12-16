'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'

export function LogoutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseBrowser()

  const handleLogout = async () => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error
      
      toast.success('Logout realizado com sucesso')
      // Hard reload para evitar problemas de chunks
      window.location.href = '/login'
    } catch (error: any) {
      console.error('[logout] Erro:', error)
      toast.error(`Erro ao fazer logout: ${error.message}`)
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={loading}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {loading ? 'Saindo...' : 'Sair'}
    </Button>
  )
}


