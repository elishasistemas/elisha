import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

function createSupabaseStub() {
  // Stub client para evitar quebra quando envs estão ausentes
  const subscription = { unsubscribe() {} }
  return {
    auth: {
      async getSession() {
        return { data: { session: null }, error: null }
      },
      async getUser() {
        return { 
          data: { user: null }, 
          error: { message: 'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.' }
        }
      },
      async signInWithPassword() {
        return {
          data: { user: null, session: null },
          error: { message: 'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.' },
        }
      },
      async signOut() {
        return { error: null }
      },
      async resetPasswordForEmail() {
        return {
          data: null,
          error: { message: 'Supabase não configurado. Não é possível enviar e-mail.' },
        }
      },
      async updateUser() {
        return {
          data: null,
          error: { message: 'Supabase não configurado.' },
        }
      },
      onAuthStateChange(callback?: (event: AuthChangeEvent, session: Session | null) => void) {
        callback?.('SIGNED_OUT', null)
        return { data: { subscription } }
      },
    },
    from: () => {
      const queryBuilder = {
        select: () => queryBuilder,
        insert: () => queryBuilder,
        update: () => queryBuilder,
        delete: () => queryBuilder,
        eq: () => queryBuilder,
        neq: () => queryBuilder,
        gt: () => queryBuilder,
        gte: () => queryBuilder,
        lt: () => queryBuilder,
        lte: () => queryBuilder,
        like: () => queryBuilder,
        ilike: () => queryBuilder,
        is: () => queryBuilder,
        in: () => queryBuilder,
        contains: () => queryBuilder,
        containedBy: () => queryBuilder,
        range: () => queryBuilder,
        match: () => queryBuilder,
        not: () => queryBuilder,
        or: () => queryBuilder,
        order: () => queryBuilder,
        limit: () => queryBuilder,
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        then: (resolve: (value: { data: []; error: null }) => void) => resolve({ data: [], error: null }),
      }
      return queryBuilder
    },
  }
}

export async function createSupabaseServer() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !anon) {
    console.error('[Supabase] Variáveis de ambiente ausentes.')
    return createSupabaseStub()
  }

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
