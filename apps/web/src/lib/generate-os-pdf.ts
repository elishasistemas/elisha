import jsPDF from 'jspdf'

interface OSPDFData {
    numero_os: string
    tipo: string
    data_abertura: string
    data_fim: string | null
    cliente_nome?: string
    cliente_endereco?: string
    cliente_telefone?: string
    quem_solicitou?: string
    equipamento_tipo?: string
    equipamento_fabricante?: string
    equipamento_modelo?: string
    equipamento_numero_serie?: string
    tecnico_nome?: string
    descricao?: string
    observacoes?: string
    laudo_o_que_foi_feito?: string
    laudo_observacao?: string
    estado_equipamento?: string
    nome_cliente_assinatura?: string
    assinatura_cliente?: string
    checklist?: Array<{ descricao: string; status: string | null }>
    empresa_nome?: string
    empresa_logo_url?: string
}

const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '-'
    // O Supabase retorna datas em UTC, então precisamos formatar considerando o timezone local
    // Usando toLocaleString com timezone local para evitar adicionar dias incorretamente
    const date = new Date(dateStr)
    return date.toLocaleString('pt-BR', { 
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const getTipoLabel = (tipo: string): string => {
    const labels: Record<string, string> = {
        preventiva: 'Preventiva',
        corretiva: 'Corretiva',
        emergencial: 'Emergencial',
        chamado: 'Chamado',
    }
    return labels[tipo] || tipo
}

const getEstadoEquipamentoLabel = (estado: string | null | undefined): string => {
    if (!estado) return 'Não informado'
    const labels: Record<string, string> = {
        funcionando: 'Funcionando Normal',
        dependendo_de_corretiva: 'Funcionando, Dependendo de Corretiva',
        parado: 'Parado',
    }
    return labels[estado] || estado
}

export async function generateOSPDF(data: OSPDFData): Promise<void> {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 15
    let y = 20

    // Colors
    const primaryColor: [number, number, number] = [33, 37, 41]
    const grayColor: [number, number, number] = [100, 100, 100]

    // Helper functions
    const addSectionTitle = (title: string) => {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...primaryColor)
        doc.text(title, margin, y)
        y += 2
        doc.setDrawColor(200, 200, 200)
        doc.line(margin, y, pageWidth - margin, y)
        y += 6
    }

    const addField = (label: string, value: string, x: number, width: number) => {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...grayColor)
        doc.text(label, x, y)
        y += 4
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...primaryColor)
        const lines = doc.splitTextToSize(value || '-', width)
        doc.text(lines, x, y)
        y += (lines.length * 4) + 2
    }

    const addFieldInline = (label: string, value: string, x: number) => {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...grayColor)
        doc.text(label, x, y)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...primaryColor)
        doc.text(value || '-', x + doc.getTextWidth(label) + 2, y)
    }

    const checkPageBreak = (neededSpace: number) => {
        if (y + neededSpace > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage()
            y = 20
        }
    }

    // === HEADER ===
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryColor)
    doc.text(data.empresa_nome || 'Empresa', margin, y)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grayColor)
    doc.text('Ordem de Serviço', margin, y + 6)

    // OS Number on the right
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryColor)
    doc.text(data.numero_os || '-', pageWidth - margin, y, { align: 'right' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grayColor)
    doc.text(getTipoLabel(data.tipo), pageWidth - margin, y + 6, { align: 'right' })

    y += 12
    doc.setDrawColor(50, 50, 50)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 10

    // === DATES SECTION ===
    doc.setFillColor(245, 245, 245)
    doc.roundedRect(margin, y - 3, pageWidth - margin * 2, 18, 3, 3, 'F')

    const halfWidth = (pageWidth - margin * 2) / 2

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grayColor)
    doc.text('Data de Abertura', margin + 10, y + 3)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryColor)
    doc.text(formatDate(data.data_abertura), margin + 10, y + 10)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grayColor)
    doc.text('Data de Encerramento', margin + halfWidth + 10, y + 3)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryColor)
    doc.text(data.data_fim ? formatDate(data.data_fim) : '-', margin + halfWidth + 10, y + 10)

    y += 22

    // === CLIENTE ===
    checkPageBreak(40)
    addSectionTitle('Dados do Cliente')

    const startY = y
    addFieldInline('Cliente: ', data.cliente_nome || '-', margin)
    y += 6
    addFieldInline('Endereço: ', data.cliente_endereco || '-', margin)
    y += 6
    addFieldInline('Telefone: ', data.cliente_telefone || '-', margin)
    y += 6
    addFieldInline('Solicitante: ', data.quem_solicitou || '-', margin)
    y += 10

    // === EQUIPAMENTO ===
    checkPageBreak(40)
    addSectionTitle('Equipamento')

    addFieldInline('Tipo: ', data.equipamento_tipo || '-', margin)
    y += 6
    addFieldInline('Fabricante/Modelo: ', `${data.equipamento_fabricante || ''} ${data.equipamento_modelo || ''}`.trim() || '-', margin)
    y += 6
    addFieldInline('Nº Série: ', data.equipamento_numero_serie || '-', margin)
    y += 6
    addFieldInline('Técnico: ', data.tecnico_nome || '-', margin)
    y += 10

    // === DESCRIÇÃO DO PROBLEMA ===
    if (data.descricao || data.observacoes) {
        checkPageBreak(30)
        addSectionTitle('Descrição do Problema')
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...primaryColor)
        const descLines = doc.splitTextToSize(data.descricao || data.observacoes || '', pageWidth - margin * 2)
        doc.text(descLines, margin, y)
        y += (descLines.length * 5) + 8
    }

    // === CHECKLIST ===
    if (data.checklist && data.checklist.length > 0) {
        checkPageBreak(30)
        addSectionTitle('Checklist')

        data.checklist.forEach((item, idx) => {
            checkPageBreak(8)
            const statusSymbol = item.status === 'conforme' ? '✓' : item.status === 'nao_conforme' ? '✗' : item.status === 'na' ? 'N/A' : '-'
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(...primaryColor)
            doc.text(`${idx + 1}. ${item.descricao}`, margin, y)
            doc.text(statusSymbol, pageWidth - margin - 10, y)
            y += 6
        })
        y += 4
    }

    // === LAUDO TÉCNICO ===
    checkPageBreak(40)
    addSectionTitle('Laudo Técnico')

    if (data.laudo_o_que_foi_feito) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...grayColor)
        doc.text('O que foi feito:', margin, y)
        y += 5
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...primaryColor)
        const laudoLines = doc.splitTextToSize(data.laudo_o_que_foi_feito, pageWidth - margin * 2)
        doc.text(laudoLines, margin, y)
        y += (laudoLines.length * 5) + 6
    } else {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(...grayColor)
        doc.text('Não preenchido', margin, y)
        y += 8
    }

    if (data.laudo_observacao) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...grayColor)
        doc.text('Observações:', margin, y)
        y += 5
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...primaryColor)
        const obsLines = doc.splitTextToSize(data.laudo_observacao, pageWidth - margin * 2)
        doc.text(obsLines, margin, y)
        y += (obsLines.length * 5) + 6
    }

    // === ENCERRAMENTO ===
    checkPageBreak(30)
    addSectionTitle('Encerramento')
    addFieldInline('Estado do Equipamento: ', getEstadoEquipamentoLabel(data.estado_equipamento), margin)
    y += 6
    const nomeResponsavel = data.nome_cliente_assinatura === 'Responsável não encontrado' 
      ? 'Responsável não encontrado no local' 
      : data.nome_cliente_assinatura || '-'
    addFieldInline('Responsável no Local: ', nomeResponsavel, margin)
    y += 10

    // === ASSINATURA ===
    if (data.assinatura_cliente && data.nome_cliente_assinatura !== 'Responsável não encontrado') {
        checkPageBreak(40)
        addSectionTitle('Assinatura do Cliente')

        try {
            doc.addImage(data.assinatura_cliente, 'PNG', margin, y, 60, 25)
            y += 28
        } catch (e) {
            doc.setFontSize(10)
            doc.setTextColor(...grayColor)
            doc.text('[Assinatura digital anexada]', margin, y)
            y += 8
        }

        doc.setFontSize(9)
        doc.setTextColor(...grayColor)
        doc.text(data.nome_cliente_assinatura || '', margin, y)
        y += 6
    } else if (data.nome_cliente_assinatura === 'Responsável não encontrado') {
        checkPageBreak(20)
        addSectionTitle('Assinatura do Cliente')
        
        doc.setFontSize(10)
        doc.setTextColor(...grayColor)
        doc.text('Responsável não encontrado no local', margin, y)
        y += 8
    }

    // === FOOTER ===
    const footerY = doc.internal.pageSize.getHeight() - 15
    doc.setDrawColor(50, 50, 50)
    doc.setLineWidth(0.5)
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grayColor)
    doc.text(`Documento gerado em ${new Date().toLocaleString('pt-BR')}`, margin, footerY)
    doc.text(data.empresa_nome || '', pageWidth - margin, footerY, { align: 'right' })

    // Download PDF (works in PWAs and browsers)
    const fileName = `OS_${data.numero_os || 'documento'}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
}
