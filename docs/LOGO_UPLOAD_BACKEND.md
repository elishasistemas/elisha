# Upload de Logo da Empresa - Backend

## Problema Resolvido

O upload de logo da empresa estava falhando com erro 403 devido às políticas de RLS (Row Level Security) do Supabase Storage. A solução foi migrar o processamento do upload para o backend NestJS, que recebe o arquivo do frontend e faz upload para o Supabase Storage usando o token do usuário.

## Implementação

### Backend (NestJS)

#### 1. Endpoint de Upload
**Arquivo:** `/apps/api/src/empresas/empresas.controller.ts`

- **Rota:** `POST /api/v1/empresas/:id/logo`
- **Autenticação:** JWT Bearer Token
- **Content-Type:** `multipart/form-data`
- **Campo do arquivo:** `file`

**Validações:**
- Tamanho máximo: 2MB
- Tipos permitidos: JPG, JPEG, PNG, GIF, WebP, SVG
- Arquivo obrigatório

**Processo:**
1. Recebe o arquivo via multer (em memória)
2. Gera nome único: `{empresaId}-logo-{timestamp}.{extensão}`
3. Faz upload para Supabase Storage bucket `empresas` no path `empresas/logos/`
4. Obtém URL pública do Supabase Storage
5. Atualiza campo `logo_url` na tabela `empresas`
6. Retorna objeto empresa com novo `logo_url`

#### 2. Service Method
**Arquivo:** `/apps/api/src/empresas/empresas.service.ts`

Método `uploadLogoToStorage()`:
- Usa `file.buffer` para upload direto na memória
- Usa Supabase Client com token do usuário para passar RLS
- Faz upload com `upsert: true` para substituir logos antigos
- Obtém URL pública via `getPublicUrl()`
- Atualiza banco de dados com a nova URL

**URL Gerada:** 
```
https://tbxumetajqwnmbcqpfmr.supabase.co/storage/v1/object/public/empresas/empresas/logos/{empresaId}-logo-{timestamp}.{ext}
```

### Frontend (Next.js)

#### Função de Upload
**Arquivo:** `/apps/web/src/lib/storage.ts`

A função `uploadCompanyLogo()`:

1. Valida arquivo (tipo e tamanho) - validação duplicada para melhor UX
2. Obtém token JWT da sessão Supabase
3. Cria FormData com o arquivo
4. Faz POST para `/api/v1/empresas/{id}/logo` com Authorization header
5. Retorna URL completa do Supabase Storage recebida do backend

**Mudanças principais:**
- ❌ **Antes:** Upload direto para Supabase Storage (bloqueado por RLS)
- ✅ **Agora:** Upload via backend que usa token do usuário para passar RLS

## Estrutura de Storage

### Supabase Storage
```
Bucket: empresas (public = true)
├── empresas/
│   └── logos/
│       ├── {empresaId1}-logo-{timestamp1}.png
│       ├── {empresaId2}-logo-{timestamp2}.jpg
│       └── ...
```

### Backend
```
apps/api/src/empresas/
├── empresas.controller.ts    # Endpoint POST /:id/logo
└── empresas.service.ts       # Método uploadLogoToStorage()
```

## Configuração RLS

### Aplicar Policies
Execute o script `/FIX_STORAGE_RLS_EMPRESAS.sql` no SQL Editor do Supabase:
- **DEV:** https://supabase.com/dashboard/project/tbxumetajqwnmbcqpfmr/sql
- **PROD:** (aplicar no projeto de produção)

### Políticas Criadas
1. **INSERT:** Usuários autenticados podem fazer upload em `empresas/logos/`
2. **UPDATE:** Usuários autenticados podem substituir logos existentes
3. **SELECT:** Acesso público para leitura (exibição das imagens)
4. **DELETE:** Usuários autenticados podem deletar logos

## Como Usar

### No Frontend

O componente `logo-upload.tsx` já está configurado. Não requer alterações:

```typescript
import { uploadCompanyLogo } from '@/lib/storage'

const result = await uploadCompanyLogo(file, empresaId)

if (result.success) {
  console.log('Logo URL:', result.url)
  // URL: https://tbxumetajqwnmbcqpfmr.supabase.co/storage/v1/object/public/empresas/empresas/logos/...
} else {
  console.error('Erro:', result.error)
}
```

### Testando com cURL

