'use client'

import { Button } from './ui/button'
import { Camera, Video, Mic, FileText } from 'lucide-react'

interface EvidenceButtonsProps {
  onPhotoClick?: () => void
  onVideoClick?: () => void
  onAudioClick?: () => void
  onNoteClick?: () => void
  disabled?: boolean
}

/**
 * Componente de botões para adicionar evidências (foto, vídeo, áudio, nota)
 * Usado em todos os tipos de OS
 */
export function EvidenceButtons({
  onPhotoClick,
  onVideoClick,
  onAudioClick,
  onNoteClick,
  disabled = false,
}: EvidenceButtonsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Button
        variant="outline"
        className="h-20 flex-col"
        disabled={disabled}
        onClick={onPhotoClick}
      >
        <Camera className="w-5 h-5 mb-1" />
        Foto
      </Button>

      <Button
        variant="outline"
        className="h-20 flex-col"
        disabled={disabled}
        onClick={onVideoClick}
      >
        <Video className="w-5 h-5 mb-1" />
        Vídeo
      </Button>

      <Button
        variant="outline"
        className="h-20 flex-col"
        disabled={disabled}
        onClick={onAudioClick}
      >
        <Mic className="w-5 h-5 mb-1" />
        Áudio
      </Button>

      <Button
        variant="outline"
        className="h-20 flex-col"
        disabled={disabled}
        onClick={onNoteClick}
      >
        <FileText className="w-5 h-5 mb-1" />
        Nota
      </Button>
    </div>
  )
}
