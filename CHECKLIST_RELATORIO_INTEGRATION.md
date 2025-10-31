# Integração Checklist → Relatório PDF

Guia para integrar os dados do checklist na geração de relatórios PDF.

## 📄 Visão Geral

O relatório PDF deve incluir:
1. Dados da OS (cliente, técnico, equipamento, datas)
2. Snapshot do checklist (template usado)
3. Respostas agregadas por seção
4. Score de conformidade
5. Evidências (fotos, assinaturas)
6. Selos ABNT (quando aplicável)

## 🔧 Preparar Dados para o Relatório

```typescript
// src/services/relatorio/prepareChecklistData.ts

import { createClient } from '@supabase/supabase-js'
import { computeComplianceScore, validateChecklistCompletion } from '@/utils/checklist/computeComplianceScore'

export async function prepareChecklistDataForReport(osId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. Get OS data
  const { data: os } = await supabase
    .from('ordens_servico')
    .select(`
      *,
      cliente:clientes(*),
      equipamento:equipamentos(*),
      tecnico:colaboradores(*)
    `)
    .eq('id', osId)
    .single()

  // 2. Get checklist snapshot
  const { data: osChecklist } = await supabase
    .from('os_checklists')
    .select('*')
    .eq('os_id', osId)
    .maybeSingle()

  if (!osChecklist) {
    return { os, hasChecklist: false }
  }

  // 3. Get responses with respondent info
  const { data: respostas } = await supabase
    .from('checklist_respostas')
    .select(`
      *,
      respondido_por:colaboradores(nome)
    `)
    .eq('os_checklist_id', osChecklist.id)
    .order('item_ordem', { ascending: true })

  // 4. Compute score and validation
  const score = computeComplianceScore(
    osChecklist.template_snapshot,
    respostas || []
  )

  const validation = validateChecklistCompletion(
    osChecklist.template_snapshot,
    respostas || []
  )

  // 5. Group responses by section
  const itens = osChecklist.template_snapshot.itens || []
  const sections: Record<string, any[]> = {}

  itens.forEach((item: any, index: number) => {
    const ordem = typeof item.ordem === 'number' ? item.ordem : index + 1
    const resposta = respostas?.find(r => r.item_ordem === ordem)
    
    if (resposta) {
      const secao = item.secao || 'Geral'
      if (!sections[secao]) {
        sections[secao] = []
      }
      sections[secao].push({
        ...item,
        resposta
      })
    }
  })

  // 6. Get signed URLs for photos and signatures
  const allPhotos: string[] = []
  const allSignatures: string[] = []

  respostas?.forEach(resp => {
    if (resp.fotos_urls && resp.fotos_urls.length > 0) {
      allPhotos.push(...resp.fotos_urls)
    }
    if (resp.assinatura_url) {
      allSignatures.push(resp.assinatura_url)
    }
  })

  // Generate signed URLs (valid for 1 hour)
  const photosWithUrls = await Promise.all(
    allPhotos.map(async (path) => {
      const { data } = await supabase.storage
        .from('os-evidencias')
        .createSignedUrl(path, 3600)
      return { path, url: data?.signedUrl }
    })
  )

  const signaturesWithUrls = await Promise.all(
    allSignatures.map(async (path) => {
      const { data } = await supabase.storage
        .from('os-evidencias')
        .createSignedUrl(path, 3600)
      return { path, url: data?.signedUrl }
    })
  )

  return {
    os,
    hasChecklist: true,
    checklist: {
      template: osChecklist.template_snapshot,
      respostas: respostas || [],
      sections,
      score,
      validation,
      photos: photosWithUrls,
      signatures: signaturesWithUrls
    }
  }
}
```

## 📊 Estrutura do PDF

### Seção 1: Cabeçalho
```
┌─────────────────────────────────────────────┐
│ Logo da Empresa           OS #12345         │
│                                             │
│ Cliente: ABC Condomínio                     │
│ Equipamento: Elevador A - Bloco 1          │
│ Técnico: João Silva                         │
│ Data: 21/10/2025                           │
└─────────────────────────────────────────────┘
```

### Seção 2: Score de Conformidade
```
┌─────────────────────────────────────────────┐
│           RELATÓRIO DE CONFORMIDADE         │
│                                             │
│   Score Global: 92%  ████████████░░         │
│                                             │
│   ✓ Conformes:       12 itens              │
│   ✗ Não Conformes:    1 item               │
│   ⊘ Pendentes:        2 itens              │
│   - N/A:              0 itens              │
│                                             │
│   ⚠ Críticos Pendentes: 0                  │
└─────────────────────────────────────────────┘
```

