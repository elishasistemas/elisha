'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import type { Profile, Empresa, Cliente, Equipamento, Colaborador, OrdemServico } from '@/lib/supabase'
import { dataCache } from '@/lib/cache'

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
      setProfile(null)
      return
    }

    let mounted = true

    const fetchProfile = async () => {
      try {
        const cacheKey = `profile:${userId}`
        
        // Usar dedupe para evitar requisições duplicadas
        const data = await dataCache.dedupe(cacheKey, async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single()

          if (error) throw error
          return data
        })
        
        if (mounted) {
          setProfile(data)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar perfil')
          setLoading(false)
        }
      }
    }

    fetchProfile()

    return () => {
      mounted = false
    }
  }, [userId, supabase])

  return { profile, loading, error }
}

export function useEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    let mounted = true

    const fetchEmpresas = async () => {
      try {
        // Usar dedupe para evitar requisições duplicadas
        const data = await dataCache.dedupe('empresas', async () => {
          const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .order('created_at', { ascending: false })
          if (error) throw error
          return data || []
        })
        
        if (mounted) {
          setEmpresas(data)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          console.error('[useEmpresas] Erro:', err)
          setError(err instanceof Error ? err.message : 'Erro ao carregar empresas')
          setLoading(false)
        }
      }
    }

    fetchEmpresas()

    return () => {
      mounted = false
    }
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
      
      // Invalidar cache
      dataCache.invalidate('empresas')
      
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
      
      // Invalidar cache
      dataCache.invalidate('empresas')
      
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro ao atualizar empresa' }
    }
  }

  return { empresas, loading, error, createEmpresa, updateEmpresa }
}

