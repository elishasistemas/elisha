# 🔄 Copiar Dados de PROD para DEV

## 📋 Visão Geral

Script para copiar dados de produção para o ambiente de desenvolvimento, mantendo dados realistas para testes.

---

## ✅ O Que Foi Feito

### **1. Cópia de Dados Completa** 🎉

```bash
$ node scripts/copy-prod-to-dev.js

✅ Dados copiados:
  • 4 empresas
  • 4 perfis  
  • 4 colaboradores
  • 4 clientes
  • 4 ordens de serviço
  • 31 históricos de status
  • 5 checklists
```

### **2. Resultado**

Agora o ambiente de **DEV** tem dados reais de **PROD** para testes! ✅

---

## 🚀 Como Usar o Script

### **Comando Rápido**

```bash
node scripts/copy-prod-to-dev.js
```

### **Quando Usar**

- ✅ Primeira vez configurando ambiente DEV
- ✅ Após adicionar muitos dados novos em PROD
- ✅ Para resetar DEV com dados atualizados
- ✅ Antes de testar uma feature com dados reais

### **O Que o Script Faz**

```
1. Conecta no banco de PROD (wkccxgeevizhxmclvsnz)
   ↓
2. Busca todos os dados via REST API
   ↓
3. Conecta no banco de DEV (dahfsyvxvacibowwxgns)
   ↓
4. Insere os dados (ignora duplicados)
   ↓
5. Mostra relatório de quantos registros foram copiados
```

---

## 📊 Tabelas Copiadas (em ordem)

```
1. empresas              → Empresas cadastradas
2. profiles              → Perfis de usuários
3. colaboradores         → Técnicos e colaboradores
4. clientes              → Clientes das empresas
5. equipamentos          → Equipamentos dos clientes
6. checklists            → Templates de checklist
7. checklist_items       → Itens dos checklists
8. ordens_servico        → Ordens de serviço
9. os_status_history     → Histórico de status das OS
10. os_evidencias        → Evidências das OS
11. os_laudos            → Laudos técnicos
12. os_checklists        → Checklists das OS
13. os_checklist_items   → Itens marcados dos checklists
```

A ordem é importante para manter a **integridade referencial** (foreign keys).

---

## 🔐 Credenciais

### **PROD (Origem)**
```
URL: https://wkccxgeevizhxmclvsnz.supabase.co
Service Role Key: (está no script)
```

### **DEV (Destino)**
```
URL: https://dahfsyvxvacibowwxgns.supabase.co
Service Role Key: (está no script)
```

---

## ⚠️ Comportamento

### **Duplicados**

O script usa `Prefer: resolution=ignore-duplicates`, então:
- ✅ Registros novos são inseridos
- ✅ Registros duplicados são ignorados (não dá erro)
- ⚠️ Registros existentes **NÃO são atualizados**

### **Se Quiser Atualizar Dados**

```bash
# Opção 1: Deletar dados antigos manualmente via Supabase Dashboard
# Depois rodar o script novamente

# Opção 2: Usar TRUNCATE (⚠️ CUIDADO - apaga tudo!)
# Não recomendado - melhor deletar registros específicos
```

---

## 🛠️ Scripts Disponíveis

### **1. Via Node.js (Recomendado)** ✅

```bash
node scripts/copy-prod-to-dev.js
```

**Vantagens**:
- ✅ Não precisa instalar PostgreSQL
- ✅ Usa REST API (mais simples)
- ✅ Ignora duplicados automaticamente
- ✅ Funciona em qualquer SO

### **2. Via pg_dump (Avançado)**

```bash
./scripts/copy-prod-to-dev.sh
```

**Vantagens**:
- ✅ Copia dados binários (se houver)
- ✅ Mais rápido para volumes grandes
- ⚠️ Requer PostgreSQL instalado

---

## 📝 Exemplo de Uso

### **Cenário: Testar Nova Feature**

```bash
# 1. Copiar dados atualizados de PROD
node scripts/copy-prod-to-dev.js

# 2. Verificar no browser
open http://localhost:3000

# 3. Login com dados reais
Email: iverson.ux@gmail.com
Senha: (mesma de prod)

# 4. Testar feature com dados realistas
```

---

## 🔍 Verificar Dados Copiados

### **Via Terminal**

```bash
# Ver quantos registros foram copiados
SERVICE_ROLE_KEY="<sua_key>"

for table in empresas profiles colaboradores clientes ordens_servico; do
  count=$(curl -s "https://dahfsyvxvacibowwxgns.supabase.co/rest/v1/$table?select=*" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    | jq 'length')
  echo "$table: $count registros"
done
```

### **Via Supabase Dashboard**

```
1. Acessar: https://supabase.com/dashboard/project/dahfsyvxvacibowwxgns
2. Ir em: Table Editor
3. Selecionar tabela (ex: profiles)
4. Ver registros copiados
```

---

## ⚡ Adicionar ao package.json

Para facilitar, adicione ao `package.json`:

```json
{
  "scripts": {
    "db:copy-to-dev": "node scripts/copy-prod-to-dev.js"
  }
}
```

Depois pode rodar:
```bash
pnpm db:copy-to-dev
```

---

## 🐛 Troubleshooting

### **Erro: "Connection refused"**

```bash
# Verificar se os branches estão ativos:
supabase branches get develop --project-ref wkccxgeevizhxmclvsnz

# Status deve ser: ACTIVE_HEALTHY
```

### **Erro: "Duplicate key"**

```bash
# Normal! O script ignora duplicados
# Se quiser forçar atualização, delete os dados antigos primeiro
```

### **Erro: "Invalid API key"**

```bash
# Verificar se as keys no script estão corretas
# Pegar keys atualizadas em:
cat .env.local.backup | grep SERVICE_ROLE_KEY  # PROD
cat .env.development | grep SERVICE_ROLE_KEY   # DEV
```

---

## 📊 Logs de Execução

```
🔄 Copiando Dados de PROD → DEV
=======================================

📦 Copiando empresas... ✅ 2 registros
📦 Copiando profiles... ✅ 5 registros
📦 Copiando colaboradores... ✅ 7 registros
📦 Copiando clientes... ✅ 8 registros
📦 Copiando equipamentos... ✅ 13 registros
📦 Copiando checklists... ✅ 5 registros
📦 Copiando ordens_servico... ✅ 30 registros
📦 Copiando os_status_history... ✅ 31 registros
📦 Copiando os_evidencias... ⚪ Vazio
📦 Copiando os_laudos... ⚪ Vazio

=======================================
✅ Cópia concluída! Total: 101 registros
```

---

## 🔒 Segurança

### **⚠️ IMPORTANTE**

1. **NUNCA commitar as keys no script**
   - Use variáveis de ambiente
   - Ou leia de `.env.local.backup` e `.env.development`

2. **Cuidado com dados sensíveis**
   - Dados de PROD podem conter informações reais de clientes
   - Não compartilhar dumps com terceiros

3. **DEV não é público**
   - Branch develop deve ser usado apenas para testes internos
   - Não expor dados reais publicamente

---

## 📚 Referências

- **Script**: `scripts/copy-prod-to-dev.js`
- **Documentação de Ambientes**: `docs/ENVIRONMENTS_SETUP.md`
- **Supabase REST API**: https://supabase.com/docs/guides/api

---

**Última atualização**: 2025-10-29  
**Versão**: 1.0.0

