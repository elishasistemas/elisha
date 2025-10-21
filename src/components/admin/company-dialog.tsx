'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface Company {
  id?: string
  nome: string
  cnpj?: string | null
  telefone?: string | null
  email?: string | null
  ativo: boolean
}

interface CompanyDialogProps {
  company?: Company | null
  onClose: () => void
}

export function CompanyDialog({ company, onClose }: CompanyDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Company>({
    nome: '',
    cnpj: null,
    telefone: null,
    email: null,
    ativo: true,
  })

  const supabase = createSupabaseBrowser()

  useEffect(() => {
    if (company) {
      setFormData(company)
    }
  }, [company])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome) {
      toast.error('Nome é obrigatório')
      return
    }

    try {
      setLoading(true)

      if (company?.id) {
        // Atualizar
        const { error } = await supabase
          .from('empresas')
          .update({
            nome: formData.nome,
            cnpj: formData.cnpj || null,
            telefone: formData.telefone || null,
            email: formData.email || null,
            ativo: formData.ativo,
          })
          .eq('id', company.id)

        if (error) throw error
        toast.success('Empresa atualizada com sucesso')
      } else {
        // Criar
        const { error } = await supabase
          .from('empresas')
          .insert({
            nome: formData.nome,
            cnpj: formData.cnpj || null,
            telefone: formData.telefone || null,
            email: formData.email || null,
            ativo: formData.ativo,
          })

        if (error) throw error
        toast.success('Empresa criada com sucesso')
      }

      onClose()
    } catch (error: any) {
      console.error('[company-dialog] Erro:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {company ? 'Editar Empresa' : 'Nova Empresa'}
            </DialogTitle>
            <DialogDescription>
              {company 
                ? 'Edite as informações da empresa' 
                : 'Cadastre uma nova empresa cliente'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome da empresa"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj || ''}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contato@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone || ''}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Empresa Ativa</Label>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : company ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

