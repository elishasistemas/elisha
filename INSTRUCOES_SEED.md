# 📋 Instruções para Popular Dados de Teste

## 🎯 Objetivo
Criar uma empresa de teste com admin, técnicos, clientes e ordens de serviço.

---

## ✅ PASSO 1: Criar a Empresa e Dados Básicos

Execute no **SQL Editor** do Supabase:

```bash
# Copie apenas a PARTE 1 do arquivo:
scripts/seed-test-data.sql
```

Seções a executar:
- ✅ 1. CRIAR EMPRESA
- ✅ 5. CRIAR CLIENTES  
- ✅ 6. CRIAR EQUIPAMENTOS
- ✅ 7. CRIAR ORDENS DE SERVIÇO
- ✅ 8. CRIAR CONTRATO
- ⏭️ PULAR: Seções 3 e 4 (Colaboradores e Profiles - faremos depois)

---

## ✅ PASSO 2: Criar Usuários no Auth Dashboard

Acesse:
```
https://supabase.com/dashboard/project/ecvjgixhcfmkdfbnueqh/auth/users
```

Clique em **"Add user"** → **"Create new user"** para cada usuário:

### 👤 Usuário 1 - Admin
- **Email**: `maria.silva@techelevadores.com.br`
- **Password**: `Admin@123`
- **Email Confirm**: ✅ ON
- **➡️ Copie o UUID gerado**

### 👤 Usuário 2 - Técnico 1
- **Email**: `joao.santos@techelevadores.com.br`
- **Password**: `Tech@123`
- **Email Confirm**: ✅ ON
- **➡️ Copie o UUID gerado**

### 👤 Usuário 3 - Técnico 2
- **Email**: `pedro.costa@techelevadores.com.br`
- **Password**: `Tech@123`
- **Email Confirm**: ✅ ON
- **➡️ Copie o UUID gerado**

---

## ✅ PASSO 3: Criar Colaboradores

Execute no SQL Editor:

```sql
-- Seção 3 do seed-test-data.sql
INSERT INTO public.colaboradores (id, empresa_id, nome, funcao, telefone, whatsapp_numero, ativo)
VALUES 
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    'João Santos',
    'Técnico de Manutenção',
    '(11) 91234-5678',
    '5511912345678',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000001',
    'Pedro Costa',
    'Técnico de Instalação',
    '(11) 93456-7890',
    '5511934567890',
    true
  );
```

---

## ✅ PASSO 4: Criar Profiles (IMPORTANTE)

**⚠️ SUBSTITUA OS UUIDs COPIADOS DO PASSO 2**

Execute no SQL Editor (um de cada vez):

### Admin - Maria Silva
```sql
INSERT INTO public.profiles (user_id, empresa_id, nome, role, active_role, roles, is_elisha_admin)
VALUES (
  'UUID_COPIADO_DO_ADMIN',  -- ⬅️ SUBSTITUA AQUI
  '00000000-0000-0000-0000-000000000001',
  'Maria Silva',
  'admin',
  'admin',
  ARRAY['admin']::text[],
  false
);
```

### Técnico 1 - João Santos
```sql
INSERT INTO public.profiles (user_id, empresa_id, nome, role, active_role, roles, tecnico_id)
VALUES (
  'UUID_COPIADO_DO_TECNICO1',  -- ⬅️ SUBSTITUA AQUI
  '00000000-0000-0000-0000-000000000001',
  'João Santos',
  'tecnico',
  'tecnico',
  ARRAY['tecnico']::text[],
  '00000000-0000-0000-0000-000000000101'
);
```

### Técnico 2 - Pedro Costa
```sql
INSERT INTO public.profiles (user_id, empresa_id, nome, role, active_role, roles, tecnico_id)
VALUES (
  'UUID_COPIADO_DO_TECNICO2',  -- ⬅️ SUBSTITUA AQUI
  '00000000-0000-0000-0000-000000000001',
  'Pedro Costa',
  'tecnico',
  'tecnico',
  ARRAY['tecnico']::text[],
  '00000000-0000-0000-0000-000000000102'
);
```

---

## ✅ PASSO 5: Verificar

Execute no SQL Editor:

```sql
-- Ver tudo que foi criado
SELECT 
  'Empresas' as tipo, COUNT(*) as total 
FROM public.empresas 
WHERE id = '00000000-0000-0000-0000-000000000001'

UNION ALL

SELECT 'Colaboradores', COUNT(*) 
FROM public.colaboradores 
WHERE empresa_id = '00000000-0000-0000-0000-000000000001'

UNION ALL

SELECT 'Profiles', COUNT(*) 
FROM public.profiles 
WHERE empresa_id = '00000000-0000-0000-0000-000000000001'

UNION ALL

SELECT 'Clientes', COUNT(*) 
FROM public.clientes 
WHERE empresa_id = '00000000-0000-0000-0000-000000000001'

UNION ALL

SELECT 'Equipamentos', COUNT(*) 
FROM public.equipamentos 
WHERE empresa_id = '00000000-0000-0000-0000-000000000001'

UNION ALL

SELECT 'Ordens de Serviço', COUNT(*) 
FROM public.ordens_servico 
WHERE empresa_id = '00000000-0000-0000-0000-000000000001'

UNION ALL

SELECT 'Contratos', COUNT(*) 
FROM public.contratos 
WHERE empresa_id = '00000000-0000-0000-0000-000000000001';
```

**Resultado esperado:**
```
Empresas            | 1
Colaboradores       | 2
Profiles            | 3
Clientes            | 3
Equipamentos        | 5
Ordens de Serviço   | 3
Contratos           | 2
```

---

## ✅ PASSO 6: Testar Login com os Novos Usuários

Faça logout e tente fazer login com:

### Admin
- Email: `maria.silva@techelevadores.com.br`
- Senha: `Admin@123`

### Técnico 1
- Email: `joao.santos@techelevadores.com.br`
- Senha: `Tech@123`

### Técnico 2
- Email: `pedro.costa@techelevadores.com.br`
- Senha: `Tech@123`

---

## 📊 Dados Criados

### 🏢 Empresa
- **Tech Elevadores LTDA** (CNPJ: 12.345.678/0001-90)

### 👥 Usuários
- **Maria Silva** - Admin
- **João Santos** - Técnico de Manutenção
- **Pedro Costa** - Técnico de Instalação

### 🏗️ Clientes (3)
1. **Shopping Center Norte** - 2 elevadores
2. **Edifício Empresarial Paulista** - 2 elevadores (1 panorâmico)
3. **Condomínio Residencial Jardins** - 1 elevador

### 📦 Equipamentos (5 total)
- Atlas Schindler, ThyssenKrupp, Otis

### 📋 Ordens de Serviço (3)
1. Preventiva programada (novo)
2. Corretiva urgente (em andamento)
3. Preventiva concluída

---

## 🎯 Próximo Passo

Após popular os dados, você pode:
1. ✅ Navegar pelo sistema com dados reais
2. ✅ Testar funcionalidades
3. ✅ Continuar o desenvolvimento

---

**Dúvidas?** Os dados são idempotentes e podem ser recriados a qualquer momento! 🚀

