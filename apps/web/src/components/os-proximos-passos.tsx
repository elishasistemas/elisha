'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { SignatureDialog } from './signature-dialog'

interface OSProximosPassosProps {
  osId: string
  empresaId: string
}

export function OSProximosPassos({ osId, empresaId }: OSProximosPassosProps) {
  const [estadoElevador, setEstadoElevador] = useState('')
  const [nomeResponsavel, setNomeResponsavel] = useState('')
  const [assinaturaUrl, setAssinaturaUrl] = useState<string | null>(null)
  const [showSignatureDialog, setShowSignatureDialog] = useState(false)
  const [realizandoCheckout, setRealizandoCheckout] = useState(false)

  const supabase = createSupabaseBrowser()

  // Mensagem de feedback baseada no estado do elevador
  const getEstadoFeedback = () => {
    switch (estadoElevador) {
      case 'funcionando':
        return { text: '✓ No checkout a OS será fechada normalmente', variant: 'success' as const }
      case 'dependendo_de_corretiva':
        return { text: '⚠️ Será criada uma OS do tipo Corretiva Programada', variant: 'warning' as const }
      case 'parado':
        return { text: '🚨 Será criada uma OS do tipo Urgência (Corretiva com status Parado)', variant: 'destructive' as const }
      default:
        return null
    }
  }

  const estadoFeedback = getEstadoFeedback()

  const handleSaveAssinatura = async (signatureDataUrl: string, clientName: string) => {
    setAssinaturaUrl(signatureDataUrl)
    setNomeResponsavel(clientName)
    setShowSignatureDialog(false)
    toast.success('Assinatura capturada com sucesso!')
  }

  const handleRealizarCheckout = async () => {
    // Validações
    if (!estadoElevador) {
      toast.error('Selecione o estado do elevador')
      return
    }

    if (!nomeResponsavel.trim()) {
      toast.error('Informe o nome do responsável no local')
      return
    }

    if (!assinaturaUrl) {
      toast.error('Capture a assinatura do responsável')
      return
    }

    setRealizandoCheckout(true)

    try {
      // Chamar RPC para checkout
      const { data, error } = await supabase.rpc('os_checkout', {
        p_os_id: osId,
        p_estado_equipamento: estadoElevador,
        p_nome_cliente: nomeResponsavel,
        p_assinatura_base64: assinaturaUrl
      })

      if (error) throw error

      const result = data as { success: boolean; error?: string; message?: string }

      if (!result.success) {
        throw new Error(result.message || result.error || 'Erro ao realizar checkout')
      }

      toast.success(result.message || 'Checkout realizado com sucesso!')
      
      // Redirecionar após sucesso
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1500)

    } catch (error) {
      console.error('[proximos-passos] Erro ao realizar checkout:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao realizar checkout')
    } finally {
      setRealizandoCheckout(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
            3
          </div>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Próximos Passos
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="estado-elevador">Estado do elevador:</Label>
          <Select value={estadoElevador} onValueChange={setEstadoElevador}>
            <SelectTrigger id="estado-elevador">
              <SelectValue placeholder="Selecione o estado do elevador" />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4}>
              <SelectItem value="funcionando">Funcionando normal</SelectItem>
              <SelectItem value="dependendo_de_corretiva">Funcionando, dependendo de corretiva</SelectItem>
              <SelectItem value="parado">Parado</SelectItem>
            </SelectContent>
          </Select>
          {estadoFeedback && (
            <p className={`text-sm mt-2 ${
              estadoFeedback.variant === 'success' ? 'text-green-600' : 
              estadoFeedback.variant === 'warning' ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {estadoFeedback.text}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="nome-responsavel">Responsável no local</Label>
          <Input
            id="nome-responsavel"
            placeholder="Nome completo do responsável"
            value={nomeResponsavel}
            onChange={(e) => setNomeResponsavel(e.target.value)}
          />
        </div>

        <div>
          <Label>Assinatura do Responsável</Label>
          <button
            type="button"
            onClick={() => setShowSignatureDialog(true)}
            className="w-full h-32 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            {assinaturaUrl ? (
              <img src={assinaturaUrl} alt="Assinatura" className="max-h-28" />
            ) : (
              'Clique para coletar assinatura'
            )}
          </button>
        </div>

        <Button
          onClick={handleRealizarCheckout}
          disabled={realizandoCheckout}
          className="w-full"
          size="lg"
        >
          {realizandoCheckout ? 'Encerrando...' : 'Encerrar Atendimento'}
        </Button>
      </CardContent>

      <SignatureDialog
        open={showSignatureDialog}
        onOpenChange={setShowSignatureDialog}
        onSubmit={handleSaveAssinatura}
      />
    </Card>
  )
}
