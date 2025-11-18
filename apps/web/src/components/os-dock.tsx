'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Maximize2, X } from 'lucide-react'

interface OSDockData {
  os_id: string
  numero_os: string
  tempo_inicio: string
  minimized_at: string
}

export function OSDock() {
  const router = useRouter()
  const [dockData, setDockData] = useState<OSDockData | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Atualizar tempo a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Carregar dados do localStorage
  useEffect(() => {
    const loadDockData = () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('os_dock')
        if (stored) {
          try {
            const data = JSON.parse(stored)
            setDockData(data)
          } catch (e) {
            console.error('[os-dock] Erro ao parsear dados:', e)
            localStorage.removeItem('os_dock')
          }
        }
      }
    }

    loadDockData()

    // Escutar evento customizado
    const handleUpdate = () => {
      loadDockData()
    }

    window.addEventListener('os-dock-updated', handleUpdate)

    return () => {
      window.removeEventListener('os-dock-updated', handleUpdate)
    }
  }, [])

  // Calcular tempo decorrido
  const tempoDecorrido = useMemo(() => {
    if (!dockData?.tempo_inicio) return null

    const inicio = new Date(dockData.tempo_inicio)
    const diff = currentTime.getTime() - inicio.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    return {
      hours: hours % 24,
      minutes: minutes % 60,
      seconds: seconds % 60
    }
  }, [dockData, currentTime])

  // Fechar dock
  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('os_dock')
      setDockData(null)
    }
  }

  // Restaurar full-screen
  const handleMaximize = () => {
    if (dockData) {
      router.push(`/os/${dockData.os_id}/full`)
    }
  }

  if (!dockData || !tempoDecorrido) return null

  const formatTime = () => {
    return `${String(tempoDecorrido.hours).padStart(2, '0')}:${String(tempoDecorrido.minutes).padStart(2, '0')}:${String(tempoDecorrido.seconds).padStart(2, '0')}`
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9998]">
      <div className="bg-black text-white rounded-full shadow-2xl px-5 py-3 flex items-center gap-4 hover:shadow-3xl transition-shadow">
        {/* Conteúdo principal */}
        <div className="flex flex-col">
          <span className="text-sm font-medium leading-tight">
            {dockData.numero_os}
          </span>
          <span className="text-base font-mono font-semibold tabular-nums leading-tight">
            {formatTime()}
          </span>
        </div>
        
        {/* Controles */}
        <div className="flex items-center gap-2 ml-2 border-l border-white/20 pl-3">
          <button
            onClick={handleMaximize}
            className="text-white/80 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10"
            title="Restaurar tela cheia"
            aria-label="Maximizar"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

