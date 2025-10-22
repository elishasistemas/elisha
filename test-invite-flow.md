# 🧪 Teste do Fluxo de Convites - Local

## Preparação

1. **Rodar servidor de desenvolvimento:**
   ```bash
   pnpm dev
   ```

2. **Verificar variáveis de ambiente:**
   ```bash
   pnpm check-env
   ```
   Deve mostrar todas as variáveis ✅

---

## Teste 1: Criar Convite como Super Admin

### Passo 1: Login como Super Admin
1. Acesse: http://localhost:3000
2. Faça login com suas credenciais de super admin

### Passo 2: Impersonar uma Empresa
1. Vá em **Admin** → **Empresas**
2. Clique em **Impersonar** em uma empresa
3. Verifique se aparece o banner amarelo de impersonation

### Passo 3: Criar Convite
1. Vá em **Configurações** → **Usuários**
2. Clique em **"Convidar Usuário"**
3. Preencha:
   - Email: `teste@example.com`
   - Nome: `Usuário Teste`
   - Papel: `Admin` (ou qualquer outro)
4. Clique em **"Enviar Convite"**

### Resultado Esperado:
- ✅ Convite criado com sucesso
- ✅ Aparece tela com link do convite
- ✅ Mensagem: "Convite criado para teste@example.com"
- ✅ Link copiável
- ✅ Console não mostra erros de foreign key

### Possíveis Erros:
- ❌ **"violates foreign key constraint"** → Migration não foi aplicada ou created_by inválido
- ❌ **"401 Unauthorized"** → `SUPABASE_SERVICE_ROLE_KEY` não está configurada
- ❌ **"500 ao enviar email"** → `RESEND_API_KEY` não está configurada (não-crítico)

---

## Teste 2: Aceitar Convite

### Passo 1: Copiar Link do Convite
1. Na tela de sucesso, copie o link do convite
2. Exemplo: `http://localhost:3000/signup?token=abc123...`

### Passo 2: Abrir em Aba Anônima
1. Abra uma janela anônima/privada do navegador
2. Cole o link do convite

### Passo 3: Criar Conta
1. Veja se aparece:
   - 🎉 "Você foi convidado!"
   - Nome da empresa
   - Badge com o papel (Admin/Gestor/Técnico)
2. Preencha:
   - Nome completo
   - Senha (mínimo 6 caracteres)
3. Clique em **"Criar Conta"**

### Resultado Esperado:
- ✅ Conta criada com sucesso
- ✅ Redirecionado para o dashboard
- ✅ Pode ver os dados da empresa

### Possíveis Erros:
- ❌ **"Token inválido"** → Token expirado ou já usado
- ❌ **"Erro ao criar usuário"** → Verificar logs do Supabase

---

## Teste 3: Revogar Convite

### Passo 1: Voltar como Super Admin
1. Na aba original (como super admin)
2. Vá em **Configurações** → **Usuários**
3. Na aba **"Convites Pendentes"**

### Passo 2: Revogar
1. Encontre o convite criado (se não foi aceito ainda)
2. Clique em **"Revogar"**

### Resultado Esperado:
- ✅ Convite marcado como revogado
- ✅ Não aparece mais na lista de pendentes

---

## Teste 4: Verificar Email (Se RESEND configurado)

### Passo 1: Verificar Inbox
1. Acesse o email configurado: `teste@example.com`
2. Procure por email de "Elisha"

### Resultado Esperado:
- ✅ Email recebido com assunto "Você foi convidado(a) para [Nome da Empresa]!"
- ✅ Email contém:
   - Logo do Elisha
   - Nome da empresa
   - Papel do convite
   - Link do convite (clicável)
   - Aviso de expiração (7 dias)

### Se Email NÃO Chegou:
- ⚠️ Verifique se `RESEND_API_KEY` está configurada
- ⚠️ Verifique os logs do console (o erro não bloqueia a criação do convite)
- ⚠️ Verifique a pasta de spam

---

## Teste 5: Deletar Usuário

### Passo 1: Listar Usuários
1. Como super admin (impersonando empresa)
2. Vá em **Configurações** → **Usuários**
3. Veja a lista de usuários ativos

### Passo 2: Deletar
1. Clique no **ícone de lixeira** de um usuário
2. Confirme a ação

### Resultado Esperado:
- ✅ Usuário deletado com sucesso
- ✅ Não aparece mais na lista

### Possíveis Erros:
- ❌ **"User not found"** → Verificar `SUPABASE_SERVICE_ROLE_KEY`
- ❌ **"500"** → Verificar logs da API

---

## Checklist Final

- [ ] ✅ Criar convite sem erro de foreign key
- [ ] ✅ Link do convite gerado corretamente
- [ ] ✅ Aceitar convite e criar conta
- [ ] ✅ Novo usuário pode acessar o dashboard
- [ ] ✅ Revogar convite funciona
- [ ] ✅ Deletar usuário funciona
- [ ] ⚠️ Email enviado (se RESEND configurado)

---

## Logs Úteis

### Ver logs do servidor:
No terminal onde rodou `pnpm dev`, procure por:
- `[create-company-user]` - logs da criação de convite
- `[admin/users/delete]` - logs da deleção de usuário
- `Erro ao enviar email` - problemas com Resend

### Ver logs do Supabase:
```bash
# Ver logs de API
supabase logs api

# Ver logs de auth
supabase logs auth
```

---

## Troubleshooting

### Erro: "violates foreign key constraint"
```bash
# Re-aplicar migration
cd supabase
supabase db reset
# OU
supabase migration up
```

### Erro: "SUPABASE_SERVICE_ROLE_KEY is not defined"
```bash
# Verificar .env.local
cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY
```

### Erro: "RESEND_API_KEY is not defined"
```bash
# Verificar .env.local
cat .env.local | grep RESEND_API_KEY

# Se não estiver, adicionar:
echo "RESEND_API_KEY=re_UizBAmtG_D19qoMkCUmXUtPvAnpWkjJPc" >> .env.local
```

---

## Próximos Passos

Após todos os testes passarem:
1. Commitar as alterações
2. Push para o repositório
3. Deploy no Vercel (automático via Git)

