import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { LogoutButton } from '@/components/admin/logout-button'
import Link from 'next/link'

/**
 * Layout para área admin (apenas Elisha admins)
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServer()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Verificar se é elisha_admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_elisha_admin, active_role')
    .eq('id', user.id)
    .single()

  if (!profile?.is_elisha_admin || profile.active_role !== 'elisha_admin') {
    redirect('/dashboard')
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
                {user.email}
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

