'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import type { OrdemServico, Cliente, Equipamento, Colaborador } from '@/lib/supabase'
import type { Checklist } from '@/types/checklist'

interface OrderDialogProps {
  empresaId: string
  ordem?: OrdemServico | null
  clientes: Cliente[]
  equipamentos: Equipamento[]
  colaboradores: Colaborador[]
  onSuccess?: () => void
  trigger?: React.ReactNode
  mode?: 'create' | 'edit'
}

export function OrderDialog({ 
  empresaId, 
  ordem, 
  clientes, 
  equipamentos: allEquipamentos,
  colaboradores, 
  onSuccess, 
  trigger, 
  mode = 'create' 
}: OrderDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [allChecklists, setAllChecklists] = useState<Checklist[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Checklist[]>([])
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    cliente_id: ordem?.cliente_id || '',
    equipamento_id: ordem?.equipamento_id || '',
    tecnico_id: ordem?.tecnico_id || '',
    tipo: ordem?.tipo || 'preventiva',
    prioridade: ordem?.prioridade || 'media',
    status: ordem?.status || 'novo',
    data_programada: ordem?.data_programada ? ordem.data_programada.split('T')[0] : '',
    observacoes: ordem?.observacoes || '',
    numero_os: ordem?.numero_os || '',
  })

  // Filtrar equipamentos do cliente selecionado
  const [equipamentosFiltrados, setEquipamentosFiltrados] = useState<Equipamento[]>([])

  useEffect(() => {
    if (formData.cliente_id) {
      const equipamentos = allEquipamentos.filter(e => e.cliente_id === formData.cliente_id)
      setEquipamentosFiltrados(equipamentos)
      
      // Se o equipamento selecionado não pertence ao cliente, limpar
      if (formData.equipamento_id && !equipamentos.some(e => e.id === formData.equipamento_id)) {
        setFormData(prev => ({ ...prev, equipamento_id: '' }))
      }
    } else {
      setEquipamentosFiltrados([])
    }
  }, [formData.cliente_id, allEquipamentos, formData.equipamento_id])

  // Load checklists when dialog opens (create mode)
  useEffect(() => {
    const load = async () => {
      try {
        const { createSupabaseBrowser } = await import('@/lib/supabase')
        const supabase = createSupabaseBrowser()
        const { data, error } = await supabase
          .from('checklists')
          .select('*')
          .eq('empresa_id', empresaId)
          .eq('ativo', true)
          .order('created_at', { ascending: false })
        if (error) throw error
        setAllChecklists(data || [])
      } catch (err) {
        console.error('[OrderDialog] Erro ao carregar templates:', err)
      }
    }
    if (open) load()
  }, [open, empresaId])

  // Filter templates by OS type and auto-select default
  useEffect(() => {
    const tipo = formData.tipo as Checklist['tipo_servico']
    const list = allChecklists.filter(c => c.tipo_servico === tipo || c.tipo_servico === 'todos')
    setFilteredTemplates(list)
    if (!selectedChecklistId) {
      const preferred = list.find(c => c.tipo_servico === tipo) || list[0] || null
      setSelectedChecklistId(preferred ? preferred.id : null)
    } else {
      // Ensure currently selected is in filtered list; otherwise, switch
      if (!list.some(c => c.id === selectedChecklistId)) {
        const preferred = list.find(c => c.tipo_servico === tipo) || list[0] || null
        setSelectedChecklistId(preferred ? preferred.id : null)
      }
    }
  }, [allChecklists, formData.tipo, selectedChecklistId])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { createSupabaseBrowser } = await import('@/lib/supabase')
      const supabase = createSupabaseBrowser()

      // Validações básicas
      if (!formData.cliente_id) {
        toast.error('Selecione um cliente')
        setLoading(false)
        return
      }

      if (!formData.equipamento_id) {
        toast.error('Selecione um equipamento')
        setLoading(false)
        return
      }

      // Preparar dados
      const ordemData = {
        empresa_id: empresaId,
        cliente_id: formData.cliente_id,
        equipamento_id: formData.equipamento_id,
        tecnico_id: formData.tecnico_id || null,
        tipo: formData.tipo as 'preventiva' | 'corretiva' | 'emergencial' | 'chamado',
        prioridade: formData.prioridade as 'alta' | 'media' | 'baixa',
        status: formData.status as 'novo' | 'em_andamento' | 'aguardando_assinatura' | 'concluido' | 'cancelado' | 'parado',
        data_abertura: new Date().toISOString(),
        data_programada: formData.data_programada ? new Date(formData.data_programada).toISOString() : null,
        observacoes: formData.observacoes.trim() || null,
        numero_os: formData.numero_os.trim() || null,
        origem: 'painel' as const,
      }

      if (mode === 'edit' && ordem) {
        // Atualizar ordem
        const { error } = await supabase
          .from('ordens_servico')
          .update(ordemData)
          .eq('id', ordem.id)

        if (error) throw error

        toast.success('Ordem de serviço atualizada com sucesso!')
        // Telemetry
        fetch('/api/telemetry/logsnag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: 'orders', event: 'Order Updated', icon: '✏️', tags: { os_id: ordem.id } }),
        }).catch(() => {})
      } else {
        // Criar nova ordem
        const { data, error } = await supabase
          .from('ordens_servico')
          .insert([ordemData])
          .select('id')
          .single()

        if (error) throw error

        toast.success('Ordem de serviço criada com sucesso!')
        // Telemetry
        if (data?.id) {
          fetch('/api/telemetry/logsnag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel: 'orders', event: 'Order Created', icon: '🆕', tags: { os_id: data.id } }),
          }).catch(() => {})
        }

        // Vincular checklist template (opcional)
        if (data?.id && selectedChecklistId) {
          try {
            const resp = await fetch(`/api/os/${data.id}/start-checklist`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ checklistId: selectedChecklistId })
            })
            if (resp.ok) {
              toast.success('Checklist vinculado à OS')
              // Telemetry
              fetch('/api/telemetry/logsnag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channel: 'orders', event: 'Checklist Linked', icon: '🧩', tags: { os_id: data?.id, checklist_id: selectedChecklistId } }),
              }).catch(() => {})
            } else {
              console.warn('Falha ao iniciar checklist para OS')
            }
          } catch (e) {
            console.warn('Erro ao iniciar checklist para OS', e)
          }
        }
      }

      setOpen(false)
      if (onSuccess) onSuccess()

      // Resetar form
      setFormData({
        cliente_id: '',
        equipamento_id: '',
        tecnico_id: '',
        tipo: 'preventiva',
        prioridade: 'media',
        status: 'novo',
        data_programada: '',
        observacoes: '',
        numero_os: '',
      })
    } catch (error) {
      console.error('Erro ao salvar ordem de serviço:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar ordem de serviço')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            {mode === 'edit' ? (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Nova Ordem
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-full max-w-[80%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Atualize as informações da ordem de serviço abaixo.' 
              : 'Preencha os dados da nova ordem de serviço abaixo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cliente e Equipamento */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Cliente e Equipamento</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cliente_id">
                  Cliente <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.cliente_id} onValueChange={(value) => handleChange('cliente_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome_local}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipamento_id">
                  Equipamento <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={formData.equipamento_id} 
                  onValueChange={(value) => handleChange('equipamento_id', value)}
                  disabled={!formData.cliente_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.cliente_id ? "Selecione o equipamento" : "Selecione um cliente primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {equipamentosFiltrados.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">Nenhum equipamento disponível</div>
                    ) : (
                      equipamentosFiltrados.map((eq) => (
                        <SelectItem key={eq.id} value={eq.id}>
                          {eq.tipo} - {eq.fabricante} {eq.modelo}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Detalhes da OS */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Detalhes da Ordem</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={formData.tipo} onValueChange={(value) => handleChange('tipo', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventiva">Preventiva</SelectItem>
                    <SelectItem value="corretiva">Corretiva</SelectItem>
                    <SelectItem value="emergencial">Emergencial</SelectItem>
                    <SelectItem value="chamado">Chamado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select value={formData.prioridade} onValueChange={(value) => handleChange('prioridade', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Nova</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="aguardando_assinatura">Aguardando Assinatura</SelectItem>
                    <SelectItem value="parado">Parado</SelectItem>
                    <SelectItem value="concluido">Concluída</SelectItem>
                    <SelectItem value="cancelado">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tecnico_id">Técnico Responsável</Label>
                <Select
                  value={formData.tecnico_id || '__none__'}
                  onValueChange={(value) => handleChange('tecnico_id', value === '__none__' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum técnico atribuído" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {colaboradores.filter(c => c.ativo).map((tecnico) => (
                      <SelectItem key={tecnico.id} value={tecnico.id}>
                        {tecnico.nome} {tecnico.funcao ? `(${tecnico.funcao})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_programada">Data Programada</Label>
                <Input
                  id="data_programada"
                  type="date"
                  value={formData.data_programada}
                  onChange={(e) => handleChange('data_programada', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_os">Número da OS (opcional)</Label>
              <Input
                id="numero_os"
                value={formData.numero_os}
                onChange={(e) => handleChange('numero_os', e.target.value)}
                placeholder="Ex: OS-2024-001"
              />
            </div>
          </div>

          {/* Checklist Template (Create mode) */}
          {mode === 'create' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Checklist</h3>
              <div className="space-y-2">
                <Label htmlFor="checklist_id">Template sugerido pelo tipo</Label>
                <Select
                  value={selectedChecklistId || '__none__'}
                  onValueChange={(value) => setSelectedChecklistId(value === '__none__' ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filteredTemplates.length ? 'Selecione o template' : 'Nenhum template disponível'} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTemplates.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">Nenhum template encontrado para este tipo</div>
                    ) : (
                      filteredTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nome} · v{t.versao} · {t.origem === 'abnt' ? 'ABNT' : t.origem === 'elisha' ? 'Elisha' : 'Personalizado'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecionamos automaticamente com base no tipo da OS. Você pode trocar se preferir.
                </p>
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Observações</h3>
            
            <div className="space-y-2">
              <Label htmlFor="observacoes">Descrição do Problema/Serviço</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                placeholder="Descreva o problema, serviço a ser realizado, ou observações relevantes..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : mode === 'edit' ? 'Atualizar' : 'Criar Ordem'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
