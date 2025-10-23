# 🚨 Solução Temporária - DNS Timeout em Dados Móveis

## Problema
O domínio `elisha.com.br` está com timeout em redes móveis devido a DNS incorreto.

---

## ✅ Solução TEMPORÁRIA (Use AGORA)

### 1. Alterar variável de ambiente no Vercel

Acesse o dashboard da Vercel:
1. https://vercel.com/idantas-projects/elisha-admin
2. Settings → Environment Variables
3. Edite `NEXT_PUBLIC_APP_URL`
4. **Valor atual**: `https://elisha.com.br`
5. **Mudar para**: `https://elisha-admin-myatmjzm6-idantas-projects.vercel.app`
6. Salve e faça **Redeploy**

### 2. Enviar novos convites
Após o redeploy, todos os novos convites usarão a URL da Vercel que funciona em mobile.

**Link de teste:**
```
https://elisha-admin-myatmjzm6-idantas-projects.vercel.app/signup?token=2acde5b7-6052-40d3-944b-065d4e4cec6f
```

---

## ✅ Solução DEFINITIVA (Fazer o quanto antes)

### Corrigir DNS no provedor do domínio

**Atual (ERRADO):**
```
Tipo: A
Nome: @
Valor: 216.198.79.1 ❌
```

**Correto (use uma destas opções):**

#### Opção 1 - CNAME (Recomendado)
```
Tipo: CNAME
Nome: @
Valor: cname.vercel-dns.com ✅
TTL: 3600
```

#### Opção 2 - Registro A (Alternativa)
```
Tipo: A
Nome: @
Valor: 76.76.21.21 ✅
TTL: 3600
```

### Após corrigir o DNS:
1. Aguarde 30-60 minutos (propagação)
2. Teste em dados móveis
3. Se funcionar, volte a usar `https://elisha.com.br` no Vercel

---

## 📱 Como Testar

### Wi-Fi (deve funcionar)
```bash
curl -I https://elisha.com.br
# HTTP/2 200 ✅
```

### Dados Móveis (deve dar timeout antes do fix)
- Abra o navegador em 4G/5G
- Acesse: https://elisha.com.br
- Se carregar = DNS OK ✅
- Se timeout = DNS ainda incorreto ❌

---

## 🔄 Passo a Passo Completo

### AGORA (Solução Temporária):
1. ✅ Alterar `NEXT_PUBLIC_APP_URL` no Vercel
2. ✅ Fazer redeploy
3. ✅ Enviar novos convites
4. ✅ Tudo funciona em mobile

### DEPOIS (Solução Definitiva):
1. ⏳ Acessar painel do provedor de domínio
2. ⏳ Corrigir DNS (CNAME ou A)
3. ⏳ Aguardar propagação (30-60 min)
4. ⏳ Testar em mobile
5. ⏳ Voltar a usar elisha.com.br no Vercel

---

## 🆘 Precisa de Ajuda?

**Não sabe como acessar o DNS?**
- Me diga qual provedor você usa (Registro.br, HostGator, Locaweb, etc.)
- Posso te dar instruções específicas

**Não consegue acessar o Vercel?**
- Use: https://vercel.com/login
- Ou me peça para fazer as alterações

---

**Prioridade**: 🔴 ALTA  
**Tempo estimado**: 5 minutos (temporária) + 1 hora (definitiva)  
**Impacto**: 📱 Crítico para mobile (técnicos e admins)

