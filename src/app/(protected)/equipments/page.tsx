'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useEmpresas, useClientes, useEquipamentos } from '@/hooks/use-supabase'

export default function EquipmentsPage() {
  const { empresas, loading: empresasLoading, error: empresasError } = useEmpresas()
  const empresaId = empresas[0]?.id
  const { clientes, loading: clientesLoading, error: clientesError } = useClientes(empresaId)
  const clienteId = clientes[0]?.id
  const { equipamentos, loading, error } = useEquipamentos(clienteId)

  const isLoading = empresasLoading || clientesLoading || loading
  const hasError = empresasError || clientesError || error

  const total = useMemo(() => equipamentos.length, [equipamentos.length])

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full py-4">
      <div className="flex items-center justify-between">   
        <div>
          <h1 className="text-2xl font-bold">Equipamentos</h1>
          <p className="text-muted-foreground">Inventário e dados técnicos</p>
        </div>
        <Button disabled>Novo Equipamento</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Equipamentos</CardTitle>  
          <CardDescription>{total} registros</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              Carregando...
            </div>
          ) : hasError ? (
            <div className="text-destructive">{hasError}</div>
          ) : !clienteId ? (
            <div className="text-center py-10 text-muted-foreground">Nenhum cliente disponível. Cadastre um cliente para listar equipamentos.</div>
          ) : equipamentos.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">Nenhum equipamento encontrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fabricante</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Nº Série</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipamentos.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.tipo || '-'}</TableCell>
                    <TableCell>{e.fabricante || '-'}</TableCell>
                    <TableCell>{e.modelo || '-'}</TableCell>
                    <TableCell>{e.numero_serie || '-'}</TableCell>
                    <TableCell>{e.ano_instalacao ?? '-'}</TableCell>
                    <TableCell>
                      <Badge variant={e.ativo ? 'default' : 'outline'}>
                        {e.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

