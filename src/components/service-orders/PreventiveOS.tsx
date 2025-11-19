'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Package,
  User,
  Wrench,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EvidenceButtons } from '@/components/EvidenceButtons'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ChecklistRunner } from '@/components/checklist-runner'
import { toast } from 'sonner'
import { createSupabaseBrowser } from '@/lib/supabase'
import { uploadOsEvidence, removeOsEvidence, getSignedEvidenciaUrl } from '@/lib/storage'
import { useDebounce } from '@/hooks/use-debounce'
import type { PreventiveOSData, ElevatorState, HistoryEntry } from '@/types/service-orders'

interface PreventiveOSProps {
  osId: string
  empresaId: string
  data: PreventiveOSData
  history?: HistoryEntry[]
  onCheckout?: (elevatorState: ElevatorState, clientName: string, signature?: string) => void
}

interface Evidencia {
  id: string
  tipo: 'foto' | 'video' | 'audio' | 'nota'
  titulo?: string
  descricao?: string
  storage_path?: string
  conteudo?: string
  created_at: string
  tamanho_bytes?: number
  mime_type?: string
}

/**
 * Componente de OS Preventiva
 * 
 * Características únicas:
 * - Possui checklist obrigatório (usa ChecklistRunner)
 * - Campo de observações com evidências
 * - Sem laudo técnico
 * - Sem descrição do cliente
 */
