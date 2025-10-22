import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API para criar convite de usuário para uma empresa (apenas elisha_admin)
 * Usa o sistema de convites interno (tabela invites)
 */
export async function POST(request: Request) {
  try {
    const { email, name, role, empresaId } = await request.json()

    if (!email || !empresaId) {
      return NextResponse.json(
        { error: 'Email e empresaId são obrigatórios' },
        { status: 400 }
      )
    }

    const roleToUse = role || 'gestor'

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

    // Pegar o usuário autenticado (super admin)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Criar convite usando RPC (bypassa RLS)
    const { data: inviteData, error: inviteError } = await supabase.rpc('create_invite', {
      p_empresa_id: empresaId,
      p_email: email.trim().toLowerCase(),
      p_role: roleToUse,
      p_expires_days: 7
    })

    if (inviteError) {
      console.error('[create-company-user] Erro ao criar convite:', inviteError)
      return NextResponse.json(
        { error: `Erro ao criar convite: ${inviteError.message}` },
        { status: 500 }
      )
    }

    if (!inviteData || !inviteData.token) {
      return NextResponse.json(
        { error: 'Convite não foi criado' },
        { status: 500 }
      )
    }

    // Gerar link de convite
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/signup?token=${inviteData.token}`

    return NextResponse.json({
      success: true,
      message: `Convite criado para ${email}`,
      invite: {
        token: inviteData.token,
        url: inviteUrl,
        email: email,
        role: roleToUse,
        empresa: empresa.nome,
        expires_at: inviteData.expires_at
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

