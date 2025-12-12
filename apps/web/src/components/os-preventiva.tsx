'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
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
  CheckCircle2,
  XCircle,
  MinusCircle,
  Camera,
  Mic,
  FileText,
  Loader2,
  Trash2,
  Play
} from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { useDebounce } from '@/hooks/use-debounce'
import { OSProximosPassos } from './os-proximos-passos'
import { OSHistoricoEquipamento } from './os-historico-equipamento'

interface OSPreventivaProps {
  osId: string
  empresaId: string
  osData: any
}

interface ChecklistItem {
  id: string
  descricao: string
  status: 'conforme' | 'nao_conforme' | 'na' | null
  ordem: number
}

interface Evidencia {
  id: string
  tipo: 'foto' | 'video' | 'audio' | 'nota'
  storage_path?: string
  conteudo?: string
  created_at: string
}

export function OSPreventiva({ osId, empresaId, osData }: OSPreventivaProps) {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [observacoes, setObservacoes] = useState('')
  const [evidencias, setEvidencias] = useState<Evidencia[]>([])
  const [loading, setLoading] = useState(true)
  const [savingObservacoes, setSavingObservacoes] = useState(false)
  const [evidenciaParaDeletar, setEvidenciaParaDeletar] = useState<Evidencia | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  // Rastrear uploads feitos nesta sessão (para limpeza se desistir)
  const newUploadIds = useRef<string[]>([])

  const router = useRouter()

  const supabase = createSupabaseBrowser()

  // Debounce das observações para autosave
  const debouncedObservacoes = useDebounce(observacoes, 2000)

  // =====================================================
  // Carregar dados iniciais
  // =====================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obter token de autenticação
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

        // Buscar checklist items via backend
        if (token) {
          const checklistResponse = await fetch(`${BACKEND_URL}/api/v1/ordens-servico/${osId}/checklist`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })

          if (checklistResponse.ok) {
            const checklistData = await checklistResponse.json()
            if (checklistData && checklistData.length > 0) {
              setChecklistItems(checklistData)
            } else {
              // Carregar checklist padrão do equipamento/tipo
              // Gerar UUIDs para cada item
              setChecklistItems([
                { id: crypto.randomUUID(), descricao: 'Verificar condições de segurança do local', status: null, ordem: 1 },
                { id: crypto.randomUUID(), descricao: 'Conferir identificação do equipamento', status: null, ordem: 2 },
                { id: crypto.randomUUID(), descricao: 'Testar funcionamento antes da manutenção', status: null, ordem: 3 },
                { id: crypto.randomUUID(), descricao: 'Utilizar EPIs adequados', status: null, ordem: 4 },
                { id: crypto.randomUUID(), descricao: 'Documentar estado inicial com fotos', status: null, ordem: 5 },
                { id: crypto.randomUUID(), descricao: 'Realizar manutenção conforme procedimento', status: null, ordem: 6 },
                { id: crypto.randomUUID(), descricao: 'Testar funcionamento após manutenção', status: null, ordem: 7 },
                { id: crypto.randomUUID(), descricao: 'Limpar área de trabalho', status: null, ordem: 8 },
                { id: crypto.randomUUID(), descricao: 'Obter assinatura do cliente', status: null, ordem: 9 }
              ])
            }
          }
        }

        // Buscar observações do laudo usando mesmo token
        if (token) {
          const response = await fetch(`${BACKEND_URL}/api/v1/ordens-servico/${osId}/laudo`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (response.ok) {
            const laudoData = await response.json()
            if (laudoData?.observacao) {
              setObservacoes(laudoData.observacao)
            }
          }
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
        console.error('[preventiva] Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [osId, supabase])

  // =====================================================
  // Autosave das observações (debounced)
  // =====================================================
  useEffect(() => {
    const saveObservacoes = async () => {
      if (!debouncedObservacoes || loading) return

      setSavingObservacoes(true)

      try {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        if (!token) throw new Error('Não autenticado')

        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

        // Verificar se já existe laudo
        const checkResponse = await fetch(`${BACKEND_URL}/api/v1/ordens-servico/${osId}/laudo`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        const laudoExistente = checkResponse.ok ? await checkResponse.json() : null

        const method = laudoExistente?.id ? 'PATCH' : 'POST'
        const url = laudoExistente?.id
          ? `${BACKEND_URL}/api/v1/ordens-servico/${osId}/laudo/${laudoExistente.id}`
          : `${BACKEND_URL}/api/v1/ordens-servico/${osId}/laudo`

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ observacao: debouncedObservacoes })
        })

        if (!response.ok) throw new Error('Erro ao salvar observações')
        console.log('[preventiva] Observações salvas automaticamente')
      } catch (error) {
        console.error('[preventiva] Erro ao salvar observações:', error)
      } finally {
        setSavingObservacoes(false)
      }
    }

    saveObservacoes()
  }, [debouncedObservacoes, loading, osId, empresaId, supabase])

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
      console.error('[preventiva] Erro ao cancelar:', error)
      toast.error('Erro ao cancelar atendimento')
    } finally {
      setCancelling(false)
      setShowCancelDialog(false)
    }
  }, [evidencias, router, supabase])

  // =====================================================
  // Atualizar status do checklist item
  // =====================================================
  const handleChecklistItemStatus = async (itemId: string, status: 'conforme' | 'nao_conforme' | 'na') => {
    try {
      // Atualizar estado local imediatamente
      setChecklistItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, status } : item
        )
      )

      // Obter token de autenticação
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) throw new Error('Não autenticado')

      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const item = checklistItems.find(i => i.id === itemId)

      // Chamar backend para salvar
      const response = await fetch(`${BACKEND_URL}/api/v1/ordens-servico/${osId}/checklist/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          descricao: item?.descricao || '',
          status,
          ordem: item?.ordem || 0
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Erro ao salvar checklist')
      }
    } catch (error) {
      console.error('[preventiva] Erro ao atualizar checklist:', error)
      toast.error('Erro ao atualizar checklist')
    }
  }

  // =====================================================
  // Upload de evidências (foto/audio)
  // =====================================================
  const handleFileUpload = async (file: File, tipo: 'foto' | 'audio') => {
    setLoading(true)

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
      console.error('[preventiva] Erro ao fazer upload:', error)
      toast.error('Erro ao enviar arquivo')
    } finally {
      setLoading(false)
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
      console.error('[preventiva] Erro ao deletar evidência:', error)
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

  // Calcular progresso do checklist
  const itemsRespondidos = checklistItems.filter(item => item.status !== null).length
  const totalItems = checklistItems.length
  const itemsConformes = checklistItems.filter(item => item.status === 'conforme').length

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Seção 1: Checklist de Atendimento */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Checklist de Atendimento
              </CardTitle>
            </div>
            <Badge variant="outline">
              {itemsRespondidos}/{totalItems} conforme
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Marque cada item conforme as normas e boas práticas da empresa
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm flex-1">{item.descricao}</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={item.status === 'conforme' ? 'default' : 'outline'}
                  onClick={() => handleChecklistItemStatus(item.id, 'conforme')}
                  className="gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Conforme
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={item.status === 'nao_conforme' ? 'destructive' : 'outline'}
                  onClick={() => handleChecklistItemStatus(item.id, 'nao_conforme')}
                  className="gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  Não Conforme
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={item.status === 'na' ? 'secondary' : 'outline'}
                  onClick={() => handleChecklistItemStatus(item.id, 'na')}
                  className="gap-1"
                >
                  <MinusCircle className="w-4 h-4" />
                  N/A
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Seção 2: Observações e Evidências */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              2
            </div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Observações
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              placeholder="Observações sobre a manutenção preventiva..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Evidências (Fotos, Áudios)</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-20 flex-col"
                disabled={loading}
                onClick={() => document.getElementById('file-foto-preventiva')?.click()}
              >
                {loading ? <Loader2 className="w-5 h-5 mb-1 animate-spin" /> : <Camera className="w-5 h-5 mb-1" />}
                <span className="text-xs">Foto</span>
                <input
                  id="file-foto-preventiva"
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
                disabled={loading}
                onClick={() => document.getElementById('file-audio-preventiva')?.click()}
              >
                {loading ? <Loader2 className="w-5 h-5 mb-1 animate-spin" /> : <Mic className="w-5 h-5 mb-1" />}
                <span className="text-xs">Áudio</span>
                <input
                  id="file-audio-preventiva"
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
                          alt="Foto"
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      {evidencia.tipo === 'audio' && (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Play className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{evidencia.tipo}</p>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          setEvidenciaParaDeletar(evidencia)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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

      {/* Seção 3: Próximos Passos */}
      <OSProximosPassos osId={osId} empresaId={empresaId} />

      {/* Seção 4: Histórico do Equipamento */}
      <OSHistoricoEquipamento equipamentoId={osData?.equipamento_id} />

      {/* AlertDialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evidência?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O arquivo será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog de confirmação de cancelamento */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar atendimento?</AlertDialogTitle>
            <AlertDialogDescription>
              {newUploadIds.current.length > 0
                ? `Você tem ${newUploadIds.current.length} evidência(s) enviada(s) nesta sessão. Elas serão removidas permanentemente.`
                : 'Tem certeza que deseja sair?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Continuar atendimento</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelAtendimento}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? 'Cancelando...' : 'Cancelar e sair'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Botão Cancelar Atendimento (fixo no rodapé) */}
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          variant="outline"
          onClick={() => setShowCancelDialog(true)}
          className="shadow-lg"
        >
          Cancelar Atendimento
        </Button>
      </div>
    </div>
  )
}
