'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{ padding: 24 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>Ocorreu um erro inesperado</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>Tente novamente ou recarregue a página.</p>
          <button onClick={() => reset()} style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}

