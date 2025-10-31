# 🔄 Tarefa 4 Em Andamento: Checklist + Laudo + Evidências

**Data de Início**: 28 de Outubro de 2025  
**Status**: 🔄 **EM ANDAMENTO** (70% concluída)  
**Plan Reference**: `.cursor/plan.yaml` → Step 4 (id: "4-atendimento-checklist-laudo-evidencias")

---

## 📋 Progresso Atual

| Subtarefa | Status | Detalhes |
|-----------|--------|----------|
| Tabela `os_evidencias` | ✅ | Criada com RLS |
| Tabela `os_laudos` | ✅ | Criada com RLS |
| Enum `evidencia_tipo` | ✅ | foto, video, audio, nota |
| Bucket `evidencias` | ✅ | Já existia |
| Hook `useDebounce` | ✅ | Criado (2s delay) |
| Componente `OSAtendimentoChecklist` | ✅ | Criado |
| Laudo com Autosave | ✅ | Implementado (debounce 2s) |
| Upload de Foto | ✅ | Com câmera ou galeria |
| Upload de Vídeo | ✅ | Com câmera ou galeria |
| Upload de Áudio | ✅ | Com microfone |
| Notas de Texto | ✅ | Prompt simples |
| Listagem de Evidências | ✅ | Com opção de deletar |
| Integração na Full-Screen | ✅ | Aparece após check-in |
| **Checklist Real** | ⏳ | **PENDENTE** (próximo passo) |

---

## ✅ Implementado Até Agora

### 1. **Migration de Evidências e Laudo**
**Arquivo**: `supabase/migrations/2025-10-28-create-evidencias-and-laudo.sql`

**Tabelas Criadas**:

#### `os_evidencias`
```sql
CREATE TABLE os_evidencias (
  id uuid PRIMARY KEY,
  os_id uuid NOT NULL REFERENCES ordens_servico(id),
  empresa_id uuid NOT NULL,
  tipo evidencia_tipo NOT NULL,  -- foto | video | audio | nota
  
  storage_path text,    -- Para arquivos
  conteudo text,        -- Para notas
  
  titulo text,
  descricao text,
  tamanho_bytes bigint,
  mime_type text,
  
  created_by uuid,
  created_at timestamptz
);
```

#### `os_laudos`
```sql
CREATE TABLE os_laudos (
  id uuid PRIMARY KEY,
  os_id uuid NOT NULL UNIQUE,
  empresa_id uuid NOT NULL,
  
  descricao text,
  diagnostico text,
  solucao_aplicada text,
  recomendacoes text,
  
  versao int NOT NULL DEFAULT 1,  -- Auto-incrementado
  
  created_by uuid,
  created_at timestamptz,
  updated_by uuid,
  updated_at timestamptz
);
```

**Trigger de Versionamento**:
- Incrementa `versao` a cada update
- Atualiza `updated_at` e `updated_by`

**RLS Configurado**:
- ✅ Leitura por empresa
- ✅ Inserção por empresa
- ✅ Atualização (criador ou admin)
- ✅ Deleção (criador ou admin)

---

### 2. **Hook `useDebounce`**
**Arquivo**: `src/hooks/use-debounce.ts`

**Funcionalidade**:
- Atrasa a propagação de mudanças de estado
- Útil para autosave (evita chamadas excessivas)
- Delay configurável (padrão: 500ms)

**Uso no Laudo**: Delay de 2 segundos

---

### 3. **Componente `OSAtendimentoChecklist`**
**Arquivo**: `src/components/os-atendimento-checklist.tsx` (~550 linhas)

**Features Implementadas**:

#### a) **Laudo Técnico**
- ✅ 4 campos: Descrição, Diagnóstico, Solução, Recomendações
- ✅ Autosave com debounce de 2 segundos
- ✅ Indicador visual "Salvando..."
- ✅ Versionamento automático
- ✅ Carregamento inicial se laudo existir

