# Implementação do Sistema de Zonas

## ✅ Implementação Completa

### 1. **Database Schema** (Migration criada)
**Arquivo:** `/supabase/migrations/20251206000000_add_zonas.sql`

#### Tabelas Criadas:

**`zonas`**
- `id` (uuid, PK)
- `empresa_id` (uuid, FK → empresas)
- `nome` (text, NOT NULL)
- `tecnico_responsavel_id` (uuid, FK → colaboradores, nullable)
- `created_at`, `updated_at` (timestamptz)
- **Constraint único:** `(empresa_id, nome)` - evita zonas duplicadas por empresa

**`zonas_tecnicos`** (Tabela de associação N:N)
- `id` (uuid, PK)
- `zona_id` (uuid, FK → zonas)
- `tecnico_id` (uuid, FK → colaboradores)
- `created_at` (timestamptz)
- **Constraint único:** `(zona_id, tecnico_id)` - evita associações duplicadas

**`clientes.zona_id`** (Coluna adicionada)
- `zona_id` (uuid, FK → zonas, nullable)
- Um cliente pode ter 0 ou 1 zona

#### Políticas RLS:
- ✅ SELECT: usuários podem ver zonas da mesma empresa
- ✅ INSERT/UPDATE/DELETE: apenas admins podem gerenciar zonas
- ✅ Suporte para impersonation (elisha_admin)

#### Funções SQL:
- `create_zona(p_empresa_id, p_nome, p_tecnico_responsavel_id)` - Cria zona com validação de permissões
- `add_tecnico_to_zona(p_zona_id, p_tecnico_id)` - Associa técnico a zona
- `remove_tecnico_from_zona(p_zona_id, p_tecnico_id)` - Remove técnico de zona

---

### 2. **TypeScript Types** (Definições atualizadas)
**Arquivo:** `/apps/web/src/lib/supabase.ts`

```typescript
export interface Zona {
  id: string
  empresa_id: string
  nome: string
  tecnico_responsavel_id: string | null
  created_at: string
  updated_at: string
}

export interface ZonaTecnico {
  id: string
  zona_id: string
  tecnico_id: string
  created_at: string
}

export interface Cliente {
  // ... outros campos
  zona_id: string | null  // ← Novo campo
}
```

---

### 3. **React Hooks** (Serviços implementados)
**Arquivo:** `/apps/web/src/hooks/use-supabase.ts`

#### `useZonas(empresaId, opts)`
Retorna:
- `zonas: Zona[]` - Lista de zonas da empresa
- `loading: boolean`
- `error: string | null`
- `createZona(nome, tecnicoResponsavelId)` - Cria nova zona
- `updateZona(id, updates)` - Atualiza zona existente
- `deleteZona(id)` - Remove zona

**Funcionalidades:**
- ✅ Listagem automática de zonas por empresa
- ✅ Ordenação alfabética por nome
- ✅ Refresh automático após operações
- ✅ Integração com RPC `create_zona`

---

### 4. **ZonaDialog Component** (Componente reutilizável)
**Arquivo:** `/apps/web/src/components/zona-dialog.tsx`

#### Props:
```typescript
{
  open: boolean
  onOpenChange: (open: boolean) => void
  empresaId: string
  colaboradores: Colaborador[]
  onSuccess?: (zonaId: string) => void
}
```

#### Features:
- ✅ Form com nome da zona (obrigatório)
- ✅ Select de técnico responsável (opcional)
- ✅ Filtra apenas técnicos ativos
- ✅ Validação de campos
- ✅ Feedback com toast
- ✅ Callback `onSuccess` com ID da zona criada
- ✅ Estados de loading e disabled

---

### 5. **Client Dialog Integration** (Clientes com zona)
**Arquivo:** `/apps/web/src/components/client-dialog.tsx`

#### Mudanças Implementadas:

**Imports:**
```typescript
import { MapPin } from 'lucide-react'
import { useZonas, useColaboradores } from '@/hooks/use-supabase'
import { ZonaDialog } from './zona-dialog'
```

**Estado:**
```typescript
const [formData, setFormData] = useState({
  // ... campos existentes
  zona_id: cliente?.zona_id || '',  // ← Novo
})

const [zonaDialogOpen, setZonaDialogOpen] = useState(false)
const [zonaRefreshKey, setZonaRefreshKey] = useState(0)
const { zonas } = useZonas(empresaId, { refreshKey: zonaRefreshKey })
const { colaboradores } = useColaboradores(empresaId)
```

**Campo no Form:**
```tsx
<div className="space-y-2">
  <Label htmlFor="zona_id">
    <MapPin className="inline w-4 h-4 mr-1" />
    Zona
  </Label>
  <Select 
    value={formData.zona_id} 
    onValueChange={(value) => {
      if (value === 'criar_nova') {
        setZonaDialogOpen(true)
      } else {
        handleChange('zona_id', value)
      }
    }}
  >
    <SelectContent>
      <SelectItem value="">Sem zona</SelectItem>
      <SelectItem value="criar_nova" className="text-primary font-medium">
        + Criar nova zona
      </SelectItem>
      {zonas.map((zona) => (
        <SelectItem key={zona.id} value={zona.id}>
          {zona.nome}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**ZonaDialog Integrado:**
```tsx
<ZonaDialog
  open={zonaDialogOpen}
  onOpenChange={setZonaDialogOpen}
  empresaId={empresaId}
  colaboradores={colaboradores}
  onSuccess={(zonaId) => {
    setZonaRefreshKey(prev => prev + 1)  // Refresh lista
    handleChange('zona_id', zonaId)      // Seleciona automaticamente
    toast.success('Zona criada e selecionada!')
  }}
