'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { toast } from 'sonner'
import { 
  Camera,
  Video,
  Mic,
  FileText,
  User,
  Phone
} from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { useDebounce } from '@/hooks/use-debounce'
import { OSProximosPassos } from './os-proximos-passos'
import { OSHistoricoEquipamento } from './os-historico-equipamento'

interface OSChamadoCorretivaProps {
  osId: string
  empresaId: string
  osData: any
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

export function OSChamadoCorretiva({ osId, empresaId, osData }: OSChamadoCorretivaProps) {
  const [laudo, setLaudo] = useState<Laudo>({})
  const [evidencias, setEvidencias] = useState<Evidencia[]>([])
  const [uploading, setUploading] = useState(false)
  const [savingLaudo, setSavingLaudo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [clienteData, setClienteData] = useState<any>(null)

  const supabase = createSupabaseBrowser()

  // Debounce do laudo para autosave
  const debouncedLaudo = useDebounce(laudo, 2000)

  // =====================================================
  // Carregar dados iniciais
  // =====================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar dados do cliente
        if (osData?.cliente_id) {
          const { data: cliente } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', osData.cliente_id)
            .single()

          if (cliente) {
            setClienteData(cliente)
          }
        }

        // Buscar laudo existente
        const { data: laudoData } = await supabase
          .from('os_laudos')
          .select('*')
          .eq('os_id', osId)
          .single()

        if (laudoData) {
          setLaudo(laudoData)
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
        if (laudo.id) {
          const { error } = await supabase
            .from('os_laudos')
            .update({
              o_que_foi_feito: debouncedLaudo.o_que_foi_feito,
              observacao: debouncedLaudo.observacao
            })
            .eq('id', laudo.id)

          if (error) throw error
        } else {
          const { data, error } = await supabase
            .from('os_laudos')
            .insert({
              os_id: osId,
              empresa_id: empresaId,
              o_que_foi_feito: debouncedLaudo.o_que_foi_feito,
              observacao: debouncedLaudo.observacao
            })
            .select()
            .single()

          if (error) throw error
          if (data) {
            setLaudo(prev => ({ ...prev, id: data.id }))
          }
        }

        console.log('[chamado-corretiva] Laudo salvo automaticamente')
      } catch (error) {
        console.error('[chamado-corretiva] Erro ao salvar laudo:', error)
      } finally {
        setSavingLaudo(false)
      }
    }

    saveLaudo()
  }, [debouncedLaudo, loading, laudo.id, osId, empresaId, supabase])

  // =====================================================
  // Upload de evidências (placeholder)
  // =====================================================
  const handleUploadEvidencia = async (tipo: 'foto' | 'video' | 'audio' | 'nota') => {
    toast.info(`Upload de ${tipo} em desenvolvimento`)
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Seção 1: Descrição do Cliente */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              1
            </div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Descrição do Cliente
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground mb-2 block">Problema relatado pelo cliente</Label>
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm">{osData?.descricao || 'Nenhuma descrição fornecida'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4" />
                Nome do Solicitante
              </Label>
              <Input
                value={clienteData?.responsavel_nome || 'N/A'}
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
                value={clienteData?.responsavel_telefone || 'N/A'}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção 2: Laudo Técnico */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              2
            </div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Laudo Técnico
            </CardTitle>
          </div>
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
            />
          </div>

          <div>
            <Label>Evidências (Fotos, Vídeos, Áudios)</Label>
            <div className="grid grid-cols-4 gap-3 mt-2">
              <Button
                type="button"
                variant="outline"
                className="h-20 flex-col"
                onClick={() => handleUploadEvidencia('foto')}
              >
                <Camera className="w-5 h-5 mb-1" />
                <span className="text-xs">Foto</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-20 flex-col"
                onClick={() => handleUploadEvidencia('video')}
              >
                <Video className="w-5 h-5 mb-1" />
                <span className="text-xs">Vídeo</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-20 flex-col"
                onClick={() => handleUploadEvidencia('audio')}
              >
                <Mic className="w-5 h-5 mb-1" />
                <span className="text-xs">Áudio</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-20 flex-col"
                onClick={() => handleUploadEvidencia('nota')}
              >
                <FileText className="w-5 h-5 mb-1" />
                <span className="text-xs">Nota</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {evidencias.length > 0 ? `${evidencias.length} evidência(s) adicionada(s)` : 'Nenhuma evidência adicionada ainda'}
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Salvamento automático a cada 2 segundos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Seção 3: Próximos Passos */}
      <OSProximosPassos osId={osId} empresaId={empresaId} />

      {/* Seção 4: Histórico do Equipamento */}
      <OSHistoricoEquipamento equipamentoId={osData?.equipamento_id} />
    </div>
  )
}
