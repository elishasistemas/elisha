# 🚀 Guia de Instalação das Migrações SQL

## ✅ Arquivos Criados

### Migrações (em ordem de execução):
1. **`supabase/migrations/001_create_invites_system.sql`** ✅ (já existe)
   - Sistema de convites para cadastro de usuários

2. **`supabase/migrations/002_create_core_tables.sql`** 🆕 **NOVO**
   - Tabelas principais: empresas, profiles, clientes, equipamentos, colaboradores, ordens_servico
   - Triggers para updated_at
   - Função para auto-criar profile ao criar usuário

3. **`supabase/migrations/003_create_rls_policies.sql`** 🆕 **NOVO**
   - Políticas RLS para multi-tenant isolation
   - Controle de acesso baseado em roles (admin, gestor, tecnico)

### Storage:
4. **`supabase/storage/001_setup_empresas_bucket.sql`** 🆕 **NOVO**
   - Bucket "empresas" para logos
   - Políticas de acesso (authenticated upload, public read)

---

## 📦 Opção 1: Via Supabase Dashboard (Recomendado)

### Passo 1: Acessar SQL Editor

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral

### Passo 2: Executar Migrações em Ordem

**Execute cada arquivo na ordem abaixo:**

#### 2.1 - Tabelas Principais (se ainda não executou o 001)
```sql
-- Cole o conteúdo de: supabase/migrations/001_create_invites_system.sql
-- Clique em RUN
```

#### 2.2 - Tabelas Core
```sql
-- Cole o conteúdo de: supabase/migrations/002_create_core_tables.sql
-- Clique em RUN
-- Aguarde mensagem: ✅ Migration 002 completed successfully!
```

#### 2.3 - RLS Policies
```sql
-- Cole o conteúdo de: supabase/migrations/003_create_rls_policies.sql
-- Clique em RUN
-- Aguarde mensagem com total de policies criadas
```

#### 2.4 - Storage Bucket
```sql
-- Cole o conteúdo de: supabase/storage/001_setup_empresas_bucket.sql
-- Clique em RUN
-- Aguarde mensagem: ✅ Storage bucket "empresas" created successfully!
```

### Passo 3: Verificar Instalação

Execute no SQL Editor:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('empresas', 'profiles', 'clientes', 'equipamentos', 'colaboradores', 'ordens_servico', 'invites')
ORDER BY table_name;

-- Deve retornar 7 tabelas

-- Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('empresas', 'profiles', 'clientes', 'equipamentos', 'colaboradores', 'ordens_servico', 'invites');

-- Todas devem ter rowsecurity = true

-- Verificar policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Deve retornar várias policies

-- Verificar storage bucket
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'empresas';

-- Deve retornar: empresas | empresas | true | 2097152
```

---

## 📦 Opção 2: Via Supabase CLI

### Pré-requisitos

```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer login
npx supabase login

# Link ao projeto remoto
npx supabase link --project-ref SEU_PROJECT_REF
```

**Onde encontrar `SEU_PROJECT_REF`:**
- No Supabase Dashboard → Settings → General → Reference ID

### Executar Migrações

```bash
# Navegar até a raiz do projeto
cd /Users/iversondantas/Projects/Elisha/web-admin

# Push de todas as migrações
npx supabase db push

# Ou executar uma por vez
npx supabase db push supabase/migrations/002_create_core_tables.sql
npx supabase db push supabase/migrations/003_create_rls_policies.sql
npx supabase db push supabase/storage/001_setup_empresas_bucket.sql
```

### Verificar Status

```bash
# Ver migrações aplicadas
npx supabase migration list

