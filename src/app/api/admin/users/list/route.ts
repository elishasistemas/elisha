import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { empresaId } = await request.json()

    if (!empresaId) {
      return NextResponse.json(
        { error: 'empresaId é obrigatório' },
        { status: 400 }
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[admin/users/list] SUPABASE_SERVICE_ROLE_KEY não configurada.')
      return NextResponse.json(
        { error: 'Chave de serviço Supabase não configurada.' },
        { status: 500 }
      )
    }

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

    // Buscar profiles da empresa
    console.log(`[admin/users/list] Buscando usuários para empresa: ${empresaId}`)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, empresa_id, role, nome, created_at')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })
    
    console.log(`[admin/users/list] Profiles encontrados: ${profiles?.length || 0}`)

    if (profilesError) {
      console.error('[admin/users/list] Erro ao buscar profiles:', profilesError)
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      )
    }

    // Buscar emails dos usuários usando auth.admin
    const usersWithEmail = await Promise.all(
      (profiles || []).map(async (profile) => {
        // ✅ Usar user_id (não id) para buscar no auth.users
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.user_id)
        
        if (authError) {
          console.warn(`[admin/users/list] Erro ao buscar email do usuário ${profile.user_id}:`, authError)
          return {
            ...profile,
            email: 'N/A'
          }
        }

        console.log(`[admin/users/list] Email encontrado para ${profile.user_id}: ${authUser.user?.email}`)
        return {
          ...profile,
          email: authUser.user?.email || 'N/A'
        }
      })
    )
    
    console.log(`[admin/users/list] Total de usuários com email: ${usersWithEmail.length}`)

    return NextResponse.json({ users: usersWithEmail })

  } catch (error) {
    console.error('[admin/users/list] Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

