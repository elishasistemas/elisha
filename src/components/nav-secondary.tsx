"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: React.ComponentType<{ className?: string }>
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname()

  const normalizePath = (value: string) => {
    if (!value) return "/"
    return value === "/" ? "/" : value.replace(/\/$/, "")
  }

  const currentPath = normalizePath(pathname)

  const isPathActive = (target: string) => {
    const normalizedTarget = normalizePath(target)

    if (normalizedTarget === "/") {
      return currentPath === "/"
    }

    return (
      currentPath === normalizedTarget ||
      (currentPath?.startsWith(`${normalizedTarget}/`) ?? false)
    )
  }

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = isPathActive(item.url)

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild size="sm" isActive={isActive}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
