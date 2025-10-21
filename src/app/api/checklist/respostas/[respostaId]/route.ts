/**
 * API Route: Update Checklist Response
 * PATCH /api/checklist/respostas/[respostaId]
 * 
 * Updates a checklist response item (incremental save)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { UpdateRespostaDTO } from '@/types/checklist'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { respostaId: string } }
) {
  try {
    // Parse request body
    const body = await request.json() as UpdateRespostaDTO

    // Create Supabase client with user context
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Get user's profile to set respondido_por
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, empresa_id')
      .eq('user_id', user.id)
      .single()

    // Prepare update data
    const updateData: any = {
      ...body,
      updated_at: new Date().toISOString()
    }

    // Auto-set respondido_por and respondido_em if status is being changed
    if (body.status_item && body.status_item !== 'pendente') {
      if (!updateData.respondido_por && profile?.id) {
        updateData.respondido_por = profile.id
      }
      if (!updateData.respondido_em) {
        updateData.respondido_em = new Date().toISOString()
      }
    }

    // Update response
    const { data: resposta, error: updateError } = await supabase
      .from('checklist_respostas')
      .update(updateData)
      .eq('id', params.respostaId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(resposta, { status: 200 })
  } catch (error) {
    console.error('[update-resposta] Error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro ao atualizar resposta',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