#### b) **Upload de Evidências**
- ✅ **Foto**: `<input type="file" accept="image/*" capture="environment">`
- ✅ **Vídeo**: `<input type="file" accept="video/*" capture="environment">`
- ✅ **Áudio**: `<input type="file" accept="audio/*">`
- ✅ **Nota**: Prompt simples com `prompt()`

**Fluxo de Upload**:
1. Usuário seleciona/captura arquivo
2. Upload para `storage.buckets.evidencias`
3. Caminho: `{os_id}/{tipo}/{timestamp}.{ext}`
4. Registro em `os_evidencias` com metadata
5. Atualização da lista em tempo real

#### c) **Listagem de Evidências**
- ✅ Card para cada evidência
- ✅ Ícone por tipo (Camera, Video, Mic, FileText)
- ✅ Timestamp formatado
- ✅ Link "Abrir" para visualizar (se não for nota)
- ✅ Botão deletar (confirmar antes)

#### d) **Segurança**
- ✅ Validação de `empresa_id`
- ✅ RLS no banco garante isolamento
- ✅ Apenas criador ou admin pode deletar

---

### 4. **Integração na Full-Screen**
**Arquivo**: `src/app/(protected)/os/[id]/full/page.tsx`

**Mudanças**:
- Import do componente `OSAtendimentoChecklist`
- Renderização condicional: `os.status === 'checkin'`
- Posicionado logo após "Área de Atendimento"
- Botões de placeholder removidos

**Fluxo Visual**:
```
1. Check-in (Chegada)
   ↓
2. Área de Atendimento aparece (card com próximos passos)
   ↓
3. Checklist + Laudo + Evidências aparecem logo abaixo
   ↓
4. Técnico preenche laudo e adiciona evidências
   ↓
5. Checkout (Tarefa 5)
```

---

## 📊 Estrutura do Componente

```
<OSAtendimentoChecklist>
  │
  ├─ <Card> Laudo Técnico
  │   ├─ Indicador "Salvando..." (se salvando)
  │   ├─ Textarea: Descrição
  │   ├─ Textarea: Diagnóstico
  │   ├─ Textarea: Solução Aplicada
  │   ├─ Textarea: Recomendações
  │   └─ Versão: N
  │
  └─ <Card> Evidências
      ├─ Botões de Upload (grid 2x2)
      │   ├─ Foto 📷
      │   ├─ Vídeo 🎥
      │   ├─ Áudio 🎤
      │   └─ Nota 📝
      │
      └─ Lista de Evidências
          └─ [Card para cada evidência]
              ├─ Ícone + Título
              ├─ Timestamp
              ├─ Link "Abrir"
              └─ Botão Deletar
```

---

## 🧪 Como Testar

### 1. Fazer Check-in
```
1. Aceite um chamado
2. Clique "Check-in (Chegada)"
3. Permita geolocalização (se solicitado)
4. Área de Atendimento aparece
5. Checklist + Laudo + Evidências aparecem logo abaixo
```

### 2. Testar Laudo
```
1. Digite algo em "Descrição do Problema"
2. Aguarde 2 segundos
3. Indicador "Salvando..." deve aparecer e desaparecer
4. Recarregue a página (F5)
5. Texto deve estar salvo ✅
```

### 3. Testar Upload de Foto
```
1. Clique no botão "Foto 📷"
2. Selecione uma imagem ou tire uma foto
3. Aguarde upload
4. Toast "Foto enviada com sucesso!" aparece
5. Foto aparece na lista abaixo
6. Clique "Abrir" para visualizar
```

### 4. Testar Nota
```
1. Clique no botão "Nota 📝"
2. Digite um texto no prompt
3. Clique OK
4. Nota aparece na lista
```

### 5. Testar Deletar Evidência
```
1. Clique no ícone de lixeira em uma evidência
2. Confirme a exclusão
3. Evidência desaparece
4. Toast "Evidência excluída com sucesso!" aparece
```

---

## ⏳ Próximos Passos (Restante da Tarefa 4)

### Implementar Checklist Real

