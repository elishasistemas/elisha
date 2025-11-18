'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import type { Colaborador } from '@/lib/supabase'

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

  // Form state
  const [formData, setFormData] = useState({
    nome: colaborador?.nome || '',
    funcao: colaborador?.funcao || '',
    telefone: colaborador?.telefone || '',
    whatsapp_numero: colaborador?.whatsapp_numero || '',
  })

  // Accordions com persistência
  const [secPessoais, setSecPessoais] = useState(true)
  const [secContato, setSecContato] = useState(true)
  const key = (s: string) => `tech_dialog:${s}`
  useEffect(() => {
    if (!open) return
    try {
      setSecPessoais((localStorage.getItem(key('pessoais')) ?? '1') === '1')
      setSecContato((localStorage.getItem(key('contato')) ?? '1') === '1')
    } catch {}
  }, [open])
  const persist = (name: string, val: boolean) => { try { localStorage.setItem(key(name), val ? '1' : '0') } catch {} }

  const handleChange = (field: string, value: string) => {
    if (isView) return
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
    }
    return value
  }

  const formatWhatsApp = (value: string) => {
    // WhatsApp format: 5581998765432 (country code + area code + number)
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 13) {
      return numbers
    }
    return value
  }

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
        telefone: formData.telefone.trim() || null,
        whatsapp_numero: formData.whatsapp_numero.replace(/\D/g, ''), // Apenas números
        ativo: true,
      }

      if (localMode === 'edit' && colaborador) {
        // Atualizar colaborador
        const { error } = await supabase
          .from('colaboradores')
          .update(colaboradorData)
          .eq('id', colaborador.id)

        if (error) throw error

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

        if (error) throw error

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
          <Accordion type="multiple" value={[secPessoais ? 'pessoais' : '', secContato ? 'contato' : ''].filter(Boolean) as string[]} onValueChange={(v) => {
            const set = new Set(v as string[])
            const p = set.has('pessoais'); const c = set.has('contato')
            setSecPessoais(p); setSecContato(c); persist('pessoais', p); persist('contato', c)
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
                      placeholder="(00) 00000-0000"
                      disabled={isView}
                    />
                    <p className="text-xs text-muted-foreground">Telefone comercial ou pessoal</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_numero">
                      WhatsApp <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="whatsapp_numero"
                      value={formData.whatsapp_numero}
                      onChange={(e) => handleChange('whatsapp_numero', formatWhatsApp(e.target.value))}
                      placeholder="5581998765432"
                      required
                      disabled={isView}
                    />
                    <p className="text-xs text-muted-foreground">
                      Apenas números: código do país (55) + DDD + número
                    </p>
                  </div>
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
