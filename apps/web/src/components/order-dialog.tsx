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
import { createSupabaseBrowser } from '@/lib/supabase'
import type { OrdemServico, Cliente, Equipamento, Colaborador } from '@/lib/supabase'

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
  const supabase = createSupabaseBrowser()
  // Abre o diálogo quando defaultOpen for true e também quando a ordem mudar
  useEffect(() => { if (defaultOpen) setOpen(true) }, [defaultOpen])
  useEffect(() => {
    if (defaultOpen && ordem) {
      setOpen(true)
    }
    // Garantir que o modo local reflita o prop ao abrir/alterar
    setLocalMode(mode)
  }, [defaultOpen, ordem?.id, mode])

  // Form state
  const [formData, setFormData] = useState({
    cliente_id: ordem?.cliente_id || '',
    equipamento_id: ordem?.equipamento_id || '',
    tecnico_id: ordem?.tecnico_id || '',
    tipo: ordem?.tipo || defaultTipo || 'preventiva',
    prioridade: ordem?.prioridade || 'media',
    observacoes: ordem?.observacoes || '',
    data_abertura: new Date().toISOString().slice(0,16),
    quem_solicitou: ordem?.quem_solicitou || '',
  })

  // Filtrar equipamentos do cliente selecionado
  const [equipamentosFiltrados, setEquipamentosFiltrados] = useState<Equipamento[]>([])
  
  // Sincronizar formData quando ordem muda (importante para refletir dados atualizados)
  useEffect(() => {
    if (ordem) {
      setFormData({
        cliente_id: ordem.cliente_id || '',
        equipamento_id: ordem.equipamento_id || '',
        tecnico_id: ordem.tecnico_id || '',
        tipo: ordem.tipo || defaultTipo || 'preventiva',
        prioridade: ordem.prioridade || 'media',
        observacoes: ordem.observacoes || '',
        data_abertura: ordem.data_abertura ? new Date(ordem.data_abertura).toISOString().slice(0,16) : new Date().toISOString().slice(0,16),
        quem_solicitou: ordem.quem_solicitou || '',
      })
    }
  }, [ordem?.id, ordem?.tecnico_id, defaultTipo])
  
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
        
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
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

      // Preparar dados (numero_os será gerado automaticamente no backend)
      const ordemData = {
        empresa_id: empresaId,
        cliente_id: formData.cliente_id,
        equipamento_id: formData.equipamento_id,
        tecnico_id: formData.tecnico_id || null,
        tipo: formData.tipo as 'preventiva' | 'corretiva' | 'emergencial' | 'chamado',
        prioridade: formData.prioridade as 'alta' | 'media' | 'baixa',
        status: 'novo' as const,
        data_abertura: formData.data_abertura ? new Date(formData.data_abertura).toISOString() : new Date().toISOString(),
        observacoes: formData.observacoes?.trim() || null,
        quem_solicitou: formData.quem_solicitou?.trim() || null,
        origem: 'painel' as const,
      }

      // Pegar token de autenticação
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        toast.error('Sessão expirada. Por favor, faça login novamente.')
        return
      }

      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

      if (localMode === 'edit' && ordem) {
        // Atualizar ordem via backend
        const res = await fetch(`${BACKEND_URL}/api/v1/ordens-servico/${ordem.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(ordemData)
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: 'Erro ao atualizar ordem' }))
          throw new Error(errorData.message || 'Erro ao atualizar ordem')
        }

        toast.success('Ordem de serviço atualizada com sucesso!')
        // Telemetry
        fetch('/api/telemetry/logsnag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: 'orders', event: 'Order Updated', icon: '✏️', tags: { os_id: ordem.id } }),
        }).catch(() => {})
      } else {
        // Criar nova ordem via backend
        const res = await fetch(`${BACKEND_URL}/api/v1/ordens-servico`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(ordemData)
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: 'Erro ao criar ordem' }))
          throw new Error(errorData.message || 'Erro ao criar ordem')
        }

        const data = await res.json()

        toast.success('Ordem de serviço criada com sucesso!')
        // Telemetry
        if (data?.id) {
          fetch('/api/telemetry/logsnag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel: 'orders', event: 'Order Created', icon: '🆕', tags: { os_id: data.id } }),
          }).catch(() => {})
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
        observacoes: '',
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
                  ? (ordem?.numero_os || 'Ordem de Serviço') 
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
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div className="space-y-2 mt-4">
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
                {ordem && (
                  <div className="space-y-2 mt-4">
                    <Label>Número da OS</Label>
                    <div className="p-2 bg-muted rounded-md text-sm font-mono">
                      {ordem.numero_os || '(Será gerado automaticamente)'}
                    </div>
                  </div>
                )}
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
