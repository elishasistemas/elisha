import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logEvent } from '@/lib/logsnag'

/**
 * API para convidar um admin Elisha
 * Apenas para uso interno - deve ser protegido em produção
 */
export async function POST(request: Request) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
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

    // 1. Criar usuário e enviar invite
    const { data: user, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          name: name || 'Elisha Admin',
          is_elisha_admin: true
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    )

    if (inviteError) {
      console.error('[invite-elisha-admin] Erro ao convidar:', inviteError)
      return NextResponse.json(
        { error: `Erro ao convidar: ${inviteError.message}` },
        { status: 500 }
      )
    }

    if (!user || !user.user) {
      return NextResponse.json(
        { error: 'Usuário não foi criado' },
        { status: 500 }
      )
    }

    // 2. Criar profile como elisha_admin
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.user.id,
        nome: name || 'Elisha Admin',
        roles: ['elisha_admin'],
        active_role: 'elisha_admin',
        is_elisha_admin: true,
        empresa_id: null
      })

    if (profileError) {
      console.error('[invite-elisha-admin] Erro ao criar profile:', profileError)
      return NextResponse.json(
        { error: `Erro ao criar profile: ${profileError.message}` },
        { status: 500 }
      )
    }

    // 3. Atualizar app_metadata
    await supabase.auth.admin.updateUserById(user.user.id, {
      app_metadata: {
        is_elisha_admin: true,
        active_role: 'elisha_admin',
        roles: ['elisha_admin']
      }
    })

    // LogSnag: convite Elisha Admin
    logEvent({
      channel: 'invites',
      event: 'Elisha Admin Invited',
      icon: '🛠️',
      description: `${email} convidado como elisha_admin`,
      tags: { user_id: user.user.id },
      notify: true,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: `Convite enviado para ${email}`,
      user: {
        id: user.user.id,
        email: user.user.email
      }
    })

  } catch (error) {
    console.error('[invite-elisha-admin] Erro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
