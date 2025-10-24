import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { canAcceptClientEvents, logEvent } from '@/lib/logsnag'

export async function POST(request: NextRequest) {
  try {
    if (!canAcceptClientEvents()) {
      return NextResponse.json({ error: 'Client telemetry disabled' }, { status: 403 })
    }

    const payload = await request.json().catch(() => null) as any
    if (!payload || !payload.channel || !payload.event) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    const allowed = new Set(['auth','invites','checklist','os','orders','clients','technicians','users','pwa'])
    if (!allowed.has(String(payload.channel))) {
      return NextResponse.json({ error: 'Channel not allowed' }, { status: 400 })
    }

    // Attach user context if available
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    await logEvent({
      channel: String(payload.channel),
      event: String(payload.event),
      description: payload.description ? String(payload.description) : undefined,
      icon: payload.icon ? String(payload.icon) : undefined,
      tags: payload.tags && typeof payload.tags === 'object' ? payload.tags : undefined,
      notify: Boolean(payload.notify),
      user_id: user?.id,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Telemetry error' }, { status: 500 })
  }
}
