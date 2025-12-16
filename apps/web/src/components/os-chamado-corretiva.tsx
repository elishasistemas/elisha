'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { toast } from 'sonner'
import {
  Camera,
  Mic,
  FileText,
  User,
  Phone,
  Loader2,
  Trash2,
  Play
} from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { useDebounce } from '@/hooks/use-debounce'
import { OSProximosPassos } from './os-proximos-passos'
import { OSHistoricoEquipamento } from './os-historico-equipamento'
import { OSStepsWrapper } from './os-steps-wrapper'

interface OSChamadoCorretivaProps {
  osId: string
  empresaId: string
  osData: any
  readOnly?: boolean
}

interface Evidencia {
  id: string
  tipo: 'foto' | 'video' | 'audio' | 'nota'
  titulo?: string
  storage_path?: string
  conteudo?: string
  created_at: string
}

interface Laudo {
  id?: string
  o_que_foi_feito?: string
  observacao?: string
}

export function OSChamadoCorretiva({ osId, empresaId, osData, readOnly = false }: OSChamadoCorretivaProps) {
  const [laudo, setLaudo] = useState<Laudo>({})
  const [evidencias, setEvidencias] = useState<Evidencia[]>([])
  const [uploading, setUploading] = useState(false)
  const [savingLaudo, setSavingLaudo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [clienteData, setClienteData] = useState<any>(null)
  const [evidenciaParaDeletar, setEvidenciaParaDeletar] = useState<Evidencia | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  // Rastrear uploads feitos nesta sessão (para limpeza se desistir)
  const newUploadIds = useRef<string[]>([])

  const router = useRouter()

  const supabase = createSupabaseBrowser()

  // Debounce do laudo para autosave
  const debouncedLaudo = useDebounce(laudo, 2000)

  // =====================================================
  // Carregar dados iniciais
  // =====================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar dados do cliente via API
        if (osData?.cliente_id) {
          try {
            const session = await supabase.auth.getSession()
            const token = session.data.session?.access_token
            if (token) {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/clientes/${osData.cliente_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              })
              if (response.ok) {
                const cliente = await response.json()
                setClienteData(cliente)
              }
            }
          } catch (err) {
            console.error('[chamado-corretiva] Erro ao buscar cliente:', err)
          }
        }

        // Buscar laudo existente via API
        try {
          const session = await supabase.auth.getSession()
          const token = session.data.session?.access_token
          if (token) {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/ordens-servico/${osId}/laudo`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            // 404 é OK - significa que não tem laudo ainda
            if (response.ok) {
              const text = await response.text()
              if (text) {
                const laudoData = JSON.parse(text)
                if (laudoData) setLaudo(laudoData)
              }
            } else if (response.status !== 404) {
              console.error('[chamado-corretiva] Erro ao buscar laudo:', response.status)
            }
          }
        } catch (err) {
          console.error('[chamado-corretiva] Erro ao buscar laudo:', err)
        }

        // Buscar evidências
        const { data: evidenciasData } = await supabase
          .from('os_evidencias')
          .select('*')
          .eq('os_id', osId)
          .order('created_at', { ascending: false })

        if (evidenciasData) {
          setEvidencias(evidenciasData)
        }
      } catch (error) {
        console.error('[chamado-corretiva] Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [osId, osData, supabase])

  // =====================================================
  // Autosave do laudo (debounced)
  // =====================================================
  useEffect(() => {
    const saveLaudo = async () => {
      if (!debouncedLaudo || loading) return

      const temConteudo = Object.values(debouncedLaudo).some(
        v => typeof v === 'string' && v.trim().length > 0
      )

      if (!temConteudo && !laudo.id) return

      setSavingLaudo(true)

      try {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token
        if (!token) return

        const url = laudo.id
          ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/ordens-servico/${osId}/laudo/${laudo.id}`
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/ordens-servico/${osId}/laudo`

        const response = await fetch(url, {
          method: laudo.id ? 'PATCH' : 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            o_que_foi_feito: debouncedLaudo.o_que_foi_feito,
            observacao: debouncedLaudo.observacao,
            empresa_id: empresaId
          })
        })

        if (!response.ok) throw new Error('Erro ao salvar laudo')

        if (!laudo.id) {
          const data = await response.json()
          if (data?.id) {
            setLaudo(prev => ({ ...prev, id: data.id }))
          }
        }

      } catch (error) {
      } finally {
        setSavingLaudo(false)
      }
    }

    saveLaudo()
  }, [debouncedLaudo, loading, laudo.id, osId, empresaId, supabase])

  // =====================================================
  // Aviso ao sair com uploads pendentes
  // =====================================================
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (newUploadIds.current.length > 0) {
        e.preventDefault()
        e.returnValue = 'Você tem evidências não salvas. Deseja realmente sair?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // =====================================================
  // Cancelar atendimento (limpa uploads)
  // =====================================================
  const handleCancelAtendimento = useCallback(async () => {
    if (newUploadIds.current.length === 0) {
      router.push('/dashboard')
      return
    }

    setCancelling(true)

    try {
      // Buscar evidências para pegar storage_paths
      const evidenciasParaDeletar = evidencias.filter(e =>
        newUploadIds.current.includes(e.id)
      )

      // Deletar arquivos do storage
      const storagePaths = evidenciasParaDeletar
        .filter(e => e.storage_path)
        .map(e => e.storage_path!)

      if (storagePaths.length > 0) {
        await supabase.storage
          .from('evidencias')
          .remove(storagePaths)
      }

      // Deletar registros do banco
      if (newUploadIds.current.length > 0) {
        await supabase
          .from('os_evidencias')
          .delete()
          .in('id', newUploadIds.current)
      }

      toast.success('Atendimento cancelado. Evidências removidas.')
      router.push('/dashboard')
    } catch (error) {
      console.error('[chamado-corretiva] Erro ao cancelar:', error)
      toast.error('Erro ao cancelar atendimento')
    } finally {
      setCancelling(false)
      setShowCancelDialog(false)
    }
  }, [evidencias, router, supabase])

  // =====================================================
  // Upload de evidências (foto/audio)
  // =====================================================
  const handleFileUpload = async (file: File, tipo: 'foto' | 'audio') => {
    setUploading(true)

    try {
      // Validar tipo de arquivo
      const allowedTypes: Record<string, string[]> = {
        foto: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a', 'audio/x-m4a']
      }

      if (!allowedTypes[tipo]?.includes(file.type)) {
        toast.error(`Tipo de arquivo não suportado para ${tipo}`)
        return
      }

      // Validar tamanho (máximo 50MB)
      const maxSize = 50 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error('Arquivo muito grande. Tamanho máximo: 50MB')
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${osId}/${tipo}/${Date.now()}.${fileExt}`

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from('evidencias')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Registrar evidência no banco
      const { data, error: dbError } = await supabase
        .from('os_evidencias')
        .insert({
          os_id: osId,
          empresa_id: empresaId,
          tipo,
          storage_path: fileName,
          mime_type: file.type,
          tamanho_bytes: file.size,
          titulo: file.name
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Rastrear este upload para limpeza se desistir
      newUploadIds.current.push(data.id)

      setEvidencias(prev => [data, ...prev])
      toast.success(`${tipo === 'foto' ? 'Foto' : 'Áudio'} enviado com sucesso!`)
    } catch (error) {
      console.error('[chamado-corretiva] Erro ao fazer upload:', error)
      toast.error('Erro ao enviar arquivo')
    } finally {
      setUploading(false)
    }
  }

  // =====================================================
  // Deletar evidência
  // =====================================================
  const handleConfirmDelete = async () => {
    if (!evidenciaParaDeletar) return

    try {
      // Deletar arquivo do storage
      if (evidenciaParaDeletar.storage_path) {
        await supabase.storage
          .from('evidencias')
          .remove([evidenciaParaDeletar.storage_path])
      }

      // Deletar registro do banco
      const { error } = await supabase
        .from('os_evidencias')
        .delete()
        .eq('id', evidenciaParaDeletar.id)

      if (error) throw error

      setEvidencias(prev => prev.filter(e => e.id !== evidenciaParaDeletar.id))
      toast.success('Evidência excluída com sucesso!')
    } catch (error) {
      console.error('[chamado-corretiva] Erro ao deletar evidência:', error)
      toast.error('Erro ao excluir evidência')
    } finally {
      setShowDeleteDialog(false)
      setEvidenciaParaDeletar(null)
    }
  }

  // =====================================================
  // Obter URL da evidência
  // =====================================================
  const getEvidenciaUrl = (evidencia: Evidencia): string | null => {
    if (!evidencia.storage_path) return null

    const { data } = supabase.storage
      .from('evidencias')
      .getPublicUrl(evidencia.storage_path)

    return data.publicUrl
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>
  }

  // Step 1: Descrição do Cliente
  const step1 = (
    <div className="flex gap-4">
      <div className="flex flex-col items-center hidden md:flex">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0">
          1
        </div>
        <div className="w-0.5 flex-1 bg-border mt-2"></div>
      </div>
      <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Descrição do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground mb-2 block">Problema relatado pelo cliente</Label>
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm">{osData?.descricao || osData?.observacoes || 'Nenhuma descrição fornecida'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4" />
                Nome do Solicitante
              </Label>
              <Input
                value={osData?.solicitante_nome || clienteData?.responsavel_nome || clienteData?.nome_local || 'N/A'}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4" />
                Telefone
              </Label>
              <Input
                value={osData?.solicitante_telefone || clienteData?.responsavel_telefone || clienteData?.telefone || 'N/A'}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Step 2: Laudo Técnico
  const step2 = (
    <div className="flex gap-4">
      <div className="flex flex-col items-center hidden md:flex">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0">
          2
        </div>
        <div className="w-0.5 flex-1 bg-border mt-2"></div>
      </div>
      <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Laudo Técnico
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Documente o que foi feito e adicione evidências
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
          <div>
            <Label htmlFor="o_que_foi_feito">O que foi feito</Label>
            <Textarea
              id="o_que_foi_feito"
              placeholder="Descreva o que foi realizado..."
              value={laudo.o_que_foi_feito || ''}
              onChange={(e) => setLaudo(prev => ({ ...prev, o_que_foi_feito: e.target.value }))}
              rows={4}
              className="resize-none"
              disabled={readOnly}
            />
          </div>

          <div>
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              placeholder="Observações adicionais..."
              value={laudo.observacao || ''}
              onChange={(e) => setLaudo(prev => ({ ...prev, observacao: e.target.value }))}
              rows={4}
              className="resize-none"
              disabled={readOnly}
            />
          </div>

          <div>
            <Label>Evidências (Fotos, Áudios)</Label>
            {!readOnly && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-20 flex-col"
                  disabled={uploading}
                  onClick={() => document.getElementById('file-foto-corretiva')?.click()}
                >
                  {uploading ? <Loader2 className="w-5 h-5 mb-1 animate-spin" /> : <Camera className="w-5 h-5 mb-1" />}
                  <span className="text-xs">Foto</span>
                  <input
                    id="file-foto-corretiva"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, 'foto')
                      e.target.value = ''
                    }}
                  />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-20 flex-col"
                  disabled={uploading}
                  onClick={() => document.getElementById('file-audio-corretiva')?.click()}
                >
                  {uploading ? <Loader2 className="w-5 h-5 mb-1 animate-spin" /> : <Mic className="w-5 h-5 mb-1" />}
                  <span className="text-xs">Áudio</span>
                  <input
                    id="file-audio-corretiva"
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, 'audio')
                      e.target.value = ''
                    }}
                  />
                </Button>
              </div>
            )}

            {/* Lista de Evidências */}
            {evidencias.length > 0 ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">{evidencias.length} evidência(s)</p>
                {evidencias.map(evidencia => (
                  <div
                    key={evidencia.id}
                    className="flex items-center justify-between p-3 border rounded-md bg-muted/30"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {evidencia.tipo === 'foto' && (
                        <img
                          src={getEvidenciaUrl(evidencia) || ''}
                          alt={evidencia.titulo || 'Foto'}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      {evidencia.tipo === 'audio' && (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Play className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{evidencia.titulo || evidencia.tipo}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(evidencia.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {evidencia.storage_path && (
                        <a
                          href={getEvidenciaUrl(evidencia) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Abrir
                        </a>
                      )}

                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            console.log('[DEBUG] Delete button clicked for:', evidencia.id)
                            setEvidenciaParaDeletar(evidencia)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center mt-4">
                Nenhuma evidência adicionada ainda
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Step 3: Próximos Passos
  const step3 = <OSProximosPassos osId={osId} empresaId={empresaId} readOnly={readOnly} osData={osData} />

  // Step 4: Histórico do Equipamento
  const step4 = <OSHistoricoEquipamento equipamentoId={osData?.equipamento_id} />

  return (
    <>
      <OSStepsWrapper step1={step1} step2={step2} step3={step3} step4={step4} />

      {/* AlertDialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
        console.log('[DEBUG] AlertDialog onOpenChange:', open)
        if (!open) {
          setShowDeleteDialog(false)
          setEvidenciaParaDeletar(null)
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evidência?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O arquivo será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false)
              setEvidenciaParaDeletar(null)
            }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
