# 📋 Fluxo de Cadastro de Clientes com Equipamentos

**Data:** 24 de outubro de 2025  
**Status:** ✅ IMPLEMENTADO

---

## 🎯 Objetivo

Melhorar o fluxo de cadastro de clientes permitindo:
1. Cadastrar **equipamentos** diretamente durante a criação do cliente
2. Adicionar campos de **contrato** (valor mensal e ART)
3. Atualização automática da lista após cadastro

---

## ✨ Funcionalidades Implementadas

### **1. Campos Adicionais no Cliente**

#### **Valor Mensal do Contrato**
- Campo: `valor_mensal_contrato` (NUMERIC)
- Formato: R$ 0,00 (formatação automática)
- Localização: Seção "Contrato"

#### **Número da ART**
- Campo: `numero_art` (TEXT)
- Descrição: Anotação de Responsabilidade Técnica
- Localização: Seção "Contrato"

### **2. Cadastro Inline de Equipamentos**

Durante a criação de um cliente, é possível adicionar múltiplos equipamentos:

#### **Campos do Equipamento:**
- **Nome** (obrigatório) - Ex: "Elevador Principal"
- **Tipo** (obrigatório) - Ex: "Elevador", "Escada Rolante"
- **Marca** - Ex: "Otis", "Schindler"
- **Pavimentos** - Ex: "Térreo ao 10º"
- **Capacidade** - Ex: "8 pessoas", "600kg"

#### **Funcionalidades:**
- ✅ Adicionar quantos equipamentos quiser antes de salvar
- ✅ Preview da lista de equipamentos adicionados
- ✅ Remover equipamentos da lista antes de salvar
- ✅ Todos os equipamentos são criados automaticamente com o cliente

### **3. Atualização Automática da Lista**

✅ **FIX:** Após criar/editar um cliente, a lista atualiza automaticamente  
✅ Não é mais necessário recarregar a página manualmente

---

## 🎨 Interface do Usuário

### **Seção de Contrato (Atualizada)**

```
┌─────────────────────────────────────────────┐
│ Contrato                                    │
├─────────────────────────────────────────────┤
│ Data de Início     | Data de Término        │
│ [___________]      | [___________]          │
│                                             │
│ Valor Mensal       | Número da ART          │
│ R$ [0,00____]      | [123456789_]           │
└─────────────────────────────────────────────┘
```

### **Seção de Equipamentos (Nova)**

```
┌─────────────────────────────────────────────┐
│ Equipamentos              (2 adicionados)   │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐    │
│ │ Elevador Principal             [🗑]  │    │
│ │ Elevador • Otis • 8 pessoas          │    │
│ └─────────────────────────────────────┘    │
│ ┌─────────────────────────────────────┐    │
│ │ Escada Rolante A               [🗑]  │    │
│ │ Escada Rolante • ThyssenKrupp • ...  │    │
│ └─────────────────────────────────────┘    │
├─────────────────────────────────────────────┤
│ Adicionar Novo Equipamento:                 │
│                                             │
│ Nome do Equipamento                         │
│ [Elevador Principal___________________]     │
│                                             │
│ Tipo                | Marca                 │
│ [Elevador_____]     | [Otis________]        │
│                                             │
│ Pavimentos          | Capacidade            │
│ [Térreo ao 10º]     | [8 pessoas___]        │
│                                             │
│        [+ Adicionar Equipamento]            │
└─────────────────────────────────────────────┘
```

---

## 🚀 Como Usar

### **1. Criar Cliente com Equipamentos**

```
1. Acessar "Clientes"
2. Clicar em "Novo Cliente"
3. Preencher dados básicos (Nome, CNPJ)
4. Preencher dados do responsável (opcional)
5. Preencher dados do contrato:
   - Datas de início/fim
   - Valor mensal: R$ 1.500,00
   - Número da ART: 123456789
6. Adicionar equipamentos (opcional):
   - Preencher campos do equipamento
   - Clicar em "Adicionar Equipamento"
   - Repetir para cada equipamento
7. Clicar em "Criar Cliente"

✅ Cliente e todos os equipamentos criados automaticamente!
✅ Lista atualiza sem precisar recarregar!
```

### **2. Editar Cliente**

```
1. Acessar "Clientes"
2. Clicar em "Editar" no cliente desejado
3. Modificar campos desejados
4. Clicar em "Atualizar"

⚠️ Nota: Edição de equipamentos deve ser feita 
   separadamente na tela de "Equipamentos"
```

---

## 📊 Estrutura do Banco de Dados

### **Tabela: `clientes`**

```sql
-- Novos campos adicionados:
ALTER TABLE public.clientes
ADD COLUMN valor_mensal_contrato NUMERIC(10, 2);

ALTER TABLE public.clientes
ADD COLUMN numero_art TEXT;
```

### **Tabela: `equipamentos`**

```sql
-- Novos campos adicionados:
ALTER TABLE public.equipamentos
ADD COLUMN nome TEXT;

ALTER TABLE public.equipamentos
ADD COLUMN pavimentos TEXT;

ALTER TABLE public.equipamentos
ADD COLUMN capacidade TEXT;

-- Campos existentes usados:
-- tipo (text)
-- fabricante (text) → usado como "marca"
```