# Ver status do banco
npx supabase db status
```

---

## 🧪 Testar Após Instalação

### 1. Criar uma Empresa de Teste

```sql
-- No SQL Editor
insert into public.empresas (nome, cnpj, logo_url)
values (
  'Empresa Teste Ltda',
  '12.345.678/0001-90',
  null
)
returning *;
```

### 2. Criar um Cliente de Teste

```sql
-- Pegue o ID da empresa criada acima e substitua em EMPRESA_ID
insert into public.clientes (
  empresa_id,
  nome_local,
  cnpj,
  status_contrato
)
values (
  'EMPRESA_ID',
  'Cliente Teste ABC',
  '98.765.432/0001-10',
  'ativo'
)
returning *;
```

### 3. Criar um Técnico de Teste

```sql
insert into public.colaboradores (
  empresa_id,
  nome,
  funcao,
  whatsapp_numero,
  ativo
)
values (
  'EMPRESA_ID',
  'João Silva',
  'Técnico Sênior',
  '5581998765432',
  true
)
returning *;
```

### 4. Testar na Aplicação

1. Execute a aplicação:
```bash
pnpm dev
```

2. Acesse [http://localhost:3000](http://localhost:3000)

3. Faça login

4. Verifique se os dados aparecem no Dashboard

---

## 🔍 Troubleshooting

### Erro: "relation already exists"

**Causa:** Tabela já foi criada antes

**Solução:** Adicione `if not exists` ou delete a tabela:

```sql
drop table if exists public.nome_da_tabela cascade;
```

### Erro: "permission denied for schema storage"

**Causa:** Usuário não tem permissão para criar storage

**Solução:** Execute como super-admin no Supabase Dashboard (SQL Editor tem permissões corretas)

### Erro: "duplicate key value violates unique constraint"

**Causa:** Tentando criar bucket que já existe

**Solução:** O script já usa `on conflict do nothing`. Se persistir:

```sql
-- Ver buckets existentes
select * from storage.buckets;

-- Deletar bucket se necessário
delete from storage.buckets where id = 'empresas';
```

### Erro de RLS: "new row violates row-level security policy"

**Causa:** Usuário tentando inserir/atualizar sem permissões

**Solução:** 
1. Verifique se o usuário tem um `profile` criado
2. Verifique se o `profile.empresa_id` está correto
3. Verifique se o `profile.role` está correto

```sql
-- Ver seu profile
select * from public.profiles where user_id = auth.uid();

-- Atualizar role para admin (apenas para testes)
update public.profiles 
set role = 'admin' 
where user_id = auth.uid();
```

---

## 📊 Estrutura Final do Banco

Após executar todas as migrações, você terá:

### Tabelas Principais (7):
- ✅ `empresas` - Empresas cadastradas
- ✅ `profiles` - Perfis de usuários vinculados a empresas
- ✅ `clientes` - Clientes das empresas
- ✅ `equipamentos` - Equipamentos dos clientes
- ✅ `colaboradores` - Técnicos e funcionários
- ✅ `ordens_servico` - Ordens de serviço
- ✅ `invites` - Sistema de convites

### Storage (1):
- ✅ Bucket `empresas` (público para leitura, auth para escrita)

### Políticas RLS:
- ✅ Multi-tenant isolation por `empresa_id`
- ✅ Role-based access control (admin, gestor, tecnico)
- ✅ ~25+ policies criadas

### Triggers:
- ✅ Auto-update de `updated_at` em todas as tabelas
- ✅ Auto-criação de `profile` ao criar usuário

### Funções:
- ✅ `create_invite()` - Criar convite
- ✅ `accept_invite()` - Aceitar convite
- ✅ `revoke_invite()` - Revogar convite
- ✅ `handle_new_user()` - Auto-criar profile
- ✅ `update_updated_at_column()` - Atualizar timestamps

---

## ✅ Checklist Pós-Instalação

- [ ] Executar migração 002 (tabelas core)
- [ ] Executar migração 003 (RLS policies)
- [ ] Executar storage setup (bucket empresas)
- [ ] Verificar tabelas criadas (7 tabelas)
- [ ] Verificar RLS habilitado (todas com rowsecurity = true)
- [ ] Verificar policies criadas (~25+ policies)
- [ ] Verificar bucket criado (empresas, public, 2MB limit)
- [ ] Testar criação de empresa
- [ ] Testar criação de cliente
- [ ] Testar criação de técnico
- [ ] Testar aplicação (login → dashboard → ver dados)

---

## 🎯 Próximos Passos

Após instalar todas as migrações:

1. ✅ Banco de dados pronto
2. ✅ Storage configurado
3. 🔄 **AGORA:** Implementar CRUDs na aplicação
4. 🔄 Configurar Supabase Auth redirects
5. 🔄 Deploy em Preview (Vercel)
6. 🔄 Testes completos
7. 🚀 Go-Live!

---

**Dúvidas?** Consulte:
- [Supabase Docs - Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Supabase Docs - RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Docs - Storage](https://supabase.com/docs/guides/storage)

---

*Documento gerado em 21/10/2025*

