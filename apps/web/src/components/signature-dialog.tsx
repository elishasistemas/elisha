'use client'

import React, { useRef, useState, useEffect } from 'react'
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
import { Eraser, Check, X } from 'lucide-react'

interface SignatureDialogProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
  onSubmit?: (signatureDataUrl: string, clientName: string, clientEmail?: string) => void
  requireEmail?: boolean
  initialName?: string
}

export function SignatureDialog({
  open,
  onOpenChange,
  onClose,
  onSubmit,
  requireEmail = false,
  initialName = '',
}: SignatureDialogProps) {
  const signatureRef = useRef<SignatureCanvas>(null)
  const [clientName, setClientName] = useState(initialName)
  const [clientEmail, setClientEmail] = useState('')
  const [isEmpty, setIsEmpty] = useState(true)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setClientName(initialName)
      setClientEmail('')
      setIsEmpty(true)
      // Clear signature after a small delay to ensure canvas is mounted
      setTimeout(() => {
        signatureRef.current?.clear()
      }, 100)
    }
  }, [open, initialName])

  const handleClose = () => {
    onOpenChange?.(false)
    onClose?.()
  }

  const handleClear = () => {
    signatureRef.current?.clear()
    setIsEmpty(true)
  }

  const handleEnd = () => {
    setIsEmpty(signatureRef.current?.isEmpty() ?? true)
  }

  const handleSave = () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      return
    }

    if (!clientName.trim()) {
      return
    }

    // Get signature as data URL (PNG with transparent background)
    const signatureDataUrl = signatureRef.current.getTrimmedCanvas().toDataURL('image/png')

    onSubmit?.(signatureDataUrl, clientName.trim(), clientEmail.trim() || undefined)
    handleClose()
  }

  const canSave = !isEmpty && clientName.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="z-[10001]" />
        <DialogPrimitive.Content
          className={cn(
            "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-[10001] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-4 sm:p-6 shadow-lg duration-200 sm:max-w-[500px] max-h-[90dvh] overflow-y-auto"
          )}
        >
          <DialogHeader>
            <DialogTitle>Coletar Assinatura</DialogTitle>
            <DialogDescription>
              Solicite ao responsável que assine no campo abaixo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nome do cliente */}
            <div className="space-y-2">
              <Label htmlFor="client-name">Nome do Responsável *</Label>
              <Input
                id="client-name"
                placeholder="Nome completo do responsável"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

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

            {/* Canvas de assinatura */}
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
                    height: 200,
                    className: 'signature-canvas',
                    style: {
                      width: '100%',
                      height: '200px',
                      touchAction: 'none',
                    },
                  }}
                  onEnd={handleEnd}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Desenhe sua assinatura acima usando o mouse ou toque na tela
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
              disabled={!canSave}
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
