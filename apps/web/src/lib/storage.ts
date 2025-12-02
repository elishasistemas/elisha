import { createSupabaseBrowser } from './supabase'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export interface ImageValidation {
  isValid: boolean
  error?: string
}

/**
 * Valida se uma URL é uma imagem válida
 */
export function validateImageUrl(url: string): ImageValidation {
  try {
    const urlObj = new URL(url)
    
    // Verificar se é uma URL válida
    if (!urlObj.protocol.startsWith('http')) {
      return { isValid: false, error: 'URL deve usar protocolo HTTP/HTTPS' }
    }

    // Verificar extensões de imagem comuns
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    const pathname = urlObj.pathname.toLowerCase()
    const hasValidExtension = imageExtensions.some(ext => pathname.endsWith(ext))
    
    if (!hasValidExtension) {
      return { isValid: false, error: 'URL deve apontar para uma imagem válida (.jpg, .png, .gif, .webp, .svg)' }
    }

    return { isValid: true }
  } catch {
    return { isValid: false, error: 'URL inválida' }
  }
}

/**
 * Upload de logo da empresa para o backend
 */
export async function uploadCompanyLogo(
  file: File,
  empresaId: string
): Promise<UploadResult> {
  try {
    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Tipo de arquivo não suportado. Use JPG, PNG, GIF, WebP ou SVG.'
      }
    }

    // Validar tamanho (máximo 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Arquivo muito grande. Tamanho máximo: 2MB'
      }
    }

    // Obter token de autenticação
    const supabase = createSupabaseBrowser()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      return {
        success: false,
        error: 'Usuário não autenticado'
      }
    }

    // Preparar FormData para upload
    const formData = new FormData()
    formData.append('file', file)

    // Fazer upload para o backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/v1/empresas/${empresaId}/logo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
      return {
        success: false,
        error: `Erro no upload: ${errorData.message || response.statusText}`
      }
    }

    const data = await response.json()
    
    // Backend retorna a URL completa do Supabase Storage
    return {
      success: true,
      url: data.logo_url
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido no upload'
    }
  }
}

/**
 * Remove logo antigo da empresa
 */
export async function removeCompanyLogo(logoUrl: string): Promise<boolean> {
  try {
    const supabase = createSupabaseBrowser()
    
    // Extrair caminho do arquivo da URL
    const url = new URL(logoUrl)
    const pathParts = url.pathname.split('/')
    const fileName = pathParts[pathParts.length - 1]
    const filePath = `empresas/logos/${fileName}`

    // Deletar arquivo do storage
    const { error } = await supabase.storage
      .from('empresas')
      .remove([filePath])

    return !error
  } catch {
    return false
  }
}

/**
 * Atualiza logo da empresa no banco de dados
 */
export async function updateCompanyLogo(
  empresaId: string,
  logoUrl: string | null
): Promise<UploadResult> {
  try {
    const supabase = createSupabaseBrowser()

    // Se logoUrl estiver vazio/null, remover logo (definir como null no banco)
    if (!logoUrl) {
      const { error } = await supabase
        .from('empresas')
        .update({ logo_url: null })
        .eq('id', empresaId)

      if (error) {
        return { success: false, error: `Erro ao remover logo: ${error.message}` }
      }

      return { success: true, url: undefined }
    }

    // Validar URL antes de salvar
    const validation = validateImageUrl(logoUrl)
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      }
    }

    // Atualizar no banco
    const { error } = await supabase
      .from('empresas')
      .update({ logo_url: logoUrl })
      .eq('id', empresaId)

    if (error) {
      return {
        success: false,
        error: `Erro ao atualizar logo: ${error.message}`
      }
    }

    return { success: true, url: logoUrl }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar logo'
    }
  }
}
