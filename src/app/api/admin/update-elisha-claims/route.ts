import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Atualizar JWT claims para elisha_admin
 * Execute após configurar o profile
 */
export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_elisha_admin, roles, active_role')
      .eq('user_id', userId)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar app_metadata
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: {
        is_elisha_admin: profile.is_elisha_admin,
        roles: profile.roles,
        active_role: profile.active_role,
        empresa_id: null // Elisha admin não tem empresa fixa
      }
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[update-elisha-claims]:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}

