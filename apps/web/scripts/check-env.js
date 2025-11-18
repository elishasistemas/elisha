#!/usr/bin/env node

/**
 * Script para verificar se todas as variáveis de ambiente necessárias estão configuradas
 */

// Carregar variáveis do .env.local
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

const requiredEnvVars = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'URL do projeto Supabase',
    example: 'https://wkccxgeevizhxmclvsnz.supabase.co'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Chave pública (anon) do Supabase',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: '🔒 Chave privada de admin do Supabase (APIs admin)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    critical: true
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: true,
    description: 'URL da aplicação (para gerar links de convite)',
    example: 'http://localhost:3000 (dev) ou https://elisha.com.br (prod)'
  },
  {
    name: 'RESEND_API_KEY',
    required: true,
    description: '🔒 Chave da API Resend (envio de emails)',
    example: 're_UizBAmtG_D19qoMkCUmXUtPvAnpWkjJPc',
    critical: true
  },
  {
    name: 'RESEND_FROM_EMAIL',
    required: false,
    description: 'Email remetente dos convites',
    example: 'onboarding@resend.dev'
  }
]

console.log('🔍 Verificando variáveis de ambiente...\n')

let allOk = true
let criticalMissing = []
let warnings = []

requiredEnvVars.forEach(({ name, required, description, example, critical }) => {
  const value = process.env[name]
  const exists = value !== undefined && value !== ''

  if (exists) {
    // Mascarar valores sensíveis
    const displayValue = name.includes('KEY') || name.includes('SECRET')
      ? `${value.substring(0, 10)}...${value.substring(value.length - 10)}`
      : value

    console.log(`✅ ${name}`)
    console.log(`   ${description}`)
    console.log(`   Valor: ${displayValue}\n`)
  } else {
    if (required) {
      allOk = false
      if (critical) {
        criticalMissing.push(name)
        console.log(`🔴 ${name} - CRÍTICA`)
      } else {
        console.log(`⚠️  ${name}`)
      }
      console.log(`   ${description}`)
      console.log(`   Exemplo: ${example}\n`)
    } else {
      warnings.push(name)
      console.log(`⚪ ${name} - Opcional`)
      console.log(`   ${description}`)
      console.log(`   Exemplo: ${example}\n`)
    }
  }
})

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

if (criticalMissing.length > 0) {
  console.log('🚨 VARIÁVEIS CRÍTICAS FALTANDO:\n')
  criticalMissing.forEach(name => {
    console.log(`   • ${name}`)
  })
  console.log('\n🔴 Funcionalidades quebradas sem estas variáveis:')
  console.log('   - Criar convites de usuário (401 Unauthorized)')
  console.log('   - Deletar usuários (500 Error)')
  console.log('   - Enviar emails de convite\n')
  console.log('📖 Consulte: SETUP_ENV_LOCAL.md\n')
}

if (warnings.length > 0 && criticalMissing.length === 0) {
  console.log('⚠️  VARIÁVEIS OPCIONAIS FALTANDO:\n')
  warnings.forEach(name => {
    console.log(`   • ${name}`)
  })
  console.log('')
}

if (allOk && warnings.length === 0) {
  console.log('✅ Todas as variáveis de ambiente estão configuradas!')
  console.log('🚀 Você está pronto para rodar a aplicação!\n')
  process.exit(0)
} else if (allOk && warnings.length > 0) {
  console.log('✅ Todas as variáveis obrigatórias estão configuradas!')
  console.log('⚠️  Algumas variáveis opcionais estão faltando, mas não afetam o funcionamento básico.\n')
  process.exit(0)
} else {
  console.log('❌ Configure as variáveis faltando no arquivo .env.local\n')
  console.log('📖 Guia completo: SETUP_ENV_LOCAL.md')
  console.log('🌐 Para produção (Vercel): VERCEL_ENV_VERIFICATION.md\n')
  process.exit(1)
}

