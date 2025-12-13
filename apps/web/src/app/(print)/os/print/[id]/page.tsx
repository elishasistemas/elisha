'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'

interface OSPrintData {
    id: string
    numero_os: string
    tipo: string
    prioridade: string
    status: string
    data_abertura: string
    data_fim: string | null
    observacoes: string | null
    descricao: string | null
    quem_solicitou: string | null
    estado_equipamento: string | null
    nome_cliente_assinatura: string | null
    assinatura_cliente: string | null
    // Related data
    cliente_nome?: string
    cliente_endereco?: string
    cliente_telefone?: string
    equipamento_tipo?: string
    equipamento_fabricante?: string
    equipamento_modelo?: string
    equipamento_numero_serie?: string
    tecnico_nome?: string
    // Laudo
    laudo_o_que_foi_feito?: string
    laudo_observacao?: string
    // Checklist
    checklist?: Array<{ descricao: string; status: string | null }>
    // Evidencias
    evidencias?: Array<{ tipo: string; storage_path: string; titulo?: string }>
}

export default function OSPrintPage() {
    const params = useParams()
    const osId = params?.id as string
    const [data, setData] = useState<OSPrintData | null>(null)
    const [loading, setLoading] = useState(true)
    const [empresa, setEmpresa] = useState<{ nome: string; logo_url?: string } | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const supabase = createSupabaseBrowser()
                const session = await supabase.auth.getSession()
                const token = session.data.session?.access_token
                if (!token) throw new Error('Não autenticado')

                const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                const headers = { 'Authorization': `Bearer ${token}` }

                // Fetch OS
                const osRes = await fetch(`${BACKEND_URL}/api/v1/ordens-servico/${osId}`, { headers })
                if (!osRes.ok) throw new Error('Erro ao buscar OS')
                const osData = await osRes.json()

                // Fetch related data in parallel
                const [clienteRes, equipamentoRes, tecnicoRes, laudoRes, checklistRes] = await Promise.all([
                    osData.cliente_id ? fetch(`${BACKEND_URL}/api/v1/clientes/${osData.cliente_id}`, { headers }) : null,
                    osData.equipamento_id ? fetch(`${BACKEND_URL}/api/v1/equipamentos/${osData.equipamento_id}`, { headers }) : null,
                    osData.tecnico_id ? fetch(`${BACKEND_URL}/api/v1/colaboradores/${osData.tecnico_id}`, { headers }) : null,
                    fetch(`${BACKEND_URL}/api/v1/ordens-servico/${osId}/laudo`, { headers }),
                    fetch(`${BACKEND_URL}/api/v1/ordens-servico/${osId}/checklist`, { headers }),
                ])

                const cliente = clienteRes?.ok ? await clienteRes.json() : null
                const equipamento = equipamentoRes?.ok ? await equipamentoRes.json() : null
                const tecnico = tecnicoRes?.ok ? await tecnicoRes.json() : null
                const laudo = laudoRes?.ok ? await laudoRes.json() : null
                const checklist = checklistRes?.ok ? await checklistRes.json() : []

                // Fetch evidencias
                const { data: evidencias } = await supabase
                    .from('os_evidencias')
                    .select('tipo, storage_path, titulo')
                    .eq('os_id', osId)

                // Fetch empresa
                if (osData.empresa_id) {
                    const { data: empresaData } = await supabase
                        .from('empresas')
                        .select('nome, logo_url')
                        .eq('id', osData.empresa_id)
                        .single()
                    if (empresaData) setEmpresa(empresaData)
                }

                setData({
                    ...osData,
                    cliente_nome: cliente?.nome_local,
                    cliente_endereco: cliente?.endereco_completo,
                    cliente_telefone: cliente?.responsavel_telefone,
                    equipamento_tipo: equipamento?.tipo,
                    equipamento_fabricante: equipamento?.fabricante,
                    equipamento_modelo: equipamento?.modelo,
                    equipamento_numero_serie: equipamento?.numero_serie,
                    tecnico_nome: tecnico?.nome,
                    laudo_o_que_foi_feito: laudo?.o_que_foi_feito,
                    laudo_observacao: laudo?.observacao,
                    checklist: checklist || [],
                    evidencias: evidencias || [],
                })
            } catch (error) {
                console.error('Erro ao carregar dados para impressão:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [osId])

    // Auto-trigger print after loading
    useEffect(() => {
        if (!loading && data) {
            setTimeout(() => window.print(), 500)
        }
    }, [loading, data])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-lg">Carregando...</p>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-lg text-red-600">Erro ao carregar OS</p>
            </div>
        )
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleString('pt-BR')
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            novo: 'Novo',
            em_deslocamento: 'Em Deslocamento',
            checkin: 'Em Atendimento',
            em_atendimento: 'Em Atendimento',
            concluido: 'Concluído',
            cancelado: 'Cancelado',
            parado: 'Parado',
        }
        return labels[status] || status
    }

    const getTipoLabel = (tipo: string) => {
        const labels: Record<string, string> = {
            preventiva: 'Preventiva',
            corretiva: 'Corretiva',
            emergencial: 'Emergencial',
            chamado: 'Chamado',
        }
        return labels[tipo] || tipo
    }

    const getEstadoEquipamentoLabel = (estado: string | null) => {
        if (!estado) return 'Não informado'
        const labels: Record<string, string> = {
            funcionando: 'Funcionando Normal',
            dependendo_de_corretiva: 'Funcionando, Dependendo de Corretiva',
            parado: 'Parado',
        }
        return labels[estado] || estado
    }

    return (
        <div className="print-container bg-white text-black p-8 max-w-4xl mx-auto">
            {/* Header */}
            <header className="flex items-center justify-between border-b-2 border-gray-800 pb-4 mb-6">
                <div className="flex items-center gap-4">
                    {empresa?.logo_url && (
                        <img src={empresa.logo_url} alt="Logo" className="h-12 w-auto" />
                    )}
                    <div>
                        <h1 className="text-2xl font-bold">{empresa?.nome || 'Empresa'}</h1>
                        <p className="text-sm text-gray-600">Ordem de Serviço</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">{data.numero_os}</p>
                    <p className="text-sm text-gray-600">{getTipoLabel(data.tipo)}</p>
                </div>
            </header>

            {/* Status Badge */}
            <div className="mb-6 flex justify-between items-center">
                <span className="inline-block px-3 py-1 bg-gray-200 rounded-full text-sm font-medium">
                    Status: {getStatusLabel(data.status)}
                </span>
                <span className="text-sm text-gray-600">
                    Data: {formatDate(data.data_abertura)}
                </span>
            </div>

            {/* Cliente Info */}
            <section className="mb-6">
                <h2 className="text-lg font-semibold border-b border-gray-300 pb-1 mb-3">Dados do Cliente</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-600">Cliente</p>
                        <p className="font-medium">{data.cliente_nome || '-'}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Endereço</p>
                        <p className="font-medium">{data.cliente_endereco || '-'}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Telefone</p>
                        <p className="font-medium">{data.cliente_telefone || '-'}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Solicitante</p>
                        <p className="font-medium">{data.quem_solicitou || '-'}</p>
                    </div>
                </div>
            </section>

            {/* Equipamento Info */}
            <section className="mb-6">
                <h2 className="text-lg font-semibold border-b border-gray-300 pb-1 mb-3">Equipamento</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-600">Tipo</p>
                        <p className="font-medium">{data.equipamento_tipo || '-'}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Fabricante/Modelo</p>
                        <p className="font-medium">{data.equipamento_fabricante} {data.equipamento_modelo}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Número de Série</p>
                        <p className="font-medium">{data.equipamento_numero_serie || '-'}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Técnico Responsável</p>
                        <p className="font-medium">{data.tecnico_nome || '-'}</p>
                    </div>
                </div>
            </section>

            {/* Descrição do Problema */}
            {(data.observacoes || data.descricao) && (
                <section className="mb-6">
                    <h2 className="text-lg font-semibold border-b border-gray-300 pb-1 mb-3">Descrição do Problema</h2>
                    <p className="text-sm whitespace-pre-wrap">{data.descricao || data.observacoes}</p>
                </section>
            )}

            {/* Checklist */}
            {data.checklist && data.checklist.length > 0 && (
                <section className="mb-6">
                    <h2 className="text-lg font-semibold border-b border-gray-300 pb-1 mb-3">Checklist</h2>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-1">Item</th>
                                <th className="text-center py-1 w-24">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.checklist.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-200">
                                    <td className="py-1">{item.descricao}</td>
                                    <td className="text-center py-1">
                                        {item.status === 'conforme' ? '✓' : item.status === 'nao_conforme' ? '✗' : item.status === 'na' ? 'N/A' : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {/* Laudo Técnico */}
            {(data.laudo_o_que_foi_feito || data.laudo_observacao) && (
                <section className="mb-6">
                    <h2 className="text-lg font-semibold border-b border-gray-300 pb-1 mb-3">Laudo Técnico</h2>
                    {data.laudo_o_que_foi_feito && (
                        <div className="mb-2">
                            <p className="text-gray-600 text-sm">O que foi feito:</p>
                            <p className="text-sm whitespace-pre-wrap">{data.laudo_o_que_foi_feito}</p>
                        </div>
                    )}
                    {data.laudo_observacao && (
                        <div>
                            <p className="text-gray-600 text-sm">Observações:</p>
                            <p className="text-sm whitespace-pre-wrap">{data.laudo_observacao}</p>
                        </div>
                    )}
                </section>
            )}

            {/* Checkout Info */}
            <section className="mb-6">
                <h2 className="text-lg font-semibold border-b border-gray-300 pb-1 mb-3">Encerramento</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-600">Estado do Equipamento</p>
                        <p className="font-medium">{getEstadoEquipamentoLabel(data.estado_equipamento)}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Data de Conclusão</p>
                        <p className="font-medium">{formatDate(data.data_fim)}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Responsável no Local</p>
                        <p className="font-medium">{data.nome_cliente_assinatura || '-'}</p>
                    </div>
                </div>
            </section>

            {/* Assinatura */}
            {data.assinatura_cliente && (
                <section className="mb-6">
                    <h2 className="text-lg font-semibold border-b border-gray-300 pb-1 mb-3">Assinatura do Cliente</h2>
                    <div className="border border-gray-300 rounded p-2 inline-block">
                        <img src={data.assinatura_cliente} alt="Assinatura" className="max-h-24" />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{data.nome_cliente_assinatura}</p>
                </section>
            )}

            {/* Footer */}
            <footer className="border-t-2 border-gray-800 pt-4 mt-8 text-center text-xs text-gray-500">
                <p>Documento gerado em {new Date().toLocaleString('pt-BR')}</p>
                <p>{empresa?.nome}</p>
            </footer>

            {/* Print Styles */}
            <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-container {
            max-width: none !important;
            padding: 0 !important;
          }
        }
        @media screen {
          .print-container {
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            margin: 2rem auto;
          }
        }
      `}</style>
        </div>
    )
}
