'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Cliente } from '@/lib/supabase'

interface Equipamento {
  id?: string
  nome: string
  tipo: string
  pavimentos: string
  marca: string
  capacidade: string
}

interface ClientDialogProps {
  empresaId: string
  cliente?: Cliente | null
  onSuccess?: () => void
  trigger?: React.ReactNode
  mode?: 'create' | 'edit' | 'view'
  onRequestEdit?: () => void
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
  hideTrigger?: boolean
}

const STORAGE_KEY = 'client_dialog_form_data'

export function ClientDialog({ empresaId, cliente, onSuccess, trigger, mode = 'create', onRequestEdit, onOpenChange, defaultOpen, hideTrigger }: ClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localMode, setLocalMode] = useState<'create' | 'edit' | 'view'>(mode)
  const isView = localMode === 'view'
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  
  // Controla abertura do dialog (sem causar re-renders desnecessários)
  useEffect(() => {
    if (defaultOpen) {
      setOpen(true)
      setLocalMode(mode)
    }
  }, [defaultOpen, mode])
  // Accordion state persistido
  const [secBasic, setSecBasic] = useState(true)
  const [secResp, setSecResp] = useState(true)
  const [secContrato, setSecContrato] = useState(true)
  const [secEquip, setSecEquip] = useState(true)
  const persistKey = (s: string) => `client_dialog:${s}`
  const loadPersist = () => {
    try {
      setSecBasic((localStorage.getItem(persistKey('basic')) ?? '1') === '1')
      setSecResp((localStorage.getItem(persistKey('resp')) ?? '1') === '1')
      setSecContrato((localStorage.getItem(persistKey('contrato')) ?? '1') === '1')
      setSecEquip((localStorage.getItem(persistKey('equip')) ?? '1') === '1')
    } catch {}
  }
  const persist = (name: string, val: boolean) => { try { localStorage.setItem(persistKey(name), val ? '1' : '0') } catch {} }
  // carregar ao abrir
  useEffect(() => { if (open) loadPersist() }, [open])

  // Form state - carrega do localStorage (create) ou do cliente (edit/view)
  const getInitialFormData = () => {
    // Se houver cliente (edit/view), usar dados do cliente
    if (cliente && (mode === 'edit' || mode === 'view')) {
      const valorMensalStr = typeof (cliente as any).valor_mensal_contrato === 'number'
        ? (Number((cliente as any).valor_mensal_contrato) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : ''
      return {
        nome_local: cliente.nome_local || '',
        cnpj: cliente.cnpj || '',
        endereco_completo: cliente.endereco_completo || '',
        responsavel_nome: cliente.responsavel_nome || '',
        responsavel_telefone: cliente.responsavel_telefone || '',
        responsavel_email: cliente.responsavel_email || '',
        data_inicio_contrato: cliente.data_inicio_contrato || '',
        data_fim_contrato: cliente.data_fim_contrato || '',
        status_contrato: cliente.status_contrato || 'ativo',
        valor_mensal_contrato: valorMensalStr,
        numero_art: (cliente as any).numero_art || '',
      }
    }
    
    // Se estiver criando, tentar carregar do localStorage
    if (mode === 'create') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          return JSON.parse(saved)
        }
      } catch (e) {
        console.error('Erro ao carregar dados do localStorage:', e)
      }
    }
    
    // Dados vazios por padrão
    return {
      nome_local: '',
      cnpj: '',
      endereco_completo: '',
      responsavel_nome: '',
      responsavel_telefone: '',
      responsavel_email: '',
      data_inicio_contrato: '',
      data_fim_contrato: '',
      status_contrato: 'ativo',
    valor_mensal_contrato: '',
    numero_art: '',
    }
  }

  const [formData, setFormData] = useState(getInitialFormData())
  const [cnpjError, setCnpjError] = useState<string | null>(null)

  // Carregar dados do cliente APENAS quando abrir o dialog pela primeira vez
  useEffect(() => {
    if (open && !initialLoadDone) {
      if (cliente && (mode === 'edit' || mode === 'view')) {
        // Carregar dados do cliente ao abrir em modo edição/visualização
        const valorMensalStr = typeof (cliente as any).valor_mensal_contrato === 'number'
          ? (Number((cliente as any).valor_mensal_contrato) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : ''
        setFormData({
          nome_local: cliente.nome_local || '',
          cnpj: cliente.cnpj || '',
          endereco_completo: cliente.endereco_completo || '',
          responsavel_nome: cliente.responsavel_nome || '',
          responsavel_telefone: cliente.responsavel_telefone || '',
          responsavel_email: cliente.responsavel_email || '',
          data_inicio_contrato: cliente.data_inicio_contrato || '',
          data_fim_contrato: cliente.data_fim_contrato || '',
          status_contrato: cliente.status_contrato || 'ativo',
          valor_mensal_contrato: valorMensalStr,
          numero_art: (cliente as any).numero_art || '',
  })
      }
      setInitialLoadDone(true)
    }
  }, [open, initialLoadDone, mode, cliente])

  // Carregar equipamentos do cliente ao abrir em modo edição/visualização
  useEffect(() => {
    const fetchEquipamentos = async () => {
      if (!open || !cliente?.id) return
      try {
        const { createSupabaseBrowser } = await import('@/lib/supabase')
        const supabase = createSupabaseBrowser()
        let query = supabase
          .from('equipamentos')
          .select('id, nome, tipo, pavimentos, fabricante, capacidade')
          .eq('cliente_id', cliente.id)
          .order('created_at', { ascending: false })

        // Restringe por empresa se disponível (ajuda com RLS)
        if (empresaId) {
          query = query.eq('empresa_id', empresaId)
        }

        const { data, error } = await query

        if (error) return
        const list = (data || []).map((e: any) => ({
          id: e.id,
          nome: e.nome || '',
          tipo: e.tipo || '',
          pavimentos: e.pavimentos || '',
          marca: e.fabricante || '',
          capacidade: e.capacidade || '',
        }))
        setEquipamentos(list)
      } catch {}
      finally {
        setEquipamentosLoaded(true)
      }
    }
    fetchEquipamentos()
  }, [open, cliente?.id])
  
  // Reset flag quando fechar (separado para não causar loops)
  useEffect(() => {
    if (!open) {
      setInitialLoadDone(false)
    }
  }, [open])

  // Equipamentos state
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [equipamentosLoaded, setEquipamentosLoaded] = useState(false)

  // Quando não houver equipamentos no modo create/edit, abrir com um formulário em branco
  // - Create: sempre abre vazio
  // - Edit: abre somente após confirmar (fetch) que não existem equipamentos salvos
  useEffect(() => {
    if (!open || isView) return
    if (localMode === 'create') {
      if (equipamentos.length === 0) {
        setEquipamentos([{ nome: '', tipo: '', pavimentos: '', marca: '', capacidade: '' }])
      }
      return
    }
    if (localMode === 'edit' && equipamentosLoaded && equipamentos.length === 0) {
      setEquipamentos([{ nome: '', tipo: '', pavimentos: '', marca: '', capacidade: '' }])
    }
  }, [open, isView, equipamentos.length, localMode, equipamentosLoaded])

  // Persistir formData no localStorage sempre que mudar (apenas em modo create)
  useEffect(() => {
    if (mode === 'create' && !isView && open) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
      } catch (e) {
        console.error('Erro ao salvar no localStorage:', e)
      }
    }
  }, [formData, mode, isView, open])

  const handleChange = (field: string, value: string) => {
    if (isView) return
    // Usar callback para garantir que sempre temos o estado mais recente
    setFormData((prev: typeof formData) => ({
      ...prev,
      [field]: value
    }))
  }

  // Função para limpar dados salvos
  const clearSavedData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.error('Erro ao limpar localStorage:', e)
    }
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 14) // Limita a 14 dígitos
    
    let formatted = numbers
    if (numbers.length >= 2) {
      formatted = numbers.replace(/^(\d{2})(\d{0,3})/, '$1.$2')
    }
    if (numbers.length >= 5) {
      formatted = numbers.replace(/^(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3')
    }
    if (numbers.length >= 8) {
      formatted = numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4')
    }
    if (numbers.length >= 12) {
      formatted = numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5')
    }
    
    return formatted
  }
  
  const validateCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length === 0) {
      setCnpjError(null)
      return true
    }
    if (numbers.length < 14) {
      setCnpjError('CNPJ incompleto. Digite 14 dígitos.')
      return false
    }
    setCnpjError(null)
    return true
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
    }
    return value
  }

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    const amount = Number(numbers) / 100
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const addEquipamento = () => {
    if (isView) return
    setEquipamentos((prev) => ([
      ...prev,
      { nome: '', tipo: '', pavimentos: '', marca: '', capacidade: '' }
    ]))
  }

  const removeEquipamento = (index: number) => {
    if (isView) return
    setEquipamentos(equipamentos.filter((_, i) => i !== index))
    toast.success('Equipamento removido da lista')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isView) { setOpen(false); return }
    setLoading(true)

    try {
      const { createSupabaseBrowser } = await import('@/lib/supabase')
      const supabase = createSupabaseBrowser()

      // Validações básicas
      if (!formData.nome_local.trim()) {
        toast.error('Nome do cliente é obrigatório')
        setLoading(false)
        return
      }

      if (!formData.cnpj.trim()) {
        toast.error('CNPJ é obrigatório')
        setLoading(false)
        return
      }

      // Validar formato do CNPJ
      const cnpjNumeros = formData.cnpj.replace(/\D/g, '')
      if (cnpjNumeros.length !== 14) {
        setCnpjError('CNPJ deve ter 14 dígitos')
        toast.error('CNPJ deve ter 14 dígitos (99.999.999/9999-99)')
        setLoading(false)
        return
      }
      
      // Limpar erro se estava setado
      setCnpjError(null)

      // Garantir que CNPJ está formatado corretamente
      const cnpjFormatado = cnpjNumeros
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')

      // Preparar dados do cliente
      const valorMensal = formData.valor_mensal_contrato.replace(/\D/g, '')
      const valorMensalNumerico = valorMensal ? Number(valorMensal) / 100 : null

      const clienteData = {
        empresa_id: empresaId,
        nome_local: formData.nome_local.trim(),
        cnpj: cnpjFormatado,
        endereco_completo: formData.endereco_completo.trim() || null,
        responsavel_nome: formData.responsavel_nome.trim() || null,
        responsavel_telefone: formData.responsavel_telefone.trim() || null,
        responsavel_email: formData.responsavel_email.trim() || null,
        data_inicio_contrato: formData.data_inicio_contrato || null,
        data_fim_contrato: formData.data_fim_contrato || null,
        status_contrato: formData.status_contrato as 'ativo' | 'em_renovacao' | 'encerrado',
        valor_mensal_contrato: valorMensalNumerico,
        numero_art: formData.numero_art.trim() || null,
      }

      let clienteId: string

      if (localMode === 'edit' && cliente) {
        // Atualizar cliente
        const { error } = await supabase
          .from('clientes')
          .update(clienteData)
          .eq('id', cliente.id)

        if (error) throw error

        clienteId = cliente.id
        // Telemetry
        fetch('/api/telemetry/logsnag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: 'clients', event: 'Client Updated', icon: '✏️', tags: { cliente_id: cliente.id } }),
        }).catch(() => {})
      } else {
        // Criar novo cliente
        const { data: newCliente, error } = await supabase
          .from('clientes')
          .insert([clienteData])
          .select('id')
          .single()

        if (error) throw error
        if (!newCliente) throw new Error('Erro ao criar cliente')

        clienteId = newCliente.id
        // Telemetry
        fetch('/api/telemetry/logsnag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: 'clients', event: 'Client Created', icon: '🆕', tags: { cliente_id: clienteId } }),
        }).catch(() => {})
      }

      // Validar e criar equipamentos se houver (funciona tanto para criar quanto para editar)
      if (equipamentos.length > 0) {
        // Validar que todos os equipamentos têm campos obrigatórios preenchidos
        const equipamentosInvalidos = equipamentos.filter(
          eq => !eq.nome?.trim() || !eq.tipo?.trim()
        )

        if (equipamentosInvalidos.length > 0) {
          toast.error('Por favor, preencha o Nome e Tipo de todos os equipamentos antes de salvar')
          setLoading(false)
          return
        }

        // Mapear tipos do formulário para os valores do banco
        const mapearTipo = (tipo: string): string => {
          const mapeamento: Record<string, string> = {
            'Elétrico': 'ELEVADOR_ELETRICO',
            'Hidráulico': 'ELEVADOR_HIDRAULICO',
            'Plataforma': 'PLATAFORMA_VERTICAL',
            // Aceitar também valores já no formato correto
            'ELEVADOR_ELETRICO': 'ELEVADOR_ELETRICO',
            'ELEVADOR_HIDRAULICO': 'ELEVADOR_HIDRAULICO',
            'PLATAFORMA_VERTICAL': 'PLATAFORMA_VERTICAL',
          }
          return mapeamento[tipo] || tipo
        }

        const equipamentosData = equipamentos.map(eq => ({
          cliente_id: clienteId,
          empresa_id: empresaId,
          nome: eq.nome.trim(),
          tipo: mapearTipo(eq.tipo.trim()),
          pavimentos: eq.pavimentos?.trim() || null,
          fabricante: eq.marca?.trim() || null,
          capacidade: eq.capacidade?.trim() || null,
          ativo: true,
        }))

        const { error: eqError } = await supabase
          .from('equipamentos')
          .insert(equipamentosData)

        if (eqError) {
          console.error('Erro ao criar equipamentos:', eqError)
          toast.error(`Erro ao criar equipamentos: ${eqError.message}`)
          setLoading(false)
          return
        } else {
          fetch('/api/telemetry/logsnag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel: 'clients', event: 'Equipments Added', icon: '🧩', tags: { cliente_id: clienteId, count: equipamentosData.length } }),
          }).catch(() => {})
        }
      }

      // Mensagem de sucesso
      const actionText = localMode === 'edit' ? 'atualizado' : 'criado'
      const equipMsg = equipamentos.length > 0 ? ` e ${equipamentos.length} equipamento(s) ${localMode === 'edit' ? 'adicionado(s)' : 'criado(s)'}` : ''
      toast.success(`Cliente ${actionText} com sucesso${equipMsg}!`)

      // Limpar dados salvos do localStorage
      clearSavedData()

      setOpen(false)
      
      // Resetar form
      setFormData({
        nome_local: '',
        cnpj: '',
        endereco_completo: '',
        responsavel_nome: '',
        responsavel_telefone: '',
        responsavel_email: '',
        data_inicio_contrato: '',
        data_fim_contrato: '',
        status_contrato: 'ativo',
        valor_mensal_contrato: '',
        numero_art: '',
      })
      setEquipamentos([])

      // Chamar onSuccess APÓS fechar o diálogo para atualizar a lista
      if (onSuccess) {
        setTimeout(() => onSuccess(), 100)
      }
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error)
      
      // Mensagens de erro amigáveis
      let errorMessage = 'Erro ao salvar cliente'
      
      if (error?.code === '23514') {
        if (error.message?.includes('clientes_cnpj_format')) {
          errorMessage = 'CNPJ inválido. Use o formato: 99.999.999/9999-99'
        } else if (error.message?.includes('status_contrato')) {
          errorMessage = 'Status do contrato inválido'
        } else {
          errorMessage = 'Dados inválidos. Verifique os campos preenchidos.'
        }
      } else if (error?.code === '23505') {
        errorMessage = 'CNPJ já cadastrado para esta empresa'
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Handler para fechar o dialog
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    onOpenChange?.(isOpen)
    
    // Se estiver fechando (cancelando), limpar dados salvos
    if (!isOpen && mode === 'create') {
      clearSavedData()
    }
    if (!isOpen) {
      setEquipamentosLoaded(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          {trigger || (
            <Button>
              {mode === 'edit' ? (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Cliente
                </>
              )}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>{isView ? 'Visualizar Cliente' : mode === 'edit' ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
              <DialogDescription>
                {isView ? 'Todos os campos estão desabilitados' : (mode === 'edit' ? 'Atualize as informações do cliente abaixo.' : 'Preencha os dados do novo cliente abaixo.')}
              </DialogDescription>
            </div>
            {/* Removido botão Editar do header em modo visualização */}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados Básicos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Dados Básicos</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => { const v = !secBasic; setSecBasic(v); persist('basic', v) }}>{secBasic ? 'Recolher' : 'Expandir'}</Button>
            </div>
            {secBasic && (
            <>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="nome_local">
                  Nome/Razão Social <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome_local"
                  value={formData.nome_local}
                  onChange={(e) => handleChange('nome_local', e.target.value)}
                  placeholder="Ex: Empresa ABC Ltda"
                  required
                  disabled={isView}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">
                  CNPJ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => {
                    const formatted = formatCNPJ(e.target.value)
                    handleChange('cnpj', formatted)
                    // Limpa erro ao digitar
                    if (cnpjError) setCnpjError(null)
                  }}
                  onBlur={(e) => validateCNPJ(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  required
                  disabled={isView}
                  className={cnpjError ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {cnpjError && (
                  <p className="text-xs text-destructive">{cnpjError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status_contrato">Status do Contrato</Label>
                <Select 
                  value={formData.status_contrato} 
                  onValueChange={(value) => handleChange('status_contrato', value)}
                  disabled={isView}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="em_renovacao">Em Renovação</SelectItem>
                    <SelectItem value="encerrado">Encerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endereco_completo">Endereço Completo</Label>
              <Textarea
                id="endereco_completo"
                value={formData.endereco_completo}
                onChange={(e) => handleChange('endereco_completo', e.target.value)}
                placeholder="Rua, número, complemento, bairro, cidade, estado, CEP"
                rows={2}
                disabled={isView}
              />
            </div>
            </>
            )}
          </div>

          {/* Dados do Responsável */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Responsável</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => { const v = !secResp; setSecResp(v); persist('resp', v) }}>{secResp ? 'Recolher' : 'Expandir'}</Button>
            </div>
            
            {secResp && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="responsavel_nome">Nome do Responsável</Label>
                <Input
                  id="responsavel_nome"
                  value={formData.responsavel_nome}
                  onChange={(e) => handleChange('responsavel_nome', e.target.value)}
                  placeholder="Ex: João Silva"
                  disabled={isView}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel_telefone">Telefone</Label>
                <Input
                  id="responsavel_telefone"
                  value={formData.responsavel_telefone}
                  onChange={(e) => handleChange('responsavel_telefone', formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  disabled={isView}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel_email">E-mail</Label>
                <Input
                  id="responsavel_email"
                  type="email"
                  value={formData.responsavel_email}
                  onChange={(e) => handleChange('responsavel_email', e.target.value)}
                  placeholder="responsavel@empresa.com"
                  disabled={isView}
                />
              </div>
            </div>
            )}
          </div>

          {/* Dados do Contrato */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Contrato</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => { const v = !secContrato; setSecContrato(v); persist('contrato', v) }}>{secContrato ? 'Recolher' : 'Expandir'}</Button>
            </div>
            
            {secContrato && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_inicio_contrato">Data de Início</Label>
                <Input
                  id="data_inicio_contrato"
                  type="date"
                  value={formData.data_inicio_contrato}
                  onChange={(e) => handleChange('data_inicio_contrato', e.target.value)}
                  disabled={isView}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_fim_contrato">Data de Término</Label>
                <Input
                  id="data_fim_contrato"
                  type="date"
                  value={formData.data_fim_contrato}
                  onChange={(e) => handleChange('data_fim_contrato', e.target.value)}
                  disabled={isView}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor_mensal_contrato">Valor Mensal</Label>
                <Input
                  id="valor_mensal_contrato"
                  value={formData.valor_mensal_contrato}
                  onChange={(e) => handleChange('valor_mensal_contrato', formatCurrency(e.target.value))}
                  placeholder="0,00"
                  disabled={isView}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero_art">Número da ART</Label>
                <Input
                  id="numero_art"
                  value={formData.numero_art}
                  onChange={(e) => handleChange('numero_art', e.target.value)}
                  placeholder="Ex: 123456789"
                  disabled={isView}
                />
              </div>
            </div>
            )}
          </div>

          {/* Equipamentos */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Equipamentos</h3>
              <span className="text-xs text-muted-foreground">
                {(() => {
                  const count = isView
                    ? equipamentos.filter(e => (e.nome || e.tipo || e.marca || e.pavimentos || e.capacidade)).length
                    : equipamentos.filter(e => (e.nome?.trim() && e.tipo?.trim())).length
                  return `${count} equipamento(s)`
                })()}
              </span>
            </div>
            
            {/* Toggle seção equipamentos */}
            <div className="flex justify-end -mt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => {
                const el = document.getElementById('sec_equip')
                if (!el) return
                const hidden = el.getAttribute('data-open') !== '1'
                el.setAttribute('data-open', hidden ? '1' : '0')
                try { localStorage.setItem('client_dialog:equip', hidden ? '1' : '0') } catch {}
              }}>{(typeof window !== 'undefined' && localStorage.getItem('client_dialog:equip') === '0') ? 'Expandir' : 'Recolher'}</Button>
            </div>
              
              {/* Lista de equipamentos adicionados */}
              <div id="sec_equip" data-open="1">
              {isView && equipamentos.filter(e => (e.nome || e.tipo || e.marca || e.pavimentos || e.capacidade)).length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2 bg-muted/20">
                  <Accordion type="multiple" className="w-full">
                    {equipamentos
                      .filter(e => (e.nome || e.tipo || e.marca || e.pavimentos || e.capacidade))
                      .map((eq, index, arr) => (
                      <AccordionItem
                        key={index}
                        value={`eq-${index}`}
                        className={(arr.length === 1 || index === arr.length - 1) ? 'border-b-0' : ''}
                      >
                        <AccordionTrigger className="px-2">
                          <div className="flex items-center justify-between w-full text-left">
                            <div className="flex-1 pr-2">
                              <p className="font-medium text-sm">{eq.nome || 'Sem nome'}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {(eq.tipo || '-')} • {(eq.marca || '-')} • {(eq.capacidade || '-')}
                        </p>
                      </div>
                      {!isView && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeEquipamento(index) }}
                        className="h-8 w-8 p-0"
                                aria-label="Remover equipamento"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      )}
                    </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-2 pb-3">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <div className="text-muted-foreground">Tipo</div>
                              <div className="font-medium text-foreground">{eq.tipo || '-'}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Marca</div>
                              <div className="font-medium text-foreground">{eq.marca || '-'}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Pavimentos</div>
                              <div className="font-medium text-foreground">{eq.pavimentos || '-'}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Capacidade</div>
                              <div className="font-medium text-foreground">{eq.capacidade || '-'}</div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                  ))}
                  </Accordion>
                </div>
              )}

              {/* Formulários de equipamentos (edit/create) */}
              {!isView && (
                <div className="space-y-3 p-3 border rounded-md bg-muted/10">
                  {equipamentos.length === 0 && (
                    <div className="text-xs text-muted-foreground">Nenhum equipamento adicionado ainda.</div>
                  )}
                  {equipamentos.map((eq, index) => (
                    <div key={index} className="grid grid-cols-2 gap-3 p-3 border rounded-md bg-background">
                <div className="col-span-2 space-y-2">
                        <Label htmlFor={`eq_nome_${index}`}>
                          Nome do Equipamento <span className="text-destructive">*</span>
                        </Label>
                  <Input
                          id={`eq_nome_${index}`}
                          value={eq.nome}
                          onChange={(e) => setEquipamentos(prev => prev.map((it, i) => i === index ? { ...it, nome: e.target.value } : it))}
                    placeholder="Ex: Elevador Principal"
                    required
                    className={!eq.nome?.trim() ? 'border-destructive' : ''}
                  />
                </div>

                <div className="space-y-2">
                        <Label htmlFor={`eq_tipo_${index}`}>
                          Tipo <span className="text-destructive">*</span>
                        </Label>
                  <Select
                          value={eq.tipo}
                          onValueChange={(value) => setEquipamentos(prev => prev.map((it, i) => i === index ? { ...it, tipo: value } : it))}
                          required
                  >
                          <SelectTrigger className={!eq.tipo?.trim() ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Elétrico">Elétrico</SelectItem>
                      <SelectItem value="Hidráulico">Hidráulico</SelectItem>
                      <SelectItem value="Plataforma">Plataforma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                        <Label htmlFor={`eq_marca_${index}`}>Marca</Label>
                  <Input
                          id={`eq_marca_${index}`}
                          value={eq.marca}
                          onChange={(e) => setEquipamentos(prev => prev.map((it, i) => i === index ? { ...it, marca: e.target.value } : it))}
                    placeholder="Ex: Otis, Schindler"
                  />
                </div>

                <div className="space-y-2">
                        <Label htmlFor={`eq_pav_${index}`}>Pavimentos</Label>
                  <Input
                          id={`eq_pav_${index}`}
                          value={eq.pavimentos}
                          onChange={(e) => setEquipamentos(prev => prev.map((it, i) => i === index ? { ...it, pavimentos: e.target.value } : it))}
                    placeholder="Ex: Térreo ao 10º"
                  />
                </div>

                <div className="space-y-2">
                        <Label htmlFor={`eq_cap_${index}`}>Capacidade</Label>
                  <Input
                          id={`eq_cap_${index}`}
                          value={eq.capacidade}
                          onChange={(e) => setEquipamentos(prev => prev.map((it, i) => i === index ? { ...it, capacidade: e.target.value } : it))}
                    placeholder="Ex: 8 pessoas, 600kg"
                  />
                </div>

                      <div className="col-span-2 flex justify-end">
                  <Button
                    type="button"
                          variant="ghost"
                          onClick={() => removeEquipamento(index)}
                          className="h-8"
                        >
                          <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button type="button" variant="outline" onClick={addEquipamento} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Equipamento
                  </Button>
                </div>
              )}
              </div>
          </div>

          <DialogFooter>
            {isView ? (
              <>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Fechar</Button>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onRequestEdit) onRequestEdit(); else setLocalMode('edit')
                  }}
                >
                  Editar
                </Button>
              </>
            ) : (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    clearSavedData()
                    setEquipamentos([])
                    handleOpenChange(false)
                  }} 
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : localMode === 'edit' ? 'Atualizar' : 'Criar Cliente'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
