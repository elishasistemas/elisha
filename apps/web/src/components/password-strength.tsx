"use client"

import { evaluatePasswordStrength } from '@/utils/password-strength'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, XCircle } from 'lucide-react'

type Props = {
  password: string
  confirm?: string
  minLength?: number
  compact?: boolean
}

export function PasswordStrength({ password, confirm, minLength = 6, compact = false }: Props) {
  const { percent, label, requirements, suggestions } = evaluatePasswordStrength(password)

  const colors = [
    'text-red-600',
    'text-orange-600',
    'text-yellow-600',
    'text-green-600',
    'text-green-700',
  ]
  const barColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-green-600',
  ]

  // Map percent to index 0..4
  const idx = percent <= 10 ? 0 : percent <= 25 ? 1 : percent <= 50 ? 2 : percent <= 75 ? 3 : 4

  const confirmMismatch = typeof confirm === 'string' && confirm.length > 0 && confirm !== password

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Força da senha</span>
        <span className={colors[idx]}>{label}</span>
      </div>
      <div className="relative w-full h-2 bg-muted rounded">
        <div className={`h-2 rounded ${barColors[idx]}`} style={{ width: `${percent}%` }} />
      </div>

      {!compact && (
        <div className="grid gap-1.5 text-xs">
          <div className="grid sm:grid-cols-2 gap-1.5">
            {requirements.map((r, i) => (
              <div key={i} className={`flex items-center gap-1 ${r.met ? 'text-foreground' : 'text-muted-foreground'}`}>
                {r.met ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                <span>{r.label}</span>
              </div>
            ))}
            {confirm !== undefined && (
              <div className={`flex items-center gap-1 ${confirmMismatch ? 'text-muted-foreground' : 'text-foreground'}`}>
                {confirmMismatch ? <XCircle className="h-3.5 w-3.5 text-muted-foreground" /> : <CheckCircle className="h-3.5 w-3.5 text-green-600" />}
                <span>Confirmação igual à senha</span>
              </div>
            )}
          </div>
          {suggestions.length > 0 && (
            <div className="text-muted-foreground">
              Sugestões: {suggestions.slice(0, 2).join(' · ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