### Seção 3: Checklist Detalhado

```
┌─────────────────────────────────────────────┐
│ SEÇÃO: Segurança                            │
├─────────────────────────────────────────────┤
│ 1. Equipamento desenergizado [CRÍTICO]     │
│    Status: ✓ CONFORME                       │
│    Valor: Sim                               │
│    Respondido por: João Silva               │
│    Referência: NBR 16083 - 5.2             │
│    [Foto da evidência]                      │
├─────────────────────────────────────────────┤
│ 2. EPIs adequados                           │
│    Status: ✓ CONFORME                       │
│    Valor: Sim                               │
│    Respondido por: João Silva               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ SEÇÃO: Medições Elétricas                   │
├─────────────────────────────────────────────┤
│ 5. Corrente do motor                        │
│    Status: ✓ CONFORME                       │
│    Valor: 32.5 A                            │
│    Intervalo permitido: 0 - 50 A           │
│    Respondido por: João Silva               │
│    [Foto do multímetro]                     │
└─────────────────────────────────────────────┘
```

### Seção 4: Selo ABNT (se aplicável)

```
┌─────────────────────────────────────────────┐
│        CERTIFICAÇÃO DE CONFORMIDADE         │
│                                             │
│  Este relatório foi elaborado de acordo    │
│  com as normas:                             │
│  • NBR 16083:2012                          │
│  • NBR 5666                                 │
│                                             │
│  ✓ CONFORME ÀS NORMAS                      │
│                                             │
│  Score: 92% (Aprovado)                     │
│  Data: 21/10/2025                          │
│                                             │
│  [Assinatura Digital do Inspetor]          │
└─────────────────────────────────────────────┘
```

## 🖨️ Implementação com Edge Function

