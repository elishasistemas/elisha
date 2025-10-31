'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { uploadCompanyLogo, updateCompanyLogo, validateImageUrl, removeCompanyLogo } from '@/lib/storage'
import type { Empresa } from '@/lib/supabase'

interface LogoUploadProps {
  empresa: Empresa
  onLogoUpdate: (logoUrl: string | null) => void
}

export function LogoUpload({ empresa, onLogoUpdate }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(empresa.logo_url)

  // Logs removidos para evitar ruído no console; mantenha apenas erros quando necessário

  const empresaInitials = empresa.nome
    ? empresa.nome.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'E'

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setMessage(null)

    try {
      const result = await uploadCompanyLogo(file, empresa.id)
      
      if (result.success && result.url) {
        // Atualizar no banco de dados
        const updateResult = await updateCompanyLogo(empresa.id, result.url)
        
        if (updateResult.success) {
          // Atualiza preview local e emite evento p/ NavUser
          setCurrentLogoUrl(result.url)
          try {
            localStorage.setItem('empresa_logo_url', result.url)
            window.dispatchEvent(new CustomEvent('empresaLogoUpdated', { detail: result.url }))
          } catch {}
          onLogoUpdate(result.url)
          setMessage({ type: 'success', text: 'Logo atualizado com sucesso!' })
        } else {
          setMessage({ type: 'error', text: updateResult.error || 'Erro ao atualizar logo' })
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro no upload' })
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Erro desconhecido' 
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    setIsUpdating(true)
    setMessage(null)

    try {
      const newUrl = urlInput.trim()
      const result = await updateCompanyLogo(empresa.id, newUrl)
      
      if (result.success) {
        setCurrentLogoUrl(newUrl)
        try {
          localStorage.setItem('empresa_logo_url', newUrl)
          window.dispatchEvent(new CustomEvent('empresaLogoUpdated', { detail: newUrl }))
        } catch {}
        onLogoUpdate(newUrl)
        setMessage({ type: 'success', text: 'Logo atualizado com sucesso!' })
        setUrlInput('')
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao atualizar logo' })
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Erro desconhecido' 
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!currentLogoUrl) return

    setIsUpdating(true)
    setMessage(null)

    try {
      // Remover do storage se for uma URL do Supabase
      if (currentLogoUrl.includes('supabase')) {
        await removeCompanyLogo(currentLogoUrl)
      }

      // Atualizar no banco
      const result = await updateCompanyLogo(empresa.id, null)
      
      if (result.success) {
        setCurrentLogoUrl(null)
        try {
          localStorage.removeItem('empresa_logo_url')
          window.dispatchEvent(new CustomEvent('empresaLogoUpdated', { detail: null }))
        } catch {}
        onLogoUpdate(null)
        setMessage({ type: 'success', text: 'Logo removido com sucesso!' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao remover logo' })
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Erro ao remover logo' 
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const validateUrl = (url: string) => {
    if (!url) return true
    const validation = validateImageUrl(url)
    return validation.isValid
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo da Empresa</CardTitle>
        <CardDescription>
          Atualize o logo que aparece no menu lateral
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview do Logo Atual */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 rounded-lg">
            <AvatarImage src={currentLogoUrl || undefined} alt={empresa.nome} />
            <AvatarFallback className="rounded-lg text-lg">{empresaInitials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{empresa.nome}</p>
            <p className="text-sm text-muted-foreground">
              {currentLogoUrl ? 'Logo configurado' : 'Nenhum logo configurado'}
            </p>
          </div>
        </div>

        {/* Upload por Arquivo */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">Upload de Arquivo</Label>
          <div className="flex items-center gap-2">
            <Input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isUploading ? 'Enviando...' : 'Escolher Arquivo'}
            </Button>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, GIF, WebP, SVG (máx. 2MB)
            </p>
          </div>
        </div>

        {/* Upload por URL */}
        <form onSubmit={handleUrlSubmit} className="space-y-2">
          <Label htmlFor="url-input">URL da Imagem</Label>
          <div className="flex gap-2">
            <Input
              id="url-input"
              type="url"
              placeholder="https://exemplo.com/logo.png"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isUpdating}
              className={urlInput && !validateUrl(urlInput) ? 'border-red-500' : ''}
            />
            <Button type="submit" disabled={isUpdating || !urlInput.trim()}>
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
            </Button>
          </div>
          {urlInput && !validateUrl(urlInput) && (
            <p className="text-xs text-red-500">
              URL inválida. Use uma URL de imagem válida.
            </p>
          )}
        </form>

        {/* Remover Logo */}
        {currentLogoUrl && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemoveLogo}
            disabled={isUpdating}
          >
            <X className="mr-2 h-4 w-4" />
            Remover Logo
          </Button>
        )}

        {/* Mensagens */}
        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {message.text}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
