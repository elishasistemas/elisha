import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    // 1. Criar client com cookies para validar autenticação
    const cookieStore = await cookies()
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll().map(cookie => ({ name: cookie.name, value: cookie.value })),
          setAll: () => {},
        }
      }
    )

    // Validar usuário autenticado
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // 2. Service role client para operações admin (bypassa RLS)
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

    // 3. Verificar se empresa existe
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

    // 4. Criar convite diretamente na tabela (service role bypassa RLS)
    const { data: inviteData, error: inviteError } = await supabase
      .from('invites')
      .insert({
        empresa_id: empresaId,
        email: email.trim().toLowerCase(),
        role: roleToUse,
        created_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single()

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

    // 5. Gerar link de convite
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/signup?token=${inviteData.token}`

    // 6. Enviar email de convite (sem bloquear a resposta)
    fetch(`${baseUrl}/api/send-invite-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        empresaNome: empresa.nome,
        role: roleToUse,
        inviteUrl: inviteUrl
      })
    }).catch(err => {
      console.error('[create-company-user] Erro ao enviar email (não-bloqueante):', err)
      // Não falha a criação do convite se o email falhar
    })

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

