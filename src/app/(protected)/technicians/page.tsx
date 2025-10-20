'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useEmpresas, useColaboradores } from '@/hooks/use-supabase'

export default function TechniciansPage() {
  const { empresas, loading: empresasLoading, error: empresasError } = useEmpresas()
  const empresaId = empresas[0]?.id
  const { colaboradores, loading, error } = useColaboradores(empresaId)

  const isLoading = empresasLoading || loading
  const hasError = empresasError || error

  const total = useMemo(() => colaboradores.length, [colaboradores.length])

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full py-16 ">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Técnicos</h1>
          <p className="text-muted-foreground">Gestão de equipe técnica</p>   
        </div>
        <Button disabled>Novo Técnico</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Técnicos</CardTitle>
          <CardDescription>{total} ativos</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              Carregando...
            </div>
          ) : hasError ? (
            <div className="text-destructive">{hasError}</div>
          ) : colaboradores.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">Nenhum técnico encontrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colaboradores.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.nome}</TableCell>
                    <TableCell>{t.funcao || '-'}</TableCell>
                    <TableCell>{t.telefone || '-'}</TableCell>
                    <TableCell>{t.whatsapp_numero}</TableCell>
                    <TableCell>
                      <Badge variant={t.ativo ? 'default' : 'outline'}>
                        {t.ativo ? 'Ativo' : 'Inativo'}
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

