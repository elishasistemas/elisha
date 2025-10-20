'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Building, User, Mail, Shield, Plus } from 'iconoir-react'

const userRoles = [
  { value: 'admin', label: 'Administrador', description: 'Acesso completo ao sistema' },
  { value: 'manager', label: 'Gerente', description: 'Gestão de equipe e relatórios' },
  { value: 'technician', label: 'Técnico', description: 'Acesso às ordens de serviço' },
  { value: 'client', label: 'Cliente', description: 'Acesso limitado aos próprios dados' }
]

export default function AdminPage() {
  const supabase = createSupabaseBrowser()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Form states
  const [companyForm, setCompanyForm] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: ''
  })

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: '',
    company_id: ''
  })

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      // Aqui você criaria a empresa no Supabase
      // const { data, error } = await supabase.from('companies').insert(companyForm)
      
      // Simulando criação
      console.log('Criando empresa:', companyForm)
      
      setMessage({ type: 'success', text: 'Empresa criada com sucesso!' })
      setCompanyForm({ name: '', cnpj: '', email: '', phone: '', address: '' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao criar empresa' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      // Aqui você criaria o usuário e enviaria o email de convite
      // const { data, error } = await supabase.auth.admin.inviteUserByEmail(userForm.email, {
      //   data: { 
      //     name: userForm.name,
      //     role: userForm.role,
      //     company_id: userForm.company_id
      //   }
      // })
      
      // Simulando criação
      console.log('Criando usuário:', userForm)
      
      setMessage({ type: 'success', text: 'Usuário criado e email de convite enviado!' })
      setUserForm({ name: '', email: '', role: '', company_id: '' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao criar usuário' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie empresas e usuários do sistema Elisha
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Criar Empresa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Nova Empresa
              </CardTitle>
              <CardDescription>
                Cadastre uma nova empresa no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCompany} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input
                    id="company-name"
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})}
                    placeholder="Ex: Empresa ABC Ltda"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-cnpj">CNPJ</Label>
                  <Input
                    id="company-cnpj"
                    value={companyForm.cnpj}
                    onChange={(e) => setCompanyForm({...companyForm, cnpj: e.target.value})}
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-email">Email</Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({...companyForm, email: e.target.value})}
                    placeholder="contato@empresa.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-phone">Telefone</Label>
                  <Input
                    id="company-phone"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({...companyForm, phone: e.target.value})}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-address">Endereço</Label>
                  <Textarea
                    id="company-address"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({...companyForm, address: e.target.value})}
                    placeholder="Endereço completo da empresa"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  <Plus className="h-4 w-4 mr-2" />
                  {isLoading ? 'Criando...' : 'Criar Empresa'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Criar Usuário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Novo Usuário
              </CardTitle>
              <CardDescription>
                Cadastre um usuário e envie convite por email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-name">Nome Completo</Label>
                  <Input
                    id="user-name"
                    value={userForm.name}
                    onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                    placeholder="Ex: João Silva"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    placeholder="joao@empresa.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-role">Perfil de Acesso</Label>
                  <Select value={userForm.role} onValueChange={(value) => setUserForm({...userForm, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {userRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div>
                            <div className="font-medium">{role.label}</div>
                            <div className="text-sm text-muted-foreground">{role.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-company">Empresa</Label>
                  <Select value={userForm.company_id} onValueChange={(value) => setUserForm({...userForm, company_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Empresa ABC Ltda</SelectItem>
                      <SelectItem value="2">Comércio XYZ S.A.</SelectItem>
                      <SelectItem value="3">Indústria DEF Ltda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  <Mail className="h-4 w-4 mr-2" />
                  {isLoading ? 'Enviando...' : 'Criar Usuário e Enviar Convite'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Informações sobre o fluxo */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Fluxo de Acesso</CardTitle>
            <CardDescription>
              Como funciona o processo de cadastro e acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">1. Cadastrar Empresa</h3>
                <p className="text-sm text-muted-foreground">
                  O time Elisha cadastra a empresa e define os dados básicos
                </p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">2. Criar Usuários</h3>
                <p className="text-sm text-muted-foreground">
                  Cadastra usuários com perfis específicos e envia convites
                </p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">3. Email de Convite</h3>
                <p className="text-sm text-muted-foreground">
                  Usuário recebe email com link para criar senha
                </p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">4. Acesso ao Sistema</h3>
                <p className="text-sm text-muted-foreground">
                  Após criar senha, acessa o sistema conforme seu perfil
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
