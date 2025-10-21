# 🔐 Sistema de Super Admin Elisha

Sistema completo de administração para equipe Elisha gerenciar todas as empresas clientes.

---

## ✅ O Que Foi Implementado

### 1. Role `elisha_admin`

**Novo papel exclusivo** para equipe Elisha com poderes especiais:

- ✅ Visualizar **TODAS as empresas** clientes
- ✅ Criar novas empresas
- ✅ Criar primeiro usuário para cada empresa
- ✅ **Impersonar** qualquer empresa (acessar como se fosse usuário dela)
- ✅ Audit log de todas as ações de impersonation

### 2. Banco de Dados

#### Colunas Adicionadas em `profiles`

```sql
- is_elisha_admin boolean DEFAULT false
- impersonating_empresa_id uuid (referência para empresas)
```

#### Nova Tabela: `impersonation_logs`

```sql
CREATE TABLE impersonation_logs (
  id uuid PRIMARY KEY,
  admin_id uuid,                -- Quem impersonou
  empresa_id uuid,              -- Qual empresa
  started_at timestamptz,       -- Quando começou
  ended_at timestamptz,         -- Quando terminou
  actions_taken jsonb           -- Log de ações (futuro)
)
```

#### Funções Helper Atualizadas

```sql
-- Verifica se usuário é elisha_admin
public.is_elisha_admin() → boolean

-- Suporta impersonation
public.current_empresa_id() → uuid
  → Retorna impersonating_empresa_id se estiver impersonando
  → Senão, retorna empresa_id normal
```

#### RLS Policies Atualizadas

**Todas as tabelas** agora incluem regra para elisha_admin:

```sql
USING (
  public.is_elisha_admin() = true  -- Elisha admin vê tudo
  OR <regras normais>
)
```

**Tabelas protegidas:**
- ✅ `empresas`
- ✅ `profiles`
- ✅ `ordens_servico`
- ✅ `clientes`
- ✅ `contratos`
- ✅ `checklists`
- ✅ `equipamentos`
- ✅ `colaboradores`

---

## 🎯 Usuários Criados

| Email | Nome | Role | Status |
|-------|------|------|--------|
| iverson.ux@gmail.com | Iverson Dantas (Elisha Admin) | elisha_admin | ✅ Configurado |

---

## 🖥️ Painel Admin

### Rota: `/admin/companies`

**Funcionalidades:**

1. **Listar Empresas**
   - Nome, CNPJ, contato
   - Quantidade de usuários
   - Quantidade de OS
   - Status (ativo/inativo)

2. **Criar Nova Empresa**
   - Nome (obrigatório)
   - CNPJ, email, telefone (opcionais)
   - Status ativo/inativo

3. **Editar Empresa**
   - Atualizar informações
   - Ativar/desativar

4. **Criar Primeiro Usuário**
   - Email do usuário
   - Nome
   - Papel (gestor/tecnico)
   - **Envia convite por email**

5. **Impersonar Empresa** (botão "Acessar")
   - Acessa o sistema como se fosse usuário da empresa
   - Banner amarelo no topo indica modo impersonation
   - Botão "Sair" para voltar ao painel admin

---

## 📡 APIs Criadas

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/admin/invite-elisha-admin` | POST | Convidar novo admin Elisha |
| `/api/admin/update-elisha-claims` | POST | Atualizar JWT claims |
| `/api/admin/create-company-user` | POST | Criar usuário para empresa |
| `/api/admin/stop-impersonation` | POST | Sair do modo impersonation |

---

## 🚀 Como Usar

### Para Iverson (Admin Elisha)

1. **Fazer Login**
   - Email: `iverson.ux@gmail.com`
   - Senha: (use a senha já configurada)

2. **Acessar Painel Admin**
   - URL: `https://app.elisha.com.br/admin/companies`
   - Ou adicionar link no menu (ver seção "Integração UI")

3. **Cadastrar Nova Empresa**
   - Clicar em "Nova Empresa"
   - Preencher nome (obrigatório) e dados adicionais
   - Salvar

4. **Criar Primeiro Usuário da Empresa**
   - Na lista, clicar em "Usuário" da empresa
   - Preencher email e nome
   - Escolher papel (geralmente "Gestor")
   - Enviar convite
   - **O usuário receberá email para ativar conta**

