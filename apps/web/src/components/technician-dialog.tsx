'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import type { Colaborador } from '@/lib/supabase'
import { useZonas } from '@/hooks/use-supabase'

interface TechnicianDialogProps {
  empresaId: string
  colaborador?: Colaborador | null
  onSuccess?: () => void
  trigger?: React.ReactNode
  mode?: 'create' | 'edit' | 'view'
  onRequestEdit?: () => void
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
  hideTrigger?: boolean
}

export function TechnicianDialog({ empresaId, colaborador, onSuccess, trigger, mode = 'create', onRequestEdit, onOpenChange, defaultOpen, hideTrigger }: TechnicianDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localMode, setLocalMode] = useState<'create' | 'edit' | 'view'>(mode)
  const isView = localMode === 'view'
  // Abrir também quando colaborador mudar (para garantir reabertura em novos cliques)
  useEffect(() => { if (defaultOpen) setOpen(true) }, [defaultOpen])
  useEffect(() => {
    if (defaultOpen && colaborador) {
      setOpen(true)
    }
    setLocalMode(mode)
  }, [defaultOpen, colaborador?.id, mode])

  const handleChange = (field: string, value: string) => {
    if (isView) return
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Limita a 11 dígitos (DDD + 9 dígitos)
    const limited = numbers.slice(0, 11)
    
    // Aplica a máscara (99)99999-9999
    if (limited.length <= 2) {
      return limited
    } else if (limited.length <= 7) {
      return `(${limited.slice(0, 2)})${limited.slice(2)}`
    } else {
      return `(${limited.slice(0, 2)})${limited.slice(2, 7)}-${limited.slice(7)}`
    }
  }

  const formatWhatsApp = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Limita a 11 dígitos (DDD + 9 dígitos)
    const limited = numbers.slice(0, 11)
    
    // Aplica a máscara (99)99999-9999
    if (limited.length <= 2) {
      return limited
    } else if (limited.length <= 7) {
      return `(${limited.slice(0, 2)})${limited.slice(2)}`
    } else {
      return `(${limited.slice(0, 2)})${limited.slice(2, 7)}-${limited.slice(7)}`
    }
  }

  // Form state
  const [formData, setFormData] = useState({
    nome: colaborador?.nome || '',
    funcao: colaborador?.funcao || '',
    telefone: colaborador?.telefone ? formatPhone(colaborador.telefone) : '',
    whatsapp_numero: colaborador?.whatsapp_numero ? formatWhatsApp(colaborador.whatsapp_numero) : '',
  })

  // Estados para gerenciamento de zonas
  const [atendeTodasZonas, setAtendeTodasZonas] = useState(false)
  const [zonasSelecionadas, setZonasSelecionadas] = useState<string[]>([])
  const { zonas, loading: zonasLoading } = useZonas(empresaId)

  // Atualizar formData quando colaborador mudar
  useEffect(() => {
    if (colaborador) {
      setFormData({
        nome: colaborador.nome || '',
        funcao: colaborador.funcao || '',
        telefone: colaborador.telefone ? formatPhone(colaborador.telefone) : '',
        whatsapp_numero: colaborador.whatsapp_numero ? formatWhatsApp(colaborador.whatsapp_numero) : '',
      })
      // Carregar zonas do técnico
      loadTecnicoZonas()
    } else {
      setFormData({
        nome: '',
        funcao: '',
        telefone: '',
        whatsapp_numero: '',
      })
      setAtendeTodasZonas(false)
      setZonasSelecionadas([])
    }
  }, [colaborador?.id])

  // Carregar zonas do técnico
  const loadTecnicoZonas = async () => {
    if (!colaborador?.id) return
    
    try {
      const { createSupabaseBrowser } = await import('@/lib/supabase')
      const supabase = createSupabaseBrowser()
      
      // Buscar zonas_tecnicos
      const { data: zonasData, error } = await supabase
        .from('zonas_tecnicos')
        .select('zona_id')
        .eq('tecnico_id', colaborador.id)
      
      if (error) throw error
      
      const zonaIds = zonasData?.map(z => z.zona_id) || []
      setZonasSelecionadas(zonaIds)
      
      // Verificar se atende todas as zonas (campo no colaborador)
      const { data: colabData } = await supabase
        .from('colaboradores')
        .select('atende_todas_zonas')
        .eq('id', colaborador.id)
        .single()
      
      setAtendeTodasZonas(colabData?.atende_todas_zonas || false)
    } catch (error) {
      console.error('Erro ao carregar zonas do técnico:', error)
    }
  }

  // Accordions com persistência
  const [secPessoais, setSecPessoais] = useState(true)
  const [secContato, setSecContato] = useState(true)
  const [secZonas, setSecZonas] = useState(true)
  const key = (s: string) => `tech_dialog:${s}`
  useEffect(() => {
    if (!open) return
    try {
      setSecPessoais((localStorage.getItem(key('pessoais')) ?? '1') === '1')
      setSecContato((localStorage.getItem(key('contato')) ?? '1') === '1')
      setSecZonas((localStorage.getItem(key('zonas')) ?? '1') === '1')
    } catch {}
  }, [open])
  const persist = (name: string, val: boolean) => { try { localStorage.setItem(key(name), val ? '1' : '0') } catch {} }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isView) { setOpen(false); return }
    setLoading(true)

    try {
      const { createSupabaseBrowser } = await import('@/lib/supabase')
      const supabase = createSupabaseBrowser()

      // Validações básicas
      if (!formData.nome.trim()) {
        toast.error('Nome do técnico é obrigatório')
        setLoading(false)
        return
      }

      if (!formData.whatsapp_numero.trim()) {
        toast.error('Número do WhatsApp é obrigatório')
        setLoading(false)
        return
      }

      // Preparar dados
      const colaboradorData = {
        empresa_id: empresaId,
        nome: formData.nome.trim(),
        funcao: formData.funcao.trim() || null,
        telefone: formData.telefone.replace(/\D/g, '') || null, // Salva apenas números
        whatsapp_numero: formData.whatsapp_numero.replace(/\D/g, ''), // Salva apenas números
        ativo: true,
        atende_todas_zonas: atendeTodasZonas, // Novo campo
      }

      let colaboradorId: string

      if (localMode === 'edit' && colaborador) {
        // Atualizar colaborador
        const { error } = await supabase
          .from('colaboradores')
          .update(colaboradorData)
          .eq('id', colaborador.id)

        if (error) throw error

        colaboradorId = colaborador.id

        // Atualizar zonas - remover todas e recriar
        await supabase
          .from('zonas_tecnicos')
          .delete()
          .eq('tecnico_id', colaboradorId)

        if (!atendeTodasZonas && zonasSelecionadas.length > 0) {
          const zonasData = zonasSelecionadas.map(zonaId => ({
            zona_id: zonaId,
            tecnico_id: colaboradorId
          }))
          await supabase.from('zonas_tecnicos').insert(zonasData)
        }

        toast.success('Técnico atualizado com sucesso!')
        // Telemetry
        fetch('/api/telemetry/logsnag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: 'technicians', event: 'Technician Updated', icon: '✏️', tags: { tecnico_id: colaborador.id } }),
        }).catch(() => {})
      } else {
        // Criar novo colaborador
        const { data, error } = await supabase
          .from('colaboradores')
          .insert([colaboradorData])
          .select('id')
          .single()

        if (error) throw error

        colaboradorId = data.id

        // Criar zonas_tecnicos
        if (!atendeTodasZonas && zonasSelecionadas.length > 0) {
          const zonasData = zonasSelecionadas.map(zonaId => ({
            zona_id: zonaId,
            tecnico_id: colaboradorId
          }))
          await supabase.from('zonas_tecnicos').insert(zonasData)
        }

        toast.success('Técnico criado com sucesso!')
        // Telemetry
        fetch('/api/telemetry/logsnag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: 'technicians', event: 'Technician Created', icon: '👷', tags: { empresa_id: empresaId } }),
        }).catch(() => {})
      }

      setOpen(false)
      if (onSuccess) onSuccess()

      // Resetar form
      setFormData({
        nome: '',
        funcao: '',
        telefone: '',
        whatsapp_numero: '',
      })
    } catch (error) {
      console.error('Erro ao salvar técnico:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar técnico')
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
                  Novo Técnico
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
              <DialogTitle>{isView ? 'Visualizar Técnico' : (mode === 'edit' ? 'Editar Técnico' : 'Novo Técnico')}</DialogTitle>
              <DialogDescription>
                {isView ? 'Todos os campos estão desabilitados' : (mode === 'edit' ? 'Atualize as informações do técnico abaixo.' : 'Preencha os dados do novo técnico/colaborador abaixo.')}
              </DialogDescription>
            </div>
            {/* Removido botão Editar do header em modo visualização */}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Accordion type="multiple" value={[secPessoais ? 'pessoais' : '', secContato ? 'contato' : '', secZonas ? 'zonas' : ''].filter(Boolean) as string[]} onValueChange={(v) => {
            const set = new Set(v as string[])
            const p = set.has('pessoais'); const c = set.has('contato'); const z = set.has('zonas')
            setSecPessoais(p); setSecContato(c); setSecZonas(z); persist('pessoais', p); persist('contato', c); persist('zonas', z)
          }} className="w-full">
            <AccordionItem value="pessoais">
              <AccordionTrigger>Dados Pessoais</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">
                      Nome Completo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleChange('nome', e.target.value)}
                      placeholder="Ex: João Silva"
                      required
                      disabled={isView}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="funcao">Função/Cargo</Label>
                    <Input
                      id="funcao"
                      value={formData.funcao}
                      onChange={(e) => handleChange('funcao', e.target.value)}
                      placeholder="Ex: Técnico Sênior, Engenheiro"
                      disabled={isView}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="contato">
              <AccordionTrigger>Contato</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => handleChange('telefone', formatPhone(e.target.value))}
                      placeholder="(99)99999-9999"
                      maxLength={14}
                      disabled={isView}
                    />
                    <p className="text-xs text-muted-foreground">Formato: (DDD)Número</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_numero">
                      WhatsApp <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="whatsapp_numero"
                      value={formData.whatsapp_numero}
                      onChange={(e) => handleChange('whatsapp_numero', formatWhatsApp(e.target.value))}
                      placeholder="(99)99999-9999"
                      maxLength={14}
                      required
                      disabled={isView}
                    />
                    <p className="text-xs text-muted-foreground">
                      Formato: (DDD)Número
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="zonas">
              <AccordionTrigger>Zonas de Atendimento</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {/* Opção: Atende todas as zonas */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="atende_todas_zonas"
                      checked={atendeTodasZonas}
                      onCheckedChange={(checked) => {
                        setAtendeTodasZonas(checked as boolean)
                        if (checked) {
                          // Se marcar "todas", desmarca zonas específicas
                          setZonasSelecionadas([])
                        }
                      }}
                      disabled={isView}
                    />
                    <Label 
                      htmlFor="atende_todas_zonas" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Atende todas as zonas
                    </Label>
                  </div>

                  {/* Lista de zonas específicas */}
                  {!atendeTodasZonas && (
                    <div className="space-y-2">
                      <Label>Selecione as zonas específicas:</Label>
                      {zonasLoading ? (
                        <p className="text-sm text-muted-foreground">Carregando zonas...</p>
                      ) : zonas.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhuma zona cadastrada</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-md p-3">
                          {zonas.map((zona) => (
                            <div key={zona.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`zona-${zona.id}`}
                                checked={zonasSelecionadas.includes(zona.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setZonasSelecionadas([...zonasSelecionadas, zona.id])
                                  } else {
                                    setZonasSelecionadas(zonasSelecionadas.filter(id => id !== zona.id))
                                  }
                                }}
                                disabled={isView}
                              />
                              <Label
                                htmlFor={`zona-${zona.id}`}
                                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {zona.nome}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {atendeTodasZonas && (
                    <p className="text-sm text-muted-foreground italic">
                      Este técnico poderá atender ordens de serviço em qualquer zona da empresa.
                    </p>
                  )}
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
                  {loading ? 'Salvando...' : localMode === 'edit' ? 'Atualizar' : 'Criar Técnico'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
