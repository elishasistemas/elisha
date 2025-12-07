'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import type { Cliente } from '@/lib/supabase'
import { useZonas, useColaboradores } from '@/hooks/use-supabase'
import { ZonaDialog } from './zona-dialog'

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

export function ClientDialog({ empresaId, cliente, onSuccess, trigger, mode = 'create', onRequestEdit, onOpenChange, defaultOpen, hideTrigger }: ClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localMode, setLocalMode] = useState<'create' | 'edit' | 'view'>(mode)
  const isView = localMode === 'view'
  // Abre também quando cliente mudar (para reabrir com novos cliques)
  useEffect(() => { if (defaultOpen) setOpen(true) }, [defaultOpen])
  useEffect(() => {
    if (defaultOpen && cliente) {
      setOpen(true)
    }
    setLocalMode(mode)
  }, [defaultOpen, cliente?.id, mode])
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

  // Form state
  const [formData, setFormData] = useState({
    nome_local: cliente?.nome_local || '',
    cnpj: cliente?.cnpj || '',
    endereco_completo: cliente?.endereco_completo || '',
    responsavel_nome: cliente?.responsavel_nome || '',
    responsavel_telefone: cliente?.responsavel_telefone || '',
    responsavel_email: cliente?.responsavel_email || '',
    data_inicio_contrato: cliente?.data_inicio_contrato || '',
    data_fim_contrato: cliente?.data_fim_contrato || '',
    status_contrato: cliente?.status_contrato || 'ativo',
    valor_mensal_contrato: '',
    numero_art: '',
    zona_id: cliente?.zona_id || '',
  })

  // Zona state and hooks
  const [zonaDialogOpen, setZonaDialogOpen] = useState(false)
  const [zonaRefreshKey, setZonaRefreshKey] = useState(0)
  const { zonas, loading: zonasLoading } = useZonas(empresaId, { refreshKey: zonaRefreshKey })
  const { colaboradores, loading: colaboradoresLoading } = useColaboradores(empresaId)

  // Equipamentos state
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [novoEquipamento, setNovoEquipamento] = useState<Equipamento>({
    nome: '',
    tipo: '',
    pavimentos: '',
    marca: '',
    capacidade: '',
  })
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(false)

  // Carregar equipamentos existentes quando abrir cliente em modo edição/visualização
  useEffect(() => {
    if (!open || !cliente?.id) {
      setEquipamentos([])
      return
    }

    const loadEquipamentos = async () => {
      setLoadingEquipamentos(true)
      try {
        const { createSupabaseBrowser } = await import('@/lib/supabase')
        const supabase = createSupabaseBrowser()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) return

        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const res = await fetch(`${BACKEND_URL}/api/v1/equipamentos?clienteId=${cliente.id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })

        if (res.ok) {
          const result = await res.json()
          const equipamentosData = result.data || []
          // Mapear para o formato do state local
          const equipamentosMapeados = equipamentosData.map((eq: any) => ({
            id: eq.id,
            nome: eq.nome || '',
            tipo: eq.tipo || '',
            pavimentos: eq.pavimentos || '',
            marca: eq.fabricante || '',
            capacidade: eq.capacidade || '',
          }))
          setEquipamentos(equipamentosMapeados)
        }
      } catch (error) {
        console.error('Erro ao carregar equipamentos:', error)
      } finally {
        setLoadingEquipamentos(false)
      }
    }

    loadEquipamentos()
  }, [open, cliente?.id])

  const handleChange = (field: string, value: string) => {
    if (isView) return
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const formatCNPJ = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '')
    // Limita a 14 dígitos (CNPJ completo)
    const limited = numbers.slice(0, 14)
    // Aplica a máscara: XX.XXX.XXX/XXXX-XX
    return limited
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  const formatPhone = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '')
    // Limita a 11 dígitos (DDD + 9 dígitos)
    const limited = numbers.slice(0, 11)
    // Aplica a máscara: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (limited.length <= 10) {
      return limited
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return limited
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  const isValidEmail = (email: string): boolean => {
    if (!email) return true // Email opcional
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
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
    if (!novoEquipamento.nome.trim() || !novoEquipamento.tipo.trim()) {
      toast.error('Nome e Tipo são obrigatórios para o equipamento')
      return
    }

    setEquipamentos([...equipamentos, novoEquipamento])
    setNovoEquipamento({
      nome: '',
      tipo: '',
      pavimentos: '',
      marca: '',
      capacidade: '',
    })
    toast.success('Equipamento adicionado à lista')
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

      // Validar email se preenchido
      if (formData.responsavel_email.trim() && !isValidEmail(formData.responsavel_email.trim())) {
        toast.error('E-mail inválido')
        setLoading(false)
        return
      }

      // Validar datas de contrato
      if (formData.data_inicio_contrato && formData.data_fim_contrato) {
        const dataInicio = new Date(formData.data_inicio_contrato)
        const dataFim = new Date(formData.data_fim_contrato)
        
        if (dataInicio > dataFim) {
          toast.error('Data de início não pode ser maior que data de término')
          setLoading(false)
          return
        }
      }

      // Validar se tem pelo menos um equipamento
      if (equipamentos.length === 0) {
        toast.error('Todo cliente precisa ter pelo menos um equipamento cadastrado')
        setLoading(false)
        return
      }

      // Preparar dados do cliente
      const valorMensal = formData.valor_mensal_contrato.replace(/\D/g, '')
      const valorMensalNumerico = valorMensal ? Number(valorMensal) / 100 : null

      const clienteData = {
        empresa_id: empresaId,
        nome_local: formData.nome_local.trim(),
        cnpj: formData.cnpj.trim(),
        endereco_completo: formData.endereco_completo.trim() || null,
        responsavel_nome: formData.responsavel_nome.trim() || null,
        responsavel_telefone: formData.responsavel_telefone.trim() || null,
        responsavel_email: formData.responsavel_email.trim() || null,
        data_inicio_contrato: formData.data_inicio_contrato || null,
        data_fim_contrato: formData.data_fim_contrato || null,
        status_contrato: formData.status_contrato as 'ativo' | 'em_renovacao' | 'encerrado',
        valor_mensal_contrato: valorMensalNumerico,
        numero_art: formData.numero_art.trim() || null,
        zona_id: formData.zona_id || null,
      }

      let clienteId: string
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

      // Pegar token do Supabase para autenticação no backend
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Sessão expirada. Faça login novamente.')
        setLoading(false)
        return
      }

      if (localMode === 'edit' && cliente) {
        // Atualizar cliente via API
        const response = await fetch(`${BACKEND_URL}/api/v1/clientes/${cliente.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(clienteData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Erro ao atualizar cliente')
        }

        clienteId = cliente.id
        // Telemetry
        fetch('/api/telemetry/logsnag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: 'clients', event: 'Client Updated', icon: '✏️', tags: { cliente_id: cliente.id } }),
        }).catch(() => {})
      } else {
        // Criar novo cliente via API
        const response = await fetch(`${BACKEND_URL}/api/v1/clientes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(clienteData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Erro ao criar cliente')
        }

        const newCliente = await response.json()
        clienteId = newCliente.id
        // Telemetry
        fetch('/api/telemetry/logsnag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: 'clients', event: 'Client Created', icon: '🆕', tags: { cliente_id: clienteId } }),
        }).catch(() => {})
      }

      // Criar equipamentos se houver (funciona tanto para criar quanto para editar)
      if (equipamentos.length > 0) {
        const equipamentosData = equipamentos.map(eq => ({
          cliente_id: clienteId,
          empresa_id: empresaId,
          nome: eq.nome,
          tipo: eq.tipo,
          pavimentos: eq.pavimentos || null,
          fabricante: eq.marca || null,
          capacidade: eq.capacidade || null,
          ativo: true,
        }))

        // Criar equipamentos via backend (um por vez para garantir consistência)
        const equipamentosPromises = equipamentosData.map(eqData => 
          fetch(`${BACKEND_URL}/api/v1/equipamentos`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify(eqData)
          })
        )

        try {
          const responses = await Promise.all(equipamentosPromises)
          const failedRequests = responses.filter(r => !r.ok)
          
          if (failedRequests.length > 0) {
            console.error('Erro ao criar equipamentos:', failedRequests)
            toast.warning(`Cliente ${localMode === 'edit' ? 'atualizado' : 'criado'}, mas houve erro ao adicionar ${failedRequests.length} equipamento(s)`)
          } else {
            // Telemetry
            fetch('/api/telemetry/logsnag', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ channel: 'clients', event: 'Equipments Added', icon: '🧩', tags: { cliente_id: clienteId, count: equipamentos.length } }),
            }).catch(() => {})
          }
        } catch (error) {
          console.error('Erro ao criar equipamentos:', error)
          toast.warning(`Cliente ${localMode === 'edit' ? 'atualizado' : 'criado'}, mas houve erro ao adicionar equipamentos`)
        }
      }

      // Mensagem de sucesso
      const actionText = localMode === 'edit' ? 'atualizado' : 'criado'
      const equipMsg = equipamentos.length > 0 ? ` e ${equipamentos.length} equipamento(s) ${localMode === 'edit' ? 'adicionado(s)' : 'criado(s)'}` : ''
      toast.success(`Cliente ${actionText} com sucesso${equipMsg}!`)

      // Chamar onSuccess ANTES de fechar o diálogo para garantir que a lista seja atualizada
      if (onSuccess) {
        onSuccess()
      }

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
      setNovoEquipamento({
        nome: '',
        tipo: '',
        pavimentos: '',
        marca: '',
        capacidade: '',
      })
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); onOpenChange?.(o) }}>
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
              <DialogTitle>{isView ? 'Detalhe do Cliente' : mode === 'edit' ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
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
                  onChange={(e) => handleChange('cnpj', formatCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  required
                  disabled={isView}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status_contrato">Status do Contrato</Label>
                <Select value={formData.status_contrato} onValueChange={(value) => handleChange('status_contrato', value)}>
                  <SelectTrigger disabled={isView}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="em_renovacao">Em Renovação</SelectItem>
                    <SelectItem value="encerrado">Encerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zona_id">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Zona
                </Label>
                <Select 
                  value={formData.zona_id || 'sem_zona'} 
                  onValueChange={(value) => {
                    if (value === 'criar_nova') {
                      setZonaDialogOpen(true)
                    } else if (value === 'sem_zona') {
                      handleChange('zona_id', '')
                    } else {
                      handleChange('zona_id', value)
                    }
                  }}
                  disabled={isView || zonasLoading}
                >
                  <SelectTrigger id="zona_id">
                    <SelectValue placeholder="Selecione uma zona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem_zona">Sem zona</SelectItem>
                    <SelectItem value="criar_nova" className="text-primary font-medium">
                      + Criar nova zona
                    </SelectItem>
                    {zonas.map((zona) => (
                      <SelectItem key={zona.id} value={zona.id}>
                        {zona.nome}
                      </SelectItem>
                    ))}
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
              <h3 className="text-sm font-semibold">
                Equipamentos <span className="text-red-500">*</span>
              </h3>
              <span className="text-xs text-muted-foreground">
                {equipamentos.length} equipamento(s)
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
              {loadingEquipamentos ? (
                <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                  Carregando equipamentos...
                </div>
              ) : equipamentos.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2 bg-muted/20">
                  {equipamentos.map((eq, index) => (
                    <div key={eq.id || index} className="flex items-center justify-between text-sm p-2 border rounded bg-background">
                      <div className="flex-1">
                        <p className="font-medium">{eq.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {eq.tipo} • {eq.marca} • {eq.capacidade}
                        </p>
                      </div>
                      {!isView && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEquipamento(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  {localMode === 'edit' || mode === 'view' ? 'Nenhum equipamento cadastrado.' : 'Nenhum equipamento adicionado ainda.'}
                </p>
              )}

              {/* Formulário para adicionar novo equipamento */}
              <div className="grid grid-cols-2 gap-3 p-3 border rounded-md bg-muted/10">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="eq_nome">Nome do Equipamento</Label>
                  <Input
                    id="eq_nome"
                    value={novoEquipamento.nome}
                    onChange={(e) => setNovoEquipamento({ ...novoEquipamento, nome: e.target.value })}
                    disabled={isView}
                    placeholder="Ex: Elevador Principal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eq_tipo">Tipo</Label>
                  <Select
                    value={novoEquipamento.tipo}
                    onValueChange={(value) => setNovoEquipamento({ ...novoEquipamento, tipo: value })}
                  >
                    <SelectTrigger disabled={isView}>
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
                  <Label htmlFor="eq_marca">Marca</Label>
                  <Input
                    id="eq_marca"
                    value={novoEquipamento.marca}
                    onChange={(e) => setNovoEquipamento({ ...novoEquipamento, marca: e.target.value })}
                    disabled={isView}
                    placeholder="Ex: Otis, Schindler"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eq_pavimentos">Pavimentos</Label>
                  <Input
                    id="eq_pavimentos"
                    value={novoEquipamento.pavimentos}
                    onChange={(e) => setNovoEquipamento({ ...novoEquipamento, pavimentos: e.target.value })}
                    disabled={isView}
                    placeholder="Ex: Térreo ao 10º"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eq_capacidade">Capacidade</Label>
                  <Input
                    id="eq_capacidade"
                    value={novoEquipamento.capacidade}
                    onChange={(e) => setNovoEquipamento({ ...novoEquipamento, capacidade: e.target.value })}
                    disabled={isView}
                    placeholder="Ex: 8 pessoas, 600kg"
                  />
                </div>

                <div className="col-span-2">
                  {!isView && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addEquipamento}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Equipamento
                  </Button>
                  )}
                </div>
              </div>
              </div>
          </div>

          <DialogFooter>
            {isView ? (
              <>
                <Button type="button" variant="outline" onClick={() => { setOpen(false); onOpenChange?.(false) }}>Fechar</Button>
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
                <Button type="button" variant="outline" onClick={() => { setOpen(false); onOpenChange?.(false) }} disabled={loading}>
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

      <ZonaDialog
        open={zonaDialogOpen}
        onOpenChange={setZonaDialogOpen}
        empresaId={empresaId}
        colaboradores={colaboradores}
        onSuccess={(zonaId) => {
          setZonaRefreshKey(prev => prev + 1)
          handleChange('zona_id', zonaId)
          toast.success('Zona criada e selecionada!')
        }}
      />
    </Dialog>
  )
}
