'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { UserPlus } from 'iconoir-react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { useZonas } from '@/hooks/use-supabase'

interface CreateUserColaboradorDialogProps {
  empresaId: string
  onUserCreated?: () => void
}

export function CreateUserColaboradorDialog({ empresaId, onUserCreated }: CreateUserColaboradorDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'tecnico' as 'admin' | 'supervisor' | 'tecnico',
    nome: '',
    funcao: '',
    telefone: '',
    whatsapp_numero: '',
  })

  // Estados para gerenciamento de zonas
  const [atendeTodasZonas, setAtendeTodasZonas] = useState(false)
  const [zonasSelecionadas, setZonasSelecionadas] = useState<string[]>([])
  const { zonas, loading: zonasLoading } = useZonas(empresaId)

  // Accordions com persistência
  const [secAuth, setSecAuth] = useState(true)
  const [secPessoais, setSecPessoais] = useState(true)
  const [secContato, setSecContato] = useState(true)
  const [secZonas, setSecZonas] = useState(true)
  
  const key = (s: string) => `create_user_dialog:${s}`
  useEffect(() => {
    if (!open) return
    try {
      setSecAuth((localStorage.getItem(key('auth')) ?? '1') === '1')
      setSecPessoais((localStorage.getItem(key('pessoais')) ?? '1') === '1')
      setSecContato((localStorage.getItem(key('contato')) ?? '1') === '1')
      setSecZonas((localStorage.getItem(key('zonas')) ?? '1') === '1')
    } catch {}
  }, [open])
  
  const persist = (name: string, val: boolean) => { 
    try { 
      localStorage.setItem(key(name), val ? '1' : '0') 
    } catch {} 
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    const limited = numbers.slice(0, 11)
    if (limited.length <= 2) {
      return limited
    } else if (limited.length <= 7) {
      return `(${limited.slice(0, 2)})${limited.slice(2)}`
    } else {
      return `(${limited.slice(0, 2)})${limited.slice(2, 7)}-${limited.slice(7)}`
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações antes de setar loading
    if (!formData.username.trim()) {
      toast.error('Nome de usuário é obrigatório')
      return
    }

    if (!formData.email.trim()) {
      toast.error('Email é obrigatório')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('E-mail inválido')
      return
    }

    if (!formData.password) {
      toast.error('Senha é obrigatória')
      return
    }

    if (formData.password.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    if (!formData.whatsapp_numero.trim()) {
      toast.error('WhatsApp é obrigatório')
      return
    }

    setLoading(true)

    try {

      const supabase = createSupabaseBrowser()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      // 1. Criar usuário via API de usuários
      const createUserResponse = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          nome: formData.nome.trim(),
          telefone: formData.telefone.replace(/\D/g, '') || null,
          whatsapp: formData.whatsapp_numero.replace(/\D/g, ''),
          funcao: formData.funcao.trim() || null,
          role: formData.role,
          empresa_id: empresaId,
        })
      })

      if (!createUserResponse.ok) {
        const error = await createUserResponse.json()
        throw new Error(error.error || 'Erro ao criar usuário')
      }

      const responseData = await createUserResponse.json()
      const userId = responseData.user?.id

      // 2. Verificar se já criou colaborador/técnico (a API já faz isso para role=tecnico)
      // Buscar o colaborador criado pela API
      const colaboradorId = responseData.user?.tecnico_id
      let finalColaboradorId = colaboradorId

      // 3. Criar zonas_tecnicos (se for técnico e não atende todas as zonas)
      if (formData.role === 'tecnico' && finalColaboradorId && !atendeTodasZonas && zonasSelecionadas.length > 0) {
        const zonasData = zonasSelecionadas.map(zonaId => ({
          zona_id: zonaId,
          tecnico_id: finalColaboradorId
        }))
        const { error: zonasError } = await supabase
          .from('zonas_tecnicos')
          .insert(zonasData)
        
        if (zonasError) {
          console.error('Erro ao criar zonas_tecnicos:', zonasError)
          toast.warning('Usuário criado, mas houve erro ao associar zonas')
        }
      }

      toast.success(`Usuário ${formData.email} criado com sucesso!`)
      
      // Telemetry
      fetch('/api/telemetry/logsnag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          channel: 'users', 
          event: 'User Created', 
          icon: '👤', 
          tags: { empresa_id: empresaId, role: formData.role } 
        }),
      }).catch(() => {})

      setOpen(false)
      onUserCreated?.()

      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'tecnico',
        nome: '',
        funcao: '',
        telefone: '',
        whatsapp_numero: '',
      })
      setAtendeTodasZonas(false)
      setZonasSelecionadas([])

    } catch (error: any) {
      console.error('[create-user-colaborador-dialog] Erro:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      supervisor: 'Supervisor',
      tecnico: 'Técnico',
    }
    return labels[role] || role
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => {
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'tecnico',
        nome: '',
        funcao: '',
        telefone: '',
        whatsapp_numero: '',
      })
      setAtendeTodasZonas(false)
      setZonasSelecionadas([])
    }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Criar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>
            Preencha os dados completos do novo colaborador da empresa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Accordion 
            type="multiple" 
            value={[
              secAuth ? 'auth' : '', 
              secPessoais ? 'pessoais' : '', 
              secContato ? 'contato' : '', 
              secZonas ? 'zonas' : ''
            ].filter(Boolean) as string[]} 
            onValueChange={(v) => {
              const set = new Set(v as string[])
              const a = set.has('auth')
              const p = set.has('pessoais')
              const c = set.has('contato')
              const z = set.has('zonas')
              setSecAuth(a)
              setSecPessoais(p)
              setSecContato(c)
              setSecZonas(z)
              persist('auth', a)
              persist('pessoais', p)
              persist('contato', c)
              persist('zonas', z)
            }} 
            className="w-full"
          >
            {/* Autenticação e Permissões */}
            <AccordionItem value="auth">
              <AccordionTrigger>Autenticação e Permissões</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">
                      Nome de Usuário <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleChange('username', e.target.value)}
                      placeholder="joao.silva"
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Usado para login (apenas letras minúsculas, números, pontos e underscores)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      E-mail <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="colaborador@empresa.com"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Senha <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirmar Senha <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      placeholder="Digite a senha novamente"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">
                      Papel / Permissão <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: 'admin' | 'supervisor' | 'tecnico') => 
                        handleChange('role', value)
                      }
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">⚙️ Administrador</SelectItem>
                        <SelectItem value="supervisor">👔 Supervisor</SelectItem>
                        <SelectItem value="tecnico">🔧 Técnico</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {formData.role === 'admin' && 'Acesso total ao sistema da empresa'}
                      {formData.role === 'supervisor' && 'Gerencia ordens de serviço e equipe'}
                      {formData.role === 'tecnico' && 'Acesso apenas às suas ordens de serviço'}
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Dados Pessoais */}
            <AccordionItem value="pessoais">
              <AccordionTrigger>Dados Pessoais</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">
                      Nome Completo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleChange('nome', e.target.value)}
                      placeholder="Ex: João Silva"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="funcao">Função/Cargo</Label>
                    <Input
                      id="funcao"
                      value={formData.funcao}
                      onChange={(e) => handleChange('funcao', e.target.value)}
                      placeholder="Ex: Técnico Sênior, Engenheiro"
                      disabled={loading}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Contato */}
            <AccordionItem value="contato">
              <AccordionTrigger>Contato</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => handleChange('telefone', formatPhone(e.target.value))}
                      placeholder="(99)99999-9999"
                      maxLength={14}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">Formato: (DDD)Número</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_numero">
                      WhatsApp <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="whatsapp_numero"
                      value={formData.whatsapp_numero}
                      onChange={(e) => handleChange('whatsapp_numero', formatPhone(e.target.value))}
                      placeholder="(99)99999-9999"
                      maxLength={14}
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Formato: (DDD)Número
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Zonas de Atendimento */}
            <AccordionItem value="zonas">
              <AccordionTrigger>Zonas de Atendimento</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="atende_todas_zonas"
                      checked={atendeTodasZonas}
                      onCheckedChange={(checked) => {
                        setAtendeTodasZonas(checked as boolean)
                        if (checked) {
                          setZonasSelecionadas([])
                        }
                      }}
                      disabled={loading}
                    />
                    <Label htmlFor="atende_todas_zonas" className="cursor-pointer">
                      Atende todas as zonas
                    </Label>
                  </div>

                  {!atendeTodasZonas && (
                    <div className="space-y-2">
                      <Label>Selecione as zonas específicas:</Label>
                      {zonasLoading ? (
                        <p className="text-sm text-muted-foreground">Carregando zonas...</p>
                      ) : zonas.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhuma zona cadastrada</p>
                      ) : (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-3">
                          {zonas.map((zona) => (
                            <div key={zona.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`zona-${zona.id}`}
                                checked={zonasSelecionadas.includes(zona.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setZonasSelecionadas([...zonasSelecionadas, zona.id])
                                  } else {
                                    setZonasSelecionadas(zonasSelecionadas.filter(id => id !== zona.id))
                                  }
                                }}
                                disabled={loading}
                              />
                              <Label htmlFor={`zona-${zona.id}`} className="cursor-pointer font-normal">
                                {zona.nome}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
