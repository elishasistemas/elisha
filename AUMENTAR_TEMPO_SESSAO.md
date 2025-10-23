# Como Aumentar o Tempo de Sessão do Supabase

## Configuração no Dashboard do Supabase

Para aumentar o tempo de sessão de 1 hora para 7 dias:

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Auth**
4. Role até **JWT Settings**
5. Altere **JWT expiry limit** de `3600` (1 hora) para `604800` (7 dias)
6. Clique em **Save**

## Valores Recomendados

- **1 hora:** `3600` (padrão)
- **24 horas:** `86400`
- **7 dias:** `604800` ✅ (recomendado)
- **30 dias:** `2592000`

## Configuração já aplicada no código

O cliente Supabase já foi configurado com:

```typescript
{
  auth: {
    autoRefreshToken: true,      // Renova automaticamente
    persistSession: true,         // Mantém sessão no localStorage
    detectSessionInUrl: true,     // Detecta token na URL
    flowType: 'pkce',            // Segurança adicional
    storageKey: 'elisha-auth-token'
  }
}
```

## Redirecionamento Automático

Quando a sessão expirar, o sistema agora:
1. Mostra mensagem: "Sessão expirada. Redirecionando para login..."
2. Aguarda 1.5 segundos
3. Redireciona automaticamente para `/login`

## Nota Importante

O auto-refresh do token funciona automaticamente enquanto o usuário mantém a aba aberta. 
O token será renovado ~5 minutos antes de expirar, garantindo que o usuário não seja desconectado durante o uso.

