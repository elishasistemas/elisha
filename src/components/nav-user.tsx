"use client"

import * as React from "react"
import { ChevronsUpDown } from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth, useProfile, useEmpresas } from "@/hooks/use-supabase"
import { useEffect, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { SettingsDialog } from "@/components/settings-dialog"

type NavUserProps = {
  variant?: "default" | "inline"
}

export function NavUser({ variant = "default" }: NavUserProps = {}) {
  const { isMobile } = useSidebar()
  const { user, signOut } = useAuth()
  const { empresas, loading: empresasLoading } = useEmpresas()
  const { profile, loading: profileLoading } = useProfile(user?.id)
  const [imageError, setImageError] = useState(false)
  const [logoUrlOverride, setLogoUrlOverride] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const whatsappSupportUrl = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_URL || "https://wa.me/"

  // Importante: hooks devem vir antes de qualquer retorno condicional
  // Carrega override de logo do localStorage e ouve updates
  useEffect(() => {
    try {
      const stored = localStorage.getItem('empresa_logo_url')
      if (stored) setLogoUrlOverride(stored)
    } catch {}
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string | null>
      setImageError(false)
      setLogoUrlOverride(ce.detail ?? null)
    }
    window.addEventListener('empresaLogoUpdated' as any, handler)
    return () => window.removeEventListener('empresaLogoUpdated' as any, handler)
  }, [])

  if (!user) {
    return null
  }

  // Mostrar loading enquanto carrega dados
  if (empresasLoading || profileLoading) {
    return (
      <SidebarMenu className={cn(variant === "inline" && "flex-row items-center gap-2 p-0") }>
        <SidebarMenuItem className={variant === "inline" ? "flex-1 min-w-0" : undefined}>
          <SidebarMenuButton
            size="lg"
            disabled
            className={cn(
              variant === "inline" &&
                "h-12 w-full justify-between gap-2 bg-sidebar p-0"
            )}
          >
            <Avatar className="h-8 w-8 rounded-lg pl-0">
              <AvatarFallback className="rounded-lg">...</AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Carregando...</span>
              <span className="truncate text-sm sm:text-xs">Aguarde</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Dados da empresa: respeitar impersonation se houver
  const effectiveEmpresaId = profile?.impersonating_empresa_id || profile?.empresa_id || empresas[0]?.id
  const empresa = empresas.find((e: any) => e.id === effectiveEmpresaId) || empresas[0]
  const empresaName = empresa?.nome || 'Empresa'
  const empresaInitials = empresa?.nome 
    ? empresa.nome.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'E'

  // Dados do usuário
  const userDisplayName = profile?.nome || user.user_metadata?.full_name || user.email || 'Usuário'
  const handleLogout = async () => { await signOut() }

  return (
    <>
    <SidebarMenu className={cn(variant === "inline" && "flex-row items-center gap-2 p-0") }>
      <SidebarMenuItem className={variant === "inline" ? "flex-1 min-w-0" : undefined}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                variant === "inline" &&
                  "h-12 w-full justify-between rounded-lg bg-sidebar text-left hover:border-sidebar-accent/60 hover:bg-sidebar-accent/60"
              )}
            >
              <Avatar className="h-[32px] w-[32px] rounded-lg">
                <AvatarImage 
                  src={!imageError && (logoUrlOverride || empresa?.logo_url) ? (logoUrlOverride || empresa?.logo_url) ?? undefined : undefined}
                  alt={empresaName}
                  onError={() => setImageError(true)}
                />
                <AvatarFallback className="rounded-lg">{empresaInitials}</AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{empresaName}</span>
                <span className="truncate text-sm sm:text-xs">{userDisplayName}</span>
              </div>
              <ChevronsUpDown className={cn("ml-auto size-4", variant === "inline" && "text-muted-foreground") } />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={variant === "inline" ? "bottom" : isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={variant === "inline" ? 8 : 4}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/novidades">Novidades</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={whatsappSupportUrl} target="_blank" rel="noopener noreferrer">Suporte</a>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>

    <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
  </>
  )
}
