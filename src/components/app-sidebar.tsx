"use client"

import * as React from "react"
import { LayoutDashboard, ClipboardList, Building2, Cable, Users, HeadphonesIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
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
    { title: "Clientes", url: "/clients", icon: Building2 },
    { title: "Equipamentos", url: "/equipments", icon: Cable },
    { title: "Técnicos", url: "/technicians", icon: Users },
  ],
}

const supportLink = { title: "Suporte", url: "/support", icon: HeadphonesIcon }

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/60 px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm">
              <Link href={supportLink.url}>
                <supportLink.icon className="size-4" />
                <span>{supportLink.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
