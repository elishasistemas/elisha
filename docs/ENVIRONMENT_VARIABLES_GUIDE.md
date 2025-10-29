# 🌍 Guia: Variáveis de Ambiente (Dev vs Prod)

## 🎯 Como Funciona

### **Ordem de Precedência do Next.js**

```
┌─────────────────────────────────────┐
│  1. .env.local         (PRIORIDADE) │ ← Sobrescreve tudo
├─────────────────────────────────────┤
│  2. .env.development   (pnpm dev)   │ ← Apenas em desenvolvimento
├─────────────────────────────────────┤
│  3. .env.production    (pnpm build) │ ← Apenas em produção
├─────────────────────────────────────┤
│  4. .env               (fallback)   │ ← Valores padrão
└─────────────────────────────────────┘
```

### **Regras Importantes** ⚠️

1. **`.env.local` SEMPRE tem prioridade**
   - Se existir, sobrescreve `.env.development` e `.env.production`
   - Útil para testes locais específicos
   - ⚠️ Nunca commitar no Git

2. **`.env.development` é usado em `pnpm dev`**
   - Apenas quando `.env.local` não existe
   - Perfeito para desenvolvimento regular

3. **`.env.production` é usado em `pnpm build`**
   - Usado no build de produção
   - Vercel usa este em production deploys

---

## 📋 Cenários de Uso

### **Cenário 1: Desenvolvimento Regular** (Recomendado) 🟢

```bash
# Estrutura de arquivos:
.env.development       ✅ (aponta para develop branch)
.env.local.backup      📦 (backup do prod, não é lido)

# Comando:
pnpm dev

# Resultado:
✅ Conecta em: dahfsyvxvacibowwxgns (DEV)
```

### **Cenário 2: Testar contra Produção Local** ⚠️

```bash
# Estrutura de arquivos:
.env.development       📝 (existe mas é ignorado)
.env.local             ✅ (aponta para main branch - PROD)

# Comando:
pnpm dev

# Resultado:
⚠️ Conecta em: wkccxgeevizhxmclvsnz (PROD)
```

### **Cenário 3: Build de Produção** 🚀

```bash
# Estrutura de arquivos:
.env.production        ✅ (aponta para main branch)

# Comando:
pnpm build

# Resultado:
✅ Build usa: wkccxgeevizhxmclvsnz (PROD)
```

---

## 🔄 Alternando Entre Ambientes

### **Para Usar DEV** (padrão) 🟢

```bash
# Se .env.local existe, renomear:
mv .env.local .env.local.backup

# Verificar:
cat .env.development | grep SUPABASE_URL
# Deve mostrar: dahfsyvxvacibowwxgns

# Rodar:
pnpm dev
```

### **Para Testar contra PROD** ⚠️

```bash
# Restaurar .env.local:
mv .env.local.backup .env.local

# Verificar:
cat .env.local | grep SUPABASE_URL
# Deve mostrar: wkccxgeevizhxmclvsnz

# Rodar:
pnpm dev

# ⚠️ CUIDADO: Dados reais de produção!
```

### **Voltar para DEV** 🟢

```bash
# Renomear novamente:
mv .env.local .env.local.backup

# Rodar:
pnpm dev
```

---

## 🔍 Como Verificar Qual Banco Está Usando

### **Método 1: Ver no Terminal**

```bash
pnpm dev
```

Procure por:
```
- Environments: .env.local, .env.development
```

- Se aparecer `.env.local` → Usando **PROD** ⚠️
- Se aparecer apenas `.env.development` → Usando **DEV** ✅

### **Método 2: Ver no Console do Navegador**

1. Abra `http://localhost:3000`
2. Abra DevTools (F12)
3. No Console, digite:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
   ```
4. Verifique a URL:
   - `dahfsyvxvacibowwxgns` → **DEV** ✅
   - `wkccxgeevizhxmclvsnz` → **PROD** ⚠️

### **Método 3: Verificar Variável de Ambiente**

```bash
# Ver qual arquivo seria usado:
ls -la .env.local .env.development 2>/dev/null

