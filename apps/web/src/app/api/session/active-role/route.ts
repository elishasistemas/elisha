import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const role = body?.role as 'admin' | 'supervisor' | 'tecnico'
    if (role !== 'admin' && role !== 'supervisor' && role !== 'tecnico') {
      return NextResponse.json({ error: 'role inválido' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.auth.updateUser({ data: { active_role: role } })
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.set('active_role', role, { path: '/', sameSite: 'lax' })
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Falha ao atualizar active_role' }, { status: 500 })
  }
}