```typescript
// supabase/functions/gerar-relatorio-os/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// Importe sua biblioteca de PDF (ex: pdfkit, jspdf, puppeteer)

serve(async (req) => {
  try {
    const { osId } = await req.json()
    
    // 1. Get data
    const data = await prepareChecklistDataForReport(osId)
    
    // 2. Generate PDF
    const pdf = await generatePDF(data)
    
    // 3. Upload to storage
    const fileName = `relatorio-os-${osId}-${Date.now()}.pdf`
    const { data: upload } = await supabase.storage
      .from('relatorios')
      .upload(fileName, pdf, {
        contentType: 'application/pdf'
      })
    
    // 4. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('relatorios')
      .getPublicUrl(fileName)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        url: publicUrl 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function generatePDF(data: any) {
  const { os, checklist } = data
  
  // Implementação específica da lib de PDF
  // Exemplo conceitual:
  
  const pdf = new PDFDocument()
  
  // Header
  pdf.fontSize(20).text('RELATÓRIO DE ORDEM DE SERVIÇO', { align: 'center' })
  pdf.fontSize(12).text(`OS #${os.numero_os}`)
  
  // OS Info
  pdf.text(`Cliente: ${os.cliente.nome_local}`)
  pdf.text(`Equipamento: ${os.equipamento.tipo} - ${os.equipamento.modelo}`)
  pdf.text(`Técnico: ${os.tecnico.nome}`)
  
  // Checklist Score
  if (checklist) {
    pdf.addPage()
    pdf.fontSize(16).text('CHECKLIST DE CONFORMIDADE')
    pdf.fontSize(12).text(`Template: ${checklist.template.nome}`)
    pdf.text(`Versão: ${checklist.template.versao}`)
    pdf.text(`Score: ${checklist.score.score}%`)
    
    // Progress bar
    const barWidth = 400
    const fillWidth = (barWidth * checklist.score.score) / 100
    pdf.rect(50, pdf.y, fillWidth, 20).fill('#4CAF50')
    pdf.rect(50 + fillWidth, pdf.y - 20, barWidth - fillWidth, 20).fill('#E0E0E0')
    
    // Stats
    pdf.moveDown()
    pdf.text(`✓ Conformes: ${checklist.score.items_por_status.conforme}`)
    pdf.text(`✗ Não Conformes: ${checklist.score.items_por_status.nao_conforme}`)
    pdf.text(`⊘ Pendentes: ${checklist.score.items_por_status.pendente}`)
    
    // Sections
    Object.entries(checklist.sections).forEach(([secao, items]) => {
      pdf.addPage()
      pdf.fontSize(14).text(secao, { underline: true })
      
      items.forEach((item: any, index: number) => {
        pdf.moveDown()
        pdf.fontSize(11).text(`${index + 1}. ${item.descricao}`)
        
        // Status icon
        const statusIcon = {
          conforme: '✓',
          nao_conforme: '✗',
          pendente: '⊘',
          na: '-'
        }[item.resposta.status_item]
        
        pdf.text(`Status: ${statusIcon} ${item.resposta.status_item.toUpperCase()}`)
        
        // Value
        if (item.resposta.valor_boolean !== null) {
          pdf.text(`Valor: ${item.resposta.valor_boolean ? 'Sim' : 'Não'}`)
        } else if (item.resposta.valor_number !== null) {
          pdf.text(`Valor: ${item.resposta.valor_number} ${item.unidade || ''}`)
        } else if (item.resposta.valor_text) {
          pdf.text(`Resposta: ${item.resposta.valor_text}`)
        }
        
        // ABNT refs
        if (item.abnt_refs && item.abnt_refs.length > 0) {
          pdf.fontSize(9).fillColor('#666')
          pdf.text(`Ref: ${item.abnt_refs.join(', ')}`)
          pdf.fillColor('#000')
        }
        
        // Photos (if any)
        const itemPhotos = checklist.photos.filter(p => 
          item.resposta.fotos_urls?.includes(p.path)
        )
        
        itemPhotos.forEach(photo => {
          if (photo.url) {
            // Download and embed image
            pdf.image(photo.url, { width: 200 })
          }
        })
      })
    })
    
    // ABNT Seal
    if (checklist.template.origem === 'abnt') {
      pdf.addPage()
      pdf.fontSize(16).text('CERTIFICAÇÃO DE CONFORMIDADE', { align: 'center' })
      pdf.moveDown()
      pdf.fontSize(12).text('Este relatório foi elaborado de acordo com:')
      
      checklist.template.abnt_refs.forEach((ref: string) => {
        pdf.text(`• ${ref}`)
      })
      
      pdf.moveDown()
      if (checklist.score.score >= 80) {
        pdf.fillColor('#4CAF50').fontSize(14).text('✓ CONFORME ÀS NORMAS')
      } else {
        pdf.fillColor('#F44336').fontSize(14).text('✗ NÃO CONFORME')
      }
      
      // Signatures
      const signatures = checklist.signatures
      signatures.forEach((sig: any, index: number) => {
        if (sig.url) {
          pdf.moveDown()
          pdf.fillColor('#000').fontSize(10).text(`Assinatura ${index + 1}:`)
          pdf.image(sig.url, { width: 150 })
        }
      })
    }
  }
  
  pdf.end()
  return pdf
}
```

## 🎨 Templates Visuais

### Layout A4 Padrão
- Margens: 20mm
- Fonte: Arial/Helvetica
- Cores: Cinza (#666) para secundário, Verde (#4CAF50) para conforme, Vermelho (#F44336) para não conforme

### Elementos Visuais

1. **Progress Bar**
   ```
   ████████████████░░░░ 85%
   ```

2. **Status Icons**
   - ✓ Conforme (verde)
   - ✗ Não Conforme (vermelho)
   - ⊘ Pendente (amarelo)
   - - N/A (cinza)

3. **Badges**
   - `[CRÍTICO]` vermelho
   - `[OBRIGATÓRIO]` azul
   - `[ABNT]` roxo

## 🔗 Chamada da API

```typescript
// Frontend
async function gerarRelatorio(osId: string) {
  const response = await fetch(
    'https://your-project.supabase.co/functions/v1/gerar-relatorio-os',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({ osId })
    }
  )
  
  const { url } = await response.json()
  
  // Download or open
  window.open(url, '_blank')
}
```

## 📱 Exemplo de Botão na UI

```typescript
// src/components/order-actions.tsx
export function OrderActions({ osId }: { osId: string }) {
  const [generating, setGenerating] = useState(false)
  
  const handleGenerateReport = async () => {
    try {
      setGenerating(true)
      const url = await gerarRelatorio(osId)
      toast.success('Relatório gerado com sucesso!')
      window.open(url, '_blank')
    } catch (error) {
      toast.error('Erro ao gerar relatório')
    } finally {
      setGenerating(false)
    }
  }
  
  return (
    <Button 
      onClick={handleGenerateReport}
      disabled={generating}
    >
      {generating ? 'Gerando...' : 'Gerar Relatório PDF'}
    </Button>
  )
}
```

---

**Próximos passos:**
1. Escolher biblioteca de PDF (recomendado: PDFKit para Node/Deno)
2. Implementar Edge Function
3. Configurar storage bucket para relatórios
4. Adicionar assinatura digital (opcional)
5. Implementar marca d'água (opcional)

