'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { toast } from 'sonner'
import { 
  CheckCircle2, 
  Circle, 
  Camera,
  Video,
  Mic,
  FileText,
  Loader2,
  Upload,
  Trash2,
  Image as ImageIcon
} from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { useDebounce } from '@/hooks/use-debounce'

interface OSAtendimentoChecklistProps {
  osId: string
  empresaId: string
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

interface Laudo {
  id?: string
  descricao?: string
  diagnostico?: string
  solucao_aplicada?: string
  recomendacoes?: string
  versao?: number
}

export function OSAtendimentoChecklist({ osId, empresaId }: OSAtendimentoChecklistProps) {
  const [laudo, setLaudo] = useState<Laudo>({})
  const [evidencias, setEvidencias] = useState<Evidencia[]>([])
  const [uploading, setUploading] = useState(false)
  const [savingLaudo, setSavingLaudo] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createSupabaseBrowser()

  // Debounce do laudo para autosave
  const debouncedLaudo = useDebounce(laudo, 2000)

  // =====================================================
  // Carregar dados iniciais
  // =====================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar laudo existente
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token
        
        if (token) {
          const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
          const response = await fetch(`${BACKEND_URL}/api/v1/ordens-servico/${osId}/laudo`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const laudoData = await response.json()
            if (laudoData) {
              setLaudo(laudoData)
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
        console.error('[checklist] Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [osId, supabase])

  // =====================================================
  // Autosave do laudo (debounced)
  // =====================================================
  useEffect(() => {
    const saveLaudo = async () => {
      if (!debouncedLaudo || loading) return

      // Verificar se tem algum conteúdo
      const temConteudo = Object.values(debouncedLaudo).some(
        v => typeof v === 'string' && v.trim().length > 0
      )

      if (!temConteudo && !laudo.id) return

      setSavingLaudo(true)

      try {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token
        
        if (!token) throw new Error('Não autenticado')
        
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        
        if (laudo.id) {
          // Atualizar laudo existente
          const response = await fetch(`${BACKEND_URL}/api/v1/ordens-servico/${osId}/laudo/${laudo.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              descricao: debouncedLaudo.descricao,
              diagnostico: debouncedLaudo.diagnostico,
              solucao_aplicada: debouncedLaudo.solucao_aplicada,
              recomendacoes: debouncedLaudo.recomendacoes
            })
          })

          if (!response.ok) throw new Error('Erro ao atualizar laudo')
        } else {
          // Criar novo laudo
          const response = await fetch(`${BACKEND_URL}/api/v1/ordens-servico/${osId}/laudo`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              descricao: debouncedLaudo.descricao,
              diagnostico: debouncedLaudo.diagnostico,
              solucao_aplicada: debouncedLaudo.solucao_aplicada,
              recomendacoes: debouncedLaudo.recomendacoes
            })
          })
          
          if (!response.ok) throw new Error('Erro ao criar laudo')
          
          const data = await response.json()

          if (data) {
            setLaudo(prev => ({ ...prev, id: data.id }))
          }
        }

      } catch (error) {
        console.error('[checklist] Erro ao salvar laudo:', error)
        toast.error('Erro ao salvar laudo automaticamente')
      } finally {
        setSavingLaudo(false)
      }
    }

    saveLaudo()
  }, [debouncedLaudo]) // eslint-disable-line react-hooks/exhaustive-deps

  // =====================================================
  // Upload de evidência (foto/video/audio)
  // =====================================================
  const handleFileUpload = async (file: File, tipo: 'foto' | 'video' | 'audio') => {
    setUploading(true)

    try {
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

      setEvidencias(prev => [data, ...prev])
      toast.success(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} enviada com sucesso!`)
    } catch (error) {
      console.error('[checklist] Erro ao fazer upload:', error)
      toast.error('Erro ao enviar arquivo')
    } finally {
      setUploading(false)
    }
  }

  // =====================================================
  // Adicionar nota de texto
  // =====================================================
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
          titulo: `Nota - ${new Date().toLocaleString('pt-BR')}`
        })
        .select()
        .single()

      if (error) throw error

      setEvidencias(prev => [data, ...prev])
      toast.success('Nota adicionada com sucesso!')
    } catch (error) {
      console.error('[checklist] Erro ao adicionar nota:', error)
      toast.error('Erro ao adicionar nota')
    }
  }

  // =====================================================
  // Deletar evidência
  // =====================================================
  const handleDeleteEvidencia = async (evidencia: Evidencia) => {
    if (!confirm('Tem certeza que deseja excluir esta evidência?')) return

    try {
      // Deletar arquivo do storage (se existir)
      if (evidencia.storage_path) {
        await supabase.storage
          .from('evidencias')
          .remove([evidencia.storage_path])
      }

      // Deletar registro do banco
      const { error } = await supabase
        .from('os_evidencias')
        .delete()
        .eq('id', evidencia.id)

      if (error) throw error

      setEvidencias(prev => prev.filter(e => e.id !== evidencia.id))
      toast.success('Evidência excluída com sucesso!')
    } catch (error) {
      console.error('[checklist] Erro ao deletar evidência:', error)
      toast.error('Erro ao excluir evidência')
    }
  }

  // =====================================================
  // Obter URL pública da evidência
  // =====================================================
  const getEvidenciaUrl = (evidencia: Evidencia): string | null => {
    if (!evidencia.storage_path) return null

    const { data } = supabase.storage
      .from('evidencias')
      .getPublicUrl(evidencia.storage_path)

    return data.publicUrl
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* =====================================================
          LAUDO TÉCNICO
      ===================================================== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Laudo Técnico</CardTitle>
              <CardDescription>
                Preencha o laudo. Salvamento automático a cada 2 segundos.
              </CardDescription>
            </div>
            {savingLaudo && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Salvando...
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição do Problema</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o problema relatado pelo cliente..."
              value={laudo.descricao || ''}
              onChange={(e) => setLaudo(prev => ({ ...prev, descricao: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnostico">Diagnóstico</Label>
            <Textarea
              id="diagnostico"
              placeholder="Qual foi o diagnóstico técnico?"
              value={laudo.diagnostico || ''}
              onChange={(e) => setLaudo(prev => ({ ...prev, diagnostico: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="solucao">Solução Aplicada</Label>
            <Textarea
              id="solucao"
              placeholder="Qual solução foi aplicada?"
              value={laudo.solucao_aplicada || ''}
              onChange={(e) => setLaudo(prev => ({ ...prev, solucao_aplicada: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recomendacoes">Recomendações</Label>
            <Textarea
              id="recomendacoes"
              placeholder="Recomendações para o cliente..."
              value={laudo.recomendacoes || ''}
              onChange={(e) => setLaudo(prev => ({ ...prev, recomendacoes: e.target.value }))}
              rows={3}
            />
          </div>

          {laudo.versao && (
            <p className="text-xs text-muted-foreground">
              Versão: {laudo.versao}
            </p>
          )}
        </CardContent>
      </Card>

      {/* =====================================================
          EVIDÊNCIAS
      ===================================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Evidências</CardTitle>
          <CardDescription>
            Adicione fotos, vídeos, áudios ou notas de texto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Botões de Upload */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-20 flex-col"
              disabled={uploading}
              onClick={() => document.getElementById('file-foto')?.click()}
            >
              <Camera className="w-5 h-5 mb-1" />
              Foto
              <input
                id="file-foto"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, 'foto')
                }}
              />
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col"
              disabled={uploading}
              onClick={() => document.getElementById('file-video')?.click()}
            >
              <Video className="w-5 h-5 mb-1" />
              Vídeo
              <input
                id="file-video"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, 'video')
                }}
              />
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col"
              disabled={uploading}
              onClick={() => document.getElementById('file-audio')?.click()}
            >
              <Mic className="w-5 h-5 mb-1" />
              Áudio
              <input
                id="file-audio"
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, 'audio')
                }}
              />
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={handleAddNote}
              disabled={uploading}
            >
              <FileText className="w-5 h-5 mb-1" />
              Nota
            </Button>
          </div>

          {/* Lista de Evidências */}
          {evidencias.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {evidencias.length} evidência(s)
              </p>
              <div className="space-y-2">
                {evidencias.map(evidencia => (
                  <div
                    key={evidencia.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {evidencia.tipo === 'foto' && <Camera className="w-4 h-4" />}
                      {evidencia.tipo === 'video' && <Video className="w-4 h-4" />}
                      {evidencia.tipo === 'audio' && <Mic className="w-4 h-4" />}
                      {evidencia.tipo === 'nota' && <FileText className="w-4 h-4" />}

                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {evidencia.titulo || `${evidencia.tipo}`}
                        </p>
                        {evidencia.tipo === 'nota' && evidencia.conteudo && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {evidencia.conteudo}
                          </p>
                        )}
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
                        onClick={() => handleDeleteEvidencia(evidencia)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma evidência adicionada ainda
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

