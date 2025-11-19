# 🔍 Debug: Clientes Não Aparecem em Produção

## Problema

A empresa `6a28d5c5-bce1-4729-a87e-1844ab48b727` tem 4 clientes cadastrados na branch de produção do Supabase, mas a interface em produção não está exibindo nenhum cliente.

## Variáveis de Ambiente - ✅ CONFIGURADAS

As variáveis de ambiente foram configuradas corretamente no Vercel:
- `NEXT_PUBLIC_SUPABASE_URL` → `https://wkccxgeevizhxmclvsnz.supabase.co` (PROD)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Configurada
- `SUPABASE_SERVICE_ROLE_KEY` → Configurada

## Mudanças Feitas

### 1. Logs de Debug Adicionados

#### Na página de clientes (`src/app/(protected)/clients/page.tsx`):
- Log do profile do usuário
- Log do empresaId sendo usado
- Log dos clientes retornados

#### No hook useClientes (`src/hooks/use-supabase.ts`):
- Log quando inicia a busca
- Log do empresaId sendo usado na query
- Log do resultado da query (count e dados)

### 2. Como Verificar

1. **Acesse a aplicação em produção**
2. **Abra o Console do navegador (F12)**
3. **Vá para a aba Console**
4. **Procure por logs começando com**:
   - `[ClientsPage] Debug:`
   - `[ClientsPage] Clientes:`
   - `[useClientes] Buscando clientes para empresa:`
   - `[useClientes] Executando query para empresa:`
   - `[useClientes] Resultado:`

### 3. O Que Verificar nos Logs

#### Se `empresaId` estiver `undefined` ou `null`:
- O problema é que o perfil do usuário não está sendo carregado corretamente
- Verifique se `profile` existe e tem `empresa_id` ou `impersonating_empresa_id`

#### Se `empresaId` estiver correto mas `dataCount` for 0:
- Pode ser um problema de RLS (Row Level Security)
- Verifique se o usuário tem permissão para ver os clientes dessa empresa
- Verifique os logs de erro (`[useClientes] Erro:`)

#### Se houver erro na query:
- O erro será logado no console
- Pode ser problema de autenticação ou RLS

## Próximos Passos

1. Faça deploy das mudanças com logs de debug
2. Acesse a aplicação em produção
3. Abra o Console do navegador
4. Copie todos os logs que começam com `[ClientsPage]` ou `[useClientes]`
5. Envie os logs para análise

## Possíveis Causas

1. **Profile não está sendo carregado**: O usuário pode não ter um profile associado à empresa
2. **RLS bloqueando acesso**: As políticas de segurança podem estar bloqueando o acesso aos clientes
3. **empresaId incorreto**: O empresaId usado pode estar diferente do esperado
4. **Query falhando silenciosamente**: A query pode estar retornando vazio sem erro

## Verificação no Banco

Execute esta query no Supabase para verificar os dados:

```sql
-- Verificar clientes da empresa
SELECT COUNT(*) as total_clients, empresa_id 
FROM clientes 
WHERE empresa_id = '6a28d5c5-bce1-4729-a87e-1844ab48b727'
GROUP BY empresa_id;

-- Verificar profiles associados
SELECT 
    p.id,
    p.user_id,
    p.empresa_id,
    p.active_role,
    u.email
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
WHERE p.empresa_id = '6a28d5c5-bce1-4729-a87e-1844ab48b727'
ORDER BY p.created_at DESC;
```

