import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logEvent } from '@/lib/logsnag'

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
        name: body.nome,  // <-- FIX: usar 'name' ao invés de 'nome'
        empresa_id: body.empresa_id || null,
        active_role: body.role,
        roles: [body.role],
        is_elisha_admin: body.is_elisha_admin || false
      })
      .eq('user_id', userId)

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

    // Telemetry: user updated
    logEvent({
      channel: 'users',
      event: 'User Updated',
      icon: '✏️',
      tags: { user_id: userId, role: body.role, empresa_id: body.empresa_id || 'null', is_elisha_admin: !!body.is_elisha_admin },
    }).catch(() => {})

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
 * API para editar usuário (admin/supervisor da empresa)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const {
      username,
      nome,
      email,
      telefone,
      whatsapp,
      funcao,
      role,
      password
    } = await request.json()

    // Validações
    if (!username || !nome || !email || !role) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: username, nome, email, role' },
        { status: 400 }
      )
    }

    // Validar senha se fornecida
    if (password) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Senha deve ter no mínimo 8 caracteres' },
          { status: 400 }
        )
      }
    }

    if (!['admin', 'supervisor', 'tecnico'].includes(role)) {
      return NextResponse.json(
        { error: 'Role inválido. Use: admin, supervisor ou tecnico' },
        { status: 400 }
      )
    }

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

    console.log('[admin/users/edit] Editando usuário:', { userId, username, email, role })

    // Verificar se username já existe (exceto para o próprio usuário)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .neq('user_id', userId)
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Nome de usuário já está em uso' },
        { status: 409 }
      )
    }

    // Buscar profile atual
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError || !currentProfile) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username,
        nome,
        telefone: telefone || null,
        whatsapp_numero: whatsapp || null,
        funcao: funcao || null,
        role,
        active_role: role,
        roles: [role],
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (profileError) {
      console.error('[admin/users/edit] Erro ao atualizar profile:', profileError)
      return NextResponse.json(
        { error: `Erro ao atualizar profile: ${profileError.message}` },
        { status: 500 }
      )
    }

    // Atualizar email no auth se mudou
    if (email !== currentProfile.email) {
      const { error: emailError } = await supabase.auth.admin.updateUserById(userId, {
        email
      })

      if (emailError) {
        console.error('[admin/users/edit] Erro ao atualizar email:', emailError)
        return NextResponse.json(
          { error: `Erro ao atualizar email: ${emailError.message}` },
          { status: 500 }
        )
      }
    }

    // Atualizar senha se fornecida
    if (password) {
      const { error: passwordError } = await supabase.auth.admin.updateUserById(userId, {
        password
      })

      if (passwordError) {
        console.error('[admin/users/edit] Erro ao atualizar senha:', passwordError)
        return NextResponse.json(
          { error: `Erro ao atualizar senha: ${passwordError.message}` },
          { status: 500 }
        )
      }
    }

    console.log('[admin/users/edit] Usuário atualizado com sucesso')

    // Log de auditoria
    await logEvent({
      channel: 'users',
      event: 'Usuário Editado',
      description: `Usuário ${nome} (${username}) foi editado`,
      icon: '✏️',
      notify: false,
      tags: {
        user_id: userId,
        role,
        username
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Usuário atualizado com sucesso'
    })

  } catch (error) {
    console.error('[admin/users/edit] Erro:', error)
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
      .select('id, user_id, name')  // <-- FIX: usar 'name' ao invés de 'nome' e 'email'
      .eq('user_id', userId)
      .single()

    if (profileError) {
      console.error('[admin/users/delete] Erro ao buscar profile:', profileError)
      return NextResponse.json(
        { error: `Perfil não encontrado: ${profileError.message}` },
        { status: 404 }
      )
    }

    console.log('[admin/users/delete] Profile encontrado:', profile)

    // Primeiro deletar profile
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId)

    if (deleteProfileError) {
      console.error('[admin/users/delete] Erro ao deletar profile:', deleteProfileError)
      return NextResponse.json(
        { error: `Erro ao deletar profile: ${deleteProfileError.message}` },
        { status: 500 }
      )
    }

    // Depois deletar usuário do auth
    const { error } = await supabase.auth.admin.deleteUser(profile.user_id)

    if (error) {
      console.error('[admin/users/delete] Erro ao deletar usuário:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log('[admin/users/delete] Usuário deletado com sucesso:', userId)

    // Telemetry: user deleted
    logEvent({
      channel: 'users',
      event: 'User Deleted',
      icon: '🗑️',
      tags: { user_id: userId, name: profile.name || '' },  // <-- FIX: usar 'name' ao invés de 'email'
      notify: false,
    }).catch(() => {})
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[admin/users/delete] Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
