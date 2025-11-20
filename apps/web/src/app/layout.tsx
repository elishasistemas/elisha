import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import PWAInstall from "@/components/pwa-install";
import { AuthProvider } from "@/contexts/auth-context";

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
    icon: [
      { url: "/icon.ico" },
      { url: "/icons/icon-192.png?v=20251023", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png?v=20251023", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/icons/apple-touch-icon.png?v=20251023", sizes: "180x180", type: "image/png" },
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Elisha Admin",
  },
};

export const viewport = {
  themeColor: "#0ea5e9",
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
        <AuthProvider>
          {/* React Grab - Element Selection Tool (Development Only) */}
          {process.env.NODE_ENV === "development" && (
            <Script
              src="//unpkg.com/react-grab/dist/index.global.js"
              crossOrigin="anonymous"
              strategy="beforeInteractive"
              data-enabled="true"
            />
          )}
          {children}
          {/* Global toast notifications */}
          <Toaster richColors position="top-right" closeButton />
          {/* Vercel Analytics & Speed Insights */}
          <Analytics />
          <SpeedInsights />
          {/* PWA: registro do SW e onboarding de instalação */}
          <PWAInstall />
        </AuthProvider>
      </body>
    </html>
  );
}
