'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
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
import { Eraser, Check, X, RotateCcw } from 'lucide-react'

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
  const landscapeSignatureRef = useRef<SignatureCanvas>(null)
  const [clientName, setClientName] = useState(initialName)
  const [clientEmail, setClientEmail] = useState('')
  const [isEmpty, setIsEmpty] = useState(true)
  const [isLandscapeMode, setIsLandscapeMode] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 468, height: 200 })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setClientName(initialName)
      setClientEmail('')
      setIsEmpty(true)
      setIsLandscapeMode(false)
      // Clear signature after a small delay to ensure canvas is mounted
      setTimeout(() => {
        signatureRef.current?.clear()
      }, 100)
    }
  }, [open, initialName])

  // Update canvas size for landscape mode
  useEffect(() => {
    if (isLandscapeMode) {
      const updateSize = () => {
        // Use full viewport for landscape
        setCanvasSize({
          width: window.innerWidth,
          height: window.innerHeight - 80, // Leave space for buttons
        })
      }
      updateSize()
      window.addEventListener('resize', updateSize)
      return () => window.removeEventListener('resize', updateSize)
    }
  }, [isLandscapeMode])

  const handleClose = () => {
    setIsLandscapeMode(false)
    onOpenChange?.(false)
    onClose?.()
  }

  const handleClear = () => {
    if (isLandscapeMode) {
      landscapeSignatureRef.current?.clear()
    } else {
      signatureRef.current?.clear()
    }
    setIsEmpty(true)
  }

  const handleEnd = useCallback(() => {
    const ref = isLandscapeMode ? landscapeSignatureRef : signatureRef
    setIsEmpty(ref.current?.isEmpty() ?? true)
  }, [isLandscapeMode])

  const handleSave = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    const ref = isLandscapeMode ? landscapeSignatureRef : signatureRef

    if (!ref.current || ref.current.isEmpty()) {
      return
    }

    if (!clientName.trim()) {
      return
    }

    // Get signature as data URL (PNG with transparent background)
    const signatureDataUrl = ref.current.getTrimmedCanvas().toDataURL('image/png')

    onSubmit?.(signatureDataUrl, clientName.trim(), clientEmail.trim() || undefined)
    setIsLandscapeMode(false)
    handleClose()
  }, [clientName, clientEmail, onSubmit, isLandscapeMode])

  const enterLandscapeMode = useCallback(() => {
    // Copy signature data if exists
    const signatureData = signatureRef.current?.toData()
    setIsLandscapeMode(true)
    
    // Restore signature in landscape canvas after it mounts
    if (signatureData && signatureData.length > 0) {
      setTimeout(() => {
        landscapeSignatureRef.current?.fromData(signatureData)
        setIsEmpty(false)
      }, 150)
    }
  }, [])

  const exitLandscapeMode = useCallback(() => {
    // Copy signature data back to normal canvas
    const signatureData = landscapeSignatureRef.current?.toData()
    setIsLandscapeMode(false)
    
    if (signatureData && signatureData.length > 0) {
      setTimeout(() => {
        signatureRef.current?.fromData(signatureData)
        setIsEmpty(false)
      }, 150)
    }
  }, [])

  const canSave = !isEmpty && clientName.trim().length > 0

  // Landscape fullscreen mode for signature
  if (isLandscapeMode) {
    return (
      <div 
        className="fixed inset-0 z-[10002] bg-white flex flex-col"
        style={{ 
          // Force landscape-like layout by rotating on portrait screens
          transform: typeof window !== 'undefined' && window.innerHeight > window.innerWidth 
            ? 'rotate(90deg)' 
            : 'none',
          transformOrigin: 'center center',
          width: typeof window !== 'undefined' && window.innerHeight > window.innerWidth 
            ? '100vh' 
            : '100vw',
          height: typeof window !== 'undefined' && window.innerHeight > window.innerWidth 
            ? '100vw' 
            : '100vh',
          position: 'fixed',
          top: typeof window !== 'undefined' && window.innerHeight > window.innerWidth 
            ? `calc(50% - 50vw)` 
            : 0,
          left: typeof window !== 'undefined' && window.innerHeight > window.innerWidth 
            ? `calc(50% - 50vh)` 
            : 0,
        }}
      >
        {/* Header com botões */}
        <div className="flex items-center justify-between p-3 bg-gray-100 border-b shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exitLandscapeMode}
            className="h-10 px-4"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <span className="text-sm font-medium text-gray-600">
            Assinatura de: {clientName || 'Cliente'}
          </span>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-10 px-4"
            >
              <Eraser className="h-4 w-4 mr-2" />
              Limpar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              onTouchEnd={(e) => {
                if (canSave) handleSave(e)
              }}
              disabled={!canSave}
              className="h-10 px-6 touch-manipulation"
            >
              <Check className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          </div>
        </div>

        {/* Canvas de assinatura fullscreen */}
        <div className="flex-1 bg-white relative">
          <SignatureCanvas
            ref={landscapeSignatureRef}
            penColor="black"
            canvasProps={{
              className: 'signature-canvas absolute inset-0',
              style: {
                width: '100%',
                height: '100%',
                touchAction: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
              },
            }}
            onEnd={handleEnd}
          />
          {/* Linha guia */}
          <div className="absolute bottom-16 left-8 right-8 border-b-2 border-dashed border-gray-300 pointer-events-none" />
          <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-gray-400 pointer-events-none">
            Assine acima da linha
          </p>
        </div>
      </div>
    )
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

          <div className="space-y-4 py-4">
            {/* Nome do cliente - só mostra se showNameField for true */}
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

            {/* Botão para girar para assinar */}
            <Button
              type="button"
              variant="default"
              size="lg"
              onClick={enterLandscapeMode}
              disabled={!clientName.trim()}
              className="w-full h-14 text-base font-medium"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Girar para Assinar
            </Button>

            {!clientName.trim() && (
              <p className="text-xs text-amber-600 text-center">
                Preencha o nome do responsável antes de assinar
              </p>
            )}

            {/* Canvas de assinatura compacto */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Assinatura *</Label>
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
              <p className="text-xs text-muted-foreground text-center">
                Ou toque em "Girar para Assinar" para mais espaço
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              onTouchEnd={(e) => {
                if (canSave) handleSave(e)
              }}
              disabled={!canSave}
              className="touch-manipulation"
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
