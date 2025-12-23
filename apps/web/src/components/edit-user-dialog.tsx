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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Pencil, Eye, EyeOff } from 'lucide-react'
import { useZonas } from '@/hooks/use-supabase'
import { PasswordStrength } from '@/components/password-strength'

interface EditUserDialogProps {
    user: any
    onUserUpdated?: () => void
}

export function EditUserDialog({ user, onUserUpdated }: EditUserDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const [formData, setFormData] = useState({
        userId: '',
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

    // Accordion state
    const [secAuth, setSecAuth] = useState(true)
    const [secPessoais, setSecPessoais] = useState(true)
    const [secContato, setSecContato] = useState(true)

    useEffect(() => {
        if (open && user) {
            setFormData({
                userId: user.user_id || user.id, // Fallback safely
                username: user.username || '',
                email: user.email || '',
                password: '',
                confirmPassword: '',
                role: user.role || 'tecnico',
                nome: user.nome || user.name || '',
                funcao: user.funcao || '',
                telefone: user.telefone || '',
                whatsapp_numero: user.whatsapp_numero || '',
            })
        }
    }, [open, user])

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

        // Validações básicas
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

        // Validação de senha SE preenchida
        if (formData.password) {
            if (formData.password.length < 8) {
                toast.error('A senha deve ter no mínimo 8 caracteres')
                return
            }
            if (formData.password !== formData.confirmPassword) {
                toast.error('As senhas não coincidem')
                return
            }
        }

        if (!formData.nome.trim()) {
            toast.error('Nome é obrigatório')
            return
        }

        setLoading(true)

        try {
            const response = await fetch(`/api/admin/users/${formData.userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username.trim(),
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password || undefined, // Envia undefined se vazio
                    nome: formData.nome.trim(),
                    telefone: formData.telefone.replace(/\D/g, '') || null,
                    whatsapp: formData.whatsapp_numero.replace(/\D/g, ''),
                    funcao: formData.funcao.trim() || null,
                    role: formData.role,
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erro ao atualizar usuário')
            }

            toast.success(`Usuário ${formData.username} atualizado com sucesso!`)
            setOpen(false)
            onUserUpdated?.()

        } catch (error: any) {
            console.error('[edit-user-dialog] Erro:', error)
            toast.error(`Erro: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Usuário</DialogTitle>
                    <DialogDescription>
                        Atualize os dados do colaborador. Deixe a senha em branco para mantê-la.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Accordion
                        type="multiple"
                        value={[
                            secAuth ? 'auth' : '',
                            secPessoais ? 'pessoais' : '',
                            secContato ? 'contato' : ''
                        ].filter(Boolean) as string[]}
                        onValueChange={(v) => {
                            const set = new Set(v as string[])
                            setSecAuth(set.has('auth'))
                            setSecPessoais(set.has('pessoais'))
                            setSecContato(set.has('contato'))
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

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="password">
                                                Nova Senha (opcional)
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={formData.password}
                                                    onChange={(e) => handleChange('password', e.target.value)}
                                                    placeholder="Mínimo 8 caracteres"
                                                    disabled={loading}
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">
                                                Confirmar Nova Senha
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="confirmPassword"
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    value={formData.confirmPassword}
                                                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                                    placeholder="Digite novamente"
                                                    disabled={loading || !formData.password}
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Força da senha (apenas se preenchendo) */}
                                    {formData.password && (
                                        <div className="space-y-2">
                                            <PasswordStrength
                                                password={formData.password}
                                                confirm={formData.confirmPassword}
                                                minLength={8}
                                            />
                                        </div>
                                    )}

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
                                            placeholder="Ex: Técnico Sênior"
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
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="whatsapp_numero">
                                            WhatsApp
                                        </Label>
                                        <Input
                                            id="whatsapp_numero"
                                            value={formData.whatsapp_numero}
                                            onChange={(e) => handleChange('whatsapp_numero', formatPhone(e.target.value))}
                                            placeholder="(99)99999-9999"
                                            maxLength={14}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
