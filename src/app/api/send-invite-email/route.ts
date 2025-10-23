import { NextResponse } from 'next/server'
import { Resend } from 'resend'

/**
 * API para enviar email de convite via Resend
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

    // Lazy instantiate Resend to avoid build-time errors
    const resend = new Resend(process.env.RESEND_API_KEY)

    const roleLabels: Record<string, string> = {
      admin: 'Admin',
      tecnico: 'Técnico',
    }

    const roleLabel = roleLabels[role] || role

    // Template HTML do email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background-color: #f4f4f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    h1 {
      color: #18181b;
      font-size: 24px;
      margin-bottom: 16px;
      text-align: center;
    }
    .emoji {
      font-size: 48px;
      text-align: center;
      margin-bottom: 24px;
    }
    .intro {
      color: #3f3f46;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .invite-box {
      background: #f4f4f5;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
    }
    .invite-box p {
      margin: 8px 0;
      color: #3f3f46;
    }
    .invite-box strong {
      color: #18181b;
    }
    .button {
      display: block;
      background: #3b82f6;
      color: white;
      padding: 16px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      text-align: center;
      margin: 32px 0;
    }
    .link-box {
      background: #fafafa;
      border: 1px solid #e4e4e7;
      border-radius: 6px;
      padding: 12px;
      margin: 16px 0;
      word-break: break-all;
      font-size: 14px;
      color: #71717a;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid #e4e4e7;
      color: #71717a;
      font-size: 14px;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
      font-size: 14px;
      color: #92400e;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="emoji">🎉</div>
    
    <h1>Você foi convidado!</h1>
    
    <p class="intro">
      <strong>${empresaNome}</strong> convidou você para acessar o 
      <strong>Sistema Elisha</strong> como <strong>${roleLabel}</strong>.
    </p>
    
    <div class="invite-box">
      <p><strong>📧 Email:</strong> ${to}</p>
      <p><strong>👤 Papel:</strong> ${roleLabel}</p>
      <p><strong>🏢 Empresa:</strong> ${empresaNome}</p>
    </div>
    
    <p style="color: #3f3f46; line-height: 1.6;">
      Clique no botão abaixo para criar sua senha e começar a usar o sistema:
    </p>
    
    <a href="${inviteUrl}" class="button">
      Aceitar Convite e Criar Conta
    </a>
    
    <p style="font-size: 14px; color: #71717a; text-align: center;">
      Ou copie e cole este link no seu navegador:
    </p>
    
    <div class="link-box">
      ${inviteUrl}
    </div>
    
    <div class="warning">
      <strong>⏰ Atenção:</strong> Este convite expira em <strong>7 dias</strong> e só pode ser usado uma vez.
    </div>
    
    <div class="footer">
      <p><strong>Sistema Elisha</strong> - Gestão Inteligente</p>
      <p style="margin-top: 8px;">
        Este é um email automático. Por favor, não responda.
      </p>
      <p style="margin-top: 16px; font-size: 12px;">
        Se você não solicitou este convite, pode ignorar este email.
      </p>
    </div>
  </div>
</body>
</html>
    `

    // Versão texto simples (fallback)
    const textContent = `
Você foi convidado!

${empresaNome} convidou você para acessar o Sistema Elisha como ${roleLabel}.

Email: ${to}
Papel: ${roleLabel}
Empresa: ${empresaNome}

Para aceitar o convite, acesse:
${inviteUrl}

⏰ Este convite expira em 7 dias e só pode ser usado uma vez.

---
Sistema Elisha - Gestão Inteligente
Este é um email automático. Por favor, não responda.
    `

    // Enviar email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: `🎉 Convite para acessar ${empresaNome} - Sistema Elisha`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('[send-invite-email] Erro ao enviar:', error)
      return NextResponse.json(
        { error: `Erro ao enviar email: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('[send-invite-email] Email enviado com sucesso:', data)

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      to,
      empresaNome,
    })
  } catch (error: any) {
    console.error('[send-invite-email] Erro:', error)
    return NextResponse.json(
      { error: 'Erro interno ao enviar email' },
      { status: 500 }
    )
  }
}

