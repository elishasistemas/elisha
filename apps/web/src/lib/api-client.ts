/**
 * API Client para o backend local
 * Substitui chamadas diretas ao Supabase REST API por chamadas ao backend NestJS
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface FetchOptions extends RequestInit {
  token?: string;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const apiClient = {
  // Profiles
  profiles: {
    getMe: (token?: string) => 
      apiFetch('/profiles/me', { token }),
    getByUserId: (userId: string, token?: string) => 
      apiFetch(`/profiles/${userId}`, { token }),
    update: (userId: string, data: any, token?: string) => 
      apiFetch(`/profiles/${userId}`, { 
        method: 'PATCH', 
        body: JSON.stringify(data),
        token 
      }),
  },

  // Empresas
  empresas: {
    list: (token?: string) => 
      apiFetch('/empresas', { token }),
    getById: (id: string, token?: string) => 
      apiFetch(`/empresas/${id}`, { token }),
    create: (data: any, token?: string) => 
      apiFetch('/empresas', { 
        method: 'POST', 
        body: JSON.stringify(data),
        token 
      }),
    uploadLogo: async (id: string, file: File, token?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/empresas/${id}/logo`, {
        method: 'POST',
        body: formData,
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    },
  },

  // Ordens de Serviço
  ordensServico: {
    list: (params: { empresaId: string; page?: number; pageSize?: number; search?: string; status?: string; tecnicoId?: string }, token?: string) => {
      const queryParams = new URLSearchParams();
      if (params.empresaId) queryParams.append('empresaId', params.empresaId);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.tecnicoId) queryParams.append('tecnicoId', params.tecnicoId);
      
      return apiFetch(`/ordens-servico?${queryParams}`, { token });
    },
    getById: (id: string, token?: string) => 
      apiFetch(`/ordens-servico/${id}`, { token }),
    create: (data: any, token?: string) => 
      apiFetch('/ordens-servico', { 
        method: 'POST', 
        body: JSON.stringify(data),
        token 
      }),
    update: (id: string, data: any, token?: string) => 
      apiFetch(`/ordens-servico/${id}`, { 
        method: 'PATCH', 
        body: JSON.stringify(data),
        token 
      }),
    delete: (id: string, token?: string) => 
      apiFetch(`/ordens-servico/${id}`, { 
        method: 'DELETE',
        token 
      }),
  },

  // Checklists
  checklists: {
    list: (empresaId: string, token?: string) => {
      const queryParams = new URLSearchParams();
      if (empresaId) queryParams.append('empresaId', empresaId);
      return apiFetch(`/checklists?${queryParams}`, { token });
    },
    getById: (id: string, token?: string) => 
      apiFetch(`/checklists/${id}`, { token }),
    create: (data: any, token?: string) => 
      apiFetch('/checklists', { 
        method: 'POST', 
        body: JSON.stringify(data),
        token 
      }),
    update: (id: string, data: any, token?: string) => 
      apiFetch(`/checklists/${id}`, { 
        method: 'PATCH', 
        body: JSON.stringify(data),
        token 
      }),
    delete: (id: string, token?: string) => 
      apiFetch(`/checklists/${id}`, { 
        method: 'DELETE',
        token 
      }),
  },

  // Colaboradores
  colaboradores: {
    list: (params: { empresaId: string; page?: number; pageSize?: number; search?: string }, token?: string) => {
      const queryParams = new URLSearchParams();
      if (params.empresaId) queryParams.append('empresaId', params.empresaId);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      
      return apiFetch(`/colaboradores?${queryParams}`, { token });
    },
    getById: (id: string, token?: string) => 
      apiFetch(`/colaboradores/${id}`, { token }),
    create: (data: any, token?: string) => 
      apiFetch('/colaboradores', { 
        method: 'POST', 
        body: JSON.stringify(data),
        token 
      }),
    update: (id: string, data: any, token?: string) => 
      apiFetch(`/colaboradores/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data),
        token 
      }),
    delete: (id: string, token?: string) => 
      apiFetch(`/colaboradores/${id}`, { 
        method: 'DELETE',
        token 
      }),
  },

  // Equipamentos
  equipamentos: {
    list: (params: { empresaId?: string; clienteId?: string; page?: number; pageSize?: number }, token?: string) => {
      const queryParams = new URLSearchParams();
      if (params.empresaId) queryParams.append('empresaId', params.empresaId);
      if (params.clienteId) queryParams.append('clienteId', params.clienteId);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      
      return apiFetch(`/equipamentos?${queryParams}`, { token });
    },
    getById: (id: string, token?: string) => 
      apiFetch(`/equipamentos/${id}`, { token }),
    create: (data: any, token?: string) => 
      apiFetch('/equipamentos', { 
        method: 'POST', 
        body: JSON.stringify(data),
        token 
      }),
    update: (id: string, data: any, token?: string) => 
      apiFetch(`/equipamentos/${id}`, { 
        method: 'PATCH', 
        body: JSON.stringify(data),
        token 
      }),
    delete: (id: string, token?: string) => 
      apiFetch(`/equipamentos/${id}`, { 
        method: 'DELETE',
        token 
      }),
  },
};

export default apiClient;
