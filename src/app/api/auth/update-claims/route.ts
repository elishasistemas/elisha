import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API Route para atualizar JWT claims do usuário
 * 
 * Chamada quando o usuário faz login ou troca de role ativo
 * Atualiza app_metadata que será incluído no JWT
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // Client com service role key para admin operations
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

    // Buscar dados do profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('empresa_id, active_role, tecnico_id, roles')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('[update-claims] Erro ao buscar profile:', profileError)
      return NextResponse.json(
        { error: 'Profile não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar app_metadata do usuário no Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        app_metadata: {
          empresa_id: profile.empresa_id,
          active_role: profile.active_role,
          tecnico_id: profile.tecnico_id,
          roles: profile.roles
        }
      }
    )

    if (updateError) {
      console.error('[update-claims] Erro ao atualizar metadata:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar claims' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      claims: {
        empresa_id: profile.empresa_id,
        active_role: profile.active_role,
        tecnico_id: profile.tecnico_id,
        roles: profile.roles
      }
    })

  } catch (error) {
    console.error('[update-claims] Erro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

