'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useZonas } from '@/hooks/use-supabase'
import type { Colaborador } from '@/lib/supabase'

interface ZonaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresaId: string
  colaboradores: Colaborador[]
  onSuccess?: (zonaId: string) => void
}

export function ZonaDialog({ open, onOpenChange, empresaId, colaboradores, onSuccess }: ZonaDialogProps) {
  const [loading, setLoading] = useState(false)
  const [nomeZona, setNomeZona] = useState('')
  const [tecnicoResponsavelId, setTecnicoResponsavelId] = useState<string>('')
  const { createZona } = useZonas(empresaId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nomeZona.trim()) {
      toast.error('Por favor, preencha o nome da zona')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await createZona(
        nomeZona.trim(),
        tecnicoResponsavelId || null
      )

      if (error) {
        toast.error(error)
        return
      }

      toast.success('Zona criada com sucesso!')
      setNomeZona('')
      setTecnicoResponsavelId('')
      onOpenChange(false)
      
      if (onSuccess && data) {
        onSuccess(data.id)
      }
    } catch (err) {
      toast.error('Erro ao criar zona')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setNomeZona('')
    setTecnicoResponsavelId('')
    onOpenChange(false)
  }

  // Filter only active tecnicos
  const tecnicosAtivos = colaboradores.filter(c => c.ativo)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Nova Zona</DialogTitle>
            <DialogDescription>
              Crie uma zona para organizar clientes e técnicos por região
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome da Zona *</Label>
              <Input
                id="nome"
                placeholder="Ex: Centro, Zona Sul, Região Norte..."
                value={nomeZona}
                onChange={(e) => setNomeZona(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tecnico">Técnico Responsável (opcional)</Label>
              <Select
                value={tecnicoResponsavelId || 'nenhum'}
                onValueChange={(value) => {
                  if (value === 'nenhum') {
                    setTecnicoResponsavelId('')
                  } else {
                    setTecnicoResponsavelId(value)
                  }
                }}
                disabled={loading}
              >
                <SelectTrigger id="tecnico">
                  <SelectValue placeholder="Selecione um técnico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum</SelectItem>
                  {tecnicosAtivos.map((tecnico) => (
                    <SelectItem key={tecnico.id} value={tecnico.id}>
                      {tecnico.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Zona'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