---

## 🔧 Implementação Técnica

### **Arquivo Modificado:**
- `src/components/client-dialog.tsx`

### **Migration Criada:**
- `supabase/migrations/2025-10-24-add-client-contract-and-equipment-fields.sql`

### **Principais Mudanças:**

1. **Estado do Formulário:**
```typescript
const [formData, setFormData] = useState({
  // ... campos existentes
  valor_mensal_contrato: '',
  numero_art: '',
})

const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
const [novoEquipamento, setNovoEquipamento] = useState<Equipamento>({
  nome: '',
  tipo: '',
  pavimentos: '',
  marca: '',
  capacidade: '',
})
```

2. **Lógica de Salvamento:**
```typescript
// 1. Criar cliente
const { data: newCliente } = await supabase
  .from('clientes')
  .insert([clienteData])
  .select('id')
  .single()

// 2. Criar equipamentos automaticamente
if (equipamentos.length > 0) {
  const equipamentosData = equipamentos.map(eq => ({
    cliente_id: newCliente.id,
    empresa_id: empresaId,
    nome: eq.nome,
    tipo: eq.tipo,
    // ...
  }))
  
  await supabase
    .from('equipamentos')
    .insert(equipamentosData)
}
```

3. **Fix de Atualização:**
```typescript
setOpen(false)

// Resetar form...

// Chamar onSuccess APÓS fechar para atualizar lista
if (onSuccess) {
  setTimeout(() => onSuccess(), 100)
}
```

---

## ✅ Validações

### **Cliente:**
- ✅ Nome é obrigatório
- ✅ CNPJ é obrigatório
- ✅ Formatação automática de CNPJ
- ✅ Formatação automática de telefone
- ✅ Formatação automática de valor monetário

### **Equipamento:**
- ✅ Nome é obrigatório
- ✅ Tipo é obrigatório
- ⚠️ Outros campos opcionais

---

## 🎯 Benefícios

### **1. Produtividade**
- ✅ Cadastro mais rápido (cliente + equipamentos em um só fluxo)
- ✅ Menos cliques e navegação
- ✅ Menos tempo de espera

### **2. Experiência do Usuário**
- ✅ Interface intuitiva
- ✅ Preview dos dados antes de salvar
- ✅ Feedback visual imediato
- ✅ Lista atualiza automaticamente

### **3. Dados Completos**
- ✅ Cadastro mais completo desde o início
- ✅ Informações de contrato organizadas
- ✅ Equipamentos vinculados corretamente

---

## 📝 Exemplos de Uso

### **Exemplo 1: Shopping Center**

```
Cliente: Shopping ABC
CNPJ: 12.345.678/0001-90
Valor Mensal: R$ 8.500,00
Número ART: 987654321

Equipamentos:
1. Elevador Social A
   - Tipo: Elevador
   - Marca: Otis
   - Pavimentos: Térreo ao 3º
   - Capacidade: 10 pessoas

2. Elevador Social B
   - Tipo: Elevador
   - Marca: Otis
   - Pavimentos: Térreo ao 3º
   - Capacidade: 10 pessoas

3. Escada Rolante Principal
   - Tipo: Escada Rolante
   - Marca: ThyssenKrupp
   - Pavimentos: Térreo ao 1º
   - Capacidade: 6.000 pessoas/hora
```

### **Exemplo 2: Prédio Comercial**

```
Cliente: Edifício Corporate
CNPJ: 98.765.432/0001-10
Valor Mensal: R$ 3.200,00
Número ART: 456789123

Equipamentos:
1. Elevador Principal
   - Tipo: Elevador
   - Marca: Schindler
   - Pavimentos: Subsolo ao 15º
   - Capacidade: 8 pessoas, 600kg
```

---

## 🔍 Testes Realizados

### **Teste 1: Criar cliente sem equipamentos**
✅ Cliente criado com sucesso  
✅ Campos de contrato salvos corretamente  
✅ Lista atualiza automaticamente  

### **Teste 2: Criar cliente com 1 equipamento**
✅ Cliente e equipamento criados  
✅ Vinculação correta (cliente_id)  
✅ Todos os campos salvos  

### **Teste 3: Criar cliente com múltiplos equipamentos**
✅ Cliente e 3 equipamentos criados  
✅ Todos vinculados corretamente  
✅ Toast com contagem de equipamentos  

### **Teste 4: Adicionar e remover equipamentos da lista**
✅ Adiciona corretamente ao preview  
✅ Remove do preview sem erros  
✅ Contador atualiza  

### **Teste 5: Formatação de valores**
✅ CNPJ: 12.345.678/0001-90  
✅ Telefone: (81) 98765-4321  
✅ Valor: R$ 1.500,00  

---

## 📞 Suporte

**Documentação Relacionada:**
- `PERMISSOES_ADMIN_CORRIGIDAS.md` - Permissões de admin
- `STATUS_PERMISSOES_24_OUT_2025.md` - Status geral do sistema

**Migration:**
- `supabase/migrations/2025-10-24-add-client-contract-and-equipment-fields.sql`

**Componente:**
- `src/components/client-dialog.tsx`

---

**Última atualização:** 24 de outubro de 2025, 23:00  
**Status:** ✅ PRONTO PARA USO

