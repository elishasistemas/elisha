import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API para criar usuário de uma empresa (apenas elisha_admin)
 */
export async function POST(request: Request) {
  try {
    const { email, name, role, empresaId } = await request.json()

    if (!email || !name || !empresaId) {
      return NextResponse.json(
        { error: 'Email, nome e empresaId são obrigatórios' },
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

    // Verificar se empresa existe
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id, nome')
      .eq('id', empresaId)
      .single()

    if (empresaError || !empresa) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    // 1. Criar usuário e enviar invite
    const { data: authData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          name,
          empresa_id: empresaId,
          active_role: role || 'gestor',
          roles: [role || 'gestor']
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    )

    if (inviteError) {
      console.error('[create-company-user] Erro ao convidar:', inviteError)
      return NextResponse.json(
        { error: `Erro ao convidar: ${inviteError.message}` },
        { status: 500 }
      )
    }

    if (!authData || !authData.user) {
      return NextResponse.json(
        { error: 'Usuário não foi criado' },
        { status: 500 }
      )
    }

    // 2. Criar profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        nome: name,
        empresa_id: empresaId,
        roles: [role || 'gestor'],
        active_role: role || 'gestor',
        is_elisha_admin: false
      })

    if (profileError) {
      console.error('[create-company-user] Erro ao criar profile:', profileError)
      // Tentar deletar o usuário criado
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: `Erro ao criar profile: ${profileError.message}` },
        { status: 500 }
      )
    }

    // 3. Atualizar app_metadata
    await supabase.auth.admin.updateUserById(authData.user.id, {
      app_metadata: {
        empresa_id: empresaId,
        active_role: role || 'gestor',
        roles: [role || 'gestor'],
        is_elisha_admin: false
      }
    })

    return NextResponse.json({
      success: true,
      message: `Convite enviado para ${email}`,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        empresa: empresa.nome
      }
    })

  } catch (error) {
    console.error('[create-company-user] Erro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

