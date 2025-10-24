'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
  mode?: 'create' | 'edit'
}

export function ClientDialog({ empresaId, cliente, onSuccess, trigger, mode = 'create' }: ClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

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
  })

  // Equipamentos state
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [novoEquipamento, setNovoEquipamento] = useState<Equipamento>({
    nome: '',
    tipo: '',
    pavimentos: '',
    marca: '',
    capacidade: '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return value
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
    setEquipamentos(equipamentos.filter((_, i) => i !== index))
    toast.success('Equipamento removido da lista')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      }

      let clienteId: string

      if (mode === 'edit' && cliente) {
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

        const { error: eqError } = await supabase
          .from('equipamentos')
          .insert(equipamentosData)

        if (eqError) {
          console.error('Erro ao criar equipamentos:', eqError)
          toast.warning(`Cliente ${mode === 'edit' ? 'atualizado' : 'criado'}, mas houve erro ao adicionar alguns equipamentos`)
        } else {
          // Telemetry
          fetch('/api/telemetry/logsnag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel: 'clients', event: 'Equipments Added', icon: '🧩', tags: { cliente_id: clienteId, count: equipamentos.length } }),
          }).catch(() => {})
        }
      }

      // Mensagem de sucesso
      const actionText = mode === 'edit' ? 'atualizado' : 'criado'
      const equipMsg = equipamentos.length > 0 ? ` e ${equipamentos.length} equipamento(s) ${mode === 'edit' ? 'adicionado(s)' : 'criado(s)'}` : ''
      toast.success(`Cliente ${actionText} com sucesso${equipMsg}!`)

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

      // Chamar onSuccess APÓS fechar o diálogo para atualizar a lista
      if (onSuccess) {
        setTimeout(() => onSuccess(), 100)
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Atualize as informações do cliente abaixo.' 
              : 'Preencha os dados do novo cliente abaixo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados Básicos */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Dados Básicos</h3>
            
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status_contrato">Status do Contrato</Label>
                <Select value={formData.status_contrato} onValueChange={(value) => handleChange('status_contrato', value)}>
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
              />
            </div>
          </div>

          {/* Dados do Responsável */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Responsável</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="responsavel_nome">Nome do Responsável</Label>
                <Input
                  id="responsavel_nome"
                  value={formData.responsavel_nome}
                  onChange={(e) => handleChange('responsavel_nome', e.target.value)}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel_telefone">Telefone</Label>
                <Input
                  id="responsavel_telefone"
                  value={formData.responsavel_telefone}
                  onChange={(e) => handleChange('responsavel_telefone', formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
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
                />
              </div>
            </div>
          </div>

          {/* Dados do Contrato */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Contrato</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_inicio_contrato">Data de Início</Label>
                <Input
                  id="data_inicio_contrato"
                  type="date"
                  value={formData.data_inicio_contrato}
                  onChange={(e) => handleChange('data_inicio_contrato', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_fim_contrato">Data de Término</Label>
                <Input
                  id="data_fim_contrato"
                  type="date"
                  value={formData.data_fim_contrato}
                  onChange={(e) => handleChange('data_fim_contrato', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor_mensal_contrato">Valor Mensal</Label>
                <Input
                  id="valor_mensal_contrato"
                  value={formData.valor_mensal_contrato}
                  onChange={(e) => handleChange('valor_mensal_contrato', formatCurrency(e.target.value))}
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero_art">Número da ART</Label>
                <Input
                  id="numero_art"
                  value={formData.numero_art}
                  onChange={(e) => handleChange('numero_art', e.target.value)}
                  placeholder="Ex: 123456789"
                />
              </div>
            </div>
          </div>

          {/* Equipamentos */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Equipamentos</h3>
              <span className="text-xs text-muted-foreground">
                {equipamentos.length} equipamento(s) {mode === 'edit' ? 'para adicionar' : 'adicionado(s)'}
              </span>
            </div>
              
              {/* Lista de equipamentos adicionados */}
              {equipamentos.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2 bg-muted/20">
                  {equipamentos.map((eq, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 border rounded bg-background">
                      <div className="flex-1">
                        <p className="font-medium">{eq.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {eq.tipo} • {eq.marca} • {eq.capacidade}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEquipamento(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulário para adicionar novo equipamento */}
              <div className="grid grid-cols-2 gap-3 p-3 border rounded-md bg-muted/10">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="eq_nome">Nome do Equipamento</Label>
                  <Input
                    id="eq_nome"
                    value={novoEquipamento.nome}
                    onChange={(e) => setNovoEquipamento({ ...novoEquipamento, nome: e.target.value })}
                    placeholder="Ex: Elevador Principal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eq_tipo">Tipo</Label>
                  <Input
                    id="eq_tipo"
                    value={novoEquipamento.tipo}
                    onChange={(e) => setNovoEquipamento({ ...novoEquipamento, tipo: e.target.value })}
                    placeholder="Ex: Elevador, Escada Rolante"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eq_marca">Marca</Label>
                  <Input
                    id="eq_marca"
                    value={novoEquipamento.marca}
                    onChange={(e) => setNovoEquipamento({ ...novoEquipamento, marca: e.target.value })}
                    placeholder="Ex: Otis, Schindler"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eq_pavimentos">Pavimentos</Label>
                  <Input
                    id="eq_pavimentos"
                    value={novoEquipamento.pavimentos}
                    onChange={(e) => setNovoEquipamento({ ...novoEquipamento, pavimentos: e.target.value })}
                    placeholder="Ex: Térreo ao 10º"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eq_capacidade">Capacidade</Label>
                  <Input
                    id="eq_capacidade"
                    value={novoEquipamento.capacidade}
                    onChange={(e) => setNovoEquipamento({ ...novoEquipamento, capacidade: e.target.value })}
                    placeholder="Ex: 8 pessoas, 600kg"
                  />
                </div>

                <div className="col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addEquipamento}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Equipamento
                  </Button>
                </div>
              </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : mode === 'edit' ? 'Atualizar' : 'Criar Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
