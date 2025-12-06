'use client'

import * as React from "react"
import {
  Building2,
  Loader2,
  Upload,
  User,
  Users,
  X,
} from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEmpresas, useAuth, useProfile } from "@/hooks/use-supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { uploadCompanyLogo, updateCompanyLogo, removeCompanyLogo } from "@/lib/storage"
import Link from "next/link"

const settingsSections = [
  { name: "Empresa", icon: Building2, id: "empresa" },
  { name: "Perfil", icon: User, id: "perfil" },
  { name: "Usuários", icon: Users, id: "usuarios", isLink: true, href: "/settings/users" },
]

interface SettingsDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

export function SettingsDialog({ open: controlledOpen, onOpenChange, trigger }: SettingsDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState("empresa")
  const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile(user?.id)
  const { empresas, loading: empresasLoading } = useEmpresas()

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      supervisor: 'Supervisor',
      tecnico: 'Técnico',
      elisha_admin: 'Admin Elisha'
    }
    return labels[role] || role
  }

  const isOpen = controlledOpen !== undefined ? controlledOpen : open
  const handleOpenChange = onOpenChange || setOpen

  const empresa = empresas[0]

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [logoUrl, setLogoUrl] = React.useState<string | null>(empresa?.logo_url ?? null)
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false)
  const [isRemovingLogo, setIsRemovingLogo] = React.useState(false)
  const messageTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    setLogoUrl(empresa?.logo_url ?? null)
  }, [empresa?.logo_url])

  React.useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current)
      }
    }
  }, [])

  const showMessage = React.useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current)
    }
    messageTimeoutRef.current = setTimeout(() => setMessage(null), 3000)
  }, [])

  const applyLogoUpdate = React.useCallback((newUrl: string | null, text?: string) => {
    setLogoUrl(newUrl)

    try {
      if (newUrl) {
        localStorage.setItem('empresa_logo_url', newUrl)
      } else {
        localStorage.removeItem('empresa_logo_url')
      }
      window.dispatchEvent(new CustomEvent('empresaLogoUpdated', { detail: newUrl }))
    } catch {}

    showMessage('success', text ?? (newUrl ? 'Logo atualizada com sucesso!' : 'Logo removida com sucesso!'))
  }, [showMessage])

  const handleLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!empresa || !file) return

    setIsUploadingLogo(true)

    try {
      const uploadResult = await uploadCompanyLogo(file, empresa.id)
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Não foi possível enviar o arquivo')
      }

      const updateResult = await updateCompanyLogo(empresa.id, uploadResult.url)
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Erro ao salvar logo')
      }

      applyLogoUpdate(uploadResult.url, 'Logo atualizada com sucesso!')
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error ? error.message : 'Erro ao atualizar logo'
      )
    } finally {
      setIsUploadingLogo(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveLogo = async () => {
    if (!empresa || !logoUrl) return

    setIsRemovingLogo(true)

    try {
      if (logoUrl.includes('supabase')) {
        await removeCompanyLogo(logoUrl)
      }

      const updateResult = await updateCompanyLogo(empresa.id, null)
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Erro ao remover logo')
      }

      applyLogoUpdate(null, 'Logo removida com sucesso!')
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error ? error.message : 'Erro ao remover logo'
      )
    } finally {
      setIsRemovingLogo(false)
    }
  }

  const isLoading = authLoading || profileLoading || empresasLoading

  const empresaInitials = empresa?.nome
    ? empresa.nome.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'E'

  const userName = profile?.nome || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const renderSectionContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando configurações...</p>
          </div>
        </div>
      )
    }

    switch (activeSection) {
      case "empresa":
        return (
          <div className="space-y-4">
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
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={logoUrl || undefined} alt={empresa?.nome || 'Empresa'} />
                      <AvatarFallback className="text-lg">{empresaInitials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{empresa?.nome || 'Nenhuma empresa'}</p>
                      <p className="text-sm text-muted-foreground">{empresa?.cnpj || 'CNPJ não informado'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoFileChange}
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingLogo || isRemovingLogo}
                    >
                      {isUploadingLogo ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      {logoUrl ? 'Trocar logo' : 'Adicionar logo'}
                    </Button>
                    {logoUrl && (
                      <Button
                        variant="ghost"
                        onClick={handleRemoveLogo}
                        disabled={isRemovingLogo || isUploadingLogo}
                        className="text-destructive hover:text-destructive"
                      >
                        {isRemovingLogo ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <X className="mr-2 h-4 w-4" />
                        )}
                        Remover
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Essa imagem aparece no menu lateral e em relatórios compartilhados com clientes. Formatos aceitos: PNG, JPG ou WebP de até 2MB.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Empresa</Label>
                  <Input
                    id="nome"
                    value={empresa?.nome || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={empresa?.cnpj || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="created_at">Data de Criação</Label>
                  <Input
                    id="created_at"
                    value={empresa?.created_at ? new Date(empresa.created_at).toLocaleDateString('pt-BR') : ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <Button disabled className="w-full">
                  Editar Informações (Em breve)
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      case "perfil":
        return (
          <div className="space-y-4">
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
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={userName} />
                    <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{userName}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nome-perfil">Nome Completo</Label>
                  <Input
                    id="nome-perfil"
                    value={profile?.nome || user?.user_metadata?.full_name || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="funcao">Função</Label>
                  <Input
                    id="funcao"
                    value={profile?.active_role ? getRoleLabel(profile.active_role) : ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                
                <Button disabled className="w-full">
                  Editar Perfil (Em breve)
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="overflow-hidden p-0 md:max-h-[600px]">
        <DialogTitle className="sr-only">Configurações</DialogTitle>
        <DialogDescription className="sr-only">
          Gerencie as configurações da sua empresa e perfil
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {settingsSections.map((item: any) => (
                      <SidebarMenuItem key={item.id}>
                        {item.isLink ? (
                          <SidebarMenuButton asChild>
                            <Link href={item.href} onClick={() => handleOpenChange(false)}>
                              <item.icon />
                              <span>{item.name}</span>
                            </Link>
                          </SidebarMenuButton>
                        ) : (
                          <SidebarMenuButton
                            onClick={() => setActiveSection(item.id)}
                            isActive={item.id === activeSection}
                          >
                            <item.icon />
                            <span>{item.name}</span>
                          </SidebarMenuButton>
                        )}
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[600px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink 
                      onClick={() => setActiveSection("empresa")}
                      className="cursor-pointer"
                    >
                      Configurações
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {settingsSections.find(s => s.id === activeSection)?.name}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
              {message && (
                <div className={`p-4 rounded-lg border ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {message.text}
                </div>
              )}
              {renderSectionContent()}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
