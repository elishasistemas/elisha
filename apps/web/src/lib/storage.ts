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
 * Upload de logo da empresa para Supabase Storage
 */
export async function uploadCompanyLogo(
  file: File,
  empresaId: string
): Promise<UploadResult> {
  try {
    const supabase = createSupabaseBrowser()

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

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${empresaId}-logo-${Date.now()}.${fileExt}`
    const filePath = `empresas/logos/${fileName}`

    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from('empresas')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      return {
        success: false,
        error: `Erro no upload: ${error.message}`
      }
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('empresas')
      .getPublicUrl(filePath)

    return {
      success: true,
      url: urlData.publicUrl
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
