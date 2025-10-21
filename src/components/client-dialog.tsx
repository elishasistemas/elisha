'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import type { Cliente } from '@/lib/supabase'

interface ClientDialogProps {
  empresaId: string
  cliente?: Cliente | null
  onSuccess?: () => void
  trigger?: React.ReactNode
  mode?: 'create' | 'edit'
}

export function ClientDialog({ empresaId, cliente, onSuccess, trigger, mode = 'create' }: ClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    nome_local: cliente?.nome_local || '',
    cnpj: cliente?.cnpj || '',
    endereco_completo: cliente?.endereco_completo || '',
    responsavel_nome: cliente?.responsavel_nome || '',
    responsavel_telefone: cliente?.responsavel_telefone || '',
    responsavel_email: cliente?.responsavel_email || '',
    data_inicio_contrato: cliente?.data_inicio_contrato || '',
    data_fim_contrato: cliente?.data_fim_contrato || '',
    status_contrato: cliente?.status_contrato || 'ativo',
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return value
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { createSupabaseBrowser } = await import('@/lib/supabase')
      const supabase = createSupabaseBrowser()

      // Validações básicas
      if (!formData.nome_local.trim()) {
        toast.error('Nome do cliente é obrigatório')
        setLoading(false)
        return
      }

      if (!formData.cnpj.trim()) {
        toast.error('CNPJ é obrigatório')
        setLoading(false)
        return
      }

      // Preparar dados
      const clienteData = {
        empresa_id: empresaId,
        nome_local: formData.nome_local.trim(),
        cnpj: formData.cnpj.trim(),
        endereco_completo: formData.endereco_completo.trim() || null,
        responsavel_nome: formData.responsavel_nome.trim() || null,
        responsavel_telefone: formData.responsavel_telefone.trim() || null,
        responsavel_email: formData.responsavel_email.trim() || null,
        data_inicio_contrato: formData.data_inicio_contrato || null,
        data_fim_contrato: formData.data_fim_contrato || null,
        status_contrato: formData.status_contrato as 'ativo' | 'em_renovacao' | 'encerrado',
      }

      if (mode === 'edit' && cliente) {
        // Atualizar cliente
        const { error } = await supabase
          .from('clientes')
          .update(clienteData)
          .eq('id', cliente.id)

        if (error) throw error

        toast.success('Cliente atualizado com sucesso!')
      } else {
        // Criar novo cliente
        const { error } = await supabase
          .from('clientes')
          .insert([clienteData])

        if (error) throw error

        toast.success('Cliente criado com sucesso!')
      }

      setOpen(false)
      if (onSuccess) onSuccess()

      // Resetar form
      setFormData({
        nome_local: '',
        cnpj: '',
        endereco_completo: '',
        responsavel_nome: '',
        responsavel_telefone: '',
        responsavel_email: '',
        data_inicio_contrato: '',
        data_fim_contrato: '',
        status_contrato: 'ativo',
      })
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar cliente')
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
                Novo Cliente
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Atualize as informações do cliente abaixo.' 
              : 'Preencha os dados do novo cliente abaixo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados Básicos */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Dados Básicos</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="nome_local">
                  Nome/Razão Social <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome_local"
                  value={formData.nome_local}
                  onChange={(e) => handleChange('nome_local', e.target.value)}
                  placeholder="Ex: Empresa ABC Ltda"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">
                  CNPJ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => handleChange('cnpj', formatCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status_contrato">Status do Contrato</Label>
                <Select value={formData.status_contrato} onValueChange={(value) => handleChange('status_contrato', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="em_renovacao">Em Renovação</SelectItem>
                    <SelectItem value="encerrado">Encerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco_completo">Endereço Completo</Label>
              <Textarea
                id="endereco_completo"
                value={formData.endereco_completo}
                onChange={(e) => handleChange('endereco_completo', e.target.value)}
                placeholder="Rua, número, complemento, bairro, cidade, estado, CEP"
                rows={2}
              />
            </div>
          </div>

          {/* Dados do Responsável */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Responsável</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="responsavel_nome">Nome do Responsável</Label>
                <Input
                  id="responsavel_nome"
                  value={formData.responsavel_nome}
                  onChange={(e) => handleChange('responsavel_nome', e.target.value)}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel_telefone">Telefone</Label>
                <Input
                  id="responsavel_telefone"
                  value={formData.responsavel_telefone}
                  onChange={(e) => handleChange('responsavel_telefone', formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel_email">E-mail</Label>
                <Input
                  id="responsavel_email"
                  type="email"
                  value={formData.responsavel_email}
                  onChange={(e) => handleChange('responsavel_email', e.target.value)}
                  placeholder="responsavel@empresa.com"
                />
              </div>
            </div>
          </div>

          {/* Dados do Contrato */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Contrato</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_inicio_contrato">Data de Início</Label>
                <Input
                  id="data_inicio_contrato"
                  type="date"
                  value={formData.data_inicio_contrato}
                  onChange={(e) => handleChange('data_inicio_contrato', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_fim_contrato">Data de Término</Label>
                <Input
                  id="data_fim_contrato"
                  type="date"
                  value={formData.data_fim_contrato}
                  onChange={(e) => handleChange('data_fim_contrato', e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : mode === 'edit' ? 'Atualizar' : 'Criar Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