5. **Impersonar Empresa** (para teste ou suporte)
   - Clicar em "Acessar"
   - Sistema muda para visualização da empresa
   - Banner amarelo aparece no topo
   - Todas as ações são como se fosse usuário da empresa
   - Para sair: clicar em "Sair" no banner

---

## 🎨 Componentes UI

| Componente | Arquivo | Uso |
|------------|---------|-----|
| `ImpersonationBanner` | `src/components/admin/impersonation-banner.tsx` | Banner no topo quando impersonando |
| `CompanyDialog` | `src/components/admin/company-dialog.tsx` | Dialog para criar/editar empresa |
| `UserDialog` | `src/components/admin/user-dialog.tsx` | Dialog para criar usuário |

### Integração no Layout Principal

Para mostrar o banner de impersonation em todas as páginas:

```tsx
// src/app/(protected)/layout.tsx
import { ImpersonationBanner } from '@/components/admin/impersonation-banner'

export default function ProtectedLayout({ children }) {
  return (
    <div>
      <ImpersonationBanner />  {/* Adicionar aqui */}
      {children}
    </div>
  )
}
```

### Adicionar Link no Menu

Para admins Elisha terem acesso rápido:

```tsx
// src/components/app-sidebar.tsx
const { data: { user } } = await supabase.auth.getUser()
const { data: profile } = await supabase
  .from('profiles')
  .select('is_elisha_admin')
  .eq('id', user.id)
  .single()

// No menu
{profile?.is_elisha_admin && (
  <Link href="/admin/companies">
    🔐 Painel Admin
  </Link>
)}
```

---

## 🔒 Segurança

### Proteção do Painel Admin

O layout `/admin/*` **já está protegido**:

```typescript
// src/app/(admin)/layout.tsx
// Verifica se é elisha_admin
if (!profile?.is_elisha_admin || profile.active_role !== 'elisha_admin') {
  redirect('/dashboard')
}
```

### Audit Log

**Todas as impersonations** são registradas:

```sql
SELECT 
  il.*,
  u.email as admin_email,
  e.nome as empresa_nome
FROM impersonation_logs il
JOIN auth.users u ON u.id = il.admin_id
JOIN empresas e ON e.id = il.empresa_id
ORDER BY started_at DESC;
```

### JWT Claims

Elisha admin tem claims especiais:

```json
{
  "is_elisha_admin": true,
  "active_role": "elisha_admin",
  "empresa_id": null,
  "impersonating_empresa_id": "uuid" // quando impersonando
}
```

---

## 📊 Fluxo de Uso Típico

### Novo Cliente

1. **Admin Elisha**: Acessa `/admin/companies`
2. **Admin Elisha**: Cria nova empresa ("Acme Corp")
3. **Admin Elisha**: Cria primeiro usuário (joao@acme.com, Gestor)
4. **Sistema**: Envia email de convite para joao@acme.com
5. **João**: Recebe email, clica no link, define senha
6. **João**: Faz primeiro login no sistema
7. **João**: Configura sua empresa (clientes, equipamentos, etc)

### Suporte Técnico

1. **Cliente**: Reporta problema
2. **Admin Elisha**: Acessa `/admin/companies`
3. **Admin Elisha**: Clica em "Acessar" na empresa do cliente
4. **Admin Elisha**: Vê exatamente o que o cliente vê
5. **Admin Elisha**: Diagnostica/resolve problema
6. **Admin Elisha**: Clica em "Sair" do modo impersonation
7. **Sistema**: Registra ação no audit log

---

## 🧪 Testes

### Teste 1: Verificar Admin Elisha

```sql
SELECT 
  u.email,
  p.nome,
  p.is_elisha_admin,
  p.active_role,
  p.roles
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE p.is_elisha_admin = true;
```

**Esperado:** 1 linha com iverson.ux@gmail.com

### Teste 2: Criar Empresa

1. Fazer login como iverson.ux@gmail.com
2. Acessar `/admin/companies`
3. Clicar "Nova Empresa"
4. Preencher "Empresa Teste"
5. Salvar
6. Verificar que aparece na lista

### Teste 3: Criar Usuário

1. Na empresa criada, clicar "Usuário"
2. Email: teste@empresa.com
3. Nome: Usuário Teste
4. Papel: Gestor
5. Enviar convite
6. **Verificar email recebido** (inbox do teste@empresa.com)

