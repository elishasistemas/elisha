// Cache simples em memória para dados que mudam pouco
interface CacheEntry<T> {
  data: T
  timestamp: number
}

// Armazena promises em andamento para evitar duplicação
const pendingRequests = new Map<string, Promise<any>>()

class DataCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private readonly TTL = 5 * 60 * 1000 // 5 minutos

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const isExpired = Date.now() - entry.timestamp > this.TTL
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  invalidateAll(): void {
    this.cache.clear()
  }

  // Deduplicação de requisições
  async dedupe<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Se já tem em cache, retorna
    const cached = this.get<T>(key)
    if (cached) return cached

    // Se já tem requisição em andamento, aguarda
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key) as Promise<T>
    }

    // Cria nova requisição
    const promise = fetcher().then(data => {
      this.set(key, data)
      pendingRequests.delete(key)
      return data
    }).catch(err => {
      pendingRequests.delete(key)
      throw err
    })

    pendingRequests.set(key, promise)
    return promise
  }
}

export const dataCache = new DataCache()
