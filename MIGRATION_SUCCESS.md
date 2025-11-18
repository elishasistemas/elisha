# ✅ MIGRATIONS APLICADAS COM SUCESSO NA BRANCH DEV

## 📊 Status Atual

- **Branch DEV ID**: `ecvjgixhcfmkdfbnueqh`
- **Dashboard**: https://supabase.com/dashboard/project/ecvjgixhcfmkdfbnueqh
- **Status**: ✅ Migrations aplicadas
- **Data**: $(date)

## 🗂️ Migrations Aplicadas (31 total)

1. ✅ 001_create_core_tables.sql
2. ✅ 002_create_rls_policies.sql
3. ✅ 003_create_invites_system.sql
4. ✅ 003_5_add_profiles_missing_columns.sql (criada durante setup)
5. ✅ 20251021000003_roles_active_role.sql
6. ✅ 004_create_checklist_system.sql
7. ✅ 20251021000000_empresa_dual_approval.sql
8. ✅ 20251021000001_os_ordering_view.sql
9. ✅ 20251021000002_rls_more_tables.sql
10. ✅ 20251022000000_add_user_id_to_profiles.sql
11-30. ✅ (todas as demais migrations)

## 📋 Próximos Passos

### 1. Criar Usuário Admin

Acesse: https://supabase.com/dashboard/project/ecvjgixhcfmkdfbnueqh/auth/users

Clique em **"Add user"** → **"Create new user"**

- **Email**: iverson.ux@gmail.com
- **Password**: (sua senha)
- **Email Confirm**: ✅ ON (confirmar automaticamente)

### 2. Criar Profile para o Usuário

Após criar o usuário, copie o UUID dele e execute no SQL Editor:

```sql
-- Substitua USER_UUID pelo UUID do usuário criado
INSERT INTO public.profiles (
  user_id,
  nome,
  role,
  active_role,
  is_elisha_admin,
  roles
) VALUES (
  'USER_UUID',
  'Iverson Dantas',
  'elisha_admin',
  'elisha_admin',
  true,
  ARRAY['admin', 'elisha_admin']::text[]
);
```

### 3. Testar Login Local

1. Certifique-se de que `.env.development` está correto:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://ecvjgixhcfmkdfbnueqh.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<pegar_no_dashboard>
   SUPABASE_SERVICE_ROLE_KEY=<pegar_no_dashboard>
   ```

2. Limpe cache do Next.js:
   ```bash
   rm -rf .next
   npm run dev
   ```

3. Acesse: http://localhost:3000/login

4. Faça login com:
   - Email: iverson.ux@gmail.com
   - Senha: (a que você definiu)

### 4. Verificar Ambiente Produção (Vercel)

O Vercel deve usar as variáveis de ambiente do projeto MAIN:
- **URL**: https://wkccxgeevizhxmclvsnz.supabase.co

Verifique em: https://vercel.com/[seu-projeto]/settings/environment-variables

## 🔧 Arquivos Importantes

- `APLICAR_NO_DASHBOARD_ORDENADO.sql` - SQL consolidado usado
- `scripts/build-sql-from-migrations.sh` - Script para gerar SQL
- `supabase/migrations/003_5_add_profiles_missing_columns.sql` - Migration criada

## 📝 Correções Aplicadas

1. ✅ Corrigido `polname` → `policyname` (PostgreSQL 17)
2. ✅ Adicionadas colunas faltantes em profiles (is_elisha_admin, etc)
3. ✅ Criada função `is_elisha_admin()`
4. ✅ Corrigida ordem de migrations (funções antes de policies)
5. ✅ Recriada view `ordens_servico_enriquecida` após ALTER TABLE
6. ✅ Corrigido JOIN para buscar email de auth.users

## 🎯 Ambiente Configurado

- ✅ **DEV**: Branch ecvjgixhcfmkdfbnueqh (localhost)
- ✅ **PROD**: Main wkccxgeevizhxmclvsnz (Vercel)

