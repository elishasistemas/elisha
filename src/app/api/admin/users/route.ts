import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API para listar todos os usuários (apenas elisha_admin)
 */
export async function GET() {
  try {
    // Service role client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Buscar todos os perfis
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nome, empresa_id, roles, active_role, is_elisha_admin, created_at')
      .order('created_at', { ascending: false })

    if (profilesError) {
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      )
    }

    // Buscar emails dos usuários
    const usersWithEmails = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: authData } = await supabase.auth.admin.getUserById(profile.id)
        return {
          ...profile,
          email: authData.user?.email || 'N/A'
        }
      })
    )

    return NextResponse.json(usersWithEmails)

  } catch (error) {
    console.error('[admin/users] Erro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

