"use client"

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Checklist } from '@/types/checklist'

type ChecklistViewDialogProps = {
  checklist: Checklist
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
  trigger?: React.ReactNode
}

const tipoServicoLabels: Record<string, string> = {
  preventiva: 'Preventiva',
  corretiva: 'Corretiva',
  emergencial: 'Emergencial',
  chamado: 'Chamado',
  todos: 'Todos os Tipos',
}

const origemLabels: Record<string, string> = {
  abnt: 'ABNT',
  custom: 'Personalizado',
  elisha: 'Elisha Padrão',
}

export function ChecklistViewDialog({ checklist, defaultOpen, onOpenChange, hideTrigger, trigger }: ChecklistViewDialogProps) {
  const [open, setOpen] = useState(false)

  // Abre automaticamente ao montar e quando o checklist mudar
  useEffect(() => { if (defaultOpen) setOpen(true) }, [defaultOpen])
  useEffect(() => { if (defaultOpen && checklist) setOpen(true) }, [defaultOpen, checklist?.id])

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); onOpenChange?.(o) }}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          {trigger || <Button variant="outline">Visualizar</Button>}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Visualizar Checklist</DialogTitle>
          <DialogDescription>Detalhes do template de checklist</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Nome</p>
              <p className="font-medium">{checklist.nome}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tipo de Serviço</p>
              <Badge variant="outline">{tipoServicoLabels[checklist.tipo_servico] || checklist.tipo_servico}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Origem</p>
              <Badge>{origemLabels[checklist.origem] || checklist.origem}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Versão</p>
              <p className="font-medium">v{checklist.versao}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant={checklist.ativo ? 'default' : 'secondary'}>
                {checklist.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            {Array.isArray(checklist.abnt_refs) && checklist.abnt_refs.length > 0 && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Referências ABNT</p>
                <p className="text-sm">{checklist.abnt_refs.join(', ')}</p>
              </div>
            )}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Itens ({Array.isArray(checklist.itens) ? checklist.itens.length : 0})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.isArray(checklist.itens) && checklist.itens.length > 0 ? (
                checklist.itens.map((item, idx) => (
                  <div key={idx} className="p-3 border rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">#{item.ordem} • {item.secao}</div>
                      <div className="flex items-center gap-2">
                        {item.critico && <Badge variant="destructive">Crítico</Badge>}
                        {item.obrigatorio && <Badge variant="outline">Obrigatório</Badge>}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{item.descricao}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum item cadastrado</p>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => { setOpen(false); onOpenChange?.(false) }}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
