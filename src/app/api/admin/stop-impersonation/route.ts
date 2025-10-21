import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API para sair do modo de impersonation
 */
export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Buscar log ativo de impersonation
    const { data: activeLog } = await supabase
      .from('impersonation_logs')
      .select('id, empresa_id')
      .eq('admin_id', userId)
      .is('ended_at', null)
      .single()

    // 2. Finalizar log
    if (activeLog) {
      await supabase
        .from('impersonation_logs')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', activeLog.id)
    }

    // 3. Remover impersonating_empresa_id do profile
    await supabase
      .from('profiles')
      .update({ impersonating_empresa_id: null })
      .eq('id', userId)

    // 4. Atualizar claims
    await supabase.auth.admin.updateUserById(userId, {
      app_metadata: {
        impersonating_empresa_id: null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[stop-impersonation]:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}

