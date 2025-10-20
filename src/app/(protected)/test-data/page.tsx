'use client'

import { useEmpresas, useClientes, useOrdensServico, useColaboradores, useEquipamentos } from '@/hooks/use-supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestDataPage() {
  const { empresas, loading: empresasLoading, error: empresasError } = useEmpresas()
  const empresaId = empresas[0]?.id
  const { clientes, loading: clientesLoading, error: clientesError } = useClientes(empresaId)
  const { ordens, loading: ordensLoading, error: ordensError } = useOrdensServico(empresaId)
  const { colaboradores, loading: colLoading, error: colError } = useColaboradores(empresaId)
  const clienteId = clientes[0]?.id
  const { equipamentos, loading: equipLoading, error: equipError } = useEquipamentos(clienteId)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Teste de Dados</h1>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Empresas</CardTitle>
            <CardDescription>
              Loading: {empresasLoading ? 'Sim' : 'Não'} | 
              Error: {empresasError || 'Nenhum'} | 
              Count: {empresas.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(empresas, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>
              Loading: {clientesLoading ? 'Sim' : 'Não'} | 
              Error: {clientesError || 'Nenhum'} | 
              Count: {clientes.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(clientes, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Colaboradores</CardTitle>
            <CardDescription>
              Loading: {colLoading ? 'Sim' : 'Não'} | 
              Error: {colError || 'Nenhum'} | 
              Count: {colaboradores.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(colaboradores, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ordens de Serviço</CardTitle>
            <CardDescription>
              Loading: {ordensLoading ? 'Sim' : 'Não'} | 
              Error: {ordensError || 'Nenhum'} | 
              Count: {ordens.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(ordens, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equipamentos</CardTitle>
            <CardDescription>
              Loading: {equipLoading ? 'Sim' : 'Não'} | 
              Error: {equipError || 'Nenhum'} | 
              Count: {equipamentos.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(equipamentos, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
