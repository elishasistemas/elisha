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
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, empresa_id, role, nome, username, telefone, whatsapp_numero, funcao, created_at')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })
    
    if (profilesError) {
      console.error('[admin/users/list] Erro ao buscar profiles:', profilesError)
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      )
    }

    // Buscar emails dos usuários usando auth.admin e filtrar órfãos
    const usersWithEmail = await Promise.all(
      (profiles || []).map(async (profile) => {
        // ✅ Usar user_id (não id) para buscar no auth.users
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.user_id)
        
        if (authError || !authUser.user) {
          console.warn(`[admin/users/list] Usuário deletado ou não encontrado ${profile.user_id}, removendo profile órfão...`)
          
          // Remover profile órfão
          const { error: deleteError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', profile.id)
          
          if (deleteError) {
            console.error('Erro ao deletar profile órfão:', deleteError)
          }
          
          return null // Marcar para filtrar
        }

        return {
          ...profile,
          email: authUser.user?.email || 'N/A'
        }
      })
    )
    
    // Filtrar profiles órfãos (null)
    const validUsers = usersWithEmail.filter(user => user !== null)
    
    return NextResponse.json({ users: validUsers })

  } catch (error) {
    console.error('[admin/users/list] Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