export function PreventiveOS({
  osId,
  empresaId,
  data,
  history = [],
  onCheckout,
}: PreventiveOSProps) {
  const router = useRouter()
  const supabase = createSupabaseBrowser()
  
  const [elevatorState, setElevatorState] = useState<ElevatorState>(null)
  const [clientName, setClientName] = useState('')
  const [observations, setObservations] = useState(data.observations || '')
  const [evidencias, setEvidencias] = useState<Evidencia[]>([])
  const [uploading, setUploading] = useState(false)
  const [savingObservations, setSavingObservations] = useState(false)
  const [loading, setLoading] = useState(true)

  // Debounce das observações para autosave
  const debouncedObservations = useDebounce(observations, 2000)

  // Carregar evidências ao montar
  useEffect(() => {
    const fetchEvidencias = async () => {
      try {
        const { data: evidenciasData, error } = await supabase
          .from('os_evidencias')
          .select('*')
          .eq('os_id', osId)
          .order('created_at', { ascending: false })

        if (error) throw error
        if (evidenciasData) {
          setEvidencias(evidenciasData)
        }
      } catch (error) {
        console.error('[PreventiveOS] Erro ao carregar evidências:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvidencias()
  }, [osId, supabase])

  // Autosave das observações
  useEffect(() => {
    const saveObservations = async () => {
      if (!debouncedObservations || loading) return

      setSavingObservations(true)
      try {
        const { error } = await supabase
          .from('ordens_servico')
          .update({ observacoes: debouncedObservations })
          .eq('id', osId)

        if (error) throw error
        console.log('[PreventiveOS] Observações salvas automaticamente')
      } catch (error) {
        console.error('[PreventiveOS] Erro ao salvar observações:', error)
        toast.error('Erro ao salvar observações automaticamente')
      } finally {
        setSavingObservations(false)
      }
    }

    saveObservations()
  }, [debouncedObservations, osId, supabase, loading])

  // Handler de upload de evidência
  const handleFileUpload = async (file: File, tipo: 'foto' | 'video' | 'audio') => {
    setUploading(true)
    try {
      const uploadResult = await uploadOsEvidence(file, osId, tipo)
      if (!uploadResult.success || !uploadResult.storage_path) {
        throw new Error(uploadResult.error || 'Erro no upload')
      }

      const { data: userData } = await supabase.auth.getUser()
      const { data, error: dbError } = await supabase
        .from('os_evidencias')
        .insert({
          os_id: osId,
          empresa_id: empresaId,
          tipo,
          storage_path: uploadResult.storage_path,
          mime_type: file.type,
          tamanho_bytes: file.size,
          titulo: file.name,
          created_by: userData.user?.id,
        })
        .select()
        .single()

      if (dbError) throw dbError
      setEvidencias(prev => [data, ...prev])
      toast.success(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} enviada com sucesso!`)
    } catch (error) {
      console.error('[PreventiveOS] Erro ao fazer upload:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar arquivo')
    } finally {
      setUploading(false)
    }
  }

  // Handler para adicionar nota
  const handleAddNote = async () => {
    const nota = prompt('Digite sua nota:')
    if (!nota || nota.trim().length === 0) return

    try {
      const { data, error } = await supabase
        .from('os_evidencias')
        .insert({
          os_id: osId,
          empresa_id: empresaId,
          tipo: 'nota',
          conteudo: nota,
          titulo: `Nota - ${new Date().toLocaleString('pt-BR')}`,
        })
        .select()
        .single()

      if (error) throw error
      setEvidencias(prev => [data, ...prev])
      toast.success('Nota adicionada com sucesso!')
    } catch (error) {
      console.error('[PreventiveOS] Erro ao adicionar nota:', error)
      toast.error('Erro ao adicionar nota')
    }
  }

  // Handler de checkout
  const handleCheckoutClick = () => {
    if (elevatorState && clientName) {
      onCheckout?.(elevatorState, clientName)
    }
  }

  // Handlers de upload por tipo
  const handlePhotoClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) handleFileUpload(file, 'foto')
    }
    input.click()
  }

  const handleVideoClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'video/*'
    input.capture = 'environment'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) handleFileUpload(file, 'video')
    }
    input.click()
  }

  const handleAudioClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'audio/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) handleFileUpload(file, 'audio')
    }
    input.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="px-4 py-4 bg-gray-50 border-b border-gray-200">
          <div className="max-w-[1000px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-xl">{data.osNumber}</h1>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="border-gray-300 text-gray-700">
                      Preventiva
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-green-300 bg-green-50 text-green-700"
                    >
                      {data.status}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Cliente: {data.clientName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>Equipamento: {data.equipment}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    <span>Técnico: {data.technician}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-8">
        <div className="max-w-[1000px] mx-auto">
          {/* Desktop: Timeline */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-200" />

              <div className="space-y-6">
                {/* Step 1: Checklist */}
                <div className="relative flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm z-10">
                      1
                    </div>
                  </div>
                  <Card className="flex-1 p-6 border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-gray-900" />
                      <h2 className="text-lg">Checklist de Atendimento</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Preencha os itens do checklist vinculado a esta OS
                    </p>
                    <ChecklistRunner osId={osId} />
                  </Card>
                </div>

                {/* Step 2: Observações */}
                <div className="relative flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm z-10">
                      2
                    </div>
                  </div>
                  <Card className="flex-1 p-6 border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-gray-900" />
                      <h2 className="text-lg">Observações</h2>
                      {savingObservations && (
                        <Badge variant="secondary" className="ml-auto flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Salvando...
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Textarea
                          placeholder="Observações sobre a manutenção preventiva..."
                          className="min-h-[80px] resize-none border-gray-200"
                          value={observations}
                          onChange={(e) => setObservations(e.target.value)}
                        />
                      </div>

                      <Separator className="my-4" />

                      <div>
                        <label className="block text-sm text-gray-700 mb-3">
                          Evidências (Fotos, Vídeos, Áudios)
                        </label>
                        <EvidenceButtons
                          onPhotoClick={handlePhotoClick}
                          onVideoClick={handleVideoClick}
                          onAudioClick={handleAudioClick}
                          onNoteClick={handleAddNote}
                          disabled={uploading}
                        />
                        {evidencias.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            <p className="text-sm text-gray-600">
                              {evidencias.length} evidência(s) adicionada(s)
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center mt-3">
                            Nenhuma evidência adicionada ainda
                          </p>
                        )}
                      </div>

                      <p className="text-xs text-gray-500">
                        Salvamento automático a cada 2 segundos
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Step 3: Próximos Passos */}
                <div className="relative flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm z-10">
                      3
                    </div>
                  </div>
                  <Card className="flex-1 p-6 border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 text-gray-900" />
                      <h2 className="text-lg">Próximos Passos</h2>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm mb-2">
                          Estado do elevador:
                        </label>
                        <Select
                          value={elevatorState || undefined}
                          onValueChange={(value) =>
                            setElevatorState(value as ElevatorState)
                          }
                        >
                          <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Selecione o estado do elevador" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="funcionando">
                              Funcionando normal
                            </SelectItem>
                            <SelectItem value="dependendo-corretiva">
                              Funcionando, dependendo de corretiva
                            </SelectItem>
                            <SelectItem value="parado">Parado</SelectItem>
                          </SelectContent>
                        </Select>
                        {elevatorState === 'funcionando' && (
                          <p className="text-sm text-green-600 mt-2">
                            ✓ No checkout a OS será fechada normalmente
                          </p>
                        )}
                        {elevatorState === 'dependendo-corretiva' && (
                          <p className="text-sm text-amber-600 mt-2">
                            ⚠️ Será criada uma OS do tipo Corretiva Programada
                          </p>
                        )}
                        {elevatorState === 'parado' && (
                          <p className="text-sm text-red-600 mt-2">
                            🚨 Será criada uma OS do tipo Urgência (Corretiva com status Parado)
                          </p>
                        )}
                      </div>

                      <Separator />

                      <div>
                        <label className="block text-sm text-gray-700 mb-2">
                          Nome do Cliente
                        </label>
                        <Input
                          placeholder="Nome completo do cliente"
                          className="bg-white"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 mb-2">
                          Assinatura do Cliente
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-white text-center cursor-pointer hover:bg-gray-50 transition-colors">
                          <p className="text-sm text-gray-500">
                            Clique para coletar assinatura
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <Button
                      className="w-full bg-black hover:bg-gray-800"
                      disabled={!elevatorState || !clientName}
                      onClick={handleCheckoutClick}
                    >
                      Realizar Checkout
                    </Button>
                  </Card>
                </div>

                {/* Step 4: Histórico */}
                {history.length > 0 && (
                  <div className="relative flex gap-6">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-sm z-10">
                        <FileText className="w-4 h-4" />
                      </div>
                    </div>
                    <Card className="flex-1 p-6 border-gray-200">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-gray-900" />
                        <h2 className="text-lg">Histórico do Equipamento</h2>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Todas as interações anteriores com este equipamento
                      </p>

                      <div className="space-y-4">
                        {history.map((entry, index) => (
                          <div
                            key={index}
                            className="border-b border-gray-200 pb-5 last:pb-0 last:border-none"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-sm">
                                  <span className="text-gray-900">{entry.date}</span>
                                  <span className="text-gray-500"> às {entry.time}</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                  Técnico: {entry.technician}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-900 mb-1">{entry.summary}</p>
                            <p className="text-sm text-gray-600">{entry.details}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile: Tabs */}
          <div className="md:hidden">
            <Tabs defaultValue="checklist" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="checklist" className="text-xs">
                  <div className="flex flex-col items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Checklist</span>
                  </div>
                </TabsTrigger>

                <TabsTrigger value="observacao" className="text-xs">
                  <div className="flex flex-col items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>Observação</span>
                  </div>
                </TabsTrigger>

                <TabsTrigger value="concluir" className="text-xs">
                  <div className="flex flex-col items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Concluir</span>
                  </div>
                </TabsTrigger>

                <TabsTrigger value="historico" className="text-xs">
                  <div className="flex flex-col items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>Histórico</span>
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="checklist">
                <Card className="p-6 border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-gray-900" />
                    <h2 className="text-lg">Checklist de Atendimento</h2>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Preencha os itens do checklist vinculado a esta OS
                  </p>
                  <ChecklistRunner osId={osId} />
                </Card>
              </TabsContent>

              <TabsContent value="observacao">
                <Card className="p-6 border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-gray-900" />
                    <h2 className="text-lg">Observações</h2>
                    {savingObservations && (
                      <Badge variant="secondary" className="ml-auto flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Salvando...
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Textarea
                        placeholder="Observações sobre a manutenção preventiva..."
                        className="min-h-[100px] resize-none border-gray-200"
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                      />
                    </div>

                    <Separator className="my-4" />

                    <div>
                      <label className="block text-sm text-gray-700 mb-3">
                        Evidências (Fotos, Vídeos, Áudios)
                      </label>
                      <EvidenceButtons
                        onPhotoClick={handlePhotoClick}
                        onVideoClick={handleVideoClick}
                        onAudioClick={handleAudioClick}
                        onNoteClick={handleAddNote}
                        disabled={uploading}
                      />
                      {evidencias.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm text-gray-600">
                            {evidencias.length} evidência(s) adicionada(s)
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center mt-3">
                          Nenhuma evidência adicionada ainda
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-gray-500">
                      Salvamento automático a cada 2 segundos
                    </p>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="concluir">
                <Card className="p-6 border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-gray-900" />
                    <h2 className="text-lg">Próximos Passos</h2>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm mb-2">
                        Estado do elevador:
                      </label>
                      <Select
                        value={elevatorState || undefined}
                        onValueChange={(value) =>
                          setElevatorState(value as ElevatorState)
                        }
                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Selecione o estado do elevador" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="funcionando">
                            Funcionando normal
                          </SelectItem>
                          <SelectItem value="dependendo-corretiva">
                            Funcionando, dependendo de corretiva
                          </SelectItem>
                          <SelectItem value="parado">Parado</SelectItem>
                        </SelectContent>
                      </Select>
                      {elevatorState === 'funcionando' && (
                        <p className="text-sm text-green-600 mt-2">
                          ✓ No checkout a OS será fechada normalmente
                        </p>
                      )}
                      {elevatorState === 'dependendo-corretiva' && (
                        <p className="text-sm text-amber-600 mt-2">
                          ⚠️ Será criada uma OS do tipo Corretiva Programada
                        </p>
                      )}
                      {elevatorState === 'parado' && (
                        <p className="text-sm text-red-600 mt-2">
                          🚨 Será criada uma OS do tipo Urgência (Corretiva com status Parado)
                        </p>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Nome do Cliente
                      </label>
                      <Input
                        placeholder="Nome completo do cliente"
                        className="bg-white"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Assinatura do Cliente
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-white text-center">
                        <p className="text-sm text-gray-500">
                          Clique para coletar assinatura
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <Button
                    className="w-full bg-black hover:bg-gray-800"
                    disabled={!elevatorState || !clientName}
                    onClick={handleCheckoutClick}
                  >
                    Realizar Checkout
                  </Button>
                </Card>
              </TabsContent>

              <TabsContent value="historico">
                <Card className="p-6 border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-gray-900" />
                    <h2 className="text-lg">Histórico do Equipamento</h2>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Todas as interações anteriores com este equipamento
                  </p>

                  <div className="space-y-4">
                    {history.length > 0 ? (
                      history.map((entry, index) => (
                        <div
                          key={index}
                          className="border-b border-gray-200 pb-4 last:pb-0 last:border-none"
                        >
                          <div className="mb-2">
                            <p className="text-sm">
                              <span className="text-gray-900">{entry.date}</span>
                              <span className="text-gray-500"> às {entry.time}</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              Técnico: {entry.technician}
                            </p>
                          </div>
                          <p className="text-sm text-gray-900 mb-1">{entry.summary}</p>
                          <p className="text-sm text-gray-600">{entry.details}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Nenhum histórico disponível
                      </p>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
