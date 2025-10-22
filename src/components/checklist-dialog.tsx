'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2, Trash2, MoveUp, MoveDown, CheckSquare } from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Checklist, ChecklistItem, TipoServico, OrigemChecklist, TipoItem } from '@/types/checklist'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

interface ChecklistDialogProps {
  empresaId: string
  checklist?: Checklist
  mode?: 'create' | 'edit'
  onSuccess?: () => void
  trigger?: React.ReactNode
}

const tipoServicoOptions: { value: TipoServico; label: string }[] = [
  { value: 'preventiva', label: 'Preventiva' },
  { value: 'corretiva', label: 'Corretiva' },
  { value: 'emergencial', label: 'Emergencial' },
  { value: 'chamado', label: 'Chamado' },
  { value: 'todos', label: 'Todos os Tipos' },
]

const origemOptions: { value: OrigemChecklist; label: string }[] = [
  { value: 'custom', label: 'Personalizado' },
  { value: 'elisha', label: 'Elisha Padrão' },
  { value: 'abnt', label: 'ABNT' },
]

const tipoItemOptions: { value: TipoItem; label: string }[] = [
  { value: 'boolean', label: 'Sim/Não' },
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'leitura', label: 'Leitura (Medição)' },
  { value: 'photo', label: 'Foto' },
  { value: 'signature', label: 'Assinatura' },
]

export function ChecklistDialog({
  empresaId,
  checklist,
  mode = 'create',
  onSuccess,
  trigger,
}: ChecklistDialogProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [nome, setNome] = useState('')
  const [tipoServico, setTipoServico] = useState<TipoServico>('preventiva')
  const [origem, setOrigem] = useState<OrigemChecklist>('custom')
  const [abntRefs, setAbntRefs] = useState('')
  const [itens, setItens] = useState<ChecklistItem[]>([])

  const supabase = createSupabaseBrowser()

  // Load existing data when editing
  useEffect(() => {
    if (open && checklist && mode === 'edit') {
      setNome(checklist.nome)
      setTipoServico(checklist.tipo_servico)
      setOrigem(checklist.origem)
      setAbntRefs(checklist.abnt_refs.join(', '))
      setItens(checklist.itens)
    } else if (open && mode === 'create') {
      resetForm()
    }
  }, [open, checklist, mode])

  const resetForm = () => {
    setNome('')
    setTipoServico('preventiva')
    setOrigem('custom')
    setAbntRefs('')
    setItens([])
  }

  const addItem = () => {
    const newItem: ChecklistItem = {
      ordem: itens.length + 1,
      secao: 'Geral',
      descricao: '',
      tipo: 'boolean',
      obrigatorio: false,
      critico: false,
      abnt_refs: []
    }
    setItens([...itens, newItem])
  }

  const removeItem = (index: number) => {
    const newItens = itens.filter((_, i) => i !== index)
    // Reorder
    newItens.forEach((item, i) => {
      item.ordem = i + 1
    })
    setItens(newItens)
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === itens.length - 1)
    ) {
      return
    }

    const newItens = [...itens]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newItens[index], newItens[targetIndex]] = [newItens[targetIndex], newItens[index]]
    
    // Reorder
    newItens.forEach((item, i) => {
      item.ordem = i + 1
    })
    
    setItens(newItens)
  }

  const updateItem = (index: number, updates: Partial<ChecklistItem>) => {
    const newItens = [...itens]
    newItens[index] = { ...newItens[index], ...updates }
    setItens(newItens)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    if (itens.length === 0) {
      toast.error('Adicione pelo menos um item ao checklist')
      return
    }

    try {
      setSaving(true)

      const data = {
        empresa_id: empresaId,
        nome: nome.trim(),
        tipo_servico: tipoServico,
        origem,
        abnt_refs: abntRefs.split(',').map(r => r.trim()).filter(r => r.length > 0),
        itens,
        ativo: true,
        versao: mode === 'edit' ? (checklist?.versao || 1) + 1 : 1,
      }

      let error

      if (mode === 'edit' && checklist) {
        const result = await supabase
          .from('checklists')
          .update(data)
          .eq('id', checklist.id)
        error = result.error
      } else {
        const result = await supabase
          .from('checklists')
          .insert(data)
        error = result.error
      }

      if (error) throw error

      toast.success(
        mode === 'edit' 
          ? 'Checklist atualizado com sucesso' 
          : 'Checklist criado com sucesso'
      )
      
      setOpen(false)
      resetForm()
      onSuccess?.()
    } catch (error) {
      console.error('Error saving checklist:', error)
      toast.error('Erro ao salvar checklist')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Checklist
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Editar Checklist' : 'Novo Checklist'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Atualize as informações do checklist. A versão será incrementada automaticamente.'
              : 'Crie um template de checklist para usar em ordens de serviço.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4">
            <div>
              <Label htmlFor="nome">Nome do Checklist *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Manutenção Preventiva - Elevador"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo de Serviço *</Label>
                <Select value={tipoServico} onValueChange={(v) => setTipoServico(v as TipoServico)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoServicoOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="origem">Origem *</Label>
                <Select value={origem} onValueChange={(v) => setOrigem(v as OrigemChecklist)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {origemOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="abnt">Referências ABNT (separadas por vírgula)</Label>
              <Input
                id="abnt"
                value={abntRefs}
                onChange={(e) => setAbntRefs(e.target.value)}
                placeholder="Ex: NBR 16083, NBR 5666"
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Itens do Checklist *</Label>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            {itens.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum item adicionado</p>
                  <p className="text-sm">Clique em &quot;Adicionar Item&quot; para começar</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {itens.map((item, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-muted-foreground">#{item.ordem}</span>
                          {item.critico && <Badge variant="destructive">Crítico</Badge>}
                          {item.obrigatorio && <Badge variant="outline">Obrigatório</Badge>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => moveItem(index, 'up')}
                            disabled={index === 0}
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => moveItem(index, 'down')}
                            disabled={index === itens.length - 1}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Seção</Label>
                          <Input
                            value={item.secao}
                            onChange={(e) => updateItem(index, { secao: e.target.value })}
                            placeholder="Ex: Segurança"
                            size={32}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Tipo</Label>
                          <Select
                            value={item.tipo}
                            onValueChange={(v) => updateItem(index, { tipo: v as TipoItem })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {tipoItemOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Descrição</Label>
                        <Textarea
                          value={item.descricao}
                          onChange={(e) => updateItem(index, { descricao: e.target.value })}
                          placeholder="Descreva o que deve ser verificado"
                          rows={2}
                        />
                      </div>

                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={item.obrigatorio}
                            onChange={(e) => updateItem(index, { obrigatorio: e.target.checked })}
                            className="rounded"
                          />
                          Obrigatório
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={item.critico}
                            onChange={(e) => updateItem(index, { critico: e.target.checked })}
                            className="rounded"
                          />
                          Crítico
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : mode === 'edit' ? (
                'Atualizar'
              ) : (
                'Criar Checklist'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
