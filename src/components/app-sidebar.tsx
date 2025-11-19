"use client"

import React from "react"
import { LayoutDashboard, ClipboardList, Building2, Users, HeadphonesIcon, CheckSquare, Shield } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { RoleSwitcher } from "@/components/role-switcher"
import { useAuth, useProfile } from "@/hooks/use-supabase"
import { getActiveRole, getRoles } from "@/utils/auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Ordens de Serviço",
      url: "/orders",
      icon: ClipboardList,
    },
    { title: "Checklists", url: "/checklists", icon: CheckSquare },
    { title: "Clientes", url: "/clients", icon: Building2 },
    { title: "Técnicos", url: "/technicians", icon: Users },
  ],
}

const supportLink = {
  title: "Suporte",
  url: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_URL || "https://wa.me/",
  icon: HeadphonesIcon,
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, session } = useAuth()
  const { profile } = useProfile(user?.id)
  const roles = getRoles(session ?? null, profile)
  const active = getActiveRole(session ?? null, profile)

  const filteredItems = ((): typeof data.navMain => {
    if (active === 'tecnico') {
      // Técnico: Dashboard + Ordens de Serviço apenas
      // Configurações dele estão no NavUser (menu de perfil)
      return data.navMain.filter((i) => 
        i.url === '/dashboard' || i.url === '/orders'
      )
    }
    // Admin: menu completo
    return data.navMain
  })()

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/60 px-2 py-2">
        <div className="flex w-full items-center gap-[1.5]">
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
            title="Elisha"
          >
            <div className="relative size-9 flex items-center justify-center rounded-lg overflow-hidden bg-transparent" style={{ marginRight: "-2px" }}>
              <Image
                src="/logo-white.png"
                alt="Elisha Logo"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <Separator orientation="vertical" className="h-10 w-px bg-sidebar-border/70 group-data-[collapsible=icon]/sidebar-wrapper:hidden" />
          <div className="flex-1 min-w-0">
            <NavUser variant="inline" />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredItems} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/60 px-3 py-3">
        <div className="mb-2">
          <RoleSwitcher />
        </div>
        <SidebarMenu>
          {profile?.is_elisha_admin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="sm">
                <Link href="/admin/companies">
                  <Shield className="size-4" />
                  <span>Super Admin</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm">
              <a href={supportLink.url} target="_blank" rel="noopener noreferrer">
                <supportLink.icon className="size-4" />
                <span>{supportLink.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
