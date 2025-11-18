import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login', '/reset-password', '/create-password', '/admin']
  
  // Deixe o redirecionamento de /login ser tratado na própria página (client-side)
  if (pathname === '/login') {
    return NextResponse.next()
  }

  // Deixa a página raiz decidir o redirecionamento (verifica sessão no client)
  if (pathname === '/') {
    return NextResponse.next()
  }

  // Demais rotas seguem o fluxo normal; a proteção é feita no layout
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
