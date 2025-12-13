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
    cliente_nome?: string
    cliente_endereco?: string
    cliente_telefone?: string
    equipamento_tipo?: string
    equipamento_fabricante?: string
    equipamento_modelo?: string
    equipamento_numero_serie?: string
    tecnico_nome?: string
    laudo_o_que_foi_feito?: string
    laudo_observacao?: string
    checklist?: Array<{ descricao: string; status: string | null }>
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

                const osRes = await fetch(`${BACKEND_URL}/api/v1/ordens-servico/${osId}`, { headers })
                if (!osRes.ok) throw new Error('Erro ao buscar OS')
                const osData = await osRes.json()

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
                })
            } catch (error) {
                console.error('Erro ao carregar dados para impressão:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [osId])

    useEffect(() => {
        if (!loading && data) {
            setTimeout(() => window.print(), 500)
        }
    }, [loading, data])

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
                <p style={{ fontSize: '18px' }}>Carregando...</p>
            </div>
        )
    }

    if (!data) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
                <p style={{ fontSize: '18px', color: 'red' }}>Erro ao carregar OS</p>
            </div>
        )
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleString('pt-BR')
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

    const styles = {
        container: {
            fontFamily: 'Arial, sans-serif',
            maxWidth: '800px',
            margin: '0 auto',
            padding: '20px',
            backgroundColor: 'white',
            color: 'black',
        } as React.CSSProperties,
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #333',
            paddingBottom: '15px',
            marginBottom: '20px',
        } as React.CSSProperties,
        logo: {
            height: '50px',
            width: 'auto',
        } as React.CSSProperties,
        title: {
            fontSize: '24px',
            fontWeight: 'bold',
            margin: '0',
        } as React.CSSProperties,
        subtitle: {
            fontSize: '14px',
            color: '#666',
            margin: '0',
        } as React.CSSProperties,
        osNumber: {
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'right' as const,
        } as React.CSSProperties,
        datesSection: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#f5f5f5',
            borderRadius: '5px',
        } as React.CSSProperties,
        dateBox: {
            textAlign: 'center' as const,
        } as React.CSSProperties,
        dateLabel: {
            fontSize: '12px',
            color: '#666',
            margin: '0',
        } as React.CSSProperties,
        dateValue: {
            fontSize: '14px',
            fontWeight: 'bold',
            margin: '0',
        } as React.CSSProperties,
        section: {
            marginBottom: '20px',
        } as React.CSSProperties,
        sectionTitle: {
            fontSize: '16px',
            fontWeight: 'bold',
            borderBottom: '1px solid #ccc',
            paddingBottom: '5px',
            marginBottom: '10px',
        } as React.CSSProperties,
        grid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
        } as React.CSSProperties,
        field: {
            marginBottom: '5px',
        } as React.CSSProperties,
        fieldLabel: {
            fontSize: '12px',
            color: '#666',
            margin: '0',
        } as React.CSSProperties,
        fieldValue: {
            fontSize: '14px',
            fontWeight: '500',
            margin: '0',
        } as React.CSSProperties,
        table: {
            width: '100%',
            borderCollapse: 'collapse' as const,
            fontSize: '14px',
        } as React.CSSProperties,
        th: {
            textAlign: 'left' as const,
            padding: '8px',
            borderBottom: '1px solid #333',
        } as React.CSSProperties,
        td: {
            padding: '8px',
            borderBottom: '1px solid #eee',
        } as React.CSSProperties,
        tdCenter: {
            padding: '8px',
            borderBottom: '1px solid #eee',
            textAlign: 'center' as const,
        } as React.CSSProperties,
        signature: {
            border: '1px solid #ccc',
            padding: '10px',
            display: 'inline-block',
            borderRadius: '5px',
        } as React.CSSProperties,
        signatureImg: {
            maxHeight: '80px',
        } as React.CSSProperties,
        footer: {
            borderTop: '2px solid #333',
            paddingTop: '15px',
            marginTop: '30px',
            textAlign: 'center' as const,
            fontSize: '12px',
            color: '#666',
        } as React.CSSProperties,
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {empresa?.logo_url && (
                        <img src={empresa.logo_url} alt="Logo" style={styles.logo} />
                    )}
                    <div>
                        <h1 style={styles.title}>{empresa?.nome || 'Empresa'}</h1>
                        <p style={styles.subtitle}>Ordem de Serviço</p>
                    </div>
                </div>
                <div style={styles.osNumber}>
                    <p style={{ margin: 0 }}>{data.numero_os}</p>
                    <p style={styles.subtitle}>{getTipoLabel(data.tipo)}</p>
                </div>
            </header>

            {/* Dates Section */}
            <div style={styles.datesSection}>
                <div style={styles.dateBox}>
                    <p style={styles.dateLabel}>Data de Abertura</p>
                    <p style={styles.dateValue}>{formatDate(data.data_abertura)}</p>
                </div>
                <div style={styles.dateBox}>
                    <p style={styles.dateLabel}>Data de Encerramento</p>
                    <p style={styles.dateValue}>{data.data_fim ? formatDate(data.data_fim) : '-'}</p>
                </div>
            </div>

            {/* Cliente Info */}
            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Dados do Cliente</h2>
                <div style={styles.grid}>
                    <div style={styles.field}>
                        <p style={styles.fieldLabel}>Cliente</p>
                        <p style={styles.fieldValue}>{data.cliente_nome || '-'}</p>
                    </div>
                    <div style={styles.field}>
                        <p style={styles.fieldLabel}>Endereço</p>
                        <p style={styles.fieldValue}>{data.cliente_endereco || '-'}</p>
                    </div>
                    <div style={styles.field}>
                        <p style={styles.fieldLabel}>Telefone</p>
                        <p style={styles.fieldValue}>{data.cliente_telefone || '-'}</p>
                    </div>
                    <div style={styles.field}>
                        <p style={styles.fieldLabel}>Solicitante</p>
                        <p style={styles.fieldValue}>{data.quem_solicitou || '-'}</p>
                    </div>
                </div>
            </section>

            {/* Equipamento Info */}
            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Equipamento</h2>
                <div style={styles.grid}>
                    <div style={styles.field}>
                        <p style={styles.fieldLabel}>Tipo</p>
                        <p style={styles.fieldValue}>{data.equipamento_tipo || '-'}</p>
                    </div>
                    <div style={styles.field}>
                        <p style={styles.fieldLabel}>Fabricante/Modelo</p>
                        <p style={styles.fieldValue}>{data.equipamento_fabricante} {data.equipamento_modelo}</p>
                    </div>
                    <div style={styles.field}>
                        <p style={styles.fieldLabel}>Número de Série</p>
                        <p style={styles.fieldValue}>{data.equipamento_numero_serie || '-'}</p>
                    </div>
                    <div style={styles.field}>
                        <p style={styles.fieldLabel}>Técnico Responsável</p>
                        <p style={styles.fieldValue}>{data.tecnico_nome || '-'}</p>
                    </div>
                </div>
            </section>

            {/* Descrição do Problema */}
            {(data.observacoes || data.descricao) && (
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Descrição do Problema</h2>
                    <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{data.descricao || data.observacoes}</p>
                </section>
            )}

            {/* Checklist */}
            {data.checklist && data.checklist.length > 0 && (
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Checklist</h2>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Item</th>
                                <th style={{ ...styles.th, textAlign: 'center', width: '80px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.checklist.map((item, idx) => (
                                <tr key={idx}>
                                    <td style={styles.td}>{item.descricao}</td>
                                    <td style={styles.tdCenter}>
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
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Laudo Técnico</h2>
                    {data.laudo_o_que_foi_feito && (
                        <div style={{ marginBottom: '10px' }}>
                            <p style={styles.fieldLabel}>O que foi feito:</p>
                            <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{data.laudo_o_que_foi_feito}</p>
                        </div>
                    )}
                    {data.laudo_observacao && (
                        <div>
                            <p style={styles.fieldLabel}>Observações:</p>
                            <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{data.laudo_observacao}</p>
                        </div>
                    )}
                </section>
            )}

            {/* Encerramento */}
            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Encerramento</h2>
                <div style={styles.grid}>
                    <div style={styles.field}>
                        <p style={styles.fieldLabel}>Estado do Equipamento</p>
                        <p style={styles.fieldValue}>{getEstadoEquipamentoLabel(data.estado_equipamento)}</p>
                    </div>
                    <div style={styles.field}>
                        <p style={styles.fieldLabel}>Responsável no Local</p>
                        <p style={styles.fieldValue}>{data.nome_cliente_assinatura || '-'}</p>
                    </div>
                </div>
            </section>

            {/* Assinatura */}
            {data.assinatura_cliente && (
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Assinatura do Cliente</h2>
                    <div style={styles.signature}>
                        <img src={data.assinatura_cliente} alt="Assinatura" style={styles.signatureImg} />
                    </div>
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>{data.nome_cliente_assinatura}</p>
                </section>
            )}

            {/* Footer */}
            <footer style={styles.footer}>
                <p>Documento gerado em {new Date().toLocaleString('pt-BR')}</p>
                <p>{empresa?.nome}</p>
            </footer>
        </div>
    )
}
