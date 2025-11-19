# 🔍 Verificação: Ambiente de Produção

## Problema Identificado

A empresa `6a28d5c5-bce1-4729-a87e-1844ab48b727` tem **4 clientes cadastrados** na branch de produção (main) do Supabase, mas a interface em produção não está exibindo nenhum.

### Diagnóstico

1. ✅ **Dados confirmados na branch de produção**: Existem 4 clientes na tabela `clientes` para a empresa
2. ✅ **RLS policies estão corretas**: As políticas de segurança permitem acesso aos clientes
3. ⚠️ **Problema provável**: A aplicação em produção (Vercel) está conectada à branch **DEV** em vez da branch **PROD**

## Branches Supabase

- **PROD (main)**: `wkccxgeevizhxmclvsnz` → Produção (Vercel)
- **DEV (dev)**: `ecvjgixhcfmkdfbnueqh` → Desenvolvimento (local)

## Como Verificar

### 1. Verificar Variáveis de Ambiente no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto `web-admin`
3. Vá para **Settings** > **Environment Variables**
4. Verifique se as seguintes variáveis estão configuradas para **Production**:

```
NEXT_PUBLIC_SUPABASE_URL=https://wkccxgeevizhxmclvsnz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<CHAVE_DA_BRANCH_PROD>
```

### 2. Verificar no Console do Navegador (Produção)

1. Acesse a aplicação em produção
2. Abra o Console do navegador (F12)
3. Execute:

```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Não encontrado')
```

**OU** verifique na aba Network:
- Procure por requisições para `*.supabase.co`
- A URL deve ser `https://wkccxgeevizhxmclvsnz.supabase.co` (PROD)
- **NÃO** deve ser `https://ecvjgixhcfmkdfbnueqh.supabase.co` (DEV)

## Solução: Configurar Variáveis de Ambiente no Vercel

### Passo 1: Obter Credenciais da Branch PROD

1. Acesse: https://supabase.com/dashboard/project/wkccxgeevizhxmclvsnz/settings/api
2. Copie:
   - **Project URL**: `https://wkccxgeevizhxmclvsnz.supabase.co`
   - **anon public key**: Para `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: Para `SUPABASE_SERVICE_ROLE_KEY`

### Passo 2: Configurar no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto `web-admin`
3. Vá para **Settings** > **Environment Variables**
4. Para cada variável abaixo, configure:

#### Para Production:

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wkccxgeevizhxmclvsnz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<COPIAR_DO_DASHBOARD_PROD>` |
| `SUPABASE_SERVICE_ROLE_KEY` | `<COPIAR_DO_DASHBOARD_PROD>` |

5. **IMPORTANTE**: Selecione **Production** no dropdown "Environment"
6. Clique em **Save**

### Passo 3: Fazer Redeploy

Após configurar as variáveis:

1. Vá para **Deployments**
2. Encontre o deployment mais recente
3. Clique nos **três pontos** (...) > **Redeploy**
4. Aguarde o deploy completar

**OU** faça um novo push para a branch `main` para forçar um novo deploy.

## Verificação Final

Após o redeploy, verifique:

1. ✅ A aplicação em produção exibe os 4 clientes
2. ✅ O Console do navegador mostra requisições para `wkccxgeevizhxmclvsnz.supabase.co`
3. ✅ Não há requisições para `ecvjgixhcfmkdfbnueqh.supabase.co`

## Referência

- Template de variáveis PROD: `docs/ENV_PROD_TEMPLATE.md`
- Dashboard PROD: https://supabase.com/dashboard/project/wkccxgeevizhxmclvsnz/settings/api

