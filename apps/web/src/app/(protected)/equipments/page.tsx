'use client'

import { useState } from 'react'
import { useAdminRoute } from '@/utils/route-protection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useEmpresas, useClientes, useEquipamentos } from '@/hooks/use-supabase'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth, useProfile } from '@/hooks/use-supabase'
import { isAdmin, isSupervisor } from '@/utils/auth'

export default function EquipmentsPage() {
  useAdminRoute() // Protege a rota - redireciona técnicos e supervisores
  
  const { user, session } = useAuth()
  const { profile } = useProfile(user?.id)
  
  // Determinar empresa ativa (impersonation ou empresa do perfil)
  const empresaId = profile?.impersonating_empresa_id || profile?.empresa_id || undefined
  
  // Verificar permissões
  const canCreate = isAdmin(session, profile) || isSupervisor(session, profile)
  
  const { empresas, loading: empresasLoading, error: empresasError } = useEmpresas()
  const { clientes, loading: clientesLoading, error: clientesError } = useClientes(empresaId)
  const clienteId = clientes[0]?.id
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { equipamentos, loading, error, count } = useEquipamentos(clienteId, { page, pageSize, search })

  const isLoading = empresasLoading || clientesLoading || loading
  const hasError = empresasError || clientesError || error

  const total = count || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const startIdx = total > 0 ? (page - 1) * pageSize + 1 : 0
  const endIdx = Math.min(page * pageSize, total)

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full py-4">
      <div className="flex items-center justify-between">   
        <div>
          <h1 className="text-2xl font-bold">Equipamentos</h1>
          <p className="text-muted-foreground">Inventário e dados técnicos</p>
        </div>
        <Button disabled={!canCreate}>Novo Equipamento</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Lista de Equipamentos</CardTitle>  
              <CardDescription>{total} {search ? 'resultado(s)' : 'registros'}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar por tipo, fabricante, modelo ou série"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-[300px]"
              />
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Por página" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / página</SelectItem>
                  <SelectItem value="20">20 / página</SelectItem>
                  <SelectItem value="50">50 / página</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
          {total > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <div>
                Mostrando {startIdx}-{endIdx} de {total}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Anterior
                </Button>
                <span>Página {page} de {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
