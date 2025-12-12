'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Search, Calendar, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import { useAuth, useProfile, useOrdensServico, useClientes, useColaboradores } from '@/hooks/use-supabase'
import { createSupabaseBrowser } from '@/lib/supabase'

const statusConfig = {
    novo: {
        label: 'Nova',
        className: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    em_deslocamento: {
        label: 'Em Deslocamento',
        className: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    checkin: {
        label: 'Em Atendimento',
        className: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    },
    em_andamento: {
        label: 'Em Andamento',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    concluido: {
        label: 'Concluída',
        className: 'bg-green-100 text-green-800 border-green-200'
    },
    cancelado: {
        label: 'Cancelada',
        className: 'bg-gray-100 text-gray-800 border-gray-200'
    }
}

export default function ScheduledCorrectivePage() {
    const router = useRouter()
    const { user } = useAuth()
    const { profile, loading: profileLoading } = useProfile(user?.id)

    const empresaId = profile?.impersonating_empresa_id || profile?.empresa_id

    const { ordens, loading: ordensLoading } = useOrdensServico(empresaId || undefined)
    const { clientes } = useClientes(empresaId || undefined)
    const { colaboradores } = useColaboradores(empresaId || undefined)

    const [search, setSearch] = useState('')
    const [refreshKey, setRefreshKey] = useState(0)
    const [actionLoading, setActionLoading] = useState(false)

    const supabase = createSupabaseBrowser()

    // Filtrar apenas corretivas programadas
    const corretivasProgramadas = useMemo(() => {
        return ordens.filter((o: any) => o.tipo === 'corretiva_programada')
    }, [ordens])

    // Aplicar busca
    const ordensFiltradas = useMemo(() => {
        if (!search.trim()) return corretivasProgramadas

        const termo = search.toLowerCase()
        return corretivasProgramadas.filter((o: any) => {
            const cliente = clientes.find(c => c.id === o.cliente_id)
            const tecnico = colaboradores.find(t => t.id === o.tecnico_id)

            return (
                o.numero_os?.toLowerCase().includes(termo) ||
                cliente?.nome_local?.toLowerCase().includes(termo) ||
                tecnico?.nome?.toLowerCase().includes(termo) ||
                o.observacoes?.toLowerCase().includes(termo)
            )
        })
    }, [corretivasProgramadas, search, clientes, colaboradores])

    const canTecnico = profile?.active_role === 'tecnico'
    const canAdmin = profile?.active_role === 'admin' || profile?.is_elisha_admin

    // Handler para aceitar OS
    const handleAccept = async (ordem: any) => {
        setActionLoading(true)
        try {
            const { data, error } = await supabase.rpc('os_accept', { p_os_id: ordem.id })
            if (error) throw error
            const result = data as { success: boolean; error?: string; message?: string }
            if (!result?.success) {
                toast.error(result?.message || result?.error || 'Erro ao aceitar OS')
                return
            }
            toast.success(result?.message || 'OS aceita com sucesso!')
            setRefreshKey(prev => prev + 1)
        } catch (e) {
            console.error('[handleAccept] Erro:', e)
            toast.error(e instanceof Error ? e.message : 'Erro ao aceitar OS')
        } finally {
            setActionLoading(false)
        }
    }

    // Handler para iniciar deslocamento
    const handleStartDeslocamento = async (ordem: any) => {
        setActionLoading(true)
        try {
            const { data, error } = await supabase.rpc('os_start_deslocamento', { p_os_id: ordem.id })
            if (error) throw error
            const result = data as { success: boolean; error?: string; message?: string }
            if (!result?.success) {
                toast.error(result?.message || result?.error || 'Erro ao iniciar deslocamento')
                return
            }
            toast.success(result?.message || 'Deslocamento iniciado!')
            setRefreshKey(prev => prev + 1)
        } catch (e) {
            console.error('[handleStartDeslocamento] Erro:', e)
            toast.error(e instanceof Error ? e.message : 'Erro ao iniciar deslocamento')
        } finally {
            setActionLoading(false)
        }
    }

    // Handler para iniciar atendimento
    const handleStartAtendimento = async (ordem: any) => {
        setActionLoading(true)
        try {
            const { data, error } = await supabase.rpc('os_checkin', { p_os_id: ordem.id, p_location: null })
            if (error) throw error
            const result = data as { success: boolean; error?: string; message?: string }
            if (!result?.success) {
                toast.error(result?.message || result?.error || 'Erro ao iniciar atendimento')
                return
            }
            toast.success(result?.message || 'Atendimento iniciado!')
            router.push(`/os/${ordem.id}/full`)
        } catch (e) {
            console.error('[handleStartAtendimento] Erro:', e)
            toast.error(e instanceof Error ? e.message : 'Erro ao iniciar atendimento')
        } finally {
            setActionLoading(false)
        }
    }

    // Helper para determinar qual botão mostrar
    const getActionButton = (o: any) => {
        // OS sem técnico = pode aceitar
        if (!o.tecnico_id && (o.status === 'novo' || o.status === 'parado')) {
            return (
                <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleAccept(o); }}
                    disabled={actionLoading}
                    variant="default"
                >
                    Aceitar
                </Button>
            )
        }

        // OS atribuída ao técnico logado
        if (o.tecnico_id === profile?.tecnico_id) {
            if (o.status === 'novo' || o.status === 'parado') {
                return (
                    <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleStartDeslocamento(o); }}
                        disabled={actionLoading}
                        variant="default"
                    >
                        Iniciar Deslocamento
                    </Button>
                )
            }
            if (o.status === 'em_deslocamento') {
                return (
                    <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleStartAtendimento(o); }}
                        disabled={actionLoading}
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                    >
                        Iniciar Atendimento
                    </Button>
                )
            }
            if (['checkin', 'em_andamento'].includes(o.status)) {
                return (
                    <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); router.push(`/os/${o.id}/full`); }}
                        variant="default"
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        Continuar
                    </Button>
                )
            }
        }

        return null
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Recarregar ordens quando refreshKey mudar (workaround sem refresh direto)
    useEffect(() => {
        // Force re-render
    }, [refreshKey])

    if (profileLoading || ordensLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Carregando...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Calendar className="w-6 h-6" />
                        Corretivas Programadas
                    </h1>
                    <p className="text-muted-foreground">
                        Ordens de serviço geradas automaticamente para manutenções corretivas pendentes
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setRefreshKey(prev => prev + 1)}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Lista de Corretivas Programadas</CardTitle>
                            <CardDescription>
                                {ordensFiltradas.length} ordem(ns) encontrada(s)
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {ordensFiltradas.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            Nenhuma corretiva programada encontrada
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-2 md:mx-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Número OS</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Técnico</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Data Criação</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ordensFiltradas.map((ordem) => {
                                        const cliente = clientes.find(c => c.id === ordem.cliente_id)
                                        const tecnico = colaboradores.find(t => t.id === ordem.tecnico_id)
                                        const status = statusConfig[ordem.status as keyof typeof statusConfig] || statusConfig.novo

                                        return (
                                            <TableRow
                                                key={ordem.id}
                                                className="cursor-pointer"
                                                onClick={() => router.push(`/os/${ordem.id}/full`)}
                                            >
                                                <TableCell className="font-medium">
                                                    {ordem.numero_os || ordem.id.slice(0, 8)}
                                                </TableCell>
                                                <TableCell>{cliente?.nome_local || 'Cliente não encontrado'}</TableCell>
                                                <TableCell>{tecnico?.nome || 'Não atribuído'}</TableCell>
                                                <TableCell>
                                                    <Badge className={status.className}>
                                                        {status.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDate(ordem.created_at)}
                                                </TableCell>
                                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                    {getActionButton(ordem)}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
