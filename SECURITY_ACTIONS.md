# 🔒 Ações de Segurança Necessárias

## ⚠️ Problema Identificado

Foi encontrada uma **Supabase Service Role Key hardcoded** no arquivo `scripts/apply-migration-via-api.js` que foi commitada no histórico do Git.

## ✅ Ações Já Executadas

1. ✅ Removida a chave hardcoded do arquivo
2. ✅ Commit criado: `security: remove hardcoded Supabase service role key`
3. ✅ Verificado que arquivos `.env.local` NÃO estão sendo rastreados

## 🚨 Ações URGENTES Necessárias

### 1. Revogar a Chave Exposta no Supabase

A chave exposta pertence ao projeto: `ecvjgixhcfmkdfbnueqh.supabase.co`

**Passos:**
1. Acesse: https://app.supabase.com/project/ecvjgixhcfmkdfbnueqh/settings/api
2. Role até "Service Role" 
3. Clique em **"Reset"** ou **"Regenerate"**
4. Atualize a nova chave em:
   - Vercel/Render (variáveis de ambiente de produção)
   - Seu `.env.local` local
   - Qualquer outro ambiente que use essa chave

**Chave comprometida (primeiros caracteres):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjdmpnaXhoY...
```

### 2. Limpar Histórico do Git (Opcional mas Recomendado)

Como a chave está no histórico do Git, você tem duas opções:

#### Opção A: Reescrever histórico (CUIDADO!)
```bash
# ⚠️ Isso reescreve o histórico - use com cuidado!
# Só faça isso se outros desenvolvedores não dependem dessa branch

git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch scripts/apply-migration-via-api.js" \
  --prune-empty --tag-name-filter cat -- --all

# Depois force push
git push origin feature/fernando --force
```

#### Opção B: Aceitar que a chave está no histórico
- Revogue a chave antiga no Supabase (passo 1)
- Continue com a nova chave
- A chave antiga ficará no histórico mas será inútil

**Recomendação:** Use a **Opção B** - é mais seguro e simples.

### 3. Verificar Outros Projetos Supabase

Se você tem outros projetos Supabase no repositório, verifique se não há outras chaves expostas:

```bash
# Buscar padrões de chaves JWT
git log -p | grep -E "eyJhbGciOi|service_role"
```

## 🔐 Boas Práticas Implementadas

1. ✅ `.gitignore` configurado corretamente:
   - `.env`
   - `.env.*` (exceto `.env.example`)

2. ✅ Arquivos `.env.example` criados para documentação

3. ✅ Scripts atualizados para exigir variáveis de ambiente

## 📋 Checklist de Segurança

- [x] Remover chave hardcoded do código
- [ ] **URGENTE: Revogar chave antiga no Supabase**
- [ ] Atualizar nova chave em todos os ambientes
- [x] Verificar `.gitignore`
- [x] Criar `.env.example`
- [ ] (Opcional) Limpar histórico do Git

## 🎯 Próximos Passos

1. **AGORA**: Revogue a Service Role Key no dashboard do Supabase
2. Atualize a nova chave em seus ambientes
3. Teste se tudo funciona com a nova chave
4. Continue desenvolvendo com segurança! 🚀

---

**Data:** 26/11/2025  
**Branch:** feature/fernando
