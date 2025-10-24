import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logEvent, setInsight } from '@/lib/logsnag'

function isAuthorized(req: NextRequest) {
  const header = req.headers.get('authorization') || ''
  const secret = process.env.CRON_SECRET
  if (!secret) return true // if no secret, allow locally
  return header === `Bearer ${secret}`
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    // Totais
    const [clients, techsActive, ordersToday, ordersOpen, ordersClosed] = await Promise.all([
      supabase.from('clientes').select('id', { count: 'exact', head: true }),
      supabase.from('colaboradores').select('id', { count: 'exact', head: true }).eq('ativo', true),
      supabase.from('ordens_servico').select('id', { count: 'exact', head: true }).gte('created_at', startOfDay.toISOString()),
      supabase.from('ordens_servico').select('id', { count: 'exact', head: true }).in('status', ['novo','em_andamento','aguardando_assinatura','parado']),
      supabase.from('ordens_servico').select('id', { count: 'exact', head: true }).in('status', ['concluido','cancelado']),
    ])

    const metrics = {
      clients_total: clients.count || 0,
      technicians_active: techsActive.count || 0,
      orders_today: ordersToday.count || 0,
      orders_open: ordersOpen.count || 0,
      orders_closed: ordersClosed.count || 0,
    }

    // Update LogSnag insights (best-effort)
    await Promise.all([
      setInsight({ title: 'Clients · Total', value: metrics.clients_total, icon: '👥' }),
      setInsight({ title: 'Technicians · Active', value: metrics.technicians_active, icon: '👷' }),
      setInsight({ title: 'Orders · Today', value: metrics.orders_today, icon: '📝' }),
      setInsight({ title: 'Orders · Open', value: metrics.orders_open, icon: '📂' }),
      setInsight({ title: 'Orders · Closed', value: metrics.orders_closed, icon: '✅' }),
    ])

    // Also log an event to help build charts if insights API is limited
    logEvent({
      channel: 'insights',
      event: 'Snapshot Updated',
      icon: '📊',
      tags: metrics,
    }).catch(() => {})

    return NextResponse.json({ success: true, metrics })
  } catch (err) {
    return NextResponse.json({ error: 'Snapshot failed' }, { status: 500 })
  }
}

