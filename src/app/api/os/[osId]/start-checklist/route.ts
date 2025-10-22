/**
 * API Route: Start Checklist for OS
 * POST /api/os/[osId]/start-checklist
 * 
 * Creates an immutable snapshot of a checklist and pre-populates responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { startChecklistForOS } from '@/services/checklist/startChecklistForOS'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ osId: string }> }
) {
  try {
    // Await params (Next.js 15+)
    const { osId } = await params
    
    // Parse request body
    const body = await request.json()
    const { checklistId } = body as { checklistId: string }

    if (!checklistId) {
      return NextResponse.json(
        { error: 'checklistId é obrigatório' },
        { status: 400 }
      )
    }

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

    // Start checklist (idempotent)
    const result = await startChecklistForOS(
      { osId, checklistId },
      supabase
    )

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[start-checklist] Error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro ao iniciar checklist',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

