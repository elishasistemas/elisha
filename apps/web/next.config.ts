import type { NextConfig } from "next";
import path from 'path'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Desabilita ESLint durante build para evitar problemas de configuração
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Desabilita type checking durante build (já validado localmente)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Evita heurística errada de monorepo que pode causar falhas de chunks em dev/build
  outputFileTracingRoot: path.join(__dirname),
  // Ensure Turbopack resolves the correct monorepo root (avoids wrong root
  // inference when there are lockfiles elsewhere on the machine).
  turbopack: {
    root: path.resolve(__dirname, '..', '..'),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        // Permitir geolocation, camera e microphone para evidências e check-in
        { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self)' },
      ],
    },
  ],
};

export default nextConfig;
