'use client'

import { useEffect, useState } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  const [shouldShow, setShouldShow] = useState(true)
  
  useEffect(() => {
    console.error('[Error]', error)
    
    // Ignorar erros de chunks durante navegação (são transitórios)
    const errorMessage = error?.message || error?.toString() || ''
    if (
      errorMessage.includes('Failed to load chunk') ||
      errorMessage.includes('Loading chunk') ||
      errorMessage.includes('ChunkLoadError')
    ) {
      console.log('[Error] Chunk loading error detected - hiding error UI')
      setShouldShow(false)
      // Tentar reset silencioso após um delay
      setTimeout(() => {
        reset()
      }, 100)
    }
  }, [error, reset])

  // Não mostrar erro se for transitório
  if (!shouldShow) {
    return null
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 24 
    }}>
      <div style={{ 
        maxWidth: 400, 
        textAlign: 'center',
        padding: 32,
        borderRadius: 12,
        border: '1px solid var(--border)',
        backgroundColor: 'var(--card)'
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Ocorreu um erro inesperado</h1>
        <p style={{ color: 'var(--muted-foreground)', marginBottom: 20 }}>Tente novamente ou recarregue a página.</p>
        <button 
          onClick={() => reset()} 
          style={{ 
            padding: '10px 20px', 
            borderRadius: 8, 
            border: '1px solid var(--border)',
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}

