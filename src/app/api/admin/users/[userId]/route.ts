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

    // Deletar usuário (cascadeará para profile)
    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[admin/users/delete] Erro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