export function useClientes(empresaId?: string, opts?: { page?: number; pageSize?: number; search?: string; refreshKey?: number }) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState<number>(0)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    if (!empresaId) {
      setLoading(false)
      setClientes([])
      return
    }

    const fetchClientes = async () => {
      try {
        setLoading(true)
        // Pega o token JWT do Supabase
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        if (!token) {
          throw new Error('Usuário não autenticado')
        }

        const page = opts?.page ?? 1
        const pageSize = opts?.pageSize ?? 1000
        const search = (opts?.search || '').trim()
        const params = new URLSearchParams({
          empresaId,
          page: String(page),
          pageSize: String(pageSize),
          ...(search ? { search } : {})
        })

        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        const res = await fetch(`${BACKEND_URL}/api/v1/clientes?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!res.ok) throw new Error('Erro ao buscar clientes')
        const result = await res.json()
        setClientes(result.data || result || [])
        setCount(result.count || result.length || 0)
      } catch (err) {
        console.error('[useClientes] Erro:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar clientes')
      } finally {
        setLoading(false)
      }
    }

    fetchClientes()
  }, [empresaId, supabase, opts?.page, opts?.pageSize, opts?.search, opts?.refreshKey])

  const createCliente = async (cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([cliente])
        .select()
        .single()

      if (error) throw error
      setClientes(prev => [data, ...prev])
      // Telemetry: client created
      fetch('/api/telemetry/logsnag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'clients', event: 'Client Created', icon: '🆕', tags: { cliente_id: data.id, empresa_id: data.empresa_id } }),
      }).catch(() => {})
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro ao criar cliente' }
    }
  }

  const updateCliente = async (id: string, updates: Partial<Omit<Cliente, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setClientes(prev => prev.map(c => c.id === id ? data : c))
      // Telemetry: client updated
      fetch('/api/telemetry/logsnag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'clients', event: 'Client Updated', icon: '✏️', tags: { cliente_id: id } }),
      }).catch(() => {})
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro ao atualizar cliente' }
    }
  }

  const deleteCliente = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)

      if (error) throw error
      setClientes(prev => prev.filter(c => c.id !== id))
      // Telemetry: client deleted
      fetch('/api/telemetry/logsnag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'clients', event: 'Client Deleted', icon: '🗑️', tags: { cliente_id: id } }),
      }).catch(() => {})
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Erro ao deletar cliente' }
    }
  }

  return { clientes, loading, error, count, createCliente, updateCliente, deleteCliente }
}

export function useEquipamentos(clienteId?: string, opts?: { page?: number; pageSize?: number; search?: string; refreshKey?: number }) {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState<number>(0)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    if (!clienteId) {
      setLoading(false)
      return
    }

    const fetchEquipamentos = async () => {
      try {
        setLoading(true)
        // Pega o token JWT do Supabase
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        if (!token) {
          throw new Error('Usuário não autenticado')
        }

        const page = opts?.page ?? 1
        const pageSize = opts?.pageSize ?? 1000
        const search = (opts?.search || '').trim()
        const params = new URLSearchParams({
          clienteId,
          page: String(page),
          pageSize: String(pageSize),
          ...(search ? { search } : {})
        })

        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        const res = await fetch(`${BACKEND_URL}/api/v1/equipamentos?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!res.ok) throw new Error('Erro ao buscar equipamentos')
        const result = await res.json()
        console.log('[useEquipamentos] Resultado do backend:', result)
        setEquipamentos(result.data || result || [])
        setCount(result.count || result.length || 0)
      } catch (err) {
        console.error('[useEquipamentos] Erro:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar equipamentos')
      } finally {
        setLoading(false)
      }
    }

    fetchEquipamentos()
  }, [clienteId, supabase, opts?.page, opts?.pageSize, opts?.search, opts?.refreshKey])

  // NOVO MÉTODO: criar equipamento via backend
  const createEquipamento = async (equipamento: Omit<Equipamento, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Usuário não autenticado')
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const res = await fetch(`${BACKEND_URL}/api/v1/equipamentos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(equipamento)
      })
      if (!res.ok) throw new Error('Erro ao criar equipamento')
      const result = await res.json()
      setEquipamentos(prev => [result, ...prev])
      return { data: result, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro ao criar equipamento' }
    }
  }

  return { equipamentos, loading, error, count, createEquipamento }
}

export function useColaboradores(empresaId?: string, opts?: { page?: number; pageSize?: number; search?: string; refreshKey?: number }) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState<number>(0)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    if (!empresaId) {
      setLoading(false)
      return
    }

    const fetchColaboradores = async () => {
      try {
        setLoading(true)
        // Pega o token JWT do Supabase
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        if (!token) {
          throw new Error('Usuário não autenticado')
        }

        const page = opts?.page ?? 1
        const pageSize = opts?.pageSize ?? 1000
        const search = (opts?.search || '').trim()
        const params = new URLSearchParams({
          empresaId,
          page: String(page),
          pageSize: String(pageSize),
          ...(search ? { search } : {})
        })

        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        const res = await fetch(`${BACKEND_URL}/api/v1/colaboradores?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!res.ok) throw new Error('Erro ao buscar colaboradores')
        const result = await res.json()
        console.log('[useColaboradores] Resultado do backend:', result)
        setColaboradores(Array.isArray(result) ? result : [])
        setCount(Array.isArray(result) ? result.length : 0)
      } catch (err) {
        console.error('[useColaboradores] Erro:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar colaboradores')
      } finally {
        setLoading(false)
      }
    }

    fetchColaboradores()
  }, [empresaId, supabase, opts?.page, opts?.pageSize, opts?.search, opts?.refreshKey])

  const createColaborador = async (colaborador: Omit<Colaborador, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .insert([colaborador])
        .select()
        .single()

      if (error) throw error
      setColaboradores(prev => [data, ...prev])
      // Telemetry: technician created
      fetch('/api/telemetry/logsnag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'technicians', event: 'Technician Created', icon: '👷', tags: { tecnico_id: data.id, empresa_id: data.empresa_id } }),
      }).catch(() => {})
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro ao criar colaborador' }
    }
  }

  const updateColaborador = async (id: string, updates: Partial<Omit<Colaborador, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setColaboradores(prev => prev.map(c => c.id === id ? data : c))
      // Telemetry: technician updated
      fetch('/api/telemetry/logsnag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'technicians', event: 'Technician Updated', icon: '✏️', tags: { tecnico_id: id } }),
      }).catch(() => {})
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro ao atualizar colaborador' }
    }
  }

  const toggleAtivoColaborador = async (id: string, ativo: boolean) => {
    try {
      // Se estiver desativando, verificar se há OSs em andamento
      if (!ativo) {
        const { data: osEmAndamento, error: osError } = await supabase
          .from('ordens_servico')
          .select('id, numero_os, status')
          .eq('tecnico_id', id)
          .in('status', ['novo', 'em_andamento', 'aguardando_assinatura'])
          .limit(5)

        if (osError) {
          console.error('Erro ao verificar OSs:', osError)
        } else if (osEmAndamento && osEmAndamento.length > 0) {
          const osNums = osEmAndamento.map(os => os.numero_os || os.id.slice(0, 8)).join(', ')
          return { 
            data: null, 
            error: `Técnico possui ${osEmAndamento.length} OS(s) em andamento (${osNums}). Por favor, finalize ou reatribua estas OSs antes de desativar o técnico.`,
            hasActiveOS: true,
            activeOS: osEmAndamento
          }
        }
      }

      const { data, error } = await supabase
        .from('colaboradores')
        .update({ ativo })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      // Atualizar o estado local imediatamente para feedback rápido
      setColaboradores(prev => prev.map(c => c.id === id ? { ...c, ativo } : c))
      
      // Telemetry: technician toggled
      fetch('/api/telemetry/logsnag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'technicians', event: ativo ? 'Technician Activated' : 'Technician Deactivated', icon: ativo ? '✅' : '⛔', tags: { tecnico_id: id, ativo } }),
      }).catch(() => {})
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro ao atualizar status' }
    }
  }

  const deleteColaborador = async (id: string) => {
    try {
      const { error } = await supabase
        .from('colaboradores')
        .delete()
        .eq('id', id)

      if (error) throw error
      setColaboradores(prev => prev.filter(c => c.id !== id))
      // Telemetry: technician deleted
      fetch('/api/telemetry/logsnag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'technicians', event: 'Technician Deleted', icon: '🗑️', tags: { tecnico_id: id } }),
      }).catch(() => {})
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Erro ao deletar colaborador' }
    }
  }

  return { colaboradores, loading, error, count, createColaborador, updateColaborador, toggleAtivoColaborador, deleteColaborador }
}

