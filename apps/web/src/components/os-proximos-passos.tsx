'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Checkbox } from './ui/checkbox'
import { generateOSPDF } from '@/lib/generate-os-pdf'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { toast } from 'sonner'
import { AlertCircle, Eye, Download } from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { SignatureDialog } from './signature-dialog'

interface OSProximosPassosProps {
  osId: string
  empresaId: string
  readOnly?: boolean
  osData?: any
}

export function OSProximosPassos({ osId, empresaId, readOnly = false, osData }: OSProximosPassosProps) {
  // Chave única para persistência baseada no osId
  const storageKey = `os-proximos-passos-${osId}`

  // Função para carregar dados salvos
  const loadSavedData = () => {
    if (typeof window === 'undefined') return null
    try {
      const saved = sessionStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  }

  const savedData = loadSavedData()

  const [estadoElevador, setEstadoElevador] = useState(savedData?.estadoElevador || '')
  const [nomeResponsavel, setNomeResponsavel] = useState(savedData?.nomeResponsavel || '')
  const [assinaturaUrl, setAssinaturaUrl] = useState<string | null>(savedData?.assinaturaUrl || null)
  const [showSignatureDialog, setShowSignatureDialog] = useState(false)
  const [realizandoCheckout, setRealizandoCheckout] = useState(false)
  const [showPdfDialog, setShowPdfDialog] = useState(false)
  const [semResponsavel, setSemResponsavel] = useState(savedData?.semResponsavel || false)

  const supabase = createSupabaseBrowser()

  // Salvar dados no sessionStorage quando mudam
  useEffect(() => {
    if (typeof window === 'undefined') return
    const dataToSave = {
      estadoElevador,
      nomeResponsavel,
      assinaturaUrl,
      semResponsavel,
    }
    sessionStorage.setItem(storageKey, JSON.stringify(dataToSave))
  }, [estadoElevador, nomeResponsavel, assinaturaUrl, semResponsavel, storageKey])

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

    if (!semResponsavel && !nomeResponsavel.trim()) {
      toast.error('Informe o nome do responsável no local ou marque "Sem responsável no local"')
      return
    }

    if (!semResponsavel && !assinaturaUrl) {
      toast.error('Capture a assinatura do responsável ou marque "Sem responsável no local"')
      return
    }

    setRealizandoCheckout(true)

    try {
      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        throw new Error('Usuário não autenticado')
      }

      const nomeParaEnviar = semResponsavel ? 'Responsável não encontrado' : nomeResponsavel
      const assinaturaParaEnviar = semResponsavel ? '' : (assinaturaUrl || '')

      // Chamar API Backend para checkout
      await import('@/lib/api-client').then(({ default: apiClient }) =>
        apiClient.ordensServico.finalize(osId, {
          estado_equipamento: estadoElevador,
          nome_cliente_assinatura: nomeParaEnviar,
          assinatura_cliente: assinaturaParaEnviar
        }, token)
      )

      // Limpar dados salvos após checkout bem-sucedido
      sessionStorage.removeItem(storageKey)

      toast.success('OS finalizada com sucesso!')

      // Mostrar diálogo customizado para pergunta do PDF
      setShowPdfDialog(true)

    } catch (error) {
      console.error('[proximos-passos] Erro ao realizar checkout:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao realizar checkout')
    } finally {
      setRealizandoCheckout(false)
    }
  }

  const handleGerarPdf = async (preview: boolean = false) => {
    setShowPdfDialog(false)

    try {
      toast.info(preview ? 'Abrindo PDF...' : 'Gerando PDF...')

      // Buscar dados da OS
      const { data: osCompleta, error: osError } = await supabase
        .from('ordens_servico')
        .select('*, data_abertura, data_fim')
        .eq('id', osId)
        .single()

      if (osError || !osCompleta) {
        console.error('[proximos-passos] Erro ao buscar OS:', osError)
        throw new Error('OS não encontrada')
      }

      // Buscar dados relacionados em paralelo
      const [empresaResult, clienteResult, equipamentoResult, tecnicoResult, laudoResult, checklistResult, evidenciasResult] = await Promise.all([
        osCompleta.empresa_id
          ? supabase.from('empresas').select('nome, logo_url').eq('id', osCompleta.empresa_id).single()
          : Promise.resolve({ data: null }),
        osCompleta.cliente_id
          ? supabase.from('clientes').select('nome_local, endereco_completo, responsavel_telefone').eq('id', osCompleta.cliente_id).single()
          : Promise.resolve({ data: null }),
        osCompleta.equipamento_id
          ? supabase.from('equipamentos').select('tipo, fabricante, modelo, numero_serie').eq('id', osCompleta.equipamento_id).single()
          : Promise.resolve({ data: null }),
        osCompleta.tecnico_id
          ? supabase.from('tecnicos').select('nome').eq('id', osCompleta.tecnico_id).single()
          : Promise.resolve({ data: null }),
        supabase.from('laudos_tecnicos').select('*').eq('os_id', osId).single(),
        supabase.from('checklist_items').select('*').eq('os_id', osId).order('ordem', { ascending: true }),
        supabase.from('os_evidencias').select('*').eq('os_id', osId).eq('tipo', 'foto').order('created_at', { ascending: true })
      ])

      const empresa = empresaResult.data
      const cliente = clienteResult.data
      const equipamento = equipamentoResult.data
      const tecnico = tecnicoResult.data
      const laudo = laudoResult.data
      const checklist = checklistResult.data
      const evidencias = evidenciasResult.data

      // Converter storage_path para URL pública
      const evidenciasComUrl = evidencias?.map(ev => {
        if (!ev.storage_path) return null
        const { data } = supabase.storage
          .from('evidencias')
          .getPublicUrl(ev.storage_path)
        return {
          tipo: ev.tipo,
          url: data.publicUrl,
          created_at: ev.created_at
        }
      }).filter(Boolean) || []

      // Gerar PDF usando a função do frontend
      await generateOSPDF({
        numero_os: osCompleta.numero_os || '',
        tipo: osCompleta.tipo,
        data_abertura: osCompleta.data_abertura,
        data_fim: osCompleta.data_fim,
        cliente_nome: cliente?.nome_local,
        cliente_endereco: cliente?.endereco_completo,
        cliente_telefone: cliente?.responsavel_telefone,
        quem_solicitou: osCompleta.quem_solicitou,
        equipamento_tipo: equipamento?.tipo,
        equipamento_fabricante: equipamento?.fabricante,
        equipamento_modelo: equipamento?.modelo,
        equipamento_numero_serie: equipamento?.numero_serie,
        tecnico_nome: tecnico?.nome,
        descricao: osCompleta.descricao,
        observacoes: osCompleta.observacoes,
        laudo_o_que_foi_feito: laudo?.o_que_foi_feito,
        laudo_observacao: laudo?.observacao,
        estado_equipamento: osCompleta.estado_equipamento,
        nome_cliente_assinatura: osCompleta.nome_cliente_assinatura,
        assinatura_cliente: osCompleta.assinatura_cliente,
        checklist: checklist || [],
        evidencias: evidenciasComUrl as any,
        empresa_nome: empresa?.nome,
        empresa_logo_url: empresa?.logo_url,
      }, { preview })

      toast.success(preview ? 'PDF aberto em nova aba!' : 'PDF baixado com sucesso!')

      // Redirecionar após sucesso
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1500)

    } catch (pdfError) {
      console.error('[proximos-passos] Erro ao gerar PDF:', pdfError)
      toast.error('Erro ao gerar PDF. Você pode gerar depois visualizando a OS.')

      // Redirecionar mesmo com erro
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1500)
    }
  }

  const handlePularPdf = () => {
    setShowPdfDialog(false)

    // Redirecionar
    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 500)
  }

  return (
    <div className="flex gap-4">
      <div className="hidden md:flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0">
          3
        </div>
      </div>
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {readOnly ? 'Informações de Encerramento' : 'Próximos Passos'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {readOnly ? (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md border">
                <p className="text-sm font-medium text-muted-foreground mb-1">Estado do Equipamento (Checkout)</p>
                <p className="text-base font-medium">
                  {osData?.estado_equipamento === 'funcionando' ? 'Funcionando normal' :
                    osData?.estado_equipamento === 'dependendo_de_corretiva' ? 'Funcionando, dependendo de corretiva' :
                      osData?.estado_equipamento === 'parado' ? 'Parado' :
                        osData?.estado_equipamento || 'Não informado'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-md border">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Responsável no Local</p>
                  <p className="text-base font-medium">
                    {osData?.nome_cliente_assinatura === 'Responsável não encontrado' ? (
                      <span className="text-orange-600">Responsável não encontrado</span>
                    ) : (
                      osData?.nome_cliente_assinatura || 'N/A'
                    )}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-md border flex flex-col items-center justify-center">
                  <p className="text-sm font-medium text-muted-foreground mb-2 w-full text-left">Assinatura</p>
                  {osData?.assinatura_cliente ? (
                    <img src={osData.assinatura_cliente} alt="Assinatura" className="max-h-20 max-w-full" />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {osData?.nome_cliente_assinatura === 'Responsável não encontrado' ? 'Sem assinatura' : 'Não assinado'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="estado-elevador">Estado do elevador:</Label>
                <Select value={estadoElevador} onValueChange={setEstadoElevador}>
                  <SelectTrigger id="estado-elevador">
                    <SelectValue placeholder="Selecione o estado do elevador" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} className="z-[10000]">
                    <SelectItem value="funcionando">Funcionando normal</SelectItem>
                    <SelectItem value="dependendo_de_corretiva">Funcionando, dependendo de corretiva</SelectItem>
                    <SelectItem value="parado">Parado</SelectItem>
                  </SelectContent>
                </Select>
                {estadoFeedback && (
                  <p className={`text-sm mt-2 ${estadoFeedback.variant === 'success' ? 'text-green-600' :
                    estadoFeedback.variant === 'warning' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                    {estadoFeedback.text}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 border rounded-md bg-muted/30">
                  <Checkbox
                    id="sem-responsavel"
                    checked={semResponsavel}
                    onCheckedChange={(checked) => {
                      setSemResponsavel(checked === true)
                      if (checked) {
                        setNomeResponsavel('')
                        setAssinaturaUrl(null)
                      }
                    }}
                    style={{ width: '18px', height: '18px', minWidth: '18px', minHeight: '18px' }}
                    className="mt-0.5 data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
                  />
                  <Label htmlFor="sem-responsavel" className="cursor-pointer font-normal text-sm leading-tight">
                    Responsável não encontrado no local
                  </Label>
                </div>

                {!semResponsavel && (
                  <>
                    <div>
                      <Label htmlFor="nome-responsavel" className="font-medium">Responsável no local *</Label>
                      <Input
                        id="nome-responsavel"
                        placeholder="Nome completo do responsável"
                        value={nomeResponsavel}
                        onChange={(e) => setNomeResponsavel(e.target.value)}
                        className="mt-1.5"
                        style={{ backgroundColor: 'hsl(var(--background))' }}
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Preencha o nome antes de coletar a assinatura
                      </p>
                    </div>

                    <div>
                      <Label className="font-medium">Assinatura do Responsável *</Label>
                      <button
                        type="button"
                        onClick={() => {
                          if (!nomeResponsavel.trim()) {
                            toast.error('Preencha o nome do responsável antes de coletar a assinatura')
                            return
                          }
                          setShowSignatureDialog(true)
                        }}
                        className="w-full min-h-[128px] border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors touch-manipulation active:scale-[0.98]"
                      >
                        {assinaturaUrl ? (
                          <img src={assinaturaUrl} alt="Assinatura" className="max-h-28" />
                        ) : (
                          <span className="text-center">
                            {nomeResponsavel.trim() ? 'Clique para coletar assinatura' : 'Preencha o nome do responsável primeiro'}
                          </span>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <Button
                onClick={handleRealizarCheckout}
                disabled={realizandoCheckout}
                className="w-full"
                size="lg"
              >
                {realizandoCheckout ? 'Encerrando...' : 'Encerrar Atendimento'}
              </Button>
            </>
          )}
        </CardContent>

        <SignatureDialog
          open={showSignatureDialog}
          onOpenChange={setShowSignatureDialog}
          onSubmit={handleSaveAssinatura}
          showNameField={false}
          initialName={nomeResponsavel}
        />

        <AlertDialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>PDF da Ordem de Serviço</AlertDialogTitle>
              <AlertDialogDescription>
                O que deseja fazer com o PDF da OS?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel onClick={handlePularPdf} className="sm:mr-auto">
                Pular
              </AlertDialogCancel>
              <Button
                variant="outline"
                onClick={() => handleGerarPdf(false)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar PDF
              </Button>
              <Button
                onClick={() => handleGerarPdf(true)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Visualizar PDF
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  )
}
