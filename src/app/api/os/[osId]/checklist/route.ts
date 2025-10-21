/**
 * API Route: Get Checklist for OS
 * GET /api/os/[osId]/checklist
 * 
 * Returns the checklist snapshot and responses for an OS
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { computeComplianceScore, validateChecklistCompletion } from '@/utils/checklist/computeComplianceScore'

export async function GET(
  request: NextRequest,
  { params }: { params: { osId: string } }
) {
  try {
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

    // Get checklist snapshot
    const { data: osChecklist, error: checklistError } = await supabase
      .from('os_checklists')
      .select('*')
      .eq('os_id', params.osId)
      .maybeSingle()

    if (checklistError) {
      return NextResponse.json(
        { error: checklistError.message },
        { status: 500 }
      )
    }

    if (!osChecklist) {
      return NextResponse.json(
        { error: 'Checklist não encontrado para esta OS' },
        { status: 404 }
      )
    }

    // Get responses
    const { data: respostas, error: respostasError } = await supabase
      .from('checklist_respostas')
      .select('*')
      .eq('os_checklist_id', osChecklist.id)
      .order('item_ordem', { ascending: true })

    if (respostasError) {
      return NextResponse.json(
        { error: respostasError.message },
        { status: 500 }
      )
    }

    // Compute score and validation
    const score = computeComplianceScore(
      osChecklist.template_snapshot,
      respostas || []
    )

    const validation = validateChecklistCompletion(
      osChecklist.template_snapshot,
      respostas || []
    )

    return NextResponse.json({
      osChecklist,
      respostas: respostas || [],
      score,
      validation
    }, { status: 200 })
  } catch (error) {
    console.error('[get-checklist] Error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro ao buscar checklist',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