/>
```

**Submit com zona_id:**
```typescript
const clienteData = {
  // ... outros campos
  zona_id: formData.zona_id || null,
}
```

---

## 📋 Fluxo de Uso Implementado

### **Cadastro de Cliente com Zona:**

1. Admin abre dialog de criar/editar cliente
2. Vê campo "Zona" com 3 opções no select:
   - ✅ **"Sem zona"** (valor vazio) - Cliente não vinculado
   - ✅ **"+ Criar nova zona"** (destacado) - Abre ZonaDialog
   - ✅ **Lista de zonas existentes** - Seleciona zona já criada

3. Se clicar em "Criar nova zona":
   - ZonaDialog abre
   - Preenche nome da zona
   - Opcionalmente seleciona técnico responsável
   - Clica "Criar Zona"
   - Zona é criada no banco
   - Select atualiza automaticamente
   - Nova zona fica selecionada
   - Toast de sucesso

4. Cliente é salvo com `zona_id`

---

## ⚠️ Limitações Conhecidas

### **Técnicos/Colaboradores:**
- ❌ Não existe dialog dedicado para criar/editar técnicos no frontend atual
- ❌ Campo de zonas não foi adicionado ao cadastro de técnicos (precisa ser criado primeiro)
- ✅ Associação técnico-zona está implementada no banco (tabela `zonas_tecnicos`)
- ✅ Backend API suporta criar técnicos via `/api/v1/colaboradores`

### **Solução Alternativa:**
Para associar técnicos a múltiplas zonas, será necessário:
1. Criar uma interface de gestão de zonas separada, ou
2. Adicionar um dialog de técnico similar ao de cliente, ou
3. Gerenciar via SQL direto enquanto não há interface:

```sql
-- Associar técnico a uma zona
INSERT INTO zonas_tecnicos (zona_id, tecnico_id)
VALUES ('zona-uuid', 'tecnico-uuid');

-- Remover técnico de uma zona
DELETE FROM zonas_tecnicos 
WHERE zona_id = 'zona-uuid' AND tecnico_id = 'tecnico-uuid';
```

---

## 🧪 Como Testar

### **1. Aplicar Migration:**
```bash
cd /Users/mau/ws/Elisha-admin
supabase db push
```

### **2. Testar Criação de Zona via Cliente:**
1. Login como admin
2. Ir para página de clientes
3. Clicar em "Novo Cliente"
4. No campo "Zona", clicar em "+ Criar nova zona"
5. Preencher nome (ex: "Centro")
6. Selecionar técnico responsável (opcional)
7. Clicar "Criar Zona"
8. Verificar que zona aparece selecionada no select
9. Salvar cliente

### **3. Verificar no Banco:**
```sql
-- Ver zonas criadas
SELECT * FROM zonas;

-- Ver clientes com zona
SELECT c.nome_local, z.nome as zona
FROM clientes c
LEFT JOIN zonas z ON c.zona_id = z.id;

-- Ver técnicos por zona
SELECT 
  z.nome as zona,
  c.nome as tecnico
FROM zonas_tecnicos zt
JOIN zonas z ON zt.zona_id = z.id
JOIN colaboradores c ON zt.tecnico_id = c.id;
```

---

## 📝 Próximos Passos (Sugestões)

### **Opcional - Interface de Gestão de Zonas:**
Criar página `/admin/zonas` com:
- ✅ Listagem de todas as zonas
- ✅ CRUD completo (criar, editar, deletar)
- ✅ Gestão de técnicos por zona (adicionar/remover)
- ✅ Visualização de clientes por zona
- ✅ Estatísticas (quantos clientes/técnicos por zona)

### **Opcional - Filtros por Zona:**
- Adicionar filtro de zona na listagem de clientes
- Adicionar filtro de zona na listagem de OS
- Dashboard com métricas por zona

### **Opcional - Dialog de Técnico:**
Criar componente similar ao `ClientDialog` para cadastro de técnicos com:
- Campos básicos (nome, telefone, whatsapp, função)
- **Multiselect de zonas** (um técnico pode estar em várias)
- Integração com `ZonaDialog` para criar zona inline

---

## ✅ Checklist de Implementação

- [x] Migration SQL com tabelas e políticas
- [x] Tipos TypeScript (Zona, ZonaTecnico)
- [x] Interface Cliente atualizada com zona_id
- [x] Hook useZonas com CRUD completo
- [x] Componente ZonaDialog reutilizável
- [x] Integração no ClientDialog
- [x] Campo zona no form de cliente
- [x] Select com 3 opções (Sem zona, Criar nova, Lista)
- [x] Fluxo de criação inline funcionando
- [x] Refresh automático após criar zona
- [x] Seleção automática da zona criada
- [x] Salvamento de zona_id ao criar/editar cliente
- [ ] Interface de gestão de técnicos com zonas
- [ ] Testes E2E completos

---

## 🎯 Regras de Negócio Implementadas

✅ **Cliente → Zona: 0 ou 1** (implementado via `clientes.zona_id` nullable)
✅ **Técnico → Zona: 0 ou N** (implementado via tabela `zonas_tecnicos`)
✅ **Apenas admin pode criar zonas** (implementado via RLS)
✅ **Zona obrigatória no cadastro de cliente** ❌ (opcional, pode ser "Sem zona")
✅ **Criação inline de zona** (implementado via ZonaDialog)
✅ **Técnico responsável por zona** (implementado via `zonas.tecnico_responsavel_id`)

---

## 📞 Suporte

Se houver dúvidas sobre a implementação, verificar:
1. Console do navegador para erros
2. Logs do Supabase para erros de RLS
3. Network tab para ver requests falhando
4. Toast messages para feedback ao usuário
