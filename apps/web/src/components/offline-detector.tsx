'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function OfflineDetector() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Estado inicial
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      document.body.classList.remove('offline')
      toast.success('Conexão restaurada! 🌐')
    }

    const handleOffline = () => {
      setIsOnline(false)
      document.body.classList.add('offline')
      toast.warning('Você está offline. Algumas funcionalidades podem estar limitadas. 📡')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Verificar status inicial
    if (!navigator.onLine) {
      document.body.classList.add('offline')
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return null
}
