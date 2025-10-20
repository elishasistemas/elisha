'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Mail, Calendar, Building2, Loader2 } from 'lucide-react'
import { useAuth, useProfile, useEmpresas } from '@/hooks/use-supabase'

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile(user?.id)
  const { empresas, loading: empresasLoading } = useEmpresas()

  const isLoading = authLoading || profileLoading || empresasLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Usuário não encontrado</p>
        </div>
      </div>
    )
  }

  const empresa = empresas[0]
  const empresaInitials = empresa?.nome
    ? empresa.nome.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'E'

  const userName = profile?.nome || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário'
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full py-16 ">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Perfil do Usuário</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Seus dados pessoais e de contato
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={userName} />
                <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{userName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                value={profile?.nome || user.user_metadata?.full_name || ''}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="funcao">Função</Label>
              <Input
                id="funcao"
                value={profile?.funcao || ''}
                disabled
                className="bg-muted"
              />
            </div>
            
            <Button disabled className="w-full">
              Editar Perfil (Em breve)
            </Button>
          </CardContent>
        </Card>

        {/* Informações da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Empresa
            </CardTitle>
            <CardDescription>
              Informações da empresa vinculada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={empresa?.logo_url || undefined} alt={empresa?.nome || 'Empresa'} />
                <AvatarFallback className="text-lg">{empresaInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{empresa?.nome || 'Nenhuma empresa'}</p>
                <p className="text-sm text-muted-foreground">{empresa?.cnpj || ''}</p>
              </div>
            </div>
            
            {empresa && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="empresa-nome">Nome da Empresa</Label>
                  <Input
                    id="empresa-nome"
                    value={empresa.nome}
                    disabled
                    className="bg-muted"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="empresa-cnpj">CNPJ</Label>
                  <Input
                    id="empresa-cnpj"
                    value={empresa.cnpj || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informações da Conta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informações da Conta
          </CardTitle>
          <CardDescription>
            Detalhes sobre sua conta no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="created_at">Membro desde</Label>
              <Input
                id="created_at"
                value={user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_sign_in">Último acesso</Label>
              <Input
                id="last_sign_in"
                value={user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR') : ''}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
