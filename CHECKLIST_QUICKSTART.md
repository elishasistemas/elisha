# Checklist System - Guia Rápido

Este guia mostrará como começar a usar o sistema de checklist em 5 minutos.

## 🚀 Setup Inicial

### 1. Aplicar Migração

Execute a migração SQL no Supabase:

```bash
# Via Supabase Dashboard
# 1. Acesse: https://app.supabase.com/project/YOUR_PROJECT/sql
# 2. Copie e cole o conteúdo de: supabase/migrations/004_create_checklist_system.sql
# 3. Clique em "Run"

# Ou via CLI
supabase db push
```

### 2. Criar Template de Teste

Use o SQL de exemplo:

```sql
-- 1. Obtenha o UUID da sua empresa
SELECT id, nome FROM public.empresas LIMIT 1;

-- 2. Execute o seed (substituindo o UUID)
-- Abra: supabase/seed_checklist_examples.sql
-- Substitua: SUBSTITUA-PELO-UUID-DA-EMPRESA
-- Cole e execute no SQL Editor do Supabase
```

Ou crie via código:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Simples: apenas 3 itens
const template = {
  empresa_id: 'seu-uuid-aqui',
  nome: 'Meu Primeiro Checklist',
  tipo_servico: 'preventiva',
  versao: 1,
  origem: 'custom',
  abnt_refs: [],
  ativo: true,
  itens: [
    {
      ordem: 1,
      secao: 'Verificações',
      descricao: 'Equipamento funcionando normalmente?',
      tipo: 'boolean',
      obrigatorio: true,
      critico: false
    },
    {
      ordem: 2,
      secao: 'Verificações',
      descricao: 'Observações gerais',
      tipo: 'text',
      obrigatorio: false,
      critico: false
    },
    {
      ordem: 3,
      secao: 'Finalização',
      descricao: 'Assinatura',
      tipo: 'signature',
      obrigatorio: true,
      critico: true
    }
  ]
}

const { data, error } = await supabase
  .from('checklists')
  .insert(template)
  .select()
  .single()

console.log('Template criado:', data.id)
```

### 3. Vincular Checklist a uma OS

```typescript
// No seu código frontend ou API
const response = await fetch(`/api/os/${osId}/start-checklist`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    checklistId: 'uuid-do-template-criado' 
  })
})

const snapshot = await response.json()
console.log('Checklist iniciado:', snapshot.id)
```

### 4. Adicionar UI na Página da OS

```typescript
// src/app/(protected)/orders/[id]/page.tsx
import { ChecklistRunner } from '@/components/checklist-runner'

export default function OrderDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  return (
    <div className="space-y-6">
      <h1>Ordem de Serviço #{params.id}</h1>
      
      {/* Outros dados da OS */}
      
      <ChecklistRunner 
        osId={params.id}
        onComplete={() => {
          console.log('Checklist concluído!')
        }}
      />
    </div>
  )
}
```

## ✅ Testando

### 1. Verificar que tudo foi criado

```sql
-- Tabelas
SELECT COUNT(*) FROM public.checklists;
SELECT COUNT(*) FROM public.os_checklists;
SELECT COUNT(*) FROM public.checklist_respostas;

-- RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('checklists', 'os_checklists', 'checklist_respostas');
```

### 2. Criar OS e Vincular Checklist

```typescript
// 1. Criar OS (se ainda não tiver)
const { data: os } = await supabase
  .from('ordens_servico')
  .insert({
    cliente_id: 'uuid',
    equipamento_id: 'uuid',
    tipo: 'preventiva',
    status: 'novo'
  })
  .select()
  .single()

// 2. Iniciar checklist
const response = await fetch(`/api/os/${os.id}/start-checklist`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ checklistId: templateId })
})

// 3. Verificar criação
const checklist = await response.json()
console.log('✅ Snapshot criado:', checklist)

// 4. Verificar respostas pré-populadas
const { data: respostas } = await supabase
  .from('checklist_respostas')
  .select('*')
  .eq('os_checklist_id', checklist.id)

