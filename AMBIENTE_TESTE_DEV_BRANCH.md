# 🧪 Ambiente de Teste - Dev Branch

**Data**: 30/10/2025  
**Branch**: `dev` (ecvjgixhcfmkdfbnueqh)

---

## ✅ Dados Criados

### 🏢 Empresa
- **Nome**: Tech Elevadores LTDA
- **CNPJ**: 12.345.678/0001-90
- **ID**: `6e9c7b60-40a3-4dc2-98fc-d28757081a8a`

---

### 👥 Colaboradores (3)

| Nome | Função | Telefone | WhatsApp | ID |
|------|--------|----------|----------|-----|
| **Carlos Silva** | Administrador | (11) 98765-4321 | 5511987654321 | `e0458945-6f54-4e64-8072-2ff1336fe6e1` |
| **João Santos** | Técnico de Manutenção | (11) 99876-5432 | 5511998765432 | `35cc6e6b-450a-470b-bbd1-4c6719acc5da` |
| **Maria Oliveira** | Técnica Especialista | (11) 97654-3210 | 5511976543210 | `6a0758a9-b30b-4ebe-8dbe-b586597e036a` |

---

### 🏢 Clientes (3)

| Nome | CNPJ | Responsável | ID |
|------|------|-------------|-----|
| **Condomínio Residencial Jardins** | 76.543.210/0001-30 | Roberto Almeida | `19c2d00b-963b-448b-be6b-a68d64131e9a` |
| **Edifício Empresarial Paulista** | 87.654.321/0001-20 | Ana Paula Rodrigues | `c41af647-57b3-448d-8866-a1a22d65b8fc` |
| **Shopping Center Norte** | 98.765.432/0001-10 | Carlos Mendes | `7af76238-8e2a-430b-a32f-45e0617bfe17` |

---

### 🛗 Equipamentos (5)

| Cliente | Nome | Fabricante | Modelo | Número Série | ID |
|---------|------|------------|--------|--------------|-----|
| Cond. Jardins | Elevador Social | Atlas Schindler | Atlas Smart 3000 | AS-2019-001234 | `f6ec7fc1-8c4d-4605-85d7-eaaff985a75b` |
| Cond. Jardins | Elevador de Serviço | Otis | Gen2 Flex | OT-2018-005678 | `252d2761-0f0a-4a66-aaf7-cda0f3e4ce21` |
| Ed. Paulista | Elevador A | ThyssenKrupp | Evolution 200 | TK-2020-009876 | `d87c60b4-b8f9-4a62-a6d3-46f95fad564d` |
| Ed. Paulista | Elevador B | ThyssenKrupp | Evolution 200 | TK-2020-009877 | `24a41185-f94d-4883-a9d7-6b5db514e19b` |
| Shopping Norte | Elevador Panorâmico | Schindler | Schindler 5500 | SC-2021-012345 | `f09dbf33-88c1-4892-b6ec-56bc3cd88986` |

---

### 📋 Ordens de Serviço (4)

| Número | Tipo | Status | Prioridade | Cliente | Equipamento | Técnico | Observações |
|--------|------|--------|------------|---------|-------------|---------|-------------|
| **OS-2025-001** | Corretiva | 🆕 **novo** | 🔴 Alta | Cond. Jardins | Elevador Social | *(sem técnico)* | Elevador parado entre andares. Pessoas presas. |
| **OS-2025-002** | Preventiva | 🔄 **em_andamento** | 🟡 Média | Ed. Paulista | Elevador A | **João Santos** | Manutenção trimestral programada. |
| **OS-2025-003** | Corretiva | ✍️ **aguardando_assinatura** | 🟢 Baixa | Shopping Norte | Elevador Panorâmico | **Maria Oliveira** | Ruído estranho. Ajuste nas polias. |
| **OS-2025-004** | Preventiva | ✅ **concluído** | 🟢 Baixa | Cond. Jardins | Elevador de Serviço | **João Santos** | Manutenção mensal OK. |

---

## 🧪 Casos de Teste Disponíveis

### 1️⃣ **Abrir Nova OS**
- Simular abertura de chamado via WhatsApp ou Painel
- Testar prioridades (alta, média, baixa)
- Testar tipos (corretiva, preventiva)

### 2️⃣ **Atribuir Técnico a OS**
- OS-2025-001 está **sem técnico** → pode atribuir João ou Maria

### 3️⃣ **Avançar Status de OS**
- **novo** → **em_andamento** (iniciar atendimento)
- **em_andamento** → **aguardando_assinatura** (finalizar serviço)
- **aguardando_assinatura** → **concluído** (coletar assinatura)

### 4️⃣ **Filtrar e Buscar OS**
- Por status
- Por técnico
- Por cliente
- Por prioridade
- Por tipo

### 5️⃣ **Cancelar OS**
- Testar cancelamento de OS em qualquer status

### 6️⃣ **Visualizar Histórico**
- Ver todas as OS de um cliente
- Ver todas as OS de um técnico
- Ver todas as OS de um equipamento

---

## 🔐 Super Admin

**Conta Super Admin**: iverson.ux@gmail.com  
- ✅ `is_elisha_admin = true`
- ✅ `role = 'elisha_admin'`
- ✅ `active_role = 'elisha_admin'`
- ✅ Empresa: Elisha Team
- ✅ Acesso ao painel `/admin/companies`

---

## 📊 Resumo Estatístico

```
✅ 1 Empresa
✅ 3 Colaboradores (1 Admin + 2 Técnicos)
✅ 3 Clientes
✅ 5 Equipamentos
✅ 4 Ordens de Serviço (diferentes status)
```

---

## 🚀 Próximos Passos

1. ✅ Logs reduzidos
2. ✅ Policies RLS corrigidas
3. ✅ Ambiente de teste completo
4. 🔲 Testar abertura de chamado na UI
5. 🔲 Testar atribuição de técnico
6. 🔲 Testar fluxo completo de OS
7. 🔲 Testar filtros e buscas

---

**Status**: 🟢 Pronto para testes!

