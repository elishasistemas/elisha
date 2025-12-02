'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
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
  equipamentos?: Equipamento[]
  colaboradores: Colaborador[]
  onSuccess?: () => void
  trigger?: React.ReactNode
  mode?: 'create' | 'edit' | 'view'
  onRequestEdit?: () => void
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
  hideTrigger?: boolean
  defaultTipo?: 'preventiva' | 'corretiva' | 'emergencial' | 'chamado'
}

export function OrderDialog({ 
  empresaId, 
  ordem, 
  clientes, 
  equipamentos: allEquipamentos,
  colaboradores, 
  onSuccess, 
  trigger, 
  mode = 'create',
  onRequestEdit,
  onOpenChange,
  defaultOpen,
  hideTrigger,
  defaultTipo,
}: OrderDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localMode, setLocalMode] = useState<'create' | 'edit' | 'view'>(mode)
  const isView = localMode === 'view'
  // Abre o diálogo quando defaultOpen for true e também quando a ordem mudar
  useEffect(() => { if (defaultOpen) setOpen(true) }, [defaultOpen])
  useEffect(() => {
    if (defaultOpen && ordem) {
      setOpen(true)
    }
    // Garantir que o modo local reflita o prop ao abrir/alterar
    setLocalMode(mode)
  }, [defaultOpen, ordem?.id, mode])
  const [allChecklists, setAllChecklists] = useState<Checklist[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Checklist[]>([])
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    cliente_id: ordem?.cliente_id || '',
    equipamento_id: ordem?.equipamento_id || '',
    tecnico_id: ordem?.tecnico_id || '',
    tipo: ordem?.tipo || defaultTipo || 'preventiva',
    prioridade: ordem?.prioridade || 'media',
    status: ordem?.status || 'novo',
    data_programada: ordem?.data_programada ? ordem.data_programada.split('T')[0] : '',
    observacoes: ordem?.observacoes || '',
    numero_os: ordem?.numero_os || '',
    data_abertura: new Date().toISOString().slice(0,16),
    quem_solicitou: ordem?.quem_solicitou || '',
  })

  // Filtrar equipamentos do cliente selecionado
  const [equipamentosFiltrados, setEquipamentosFiltrados] = useState<Equipamento[]>([])
  
  // Sincronizar formData quando ordem muda (importante para refletir status atualizado)
  useEffect(() => {
    if (ordem) {
      setFormData({
        cliente_id: ordem.cliente_id || '',
        equipamento_id: ordem.equipamento_id || '',
        tecnico_id: ordem.tecnico_id || '',
        tipo: ordem.tipo || defaultTipo || 'preventiva',
        prioridade: ordem.prioridade || 'media',
        status: ordem.status || 'novo',
        data_programada: ordem.data_programada ? ordem.data_programada.split('T')[0] : '',
        observacoes: ordem.observacoes || '',
        numero_os: ordem.numero_os || '',
        data_abertura: ordem.data_abertura ? new Date(ordem.data_abertura).toISOString().slice(0,16) : new Date().toISOString().slice(0,16),
        quem_solicitou: ordem.quem_solicitou || '',
      })
    }
  }, [ordem?.id, ordem?.status, ordem?.tecnico_id, defaultTipo])
  
  // Accordion com persistência (shadcn)
  const accKey = (s: string) => `order_dialog:${s}`
  const [openSections, setOpenSections] = useState<string[]>(['cliente','detalhes','observacoes'])
  useEffect(() => {
    if (!open) return
    try {
      const saved = localStorage.getItem(accKey('open'))
      if (saved) setOpenSections(JSON.parse(saved))
    } catch {}
  }, [open])
  const onAccordionChange = (v: string[]) => {
    setOpenSections(v)
    try { localStorage.setItem(accKey('open'), JSON.stringify(v)) } catch {}
  }

  useEffect(() => {
    const loadEquip = async () => {
      if (!formData.cliente_id) { setEquipamentosFiltrados([]); return }
      try {
        const { createSupabaseBrowser } = await import('@/lib/supabase')
        const supabase = createSupabaseBrowser()
        
        // Buscar equipamentos via backend
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) throw new Error('Não autenticado')
        
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        const res = await fetch(`${BACKEND_URL}/api/v1/equipamentos?clienteId=${formData.cliente_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!res.ok) throw new Error('Erro ao buscar equipamentos')
        const result = await res.json()
        const list = (result.data || result || []) as Equipamento[]
        
        setEquipamentosFiltrados(list)
        // Auto-selecionar equipamento ao escolher o cliente no fluxo de criação
        // 1) Se havia um equipamento selecionado que não pertence ao novo cliente, troca para o primeiro disponível
        // 2) Se nenhum equipamento estiver selecionado e houver opções, seleciona a primeira
        if (!isView) {
          const existsInList = formData.equipamento_id && list.some(e => e.id === formData.equipamento_id)
          if (formData.equipamento_id && !existsInList) {
            setFormData(prev => ({ ...prev, equipamento_id: list.length > 0 ? list[0].id : '' }))
          } else if (!formData.equipamento_id && list.length > 0 && localMode === 'create') {
            setFormData(prev => ({ ...prev, equipamento_id: list[0].id }))
          }
        }
      } catch (err) {
        console.error('[OrderDialog] Erro ao carregar equipamentos:', err)
        setEquipamentosFiltrados([])
      }
    }
    loadEquip()
  }, [formData.cliente_id])

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
    if (isView) return
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isView) { setOpen(false); return }
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
        status: formData.status as 'novo' | 'em_deslocamento' | 'checkin' | 'em_andamento' | 'checkout' | 'aguardando_assinatura' | 'concluido' | 'cancelado' | 'parado' | 'reaberta',
        data_abertura: formData.data_abertura ? new Date(formData.data_abertura).toISOString() : new Date().toISOString(),
        data_programada: formData.data_programada ? new Date(formData.data_programada).toISOString() : null,
        observacoes: formData.observacoes?.trim() || null,
        numero_os: formData.numero_os.trim() || null,
        quem_solicitou: formData.quem_solicitou?.trim() || null,
        origem: 'painel' as const,
      }

      if (localMode === 'edit' && ordem) {
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
        data_abertura: new Date().toISOString().slice(0,16),
        quem_solicitou: '',
      })
    } catch (error) {
      console.error('Erro ao salvar ordem de serviço:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar ordem de serviço')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); onOpenChange?.(o) }}>
      {!hideTrigger && (
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
      )}
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>
                {isView 
                  ? (formData.numero_os || 'Ordem de Serviço sem número') 
                  : (mode === 'edit' ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço')
                }
              </DialogTitle>
              <DialogDescription>
                {isView ? 'Todos os campos estão desabilitados' : (mode === 'edit' ? 'Atualize as informações da ordem de serviço abaixo.' : 'Preencha os dados da nova ordem de serviço abaixo.')}
              </DialogDescription>
            </div>
            {/* Botão Editar removido do topo em modo visualização */}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cliente e Equipamento (Accordion) */}
          <Accordion type="multiple" value={openSections} onValueChange={onAccordionChange} className="w-full space-y-3">
            <AccordionItem value="cliente">
              <AccordionTrigger>Cliente e Equipamento</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cliente_id">Cliente <span className="text-destructive">*</span></Label>
                    <Select value={formData.cliente_id} onValueChange={(value) => handleChange('cliente_id', value)}>
                      <SelectTrigger disabled={isView}><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>{cliente.nome_local}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="equipamento_id">Equipamento <span className="text-destructive">*</span></Label>
                    <Select value={formData.equipamento_id} onValueChange={(value) => handleChange('equipamento_id', value)} disabled={!formData.cliente_id || isView}>
                      <SelectTrigger disabled={!formData.cliente_id || isView}><SelectValue placeholder={formData.cliente_id ? 'Selecione o equipamento' : 'Selecione um cliente primeiro'} /></SelectTrigger>
                      <SelectContent>
                        {equipamentosFiltrados.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">Nenhum equipamento disponível</div>
                        ) : (
                          equipamentosFiltrados.map((eq) => (
                            <SelectItem key={eq.id} value={eq.id}>{eq.tipo} - {eq.fabricante} {eq.modelo}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="detalhes">
              <AccordionTrigger>Detalhes da Ordem</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={formData.tipo} onValueChange={(value) => handleChange('tipo', value)}>
                  <SelectTrigger disabled={isView}>
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
                  <SelectTrigger disabled={isView}>
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
                  <SelectTrigger disabled={isView}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Nova</SelectItem>
                    <SelectItem value="em_deslocamento">Em Deslocamento</SelectItem>
                    <SelectItem value="checkin">No Local</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="checkout">Finalizado</SelectItem>
                    <SelectItem value="aguardando_assinatura">Aguardando Assinatura</SelectItem>
                    <SelectItem value="concluido">Concluída</SelectItem>
                    <SelectItem value="cancelado">Cancelada</SelectItem>
                    <SelectItem value="parado">Parado</SelectItem>
                    <SelectItem value="reaberta">Reaberta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="tecnico_id">Técnico Responsável</Label>
                <Select
                  value={formData.tecnico_id || '__none__'}
                  onValueChange={(value) => handleChange('tecnico_id', value === '__none__' ? '' : value)}
                >
                  <SelectTrigger disabled={isView}>
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
                  disabled={isView}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_abertura">Data/Hora Abertura</Label>
                <Input
                  id="data_abertura"
                  type="datetime-local"
                  value={formData.data_abertura}
                  onChange={(e) => handleChange('data_abertura', e.target.value)}
                  disabled={isView}
                />
              </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="numero_os">Número da OS (opcional)</Label>
                  <Input
                    id="numero_os"
                    value={formData.numero_os}
                    onChange={(e) => handleChange('numero_os', e.target.value)}
                    placeholder="Ex: OS-2024-001"
                    disabled={isView}
                  />
                </div>
                <div className="space-y-2 mt-2">
              <Label htmlFor="quem_solicitou">Quem solicitou o atendimento</Label>
              <Input
                id="quem_solicitou"
                value={formData.quem_solicitou}
                onChange={(e) => handleChange('quem_solicitou', e.target.value)}
                placeholder="Nome de quem solicitou"
                disabled={isView}
              />
                </div>
              </AccordionContent>
            </AccordionItem>

          {/* Checklist Template (Create mode) */}
          {mode === 'create' && !isView && (
            <AccordionItem value="checklist">
              <AccordionTrigger>Checklist</AccordionTrigger>
              <AccordionContent>
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
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Observações */}
          <AccordionItem value="observacoes">
            <AccordionTrigger>Observações</AccordionTrigger>
            <AccordionContent>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Descrição do Problema/Serviço</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                placeholder="Descreva o problema, serviço a ser realizado, ou observações relevantes..."
                rows={4}
                disabled={isView}
              />
            </div>
            </AccordionContent>
          </AccordionItem>
          </Accordion>

          <DialogFooter>
            {isView ? (
              <>
                <Button type="button" variant="outline" onClick={() => { setOpen(false); onOpenChange?.(false) }}>Fechar</Button>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onRequestEdit) onRequestEdit(); else setLocalMode('edit')
                  }}
                >
                  Editar
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => { setOpen(false); onOpenChange?.(false) }} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : localMode === 'edit' ? 'Atualizar' : 'Criar Ordem'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
