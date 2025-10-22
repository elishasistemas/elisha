export type StrengthLabel = 'Muito fraca' | 'Fraca' | 'Média' | 'Forte' | 'Muito forte'

export interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4
  percent: number
  label: StrengthLabel
  suggestions: string[]
  requirements: Array<{ label: string; met: boolean }>
}

const COMMON_PATTERNS = [
  '12345', '123456', '1234567', '12345678', 'qwerty', 'abcdef', 'abc123',
  'password', 'senha', 'admin', 'elisha'
]

export function evaluatePasswordStrength(password: string): StrengthResult {
  const len = password.length
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)

  const variety = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length

  // Penalidades por padrões comuns ou repetição excessiva
  const lowered = password.toLowerCase()
  const hasCommon = COMMON_PATTERNS.some(p => lowered.includes(p))
  const repeats = /(.)\1{2,}/.test(password) // 3+ repetições

  // Base score por tamanho e variedade
  let score = 0
  if (len >= 6) score = 1
  if (len >= 8 && variety >= 2) score = 2
  if (len >= 10 && variety >= 3) score = 3
  if (len >= 12 && variety >= 3) score = 4
  if (len >= 14 && variety === 4) score = 4

  // Penalidades
  if (hasCommon) score = Math.max(0, score - 2)
  if (repeats) score = Math.max(0, score - 1)

  // Ajuste se for muito curta
  if (len < 6) score = 0

  const percent = [10, 25, 50, 75, 100][score]
  const label: StrengthLabel = ['Muito fraca', 'Fraca', 'Média', 'Forte', 'Muito forte'][score]

  const suggestions: string[] = []
  if (len < 12) suggestions.push('Use 12 ou mais caracteres')
  if (variety < 3) suggestions.push('Misture letras, números e símbolos')
  if (hasCommon) suggestions.push('Evite padrões comuns (ex.: 123456, qwerty)')
  if (repeats) suggestions.push('Evite caracteres repetidos em sequência')

  const requirements = [
    { label: 'Mínimo de 6 caracteres', met: len >= 6 },
    { label: '12+ caracteres (recomendado)', met: len >= 12 },
    { label: 'Letras maiúsculas e minúsculas', met: hasLower && hasUpper },
    { label: 'Números', met: hasNumber },
    { label: 'Símbolos', met: hasSymbol },
  ]

  return { score: score as StrengthResult['score'], percent, label, suggestions, requirements }
}

