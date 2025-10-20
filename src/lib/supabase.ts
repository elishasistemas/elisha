import { createBrowserClient } from '@supabase/ssr'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

// Tipos para o banco de dados
export interface Empresa {
  id: string
  nome: string
  cnpj: string
  logo_url: string | null
  created_at: string
}

export interface Profile {
  id: string
  empresa_id: string | null
  nome: string | null
  funcao: 'admin' | 'gestor' | 'tecnico'
  role: 'admin' | 'gestor' | 'tecnico'
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  empresa_id: string
  nome_local: string
  cnpj: string
  endereco_completo: string | null
  responsavel_nome: string | null
  responsavel_telefone: string | null
  responsavel_email: string | null
  data_inicio_contrato: string | null
  data_fim_contrato: string | null
  status_contrato: 'ativo' | 'em_renovacao' | 'encerrado'
  created_at: string
  updated_at: string
}

export interface Equipamento {
  id: string
  cliente_id: string
  empresa_id: string | null
  tipo: string | null
  fabricante: string | null
  modelo: string | null
  numero_serie: string | null
  ano_instalacao: number | null
  descricao: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Colaborador {
  id: string
  empresa_id: string
  nome: string
  funcao: string | null
  telefone: string | null
  whatsapp_numero: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface OrdemServico {
  id: string
  cliente_id: string
  equipamento_id: string
  tecnico_id: string | null
  empresa_id: string | null
  tipo: 'preventiva' | 'corretiva' | 'emergencial' | 'chamado'
  prioridade: 'alta' | 'media' | 'baixa'
  status: 'novo' | 'em_andamento' | 'aguardando_assinatura' | 'concluido' | 'cancelado' | 'parado'
  data_abertura: string
  data_inicio: string | null
  data_fim: string | null
  data_programada: string | null
  observacoes: string | null
  origem: 'whatsapp' | 'painel'
  numero_os: string | null
  created_at: string
  updated_at: string
}

function createSupabaseStub() {
  // Stub client para evitar quebra quando envs estão ausentes
  const subscription = { unsubscribe() {} }
  return {
    auth: {
      async getSession() {
        return { data: { session: null }, error: null }
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
      async setSession() {
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
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => ({ data: null, error: null }),
          order: () => ({ data: [], error: null }),
          limit: () => ({ data: [], error: null })
        }),
        order: () => ({ data: [], error: null }),
        limit: () => ({ data: [], error: null }),
        single: () => ({ data: null, error: null })
      }),
      insert: () => ({
        select: () => ({
          single: () => ({ data: null, error: null })
        })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => ({ data: null, error: null })
          })
        })
      }),
      delete: () => ({ data: null, error: null }),
    }),
  }
}

export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('[Supabase] URL:', url ? 'Configurada' : 'Ausente')
  console.log('[Supabase] Anon Key:', anon ? 'Configurada' : 'Ausente')
  
  if (!url || !anon) {
    console.error('[Supabase] Variáveis de ambiente ausentes. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local')
    return createSupabaseStub()
  }
  
  const client = createBrowserClient(url, anon)
  console.log('[Supabase] Cliente criado com sucesso')
  return client
}

