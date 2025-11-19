# ✅ Configuração DEV - Resumo

## Situação Atual

✅ **Você já está configurado!**

- ✅ Arquivo `.env.development` existe
- ✅ Configurado para branch DEV: `ecvjgixhcfmkdfbnueqh`
- ✅ URL Supabase DEV: `https://ecvjgixhcfmkdfbnueqh.supabase.co`

## Como Funciona

O Next.js automaticamente usa `.env.development` quando você executa:
```bash
pnpm dev
```

**NÃO precisa criar `.env.local`** - seu `.env.development` já cobre isso!

## Verificação Rápida

### 1. Verificar se está usando DEV:
```bash
# Quando rodar pnpm dev, no console do navegador:
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
# Deve mostrar: https://ecvjgixhcfmkdfbnueqh.supabase.co
```

### 2. Verificar se as chaves estão configuradas:
```bash
# Verificar se tem as chaves (sem mostrar valores)
cat .env.development | grep -E "ANON_KEY|SERVICE_ROLE" | grep -v "^#" | wc -l
# Deve retornar 2 (ou mais)
```

### 3. Se precisar obter as chaves:
- Dashboard DEV: https://supabase.com/dashboard/project/ecvjgixhcfmkdfbnueqh/settings/api
- Copie `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copie `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

## Próximos Passos para Continuar Plan.yaml

1. ✅ **Branch de desenvolvimento** (opcional, mas recomendado):
```bash
git checkout -b dev
# Ou continuar na branch atual
```

2. ✅ **Ambiente já configurado** - `.env.development` está pronto!

3. 🚀 **Iniciar desenvolvimento**:
```bash
pnpm dev
```

4. 📝 **Continuar Task 4 do plan.yaml**:
   - Checklist vinculado à OS
   - Laudo com autosave
   - Upload de evidências

## Diferença entre .env.development e .env.local

- **`.env.development`**: ✅ Recomendado, commitado no git (template)
- **`.env.local`**: ⚠️ Mais prioritário, não commitado (override local)
  - Se existir, sobrescreve `.env.development`
  - Útil para valores sensíveis pessoais

**Para desenvolvimento**: Use `.env.development` (como você já está fazendo) ✅

## Referências

- Plan.yaml: `.cursor/plan.yaml`
- Task 4 pendente: Checklist + Laudo + Evidências
- Documentação DEV: `docs/DEV_BRANCH_SETUP.md`

