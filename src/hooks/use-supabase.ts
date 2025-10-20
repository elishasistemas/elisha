'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import type { Profile, Empresa, Cliente, Equipamento, Colaborador, OrdemServico } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  return {
    user,
    session,
    loading,
    signOut: () => supabase.auth.signOut(),
  }
}

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) throw error
        setProfile(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar perfil')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId, supabase])

  return { profile, loading, error }
}

export function useEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        setLoading(true)
        console.log('[useEmpresas] Iniciando busca de empresas...')
        const { data, error } = await supabase
          .from('empresas')
          .select('*')
          .order('created_at', { ascending: false })

        console.log('[useEmpresas] Resposta:', { data, error })
        if (error) throw error
        setEmpresas(data || [])
        console.log('[useEmpresas] Empresas carregadas:', data?.length || 0)
      } catch (err) {
        console.error('[useEmpresas] Erro:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar empresas')
      } finally {
        setLoading(false)
      }
    }

    fetchEmpresas()
  }, [supabase])

  const createEmpresa = async (empresa: Omit<Empresa, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .insert([empresa])
        .select()
        .single()

      if (error) throw error
      setEmpresas(prev => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro ao criar empresa' }
    }
  }

  const updateEmpresa = async (id: string, updates: Partial<Omit<Empresa, 'id' | 'created_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setEmpresas(prev => prev.map(e => e.id === id ? data : e))
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro ao atualizar empresa' }
    }
  }

  return { empresas, loading, error, createEmpresa, updateEmpresa }
}

export function useClientes(empresaId?: string) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    if (!empresaId) {
      console.log('[useClientes] Sem empresaId, pulando busca')
      setLoading(false)
      return
    }

    const fetchClientes = async () => {
      try {
        setLoading(true)
        console.log('[useClientes] Buscando clientes para empresa:', empresaId)
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('empresa_id', empresaId)
          .order('created_at', { ascending: false })

        console.log('[useClientes] Resposta:', { data, error })
        if (error) throw error
        setClientes(data || [])
        console.log('[useClientes] Clientes carregados:', data?.length || 0)
      } catch (err) {
        console.error('[useClientes] Erro:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar clientes')
      } finally {
        setLoading(false)
      }
    }

    fetchClientes()
  }, [empresaId, supabase])

  const createCliente = async (cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([cliente])
        .select()
        .single()

      if (error) throw error
      setClientes(prev => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro ao criar cliente' }
    }
  }

  return { clientes, loading, error, createCliente }
}

export function useEquipamentos(clienteId?: string) {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    if (!clienteId) {
      console.log('[useEquipamentos] Sem clienteId, pulando busca')
      setLoading(false)
      return
    }

    const fetchEquipamentos = async () => {
      try {
        setLoading(true)
        console.log('[useEquipamentos] Buscando equipamentos para cliente:', clienteId)
        const { data, error } = await supabase
          .from('equipamentos')
          .select('*')
          .eq('cliente_id', clienteId)
          .order('created_at', { ascending: false })

        console.log('[useEquipamentos] Resposta:', { data, error })
        if (error) throw error
        setEquipamentos(data || [])
        console.log('[useEquipamentos] Equipamentos carregados:', data?.length || 0)
      } catch (err) {
        console.error('[useEquipamentos] Erro:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar equipamentos')
      } finally {
        setLoading(false)
      }
    }

    fetchEquipamentos()
  }, [clienteId, supabase])

  return { equipamentos, loading, error }
}

export function useColaboradores(empresaId?: string) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    if (!empresaId) {
      console.log('[useColaboradores] Sem empresaId, pulando busca')
      setLoading(false)
      return
    }

    const fetchColaboradores = async () => {
      try {
        setLoading(true)
        console.log('[useColaboradores] Buscando colaboradores para empresa:', empresaId)
        const { data, error } = await supabase
          .from('colaboradores')
          .select('*')
          .eq('empresa_id', empresaId)
          .eq('ativo', true)
          .order('created_at', { ascending: false })

        console.log('[useColaboradores] Resposta:', { data, error })
        if (error) throw error
        setColaboradores(data || [])
        console.log('[useColaboradores] Colaboradores carregados:', data?.length || 0)
      } catch (err) {
        console.error('[useColaboradores] Erro:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar colaboradores')
      } finally {
        setLoading(false)
      }
    }

    fetchColaboradores()
  }, [empresaId, supabase])

  return { colaboradores, loading, error }
}

export function useOrdensServico(empresaId?: string) {
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    if (!empresaId) {
      console.log('[useOrdensServico] Sem empresaId, pulando busca')
      setLoading(false)
      return
    }

    const fetchOrdens = async () => {
      try {
        setLoading(true)
        console.log('[useOrdensServico] Buscando ordens para empresa:', empresaId)
        const { data, error } = await supabase
          .from('ordens_servico')
          .select('*')
          .eq('empresa_id', empresaId)
          .order('created_at', { ascending: false })

        console.log('[useOrdensServico] Resposta:', { data, error })
        if (error) throw error
        setOrdens(data || [])
        console.log('[useOrdensServico] Ordens carregadas:', data?.length || 0)
      } catch (err) {
        console.error('[useOrdensServico] Erro:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar ordens de serviço')
      } finally {
        setLoading(false)
      }
    }

    fetchOrdens()
  }, [empresaId, supabase])

  const updateOrdem = async (id: string, updates: Partial<OrdemServico>) => {
    try {
      const { data, error } = await supabase
        .from('ordens_servico')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setOrdens(prev => prev.map(ordem => ordem.id === id ? data : ordem))
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro ao atualizar ordem' }
    }
  }

  return { ordens, loading, error, updateOrdem }
}
