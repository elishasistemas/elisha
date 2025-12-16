'use client'

import { useEffect } from 'react'

export default function GlobalError({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string }
  reset: () => void 
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ 
            maxWidth: 400, 
            textAlign: 'center',
            padding: 32,
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h1 style={{ 
              fontSize: 18, 
              fontWeight: 600, 
              marginBottom: 12,
              color: '#111827'
            }}>
              Ocorreu um erro crítico
            </h1>
            <p style={{ 
              color: '#6b7280', 
              marginBottom: 20,
              fontSize: 14
            }}>
              Algo deu errado. Tente recarregar a página.
            </p>
            <button 
              onClick={() => reset()} 
              style={{ 
                padding: '10px 20px', 
                borderRadius: 8, 
                border: 'none',
                backgroundColor: '#0ea5e9',
                color: '#ffffff',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: 14
              }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