export function useOrdensServico(
  empresaId?: string,
  opts?: {
    page?: number
    pageSize?: number
    search?: string
    orderBy?: keyof OrdemServico | 'created_at' | 'status' | 'prioridade'
    ascending?: boolean
    tecnicoId?: string
    refreshKey?: number
  }
) {
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState<number>(0)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    if (!empresaId) {
      setLoading(false)
      return
    }

    const fetchOrdens = async () => {
      try {
        setLoading(true)
        // Pega o token JWT do Supabase
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        if (!token) {
          throw new Error('Usuário não autenticado')
        }

        const page = opts?.page ?? 1
        const pageSize = opts?.pageSize ?? 10
        const search = (opts?.search || '').trim()
        const orderBy = opts?.orderBy || 'prioridade'
        
        const params = new URLSearchParams({
          empresaId,
          page: String(page),
          pageSize: String(pageSize),
          ...(search ? { search } : {}),
          ...(opts?.tecnicoId ? { tecnicoId: opts.tecnicoId } : {}),
          ...(orderBy ? { orderBy: String(orderBy) } : {}),
        })

        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        const res = await fetch(`${BACKEND_URL}/api/v1/ordens-servico?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!res.ok) throw new Error('Erro ao buscar ordens de serviço')
        const result = await res.json()
        console.log('[useOrdensServico] Resultado do backend:', result)
        setOrdens(result.data || result || [])
        setCount(result.count || result.length || 0)
      } catch (err) {
        console.error('[useOrdensServico] Erro:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar ordens de serviço')
      } finally {
        setLoading(false)
      }
    }

    fetchOrdens()
  }, [empresaId, supabase, opts?.page, opts?.pageSize, opts?.search, opts?.orderBy, opts?.ascending, opts?.tecnicoId, opts?.refreshKey])

  const createOrdem = async (ordem: Omit<OrdemServico, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Usuário não autenticado')
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const res = await fetch(`${BACKEND_URL}/api/v1/ordens-servico`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ordem)
      })
      if (!res.ok) throw new Error('Erro ao criar ordem de serviço')
      const data = await res.json()
      // Telemetry: order created
      fetch('/api/telemetry/logsnag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'orders', event: 'Order Created', icon: '🆕', tags: { os_id: data.id, empresa_id: data.empresa_id, tecnico_id: data.tecnico_id || 'null' } }),
      }).catch(() => {})
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro ao criar ordem' }
    }
  }

  const updateOrdem = async (id: string, updates: Partial<OrdemServico>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Usuário não autenticado')
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const res = await fetch(`${BACKEND_URL}/api/v1/ordens-servico/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })
      if (!res.ok) throw new Error('Erro ao atualizar ordem de serviço')
      const data = await res.json()
      setOrdens(prev => prev.map(ordem => ordem.id === id ? data : ordem))
      // Telemetry: order updated
      fetch('/api/telemetry/logsnag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'orders', event: 'Order Updated', icon: '✏️', tags: { os_id: id, status: updates?.status || 'updated' } }),
      }).catch(() => {})
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro ao atualizar ordem' }
    }
  }

  const deleteOrdem = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Usuário não autenticado')
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const res = await fetch(`${BACKEND_URL}/api/v1/ordens-servico/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!res.ok) throw new Error('Erro ao deletar ordem de serviço')
      // Telemetry: order deleted
      fetch('/api/telemetry/logsnag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'orders', event: 'Order Deleted', icon: '🗑️', tags: { os_id: id } }),
      }).catch(() => {})
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Erro ao deletar ordem' }
    }
  }

  return { ordens, loading, error, count, createOrdem, updateOrdem, deleteOrdem }
}

export function useChecklists(empresaId?: string, opts?: { page?: number; pageSize?: number; search?: string; refreshKey?: number }) {
  const [checklists, setChecklists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState<number>(0)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    if (!empresaId) {
      setLoading(false)
      setChecklists([])
      return
    }

    const fetchChecklists = async () => {
      try {
        setLoading(true)
        // Pega o token JWT do Supabase
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        if (!token) {
          throw new Error('Usuário não autenticado')
        }

        const page = opts?.page ?? 1
        const pageSize = opts?.pageSize ?? 10
        const search = (opts?.search || '').trim()
        const params = new URLSearchParams({
          empresaId,
          page: String(page),
          pageSize: String(pageSize),
          ...(search ? { search } : {})
        })

        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        const res = await fetch(`${BACKEND_URL}/api/v1/checklists?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!res.ok) throw new Error('Erro ao buscar checklists')
        const result = await res.json()
        console.log('[useChecklists] Resultado do backend:', result)
        setChecklists(result.data || result || [])
        setCount(result.count || result.length || 0)
      } catch (err) {
        console.error('[useChecklists] Erro:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar checklists')
      } finally {
        setLoading(false)
      }
    }

    fetchChecklists()
  }, [empresaId, supabase, opts?.page, opts?.pageSize, opts?.search, opts?.refreshKey])

  const createChecklist = async (checklist: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Usuário não autenticado')
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const res = await fetch(`${BACKEND_URL}/api/v1/checklists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(checklist)
      })
      if (!res.ok) throw new Error('Erro ao criar checklist')
      const data = await res.json()
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro ao criar checklist' }
    }
  }

  const updateChecklist = async (id: string, updates: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Usuário não autenticado')
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const res = await fetch(`${BACKEND_URL}/api/v1/checklists/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })
      if (!res.ok) throw new Error('Erro ao atualizar checklist')
      const data = await res.json()
      setChecklists(prev => prev.map(c => c.id === id ? data : c))
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro ao atualizar checklist' }
    }
  }

  const deleteChecklist = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Usuário não autenticado')
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const res = await fetch(`${BACKEND_URL}/api/v1/checklists/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!res.ok) throw new Error('Erro ao deletar checklist')
      setChecklists(prev => prev.filter(c => c.id !== id))
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Erro ao deletar checklist' }
    }
  }

  return { checklists, loading, error, count, createChecklist, updateChecklist, deleteChecklist }
}
