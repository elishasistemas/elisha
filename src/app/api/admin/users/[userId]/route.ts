import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API para atualizar usuário (apenas elisha_admin)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const body = await request.json()

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

    // Atualizar profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        nome: body.nome,
        empresa_id: body.empresa_id || null,
        active_role: body.role,
        roles: [body.role],
        is_elisha_admin: body.is_elisha_admin || false
      })
      .eq('id', userId)

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      )
    }

    // Atualizar app_metadata
    await supabase.auth.admin.updateUserById(userId, {
      app_metadata: {
        empresa_id: body.empresa_id || null,
        active_role: body.role,
        roles: [body.role],
        is_elisha_admin: body.is_elisha_admin || false
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[admin/users/update] Erro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * API para deletar usuário (apenas elisha_admin)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    console.log('[admin/users/delete] Tentando deletar usuário:', userId)

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

    // Verificar se service role key está configurada
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[admin/users/delete] SUPABASE_SERVICE_ROLE_KEY não configurada')
      return NextResponse.json(
        { error: 'Service role key não configurada' },
        { status: 500 }
      )
    }

    // Primeiro verificar se o usuário existe no profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, nome, email')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('[admin/users/delete] Erro ao buscar profile:', profileError)
      return NextResponse.json(
        { error: `Perfil não encontrado: ${profileError.message}` },
        { status: 404 }
      )
    }

    console.log('[admin/users/delete] Profile encontrado:', profile)

    // Deletar usuário (cascadeará para profile via FK)
    const { error } = await supabase.auth.admin.deleteUser(profile.user_id)

    if (error) {
      console.error('[admin/users/delete] Erro ao deletar usuário:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log('[admin/users/delete] Usuário deletado com sucesso:', userId)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[admin/users/delete] Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

