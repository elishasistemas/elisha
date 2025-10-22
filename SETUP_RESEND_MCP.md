# 📧 Setup Resend MCP Server

Guia para configurar o servidor MCP do Resend para enviar emails automaticamente.

---

## 🚀 Opção 1: Usar NPX (Recomendado - Mais Simples)

### Passo 1: Obter Chave API do Resend

1. Acesse [Resend Dashboard](https://resend.com/api-keys)
2. Crie uma nova API Key
3. Copie a chave (começa com `re_`)

### Passo 2: Atualizar `.cursor/mcp.json`

Abra `.cursor/mcp.json` e substitua pela versão NPX:

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": [
        "shadcn@latest",
        "mcp"
      ]
    },
    "resend": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-resend"
      ],
      "env": {
        "RESEND_API_KEY": "re_SUA_CHAVE_AQUI"
      }
    }
  }
}
```

### Passo 3: Reiniciar Cursor

1. Feche e abra o Cursor
2. O servidor Resend será iniciado automaticamente

---

## 🛠️ Opção 2: Instalar Localmente (Mais Controle)

### Passo 1: Criar Projeto MCP

```bash
# Criar diretório
mkdir -p ~/Projects/mcp-servers
cd ~/Projects/mcp-servers

# Clonar ou criar servidor Resend
git clone https://github.com/modelcontextprotocol/servers.git
cd servers/src/resend

# Instalar dependências
npm install

# Build
npm run build
```

### Passo 2: Atualizar `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": [
        "shadcn@latest",
        "mcp"
      ]
    },
    "resend": {
      "command": "node",
      "args": [
        "/Users/iversondantas/Projects/mcp-servers/servers/src/resend/build/index.js"
      ],
      "env": {
        "RESEND_API_KEY": "re_SUA_CHAVE_AQUI"
      }
    }
  }
}
```

---

## 🧪 Testar Servidor Resend

### Via Cursor (Depois de configurado)

1. Abra o Cursor
2. Use o comando: `@Resend send email`
3. Preencha:
   - **From**: seu-email@dominio-verificado.com
   - **To**: destinatario@email.com
   - **Subject**: Teste MCP Resend
   - **Body**: Email de teste do servidor MCP

### Via Terminal (Teste Manual)

```bash
# Instalar CLI do Resend
npm install -g resend

# Enviar email de teste
resend emails send \
  --from "onboarding@resend.dev" \
  --to "seu-email@gmail.com" \
  --subject "Teste Resend" \
  --text "Email de teste via CLI"
```

---

## 📧 Integrar com Sistema de Convites

### Atualizar API create-company-user

```typescript
// src/app/api/admin/create-company-user/route.ts

// Depois de criar o convite, enviar email
if (inviteData && inviteData.token) {
  const inviteUrl = `${baseUrl}/signup?token=${inviteData.token}`
  
  // Usar MCP Resend via API
  await fetch('http://localhost:3000/api/send-invite-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: email,
      empresaNome: empresa.nome,
      role: roleToUse,
      inviteUrl: inviteUrl
    })
  })
}
```

### Criar API Route para Email

```typescript
// src/app/api/send-invite-email/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { to, empresaNome, role, inviteUrl } = await request.json()
    
    // TODO: Integrar com servidor MCP Resend
    // Por enquanto, apenas log
    console.log('[send-invite-email]', { to, empresaNome, role, inviteUrl })
    
    // Futuramente: usar servidor MCP ou SDK Resend
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[send-invite-email] Erro:', error)
    return NextResponse.json({ error: 'Erro ao enviar email' }, { status: 500 })
  }
}
```

---

## 🎨 Template de Email (HTML)

Crie um template bonito para os convites:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: #f4f4f5;
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
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
    }
    .invite-box {
      background: #f4f4f5;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
    }
    .button {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 12px 32px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      color: #71717a;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <img src="https://elisha.com.br/logo-completa.svg" alt="Elisha" width="160">
    </div>
    
    <h1>🎉 Você foi convidado!</h1>
    
    <p>Olá!</p>
    
    <p>
      <strong>{{EMPRESA_NOME}}</strong> convidou você para acessar o 
      <strong>Sistema Elisha</strong> como <strong>{{ROLE_LABEL}}</strong>.
    </p>
    
    <div class="invite-box">
      <p><strong>📧 Email:</strong> {{EMAIL}}</p>
      <p><strong>👤 Papel:</strong> {{ROLE_LABEL}}</p>
      <p><strong>🏢 Empresa:</strong> {{EMPRESA_NOME}}</p>
    </div>
    
    <p>Clique no botão abaixo para criar sua conta e começar a usar:</p>
    
    <p style="text-align: center; margin: 32px 0;">
      <a href="{{INVITE_URL}}" class="button">
        Aceitar Convite
      </a>
    </p>
    
    <p style="font-size: 14px; color: #71717a;">
      Ou copie e cole este link no seu navegador:<br>
      <code>{{INVITE_URL}}</code>
    </p>
    
    <p style="font-size: 14px; color: #71717a;">
      ⏰ Este convite expira em <strong>7 dias</strong> e só pode ser usado uma vez.
    </p>
    
    <div class="footer">
      <p>Sistema Elisha - Gestão Inteligente</p>
      <p>Este é um email automático. Por favor, não responda.</p>
    </div>
  </div>
</body>
</html>
```

---

## 🔐 Variáveis de Ambiente

Adicione ao `.env.local`:

```bash
# Resend API Key
RESEND_API_KEY=re_sua_chave_aqui

# Email de envio (deve ser verificado no Resend)
RESEND_FROM_EMAIL=noreply@elisha.com.br
```

---

## ✅ Checklist de Setup

- [ ] Obter chave API do Resend
- [ ] Verificar domínio no Resend (se usar email customizado)
- [ ] Adicionar servidor ao `.cursor/mcp.json`
- [ ] Adicionar `RESEND_API_KEY` ao `.env.local`
- [ ] Testar envio de email via Cursor
- [ ] Integrar com API de convites
- [ ] Criar template HTML bonito
- [ ] Testar fluxo completo

---

## 📚 Recursos

- [Resend Docs](https://resend.com/docs)
- [MCP Resend Server](https://github.com/modelcontextprotocol/servers/tree/main/src/resend)
- [Resend Templates](https://resend.com/docs/send-with-react)
- [Resend API Reference](https://resend.com/docs/api-reference/emails/send-email)

---

## 🆘 Troubleshooting

### Erro: "Invalid API Key"
- Verifique se copiou a chave completa
- Certifique-se que a chave está ativa no Resend

### Erro: "Domain not verified"
- Se usar email customizado (@elisha.com.br), precisa verificar domínio
- Ou use domínio sandbox: onboarding@resend.dev (apenas para teste)

### Servidor MCP não inicia
- Verifique se o caminho do `build/index.js` está correto
- Rode `npm run build` no diretório do servidor
- Reinicie o Cursor completamente

---

**Implementado em:** Outubro 22, 2025  
**Status:** ⏳ Aguardando configuração da chave API