**Problema**: O componente atual não renderiza o checklist vinculado à OS.

**Solução Necessária**:
1. Buscar checklist vinculado à OS:
   ```typescript
   const { data: checklist } = await supabase
     .from('os_checklists')
     .select('*, template_snapshot')
     .eq('os_id', osId)
     .single()
   ```

2. Se não existir, criar snapshot ao iniciar:
   ```typescript
   // Buscar template vinculado ao equipamento
   const template = await buscarTemplateVinculado(os.equipamento_id)
   
   // Criar snapshot imutável
   const { data } = await supabase
     .from('os_checklists')
     .insert({
       os_id: osId,
       empresa_id: empresaId,
       checklist_id: template.id,
       template_snapshot: template.itens, // JSONB com itens
       started_at: new Date().toISOString()
     })
     .select()
     .single()
   ```

3. Renderizar itens do checklist:
   ```tsx
   {checklist?.template_snapshot?.itens?.map(item => (
     <div key={item.id}>
       <Checkbox 
         checked={item.checked}
         onChange={() => toggleItem(item.id)}
       />
       <span>{item.titulo}</span>
     </div>
   ))}
   ```

4. Atualizar snapshot ao marcar/desmarcar:
   ```typescript
   const updateItemStatus = async (itemId: string, checked: boolean) => {
     const updated = {
       ...checklist.template_snapshot,
       itens: checklist.template_snapshot.itens.map(i =>
         i.id === itemId ? { ...i, checked } : i
       )
     }
     
     await supabase
       .from('os_checklists')
       .update({ template_snapshot: updated })
       .eq('id', checklist.id)
   }
   ```

**Estimativa**: 1-2 horas

---

## 📈 Métricas de Implementação

| Item | Linhas de Código | Complexidade |
|------|------------------|--------------|
| Migration SQL | ~170 | Média |
| Hook `useDebounce` | ~30 | Baixa |
| Componente Checklist | ~550 | Alta |
| Integração Full-Screen | ~10 | Baixa |
| **TOTAL** | **~760** | **Média-Alta** |

---

## 🎓 Lições Aprendidas (Até Agora)

1. **Debounce é Essencial**: Evita sobrecarga de chamadas ao banco
2. **Storage Paths**: Organizar por `{os_id}/{tipo}/{timestamp}`
3. **RLS Multi-Tenant**: Sempre validar `empresa_id`
4. **Permissions Policy**: Já configurada na Tarefa 3 (câmera, mic, geo)
5. **Autosave UX**: Indicador visual é importante para feedback
6. **Constraint CHECK**: Garante integridade (storage_path OU conteudo)

---

## 🔐 Segurança Implementada

| Aspecto | Status | Implementação |
|---------|--------|---------------|
| RLS Evidências | ✅ | Por empresa + criador |
| RLS Laudos | ✅ | Por empresa |
| Storage Privado | ✅ | Bucket não-público |
| Validação de Tipo | ✅ | Enum `evidencia_tipo` |
| Multi-tenancy | ✅ | `empresa_id` obrigatório |
| Auditoria | ✅ | `created_by`, `updated_by` |

---

## 📚 Arquivos Criados/Modificados

### Criados (3):
1. `supabase/migrations/2025-10-28-create-evidencias-and-laudo.sql`
2. `src/hooks/use-debounce.ts`
3. `src/components/os-atendimento-checklist.tsx`

### Modificados (2):
1. `src/app/(protected)/os/[id]/full/page.tsx` (integração)
2. `supabase/migrations/2025-10-28-create-evidencias-and-laudo.sql` (typo fix)

---

**✍️ Progresso**: 70% da Tarefa 4 concluído  
**⏭️ Próximo**: Implementar renderização de checklist real  
**🚀 Continuar na mesma sessão!**

---

**Desenvolvido por**: Elisha AI + Cursor IDE  
**Data**: 28 de Outubro de 2025  
**Versão**: 1.0  
**Status**: 🔄 Em Andamento

