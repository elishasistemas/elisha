import { NextResponse } from 'next/server'

/**
 * API para enviar email de convite via Resend
 * 
 * NOTA: Resend está DESATIVADO temporariamente.
 * O sistema funciona apenas com convite por link.
 * O link de convite é retornado na resposta da criação do convite.
 */
export async function POST(request: Request) {
  try {
    const { to, empresaNome, role, inviteUrl } = await request.json()

    if (!to || !empresaNome || !role || !inviteUrl) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }

    // Resend está desativado - apenas logar e retornar sucesso
    console.log('[send-invite-email] Resend desativado. Convite criado:', {
      to,
      empresaNome,
      role,
      inviteUrl,
      note: 'Email não enviado. Use o link de convite retornado na resposta.'
    })

    // Retornar sucesso sem enviar email
    // O link de convite já está disponível na resposta da criação do convite
    return NextResponse.json({
      success: true,
      message: 'Convite criado com sucesso. Use o link retornado para compartilhar.',
      emailDisabled: true,
      to,
      empresaNome,
      inviteUrl, // Retornar o link para referência
    })
  } catch (error: any) {
    console.error('[send-invite-email] Erro:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar convite' },
      { status: 500 }
    )
  }
}

