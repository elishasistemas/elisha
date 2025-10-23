import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import PWAInstall from "@/components/pwa-install";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Elisha - Administrador",
  description: "Sistema inteligente de gestão para empresas de manutenção de elevadores",
  icons: {
    icon: "/icon.ico",
    apple: "/logo-white.png",
  },
  manifest: "/manifest.webmanifest",
  themeColor: "#0ea5e9",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Elisha Admin",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        {/* Global toast notifications */}
        <Toaster richColors position="top-right" closeButton />
        {/* Vercel Analytics & Speed Insights */}
        <Analytics />
        <SpeedInsights />
        {/* PWA: registro do SW e onboarding de instalação */}
        <PWAInstall />
      </body>
    </html>
  );
}