```bash
# Obter token JWT
TOKEN="seu_jwt_token_aqui"
EMPRESA_ID="uuid-da-empresa"

# Upload
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/caminho/para/logo.png" \
  http://localhost:3001/api/v1/empresas/$EMPRESA_ID/logo

# Resposta esperada:
# {
#   "id": "uuid-da-empresa",
#   "logo_url": "https://tbxumetajqwnmbcqpfmr.supabase.co/storage/v1/object/public/empresas/empresas/logos/uuid-logo-123456789.png",
#   ...
# }
```

## Vantagens da Implementação

1. **✅ Backend gerencia upload com token do usuário**
   - RLS continua ativo e seguro
   - Backend usa credenciais do usuário autenticado
   - Não expõe service_role_key

2. **✅ URLs apontam para Supabase Storage**
   - Funcionam em DEV e PROD
   - CDN do Supabase para performance
   - URLs públicas acessíveis de qualquer lugar

3. **✅ Validação centralizada**
   - Backend valida tipo e tamanho
   - Frontend valida para melhor UX
   - Logs centralizados no backend

4. **✅ Compatível com múltiplos ambientes**
   - Mesma lógica para DEV e PROD
   - Apenas muda a variável NEXT_PUBLIC_SUPABASE_URL
   - Storage policies aplicadas em ambos

5. **✅ Fácil manutenção**
   - Upload em memória (sem arquivos temporários)
   - Código limpo e testável
   - Políticas de RLS configuráveis

## Ambientes

### DEV
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001
- **Supabase:** https://tbxumetajqwnmbcqpfmr.supabase.co
- **Storage URL:** https://tbxumetajqwnmbcqpfmr.supabase.co/storage/v1/object/public/empresas/...

### PROD
- **Frontend:** (URL de produção)
- **Backend:** (URL de produção)
- **Supabase:** (URL de produção)
- **Storage URL:** (URL de produção do Supabase Storage)

## Checklist de Deploy

### Para DEV (já configurado)
- [x] Backend atualizado com `uploadLogoToStorage()`
- [x] Frontend atualizado para chamar backend
- [ ] **APLICAR SCRIPT SQL:** `FIX_STORAGE_RLS_EMPRESAS.sql` no Supabase DEV
- [ ] Testar upload de logo
- [ ] Verificar URL gerada aponta para Supabase Storage

### Para PROD (quando fizer deploy)
- [ ] Deploy do backend com código atualizado
- [ ] Deploy do frontend com código atualizado
- [ ] **APLICAR SCRIPT SQL:** `FIX_STORAGE_RLS_EMPRESAS.sql` no Supabase PROD
- [ ] Verificar variáveis de ambiente (NEXT_PUBLIC_SUPABASE_URL, etc.)
- [ ] Testar upload em produção
- [ ] Verificar URLs acessíveis publicamente

## Melhorias Futuras

- [ ] Adicionar compressão automática de imagens (Sharp, ImageMagick)
- [ ] Implementar cache de imagens (CDN, CloudFlare)
- [ ] Implementar versionamento de logos (histórico)
- [ ] Deletar logo antigo ao fazer upload de novo (limpeza automática)
- [ ] Migrar outros uploads (avatares, anexos OS) para mesmo padrão
- [ ] Adicionar webhooks para processar imagens em background
- [ ] Implementar crop/resize de imagens no frontend antes do upload

## Troubleshooting

### Erro 403 ao fazer upload
**Causa:** RLS policies não aplicadas no Supabase Storage

**Solução:** 
1. Executar script `FIX_STORAGE_RLS_EMPRESAS.sql`
2. Verificar se bucket `empresas` tem `public = true`
3. Verificar se usuário está autenticado (token válido)

### URL aponta para localhost
**Causa:** Backend retornando URL local ao invés de Supabase Storage

**Solução:**
1. Verificar se código atualizado está rodando (hot reload ativo?)
2. Verificar método `uploadLogoToStorage()` usa `getPublicUrl()`
3. Reiniciar backend se necessário

### Arquivo não aparece no Storage
**Causa:** Upload falhou mas banco foi atualizado

**Solução:**
1. Verificar logs do backend para erros de upload
2. Verificar permissões de RLS
3. Testar upload manualmente no Supabase Dashboard

### Imagem não carrega no frontend
**Causa:** URL inválida ou CORS

**Solução:**
1. Verificar se bucket é público
2. Verificar RLS policy de SELECT (public access)
3. Testar URL diretamente no navegador

## Referências

- [NestJS File Upload](https://docs.nestjs.com/techniques/file-upload)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Supabase Storage RLS](https://supabase.com/docs/guides/storage/security/access-control)
- [Multer Documentation](https://github.com/expressjs/multer)
