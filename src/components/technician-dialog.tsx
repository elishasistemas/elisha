'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
  mode?: 'create' | 'edit'
}

export function TechnicianDialog({ empresaId, colaborador, onSuccess, trigger, mode = 'create' }: TechnicianDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    nome: colaborador?.nome || '',
    funcao: colaborador?.funcao || '',
    telefone: colaborador?.telefone || '',
    whatsapp_numero: colaborador?.whatsapp_numero || '',
  })

  const handleChange = (field: string, value: string) => {
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

      if (mode === 'edit' && colaborador) {
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
                Novo Técnico
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-full max-w-[80%]">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Editar Técnico' : 'Novo Técnico'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Atualize as informações do técnico abaixo.' 
              : 'Preencha os dados do novo técnico/colaborador abaixo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados Básicos */}
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="funcao">Função/Cargo</Label>
              <Input
                id="funcao"
                value={formData.funcao}
                onChange={(e) => handleChange('funcao', e.target.value)}
                placeholder="Ex: Técnico Sênior, Engenheiro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleChange('telefone', formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
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
              />
              <p className="text-xs text-muted-foreground">
                Apenas números: código do país (55) + DDD + número
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : mode === 'edit' ? 'Atualizar' : 'Criar Técnico'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
