# Correção: Técnicos no Limbo

## 🐛 Problema Identificado

Quando um usuário era convidado como **técnico** e aceitava o convite:

1. ✅ Era criado um registro na tabela `profiles` com `active_role = 'tecnico'`
2. ✅ Era criado um registro na tabela `colaboradores`
3. ❌ **MAS** o campo `tecnico_id` no `profiles` ficava **NULL**

### Consequências:

- Técnico conseguia fazer login
- Sistema identificava como `isTecnico()` = true
- **MAS** ao tentar aceitar OSs, o RPC `os_accept` falhava porque `profile.tecnico_id` era NULL
- OSs ficavam "não atribuído" mesmo quando aceitas
- Técnico não conseguia finalizar OSs (validação bloqueava)

## ✅ Solução Implementada

### 1. Atualização do RPC `accept_invite`

**Arquivo**: `supabase/migrations/20251208000000_fix_accept_invite_link_tecnico_id.sql`

**O que mudou**:
- Quando técnico aceita convite, o colaborador é criado E o `tecnico_id` é vinculado no profile
- Retorna o `tecnico_id` no resultado do RPC

**Código relevante**:
```sql
-- Cria colaborador
INSERT INTO public.colaboradores (...)
RETURNING id INTO v_colaborador_id;

-- Vincula tecnico_id no profile
UPDATE public.profiles
SET tecnico_id = v_colaborador_id
WHERE user_id = v_user;
```

### 2. Correção de Dados Existentes

**Arquivo**: `supabase/migrations/20251208000001_fix_existing_tecnicos_in_limbo.sql`

**O que faz**:
- Busca todos os profiles com `active_role='tecnico'` e `tecnico_id IS NULL`
- Para cada um:
  - Tenta encontrar colaborador correspondente (por `user_id`)
  - Se encontrar: vincula o `tecnico_id`
  - Se não encontrar: cria o colaborador e vincula
- Exibe logs detalhados do processo

## 🚀 Como Aplicar

### Opção 1: Script automático
```bash
cd /Users/mau/ws/Elisha-admin
chmod +x scripts/fix-tecnicos-limbo.sh
./scripts/fix-tecnicos-limbo.sh
```

### Opção 2: Manual via Supabase Studio
1. Abra o Supabase Studio
2. Vá em SQL Editor
3. Execute o conteúdo de `20251208000000_fix_accept_invite_link_tecnico_id.sql`
4. Execute o conteúdo de `20251208000001_fix_existing_tecnicos_in_limbo.sql`

## 🔍 Verificar se Funcionou

Execute no SQL Editor:

```sql
-- Ver todos os técnicos e seus colaboradores
SELECT 
  p.name as tecnico_nome,
  p.email,
  p.active_role,
  p.tecnico_id,
  c.id as colaborador_id,
  c.nome as colaborador_nome,
  CASE 
    WHEN p.tecnico_id IS NULL THEN '❌ NO LIMBO'
    WHEN p.tecnico_id = c.id THEN '✅ VINCULADO'
    ELSE '⚠️ INCONSISTENTE'
  END as status
FROM profiles p
LEFT JOIN colaboradores c ON c.id = p.tecnico_id
WHERE p.active_role = 'tecnico'
ORDER BY status;
```

## 📝 Testes Necessários

Após aplicar as correções:

1. **Novo técnico**: Criar convite → aceitar → verificar se `tecnico_id` está preenchido
2. **Técnico existente**: Fazer login → aceitar OS → verificar se técnico é atribuído
3. **Finalizar OS**: Técnico deve conseguir finalizar sua OS com assinatura
4. **Lista de OSs**: OSs devem aparecer com nome do técnico (não "não atribuído")

## 🎯 Resultado Esperado

Após as correções:
- ✅ Novos técnicos criados via convite terão `tecnico_id` preenchido automaticamente
- ✅ Técnicos antigos no limbo serão vinculados aos colaboradores
- ✅ Técnicos conseguirão aceitar e finalizar OSs normalmente
- ✅ Nome do técnico aparecerá corretamente na lista de OSs
