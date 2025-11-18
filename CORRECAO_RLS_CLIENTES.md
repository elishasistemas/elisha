# ✅ Correção: Política RLS para Clientes

## Problema Identificado

A política RLS `"Users can view clientes from same empresa"` estava incorreta. Ela estava comparando `impersonating_empresa_id` com `empresa_id` do próprio profile, em vez de usar a lógica correta de impersonation.

### Política Antiga (INCORRETA):
```sql
where user_id = auth.uid()
or (is_elisha_admin = true and impersonating_empresa_id = empresa_id)
```

Isso estava comparando `impersonating_empresa_id` com `empresa_id` do profile, o que não faz sentido!

## Correção Aplicada

Criei uma migration (`fix_clientes_rls_impersonation`) que corrige a política para:

1. **Usar `current_empresa_id()`**: Função que já tem a lógica correta de impersonation
2. **OU usar uma subquery correta**: Que verifica se está impersonando e usa o `impersonating_empresa_id` corretamente

### Políticas Corrigidas:

#### Política 1: Usando current_empresa_id()
```sql
CREATE POLICY "clientes_select_authenticated" ON public.clientes
FOR SELECT
TO authenticated
USING (
  is_elisha_admin() = true 
  OR empresa_id = current_empresa_id()
);
```

#### Política 2: Subquery Corrigida
```sql
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

## Como Funciona Agora

1. Se o usuário é `elisha_admin` e está impersonando:
   - Usa `impersonating_empresa_id` para comparar com `empresa_id` dos clientes
   
2. Se o usuário é normal:
   - Usa `empresa_id` do profile para comparar com `empresa_id` dos clientes

## Teste

Após a correção, os 4 clientes da empresa `6a28d5c5-bce1-4729-a87e-1844ab48b727` devem aparecer quando um usuário com `impersonating_empresa_id` configurado acessa a página de clientes.

## Próximos Passos

1. ✅ Migration aplicada
2. ⏳ Aguardar usuário testar em produção
3. Se ainda não funcionar, verificar:
   - Se o `impersonating_empresa_id` está sendo atualizado no JWT
   - Se a sessão precisa ser atualizada
   - Se há cache de políticas RLS

