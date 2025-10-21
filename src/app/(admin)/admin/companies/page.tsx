'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Eye, Users } from 'lucide-react'
import { toast } from 'sonner'
import { CompanyDialog } from '@/components/admin/company-dialog'
import { UserDialog } from '@/components/admin/user-dialog'

interface Company {
  id: string
  nome: string
  cnpj: string | null
  telefone: string | null
  email: string | null
  ativo: boolean
  created_at: string
  _count?: {
    profiles: number
    ordens_servico: number
  }
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompanyDialog, setShowCompanyDialog] = useState(false)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [selectedCompanyForUser, setSelectedCompanyForUser] = useState<Company | null>(null)

  const supabase = createSupabaseBrowser()

  const loadCompanies = async () => {
    try {
      setLoading(true)
      
      // Buscar todas as empresas
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Para cada empresa, buscar contagens
      const companiesWithCounts = await Promise.all(
        (data || []).map(async (company) => {
          const [profilesCount, ordersCount] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('empresa_id', company.id),
            supabase.from('ordens_servico').select('id', { count: 'exact', head: true }).eq('empresa_id', company.id),
          ])

          return {
            ...company,
            _count: {
              profiles: profilesCount.count || 0,
              ordens_servico: ordersCount.count || 0,
            }
          }
        })
      )

      setCompanies(companiesWithCounts)
    } catch (error: any) {
      console.error('[companies] Erro ao carregar:', error)
      toast.error(`Erro ao carregar empresas: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  const handleImpersonate = async (company: Company) => {
    try {
      // Atualizar sessão para impersonar
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Atualizar profile com impersonating_empresa_id
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ impersonating_empresa_id: company.id })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Atualizar claims
      await fetch('/api/auth/update-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      // Criar log
      await supabase.from('impersonation_logs').insert({
        admin_id: user.id,
        empresa_id: company.id,
        started_at: new Date().toISOString()
      })

      toast.success(`Impersonando: ${company.nome}`)
      
      // Redirecionar para dashboard
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)

    } catch (error: any) {
      console.error('[impersonate] Erro:', error)
      toast.error(`Erro ao impersonar: ${error.message}`)
    }
  }

  const handleEdit = (company: Company) => {
    setSelectedCompany(company)
    setShowCompanyDialog(true)
  }

  const handleCreateUser = (company: Company) => {
    setSelectedCompanyForUser(company)
    setShowUserDialog(true)
  }

  const handleDialogClose = () => {
    setShowCompanyDialog(false)
    setShowUserDialog(false)
    setSelectedCompany(null)
    setSelectedCompanyForUser(null)
    loadCompanies()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando empresas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Empresas Clientes</h2>
          <p className="text-muted-foreground">
            Gerencie as empresas e seus usuários
          </p>
        </div>
        <Button onClick={() => setShowCompanyDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Empresa
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empresas Cadastradas</CardTitle>
          <CardDescription>
            Total de {companies.length} empresa(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhuma empresa cadastrada
              </p>
              <Button onClick={() => setShowCompanyDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Primeira Empresa
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-center">Usuários</TableHead>
                  <TableHead className="text-center">OS</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">
                      {company.nome}
                    </TableCell>
                    <TableCell>
                      {company.cnpj || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {company.email && <div>{company.email}</div>}
                        {company.telefone && <div className="text-muted-foreground">{company.telefone}</div>}
                        {!company.email && !company.telefone && '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {company._count?.profiles || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {company._count?.ordens_servico || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={company.ativo ? 'default' : 'secondary'}>
                        {company.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCreateUser(company)}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Usuário
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(company)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleImpersonate(company)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Acessar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showCompanyDialog && (
        <CompanyDialog
          company={selectedCompany}
          onClose={handleDialogClose}
        />
      )}

      {showUserDialog && selectedCompanyForUser && (
        <UserDialog
          company={selectedCompanyForUser}
          onClose={handleDialogClose}
        />
      )}
    </div>
  )
}

