#!/usr/bin/env node

/**
 * Script para verificar qual branch Supabase está sendo usada
 * Execute: node scripts/verify-prod-branch.js
 */

const requiredEnvVars = {
  'NEXT_PUBLIC_SUPABASE_URL': {
    prod: 'https://wkccxgeevizhxmclvsnz.supabase.co',
    dev: 'https://ecvjgixhcfmkdfbnueqh.supabase.co',
    description: 'URL do projeto Supabase'
  }
}

console.log('🔍 Verificando configuração do ambiente...\n')

// Carregar variáveis do .env.local (se existir)
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=')
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join('=').trim()
      }
    }
  })
}

let allCorrect = true
let issues = []

// Verificar NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL não está definida')
  allCorrect = false
  issues.push('NEXT_PUBLIC_SUPABASE_URL não está definida')
} else {
  console.log(`✅ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`)
  
  if (supabaseUrl === requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL.prod) {
    console.log('   ✅ Correta: Usando branch PROD (wkccxgeevizhxmclvsnz)')
  } else if (supabaseUrl === requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL.dev) {
    console.log('   ⚠️  AVISO: Usando branch DEV (ecvjgixhcfmkdfbnueqh)')
    console.log('   ⚠️  Para produção, use a branch PROD!')
    allCorrect = false
    issues.push('Está usando branch DEV em vez de PROD')
  } else {
    console.log('   ⚠️  URL desconhecida: Não é nem PROD nem DEV')
    allCorrect = false
    issues.push(`URL desconhecida: ${supabaseUrl}`)
  }
}

// Verificar NEXT_PUBLIC_SUPABASE_ANON_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!anonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida')
  allCorrect = false
  issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida')
} else {
  console.log(`✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anonKey.substring(0, 20)}...`)
}

console.log('\n' + '='.repeat(60))

if (allCorrect) {
  console.log('✅ Todas as variáveis estão configuradas corretamente!')
  console.log('\n📝 Para produção no Vercel:')
  console.log('   1. Configure NEXT_PUBLIC_SUPABASE_URL=https://wkccxgeevizhxmclvsnz.supabase.co')
  console.log('   2. Configure NEXT_PUBLIC_SUPABASE_ANON_KEY da branch PROD')
  console.log('   3. Configure SUPABASE_SERVICE_ROLE_KEY da branch PROD')
  console.log('   4. Faça um redeploy no Vercel')
} else {
  console.log('❌ Problemas encontrados:')
  issues.forEach(issue => {
    console.log(`   - ${issue}`)
  })
  console.log('\n📝 Solução:')
  console.log('   1. Para PRODUÇÃO, use:')
  console.log('      NEXT_PUBLIC_SUPABASE_URL=https://wkccxgeevizhxmclvsnz.supabase.co')
  console.log('   2. Obtenha as chaves em:')
  console.log('      https://supabase.com/dashboard/project/wkccxgeevizhxmclvsnz/settings/api')
  console.log('   3. Configure no Vercel: Settings > Environment Variables')
  console.log('   4. Selecione "Production" no ambiente')
  console.log('   5. Faça um redeploy')
}

console.log('\n📖 Referência:')
console.log('   - docs/ENV_PROD_TEMPLATE.md')
console.log('   - VERIFICACAO_AMBIENTE_PRODUCAO.md')

process.exit(allCorrect ? 0 : 1)