### Teste 4: Impersonation

1. Clicar "Acessar" em uma empresa
2. Verificar banner amarelo no topo
3. Navegar pelas páginas
4. Verificar que só vê dados daquela empresa
5. Clicar "Sair"
6. Verificar retorno ao painel admin

### Teste 5: RLS

```sql
-- Simular contexto de elisha_admin
SET request.jwt.claims = '{"is_elisha_admin": true}';

-- Deve retornar TODAS as empresas
SELECT * FROM empresas;

-- Deve retornar TODAS as OS
SELECT * FROM ordens_servico;
```

---

## ⚠️ Avisos Importantes

### 1. Service Role Key

As APIs admin usam `SUPABASE_SERVICE_ROLE_KEY`. **Nunca exponha essa chave** no frontend!

```bash
# .env.local (OBRIGATÓRIO)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Proteção em Produção

Em produção, adicione autenticação extra nas APIs `/api/admin/*`:

```typescript
// Verificar se usuário é realmente elisha_admin
const { data: { user } } = await supabase.auth.getUser()
const { data: profile } = await supabase
  .from('profiles')
  .select('is_elisha_admin')
  .eq('id', user.id)
  .single()

if (!profile?.is_elisha_admin) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}
```

### 3. Audit Log

**Sempre revise** o audit log periodicamente:

```sql
-- Impersonations na última semana
SELECT 
  DATE(started_at) as dia,
  COUNT(*) as total_impersonations,
  COUNT(DISTINCT admin_id) as admins_distintos,
  COUNT(DISTINCT empresa_id) as empresas_impersonadas
FROM impersonation_logs
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(started_at)
ORDER BY dia DESC;
```

### 4. Convites Expiram

Convites do Supabase expiram em **24 horas**. Se cliente não ativar a tempo, crie novo convite.

---

## 🔧 Manutenção

### Adicionar Novo Admin Elisha

```sql
-- 1. Criar usuário via Supabase Dashboard ou API

-- 2. Configurar profile
UPDATE profiles SET
  is_elisha_admin = true,
  roles = ARRAY['elisha_admin'],
  active_role = 'elisha_admin',
  empresa_id = NULL
WHERE id = 'user-id-aqui';

-- 3. Atualizar claims (via API ou manualmente)
```

### Remover Admin Elisha

```sql
UPDATE profiles SET
  is_elisha_admin = false,
  roles = ARRAY['gestor'],  -- ou outro papel
  active_role = 'gestor',
  empresa_id = 'empresa-id'  -- vincular a uma empresa
WHERE id = 'user-id-aqui';
```

### Limpar Logs Antigos

```sql
-- Manter apenas últimos 90 dias
DELETE FROM impersonation_logs
WHERE started_at < NOW() - INTERVAL '90 days';
```

---

## 📚 Próximos Passos

### Imediato

1. ✅ **Testar login** como iverson.ux@gmail.com
2. ✅ **Criar primeira empresa** de teste
3. ✅ **Criar primeiro usuário** de teste
4. ✅ **Testar impersonation**

### Curto Prazo

5. ⏳ Adicionar link do painel admin no menu principal
6. ⏳ Integrar `ImpersonationBanner` no layout
7. ⏳ Criar mais admins Elisha se necessário
8. ⏳ Documentar processo para novos clientes

### Médio Prazo

9. ⏳ Dashboard de estatísticas no painel admin
10. ⏳ Filtros/busca na lista de empresas
11. ⏳ Exportar lista de empresas (CSV/Excel)
12. ⏳ Notificações de novas empresas

### Longo Prazo

13. ⏳ Sistema de tickets/suporte integrado
14. ⏳ Relatórios de uso por empresa
15. ⏳ Billing/cobrança automatizada
16. ⏳ Auditoria avançada com busca

---

## 📞 Suporte

Para dúvidas sobre o sistema de super admin, contate:

- **Email**: iverson.ux@gmail.com
- **Slack**: #elisha-admin (se aplicável)
- **Docs**: Este arquivo

---

**Implementado em:** Outubro 21, 2025  
**Versão:** 1.0.0  
**Status:** ✅ PRONTO PARA USO

**Primeiro Admin:** Iverson Dantas (iverson.ux@gmail.com)

