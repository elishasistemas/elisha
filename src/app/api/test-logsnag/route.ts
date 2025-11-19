import { NextResponse } from 'next/server'
import { logEvent, setInsight } from '@/lib/logsnag'

// Endpoint temporário para testar LogSnag em produção
// DELETE THIS FILE AFTER TESTING
export async function GET() {
  try {
    // Envia um evento de teste
    await logEvent({
      channel: 'test',
      event: 'Production Test Event',
      description: `Teste realizado em ${new Date().toISOString()}`,
      icon: '🧪',
      tags: { test: 'true', timestamp: Date.now() },
    })

    // Envia um Insight de teste
    await setInsight({
      title: 'Test Counter',
      value: Math.floor(Math.random() * 100),
      icon: '🎲',
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Evento e Insight enviados!',
      env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