# Ver conteúdo:
cat .env.development | grep SUPABASE_URL
```

---

## 📂 Estrutura de Arquivos Recomendada

```
/Users/iversondantas/Projects/Elisha/web-admin/
├── .env.development         ✅ DEV (commit: NÃO)
├── .env.local.backup        📦 PROD backup (commit: NÃO)
├── .env.production          🚀 PROD (commit: NÃO)
├── .env.example             📋 Template (commit: SIM)
└── .gitignore               🔒 Ignora todos .env.* (commit: SIM)
```

---

## 🎯 Fluxo de Trabalho Recomendado

### **Desenvolvimento Diário** (99% do tempo)

```bash
# 1. Garantir que está em DEV
ls .env.local 2>/dev/null && echo "⚠️ ATENÇÃO: .env.local existe!" || echo "✅ OK"

# 2. Rodar
pnpm dev

# 3. Desenvolver tranquilo
# Todas mudanças vão para o branch develop ✅
```

### **Testar contra Produção** (raramente)

```bash
# 1. Avisar time
echo "⚠️ TESTANDO CONTRA PRODUÇÃO!"

# 2. Ativar .env.local
mv .env.local.backup .env.local

# 3. Testar
pnpm dev

# 4. VOLTAR PARA DEV
mv .env.local .env.local.backup
```

---

## 🚨 Troubleshooting

### **Problema: "Estou em DEV mas vejo dados de PROD"**

```bash
# Verificar qual ambiente está ativo:
ls -la .env.local 2>/dev/null

# Se existir, renomear:
mv .env.local .env.local.backup

# Reiniciar servidor:
# Ctrl+C no terminal do pnpm dev
pnpm dev
```

### **Problema: "Não sei qual banco estou usando"**

```bash
# Ver todas variáveis SUPABASE:
cat .env.development .env.local 2>/dev/null | grep SUPABASE_URL

# Deve mostrar apenas uma URL ativa:
# - dahfsyvxvacibowwxgns → DEV ✅
# - wkccxgeevizhxmclvsnz → PROD ⚠️
```

### **Problema: "Mudei .env mas não funcionou"**

```bash
# Next.js faz cache das variáveis de ambiente
# Precisa reiniciar o servidor:

# 1. Parar servidor (Ctrl+C)
# 2. Limpar cache
rm -rf .next

# 3. Reiniciar
pnpm dev
```

---

## 📊 Resumo Visual

### **Configuração Atual (Recomendada)** ✅

```
┌─────────────────────────────────────┐
│  Arquivo                 │ Status   │
├──────────────────────────┼──────────┤
│  .env.development        │ ✅ ATIVO │ → DEV (dahfsyvxvacibowwxgns)
│  .env.local.backup       │ 📦 OFF   │ → PROD (wkccxgeevizhxmclvsnz)
└─────────────────────────────────────┘

$ pnpm dev
  → Conecta em: DEV ✅
```

### **Se .env.local Existir** ⚠️

```
┌─────────────────────────────────────┐
│  Arquivo                 │ Status   │
├──────────────────────────┼──────────┤
│  .env.local              │ 👑 ATIVO │ → PROD (wkccxgeevizhxmclvsnz)
│  .env.development        │ ⚠️ IGNOR │ → DEV (ignorado)
└─────────────────────────────────────┘

$ pnpm dev
  → Conecta em: PROD ⚠️ (cuidado!)
```

---

## 🎓 Comandos Úteis

```bash
# Ver qual ambiente está ativo:
pnpm dev | grep "Environments"

# Listar arquivos .env:
ls -la .env* | grep -v example

# Ver URL do Supabase ativo:
cat .env.development 2>/dev/null | grep SUPABASE_URL || \
cat .env.local 2>/dev/null | grep SUPABASE_URL

# Alternar para DEV:
[ -f .env.local ] && mv .env.local .env.local.backup && echo "✅ Agora em DEV"

# Alternar para PROD (cuidado!):
[ -f .env.local.backup ] && mv .env.local.backup .env.local && echo "⚠️ Agora em PROD"
```

---

## 📞 Dúvidas Comuns

**Q: Posso ter .env.local e .env.development ao mesmo tempo?**  
A: Tecnicamente sim, mas `.env.local` vai sobrescrever `.env.development`. Não recomendado.

**Q: O que acontece se eu deletar todos .env?**  
A: A aplicação não vai iniciar. Precisa de pelo menos um arquivo `.env.*` com as credenciais.

**Q: Vercel usa qual .env?**  
A: Vercel usa as variáveis configuradas no dashboard dele, não os arquivos locais.

**Q: Como garantir que estou em DEV?**  
A: `ls .env.local` não deve retornar nada. Apenas `.env.development` deve existir.

---

**Última atualização**: 2025-10-29  
**Versão**: 1.0.0


