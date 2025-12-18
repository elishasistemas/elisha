'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import SignatureCanvas from 'react-signature-canvas'
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eraser, Check, X, Maximize2 } from 'lucide-react'

interface SignatureDialogProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
  onSubmit?: (signatureDataUrl: string, clientName: string, clientEmail?: string) => void
  requireEmail?: boolean
  initialName?: string
  showNameField?: boolean
}

export function SignatureDialog({
  open,
  onOpenChange,
  onClose,
  onSubmit,
  requireEmail = false,
  initialName = '',
  showNameField = true,
}: SignatureDialogProps) {
  const signatureRef = useRef<SignatureCanvas>(null)
  const fullscreenSignatureRef = useRef<SignatureCanvas>(null)
  const [clientName, setClientName] = useState(initialName)
  const [clientEmail, setClientEmail] = useState('')
  const [isEmpty, setIsEmpty] = useState(true)
  const [isFullscreenMode, setIsFullscreenMode] = useState(false)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setClientName(initialName)
      setClientEmail('')
      setIsEmpty(true)
      setIsFullscreenMode(false)
      setTimeout(() => {
        signatureRef.current?.clear()
      }, 100)
    }
  }, [open, initialName])

  const handleClose = () => {
    setIsFullscreenMode(false)
    onOpenChange?.(false)
    onClose?.()
  }

  const handleClear = () => {
    if (isFullscreenMode) {
      fullscreenSignatureRef.current?.clear()
    } else {
      signatureRef.current?.clear()
    }
    setIsEmpty(true)
  }

  const handleEnd = useCallback(() => {
    const ref = isFullscreenMode ? fullscreenSignatureRef : signatureRef
    setIsEmpty(ref.current?.isEmpty() ?? true)
  }, [isFullscreenMode])

  // Função para rotacionar a imagem 90 graus anti-horário (para deixar horizontal corretamente)
  const rotateImage90CounterClockwise = useCallback((dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        // Inverter dimensões para rotação
        canvas.width = img.height
        canvas.height = img.width
        const ctx = canvas.getContext('2d')
        if (ctx) {
          // Rotacionar 90 graus anti-horário
          ctx.translate(0, canvas.height)
          ctx.rotate(-Math.PI / 2)
          ctx.drawImage(img, 0, 0)
        }
        resolve(canvas.toDataURL('image/png'))
      }
      img.src = dataUrl
    })
  }, [])

  const handleSave = useCallback(async () => {
    const ref = isFullscreenMode ? fullscreenSignatureRef : signatureRef

    if (!ref.current || ref.current.isEmpty()) {
      console.log('[SignatureDialog] Canvas vazio ou ref inválida')
      return
    }

    if (!clientName.trim()) {
      console.log('[SignatureDialog] Nome do cliente vazio')
      return
    }

    try {
      let signatureDataUrl = ref.current.getTrimmedCanvas().toDataURL('image/png')

      // Se estiver no modo fullscreen, rotacionar 90 graus anti-horário para ficar horizontal
      if (isFullscreenMode) {
        signatureDataUrl = await rotateImage90CounterClockwise(signatureDataUrl)
      }

      console.log('[SignatureDialog] Chamando onSubmit')
      onSubmit?.(signatureDataUrl, clientName.trim(), clientEmail.trim() || undefined)
      
      // Fechar o dialog
      setIsFullscreenMode(false)
      onOpenChange?.(false)
      onClose?.()
    } catch (error) {
      console.error('[SignatureDialog] Erro ao salvar:', error)
    }
  }, [clientName, clientEmail, onSubmit, isFullscreenMode, rotateImage90CounterClockwise, onOpenChange, onClose])

  const enterFullscreenMode = useCallback(() => {
    setIsFullscreenMode(true)
    setIsEmpty(true)
    setTimeout(() => {
      fullscreenSignatureRef.current?.clear()
    }, 100)
  }, [])

  const exitFullscreenMode = useCallback(() => {
    setIsFullscreenMode(false)
    setIsEmpty(true)
  }, [])

  const canSave = !isEmpty && clientName.trim().length > 0

  // Estado para controlar se estamos no cliente (para evitar SSR issues com createPortal)
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Bloquear scroll do body quando em fullscreen
  useEffect(() => {
    if (isFullscreenMode) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.height = '100%'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.height = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.height = ''
    }
  }, [isFullscreenMode])

  // Modo tela cheia - ocupa toda a tela sem rotação CSS
  // O cliente assina normalmente, depois rotacionamos a imagem ao salvar
  // Usando createPortal para garantir que renderize no body, fora de qualquer stacking context
  if (isFullscreenMode && isMounted) {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 400
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 700

    const fullscreenContent = (
      <div 
        className="bg-white flex flex-col"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 2147483647, // Valor máximo de z-index
          isolation: 'isolate', // Cria novo stacking context
          WebkitTransform: 'translateZ(0)', // Force GPU layer no Safari
          transform: 'translateZ(0)',
        }}
      >
        {/* Header com botões */}
        <div 
          className="flex items-center justify-between px-4 py-3 bg-slate-900 shrink-0"
          style={{ minHeight: '56px' }}
        >
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={exitFullscreenMode}
            className="h-10 px-3 text-sm"
          >
            <X className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          
          <span className="text-white text-sm font-medium truncate mx-2">
            {clientName || 'Assinatura'}
          </span>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClear}
              className="h-10 px-3"
            >
              <Eraser className="h-4 w-4 mr-1" />
              Limpar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isEmpty}
              className="h-10 px-4 touch-manipulation bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              onClick={() => {
                console.log('[SignatureDialog] Botão fullscreen clicado, isEmpty:', isEmpty, 'clientName:', clientName)
                if (!isEmpty && clientName.trim()) {
                  handleSave()
                }
              }}
            >
              <Check className="h-4 w-4 mr-1" />
              Confirmar
            </Button>
          </div>
        </div>

        {/* Área de assinatura - ocupa todo o resto da tela */}
        <div className="flex-1 bg-white relative overflow-hidden">
          <SignatureCanvas
            ref={fullscreenSignatureRef}
            penColor="black"
            backgroundColor="white"
            minWidth={1.5}
            maxWidth={3}
            canvasProps={{
              width: screenWidth,
              height: screenHeight - 70,
              className: 'signature-canvas',
              style: {
                width: '100%',
                height: '100%',
                touchAction: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
                display: 'block',
              },
            }}
            onEnd={handleEnd}
          />
          {/* Linha guia para assinatura */}
          <div 
            className="absolute left-6 right-6 border-b-2 border-dashed border-gray-300 pointer-events-none"
            style={{ bottom: '20%' }}
          />
          <p 
            className="absolute left-0 right-0 text-center text-sm text-gray-400 pointer-events-none"
            style={{ bottom: '12%' }}
          >
            Assine acima da linha
          </p>
        </div>
      </div>
    )

    // Usar createPortal para renderizar diretamente no body
    return createPortal(fullscreenContent, document.body)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="z-[10001]" />
        <DialogPrimitive.Content
          className={cn(
            "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed z-[10001] grid gap-4 rounded-lg border p-4 sm:p-6 shadow-lg duration-200 overflow-y-auto",
            "top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-[calc(100%-2rem)] sm:max-w-[500px] max-h-[90dvh]"
          )}
        >
          <DialogHeader>
            <DialogTitle>Coletar Assinatura</DialogTitle>
            <DialogDescription>
              Solicite ao responsável que assine no campo abaixo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Nome do cliente */}
            {showNameField && (
              <div className="space-y-2">
                <Label htmlFor="client-name">Nome do Responsável *</Label>
                <Input
                  id="client-name"
                  placeholder="Nome completo do responsável"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
            )}

            {/* Email opcional */}
            {requireEmail && (
              <div className="space-y-2">
                <Label htmlFor="client-email">Email (opcional)</Label>
                <Input
                  id="client-email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </div>
            )}

            {/* Canvas de assinatura compacto */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Assinatura *</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-8 px-2 text-muted-foreground"
                  >
                    <Eraser className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={enterFullscreenMode}
                    disabled={!clientName.trim()}
                    className="h-8 px-3"
                  >
                    <Maximize2 className="h-4 w-4 mr-1" />
                    Tela Cheia
                  </Button>
                </div>
              </div>
              <div className="border-2 border-dashed rounded-lg bg-white overflow-hidden">
                <SignatureCanvas
                  ref={signatureRef}
                  penColor="black"
                  canvasProps={{
                    width: 468,
                    height: 150,
                    className: 'signature-canvas',
                    style: {
                      width: '100%',
                      height: '150px',
                      touchAction: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none',
                    },
                  }}
                  onEnd={handleEnd}
                />
              </div>
              {!clientName.trim() && (
                <p className="text-xs text-amber-600 text-center">
                  Preencha o nome do responsável antes de assinar
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex-col-reverse sm:flex-row">
            <Button type="button" variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!canSave}
              className="touch-manipulation"
              onClick={() => {
                console.log('[SignatureDialog] Botão clicado, canSave:', canSave, 'isEmpty:', isEmpty, 'clientName:', clientName)
                if (canSave) {
                  handleSave()
                }
              }}
            >
              <Check className="h-4 w-4 mr-2" />
              Confirmar Assinatura
            </Button>
          </DialogFooter>
          <DialogPrimitive.Close
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}

export default SignatureDialog