console.log('✅ Respostas:', respostas.length)
```

### 3. Atualizar uma Resposta

```typescript
// Marcar item como conforme
const respostaId = respostas[0].id

const response = await fetch(`/api/checklist/respostas/${respostaId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status_item: 'conforme',
    valor_boolean: true,
    observacoes: 'Tudo OK!'
  })
})

const updated = await response.json()
console.log('✅ Item atualizado:', updated)
```

### 4. Verificar Score

```typescript
const response = await fetch(`/api/os/${osId}/checklist`)
const data = await response.json()

console.log('Score:', data.score.score + '%')
console.log('Pode concluir?', data.validation.pode_concluir)
console.log('Pendências:', data.score.pendencias)
console.log('Críticos:', data.score.criticos_pendentes)
```

## 🎯 Cenários Comuns

### Criar Checklist para Cada Tipo de Serviço

```sql
-- Preventiva
INSERT INTO public.checklists (empresa_id, nome, tipo_servico, ...) 
VALUES (..., 'preventiva', ...);

-- Corretiva
INSERT INTO public.checklists (empresa_id, nome, tipo_servico, ...) 
VALUES (..., 'corretiva', ...);

-- Emergencial
INSERT INTO public.checklists (empresa_id, nome, tipo_servico, ...) 
VALUES (..., 'emergencial', ...);
```

### Vincular Automaticamente ao Criar OS

```typescript
// Server Action ou API Route
async function createOSWithChecklist(data: any) {
  // 1. Criar OS
  const { data: os } = await supabase
    .from('ordens_servico')
    .insert(data)
    .select()
    .single()
  
  // 2. Buscar template padrão para o tipo
  const { data: template } = await supabase
    .from('checklists')
    .select('id')
    .eq('empresa_id', empresaId)
    .eq('tipo_servico', data.tipo)
    .eq('ativo', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  // 3. Vincular checklist
  if (template) {
    await fetch(`/api/os/${os.id}/start-checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklistId: template.id })
    })
  }
  
  return os
}
```

### Bloquear Conclusão de OS

```typescript
// Antes de concluir OS, verificar checklist
async function concluirOS(osId: string) {
  const response = await fetch(`/api/os/${osId}/checklist`)
  const { validation } = await response.json()
  
  if (!validation.pode_concluir) {
    alert('Não é possível concluir:\n' + validation.motivos_bloqueio.join('\n'))
    return false
  }
  
  // Continuar com conclusão...
  await supabase
    .from('ordens_servico')
    .update({ status: 'concluido' })
    .eq('id', osId)
  
  // Marcar checklist como completo
  await supabase
    .from('os_checklists')
    .update({ completed_at: new Date().toISOString() })
    .eq('os_id', osId)
  
  return true
}
```

## 🐛 Troubleshooting

### "Template não encontrado"
- Verifique se o template está ativo: `ativo = true`
- Verifique se pertence à empresa correta
- Verifique se o UUID está correto

### "Não autenticado"
- Certifique-se de que o usuário está logado
- Verifique se os cookies do Supabase estão funcionando
- Teste com `supabase.auth.getUser()`

### "RLS Policy violado"
- Verifique se o usuário tem `empresa_id` no perfil
- Verifique se `current_empresa_id()` retorna valor
- Teste: `SELECT current_empresa_id();`

### Checklist não aparece na UI
- Verifique se o snapshot foi criado: `SELECT * FROM os_checklists WHERE os_id = ?`
- Verifique se as respostas foram criadas: `SELECT COUNT(*) FROM checklist_respostas WHERE os_id = ?`
- Abra o console do navegador para ver erros

## 📚 Próximos Passos

1. ✅ Criar templates personalizados
2. ✅ Testar fluxo completo de uma OS
3. ✅ Implementar upload de fotos
4. ✅ Implementar assinatura digital
5. ✅ Gerar PDF com checklist preenchido
6. ✅ Dashboard com estatísticas de conformidade

---

Para mais detalhes, consulte: [CHECKLIST_SYSTEM.md](./CHECKLIST_SYSTEM.md)

