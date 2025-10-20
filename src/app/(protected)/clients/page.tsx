'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useEmpresas, useClientes } from '@/hooks/use-supabase'

export default function ClientsPage() {
  const { empresas, loading: empresasLoading, error: empresasError } = useEmpresas()
  const empresaId = empresas[0]?.id
  const { clientes, loading, error } = useClientes(empresaId)

  const isLoading = empresasLoading || loading
  const hasError = empresasError || error

  const total = useMemo(() => clientes.length, [clientes.length])

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerencie clientes e contratos</p>
        </div>
        <Button disabled>Novo Cliente</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>{total} registros</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              Carregando...
            </div>
          ) : hasError ? (
            <div className="text-destructive">{hasError}</div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">Nenhum cliente encontrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status do Contrato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome_local}</TableCell>
                    <TableCell>{c.cnpj}</TableCell>
                    <TableCell>{c.responsavel_nome || '-'}</TableCell>
                    <TableCell>{c.responsavel_telefone || c.responsavel_email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={c.status_contrato === 'ativo' ? 'default' : c.status_contrato === 'em_renovacao' ? 'secondary' : 'outline'}>
                        {c.status_contrato === 'ativo' ? 'Ativo' : c.status_contrato === 'em_renovacao' ? 'Em Renovação' : 'Encerrado'}
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
