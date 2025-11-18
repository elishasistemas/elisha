# ✅ Solução: Clientes Não Aparecem em Produção

## Problema Identificado

Os logs do console mostraram:
- `empresaId` estava correto: `6a28d5c5-bce1-4729-a87e-1844ab48b727`
- Query estava sendo executada
- Mas retornava 0 clientes mesmo existindo 4 na branch PROD

## Causa Raiz

A política RLS `"Users can view clientes from same empresa"` tinha uma lógica incorreta para handling impersonation. Ela estava comparando `impersonating_empresa_id` com `empresa_id` do próprio profile em vez de usar a lógica correta.

## Correções Aplicadas

### 1. Política RLS Corrigida ✅

Aplicada migration `fix_clientes_rls_impersonation` que corrige a política para:

```sql
-- Política que usa current_empresa_id() (que já tem lógica de impersonation)
CREATE POLICY "clientes_select_authenticated" ON public.clientes
FOR SELECT
TO authenticated
USING (
  is_elisha_admin() = true 
  OR empresa_id = current_empresa_id()
);

-- Política com subquery corrigida
CREATE POLICY "Users can view clientes from same empresa" ON public.clientes
FOR SELECT
TO authenticated
USING (
  empresa_id IN (
    SELECT 
      CASE 
        WHEN is_elisha_admin() AND impersonating_empresa_id IS NOT NULL 
        THEN impersonating_empresa_id
        ELSE empresa_id
      END
    FROM profiles
    WHERE user_id = auth.uid()
  )
);
```

### 2. Atualização Automática de Claims ✅

Adicionado código na página de clientes para atualizar os JWT claims quando o usuário está impersonando:

```typescript
// Atualizar claims se necessário (para RLS funcionar corretamente)
useEffect(() => {
  if (user?.id && profile?.is_elisha_admin && profile?.impersonating_empresa_id) {
    fetch('/api/auth/update-claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    })
      .then(() => {
        // Refresh session para carregar novos claims no JWT
        const supabase = createSupabaseBrowser()
        supabase.auth.refreshSession()
      })
  }
}, [user?.id, profile?.is_elisha_admin, profile?.impersonating_empresa_id])
```

## Como Funciona Agora

1. Quando um `elisha_admin` está impersonando uma empresa:
   - O `impersonating_empresa_id` está no profile
   - Os claims são atualizados automaticamente na página de clientes
   - A sessão é refreshada para incluir `impersonating_empresa_id` no JWT
   - As políticas RLS verificam o `impersonating_empresa_id` e permitem acesso aos clientes

2. A política RLS verifica:
   - Se é `elisha_admin` → permite acesso a todos os clientes
   - OU se `empresa_id` do cliente corresponde a `current_empresa_id()` (que usa `impersonating_empresa_id` se estiver impersonando)
   - OU se `empresa_id` do cliente está na lista de empresas do profile (com lógica de impersonation)

## Próximos Passos

1. ✅ Migration aplicada na branch PROD
2. ✅ Código de atualização de claims adicionado
3. ⏳ Aguardar deploy completar
4. ⏳ Testar em produção:
   - Acessar página de clientes
   - Verificar se os 4 clientes aparecem
   - Verificar logs do console se ainda houver problemas

## Se Ainda Não Funcionar

1. **Forçar refresh de sessão**: Fazer logout/login
2. **Verificar JWT claims**: No console do navegador, verificar se `impersonating_empresa_id` está nos claims
3. **Verificar política RLS**: Testar a query diretamente no Supabase SQL Editor

