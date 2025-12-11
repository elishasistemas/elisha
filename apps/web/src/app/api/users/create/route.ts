import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logEvent } from '@/lib/logsnag'

/**
 * API para criar usuário diretamente (sem convite)
 * Apenas admin e supervisor podem criar usuários
 * 
 * Body: { username, password, nome, email, telefone, whatsapp, funcao, role, empresa_id }
 */
export async function POST(request: Request) {
  try {
    const {
      username,
      password,
      nome,
      email,
      telefone,
      whatsapp,
      funcao,
      role,
      empresa_id
    } = await request.json()

    // Validações
    if (!username || !password || !nome || !email || !role || !empresa_id) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: username, password, nome, email, role, empresa_id' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 8 caracteres' },
        { status: 400 }
      )
    }

    if (!['admin', 'supervisor', 'tecnico'].includes(role)) {
      return NextResponse.json(
        { error: 'Role inválido. Use: admin, supervisor ou tecnico' },
        { status: 400 }
      )
    }

    // Service role client (bypassa RLS)
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

    // 1. Verificar se username já existe
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Nome de usuário já está em uso' },
        { status: 409 }
      )
    }

    // 2. Verificar se empresa existe
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id, nome')
      .eq('id', empresa_id)
      .single()

    if (empresaError || !empresa) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    // 3. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        nome,
        username,
        role,
        empresa_id
      }
    })

    if (authError) {
      console.error('[users/create] Erro ao criar usuário no auth:', authError)
      return NextResponse.json(
        { error: `Erro ao criar usuário: ${authError.message}` },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Usuário não foi criado' },
        { status: 500 }
      )
    }

    // 4. Criar/Atualizar profile
    let tecnico_id = null

    // Criar registro na tabela colaboradores (para todos os roles)
    const { data: colaboradorData, error: colaboradorError } = await supabase
      .from('colaboradores')
      .insert({
        empresa_id,
        user_id: authData.user.id,
        nome,
        telefone: telefone || whatsapp,
        whatsapp_numero: whatsapp,
        funcao: funcao || (role === 'admin' ? 'Administrador' : role === 'supervisor' ? 'Supervisor' : 'Técnico'),
        ativo: true
      })
      .select('id')
      .single()

    if (colaboradorError) {
      console.error('[users/create] Erro ao criar colaborador:', colaboradorError)
      // Não falhar, apenas log
    } else {
      tecnico_id = colaboradorData.id
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        user_id: authData.user.id,
        username,
        nome,
        whatsapp_numero: whatsapp,
        funcao,
        empresa_id,
        role,
        active_role: role,
        roles: [role],
        tecnico_id,
        is_elisha_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('[users/create] Erro ao criar profile:', profileError)
      // Tentar deletar usuário criado
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: `Erro ao criar profile: ${profileError.message}` },
        { status: 500 }
      )
    }

    // 5. Log de auditoria
    await logEvent({
      channel: 'users',
      event: 'Usuário Criado',
      description: `${nome} (${username}) foi criado na empresa ${empresa.nome}`,
      icon: '👤',
      notify: false,
      tags: {
        role,
        empresa: empresa.nome,
        email
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        id: authData.user.id,
        username,
        nome,
        email,
        role,
        empresa_id,
        tecnico_id
      }
    })

  } catch (error) {
    console.error('[users/create] Erro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
