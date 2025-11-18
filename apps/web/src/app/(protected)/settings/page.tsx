'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Building2, Save, Loader2 } from 'lucide-react'
import { useEmpresas } from '@/hooks/use-supabase'
import { LogoUpload } from '@/components/logo-upload'

export default function SettingsPage() {
  const { empresas, loading: empresasLoading, error: empresasError } = useEmpresas()
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const empresa = empresas[0]

  if (empresasLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  if (empresasError || !empresa) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {empresasError || 'Nenhuma empresa encontrada'}
          </p>
        </div>
      </div>
    )
  }

  const handleLogoUpdate = (logoUrl: string | null) => {
    // Atualizar a lista de empresas localmente
    // Isso será refletido automaticamente no nav-user
    setMessage({ type: 'success', text: 'Logo atualizado com sucesso!' })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full py-16 ">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações da sua empresa
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informações da Empresa
            </CardTitle>
            <CardDescription>
              Dados básicos da sua empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Empresa</Label>
              <Input
                id="nome"
                value={empresa.nome}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={empresa.cnpj || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="created_at">Data de Criação</Label>
              <Input
                id="created_at"
                value={new Date(empresa.created_at).toLocaleDateString('pt-BR')}
                disabled
                className="bg-muted"
              />
            </div>
            <Button disabled className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Editar Informações (Em breve)
            </Button>
          </CardContent>
        </Card>

        {/* Logo da Empresa */}
        <LogoUpload 
          empresa={empresa} 
          onLogoUpdate={handleLogoUpdate}
        />
      </div>

      {/* Configurações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Sistema</CardTitle>
          <CardDescription>
            Outras configurações importantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Notificações por Email</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações sobre ordens de serviço
              </p>
              <Button variant="outline" disabled className="w-full">
                Configurar (Em breve)
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Integração WhatsApp</Label>
              <p className="text-sm text-muted-foreground">
                Conectar com WhatsApp Business API
              </p>
              <Button variant="outline" disabled className="w-full">
                Configurar (Em breve)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mensagens */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  )
}
