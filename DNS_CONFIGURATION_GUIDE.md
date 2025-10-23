# 🌐 Guia de Configuração DNS - elisha.com.br

## 🚨 Problema Atual

O domínio `elisha.com.br` está com DNS configurado incorretamente, causando timeout em redes móveis.

**Status Atual:**
- ❌ IP DNS Atual: `216.198.79.1` (INCORRETO)
- ✅ IP Vercel Correto: `76.76.21.21` (RECOMENDADO)

---

## ✅ Solução 1: CNAME (Recomendado pela Vercel)

### Para o domínio raiz (@):
```
Tipo: CNAME
Nome: @ ou deixe vazio
Valor: cname.vercel-dns.com
TTL: 3600 (1 hora)
```

### Para www:
```
Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com
TTL: 3600 (1 hora)
```

**Vantagens:**
- ✅ Atualização automática de IPs pela Vercel
- ✅ Melhor performance global
- ✅ Maior confiabilidade

---

## ✅ Solução 2: Registro A (Se CNAME não funcionar)

Se o seu provedor não aceitar CNAME no domínio raiz:

### Para o domínio raiz (@):
```
Tipo: A
Nome: @ ou deixe vazio
Valor: 76.76.21.21
TTL: 3600 (1 hora)
```

### Para www:
```
Tipo: A
Nome: www
Valor: 76.76.21.21
TTL: 3600 (1 hora)
```

---

## 📋 Passo a Passo

1. **Acesse o painel do provedor de domínio**
   - Registro.br, HostGator, Locaweb, etc.

2. **Entre na seção DNS/Zona DNS**
   - Pode estar em: DNS Management, Gerenciar DNS, Zona DNS

3. **Localize os registros existentes**
   - Procure por registros A ou CNAME com `@` ou `elisha.com.br`

4. **DELETE o registro A antigo**
   - O que aponta para `216.198.79.1`

5. **CRIE novo registro**
   - **Opção 1**: CNAME → `cname.vercel-dns.com`
   - **Opção 2**: A → `76.76.21.21`

6. **Salve as alterações**

7. **Aguarde propagação**
   - Tempo: 5 minutos a 48 horas (geralmente 15-30 min)

---

## 🧪 Como Verificar se Funcionou

### 1. Teste de DNS
```bash
# Ver para onde o domínio aponta
nslookup elisha.com.br

# Deve mostrar:
# Address: 76.76.21.21 (se usar registro A)
# ou um endereço da Vercel (se usar CNAME)
```

### 2. Teste em Dados Móveis
- Abra o navegador em dados móveis (não Wi-Fi)
- Acesse: https://elisha.com.br
- Deve carregar sem timeout

### 3. Teste de SSL
```bash
curl -I https://elisha.com.br
# Deve retornar HTTP/2 200
```

---

## 🆘 Solução Temporária (Enquanto DNS não propaga)

### Use a URL da Vercel:
```
https://elisha-admin-myatmjzm6-idantas-projects.vercel.app
```

**Para convites, use:**
```
https://elisha-admin-myatmjzm6-idantas-projects.vercel.app/signup?token={TOKEN}
```

Esta URL funciona em qualquer rede (Wi-Fi, 4G, 5G).

---

## 🔧 Configuração no Vercel

O domínio já está configurado no Vercel:
- ✅ elisha.com.br
- ✅ www.elisha.com.br
- ✅ Certificado SSL automático
- ✅ HTTP/2 ativado

**Só falta corrigir o DNS no provedor do domínio!**

---

## 📞 Provedores Comuns e Onde Configurar

### Registro.br
1. Acesse: https://registro.br
2. Login → Meus Domínios
3. Clique no domínio → Editar DNS
4. Adicione os registros

### HostGator
1. cPanel → Zona DNS
2. Adicione registros CNAME ou A

### Locaweb
1. Painel de Controle → DNS
2. Gerenciar Zona DNS
3. Adicione registros

### Cloudflare
1. Dashboard → DNS
2. Add Record
3. Configure CNAME ou A

---

## ⚠️ IMPORTANTE

- **Não use IP fixo antigo** (`216.198.79.1`)
- **Prefira CNAME** sempre que possível
- **TTL recomendado**: 3600 (1 hora)
- **Após alterar**: Aguarde 30 minutos antes de testar em mobile

---

## ✅ Checklist Final

- [ ] DNS alterado no provedor
- [ ] CNAME ou A configurado com valor correto
- [ ] www também configurado
- [ ] Aguardado 30 minutos
- [ ] Testado em Wi-Fi
- [ ] Testado em dados móveis (4G/5G)
- [ ] Teste com curl bem-sucedido
- [ ] Convites funcionando

---

**Última atualização**: 23 de outubro de 2025

