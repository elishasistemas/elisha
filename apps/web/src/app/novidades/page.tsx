import fs from 'fs'
import path from 'path'

export const dynamic = 'force-static'

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderInlineMarkdown(input: string) {
  // Links: [texto](url)
  return input.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (_m, text, url) => {
    const safeText = escapeHtml(text)
    const safeUrl = url
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-primary underline">${safeText}</a>`
  })
}

function renderMarkdown(md: string) {
  const lines = md.split('\n')
  let html: string[] = []
  let inList = false
  let inCode = false

  const closeList = () => {
    if (inList) {
      html.push('</ul>')
      inList = false
    }
  }

  for (const raw of lines) {
    const line = raw.replace(/\r$/, '')

    // Code block fence
    if (line.startsWith('```')) {
      if (!inCode) {
        closeList()
        inCode = true
        html.push('<pre class="bg-muted/50 border rounded-lg p-4 overflow-x-auto text-sm"><code>')
      } else {
        inCode = false
        html.push('</code></pre>')
      }
      continue
    }

    if (inCode) {
      html.push(escapeHtml(line))
      continue
    }

    // Headings
    const hMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (hMatch) {
      closeList()
      const level = hMatch[1].length
      const text = renderInlineMarkdown(escapeHtml(hMatch[2].trim()))
      const size = level === 1 ? 'text-3xl' : level === 2 ? 'text-2xl' : level === 3 ? 'text-xl' : 'text-lg'
      html.push(`<h${level} class="${size} font-bold mt-8 mb-3">${text}</h${level}>`)
      continue
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      closeList()
      html.push('<hr class="my-8 border-muted" />')
      continue
    }

    // List items
    if (line.startsWith('- ')) {
      if (!inList) {
        inList = true
        html.push('<ul class="list-disc ml-6 space-y-1">')
      }
      const item = renderInlineMarkdown(escapeHtml(line.slice(2)))
      html.push(`<li>${item}</li>`)
      continue
    }

    // Blank line
    if (line.trim() === '') {
      closeList()
      continue
    }

    // Paragraph
    closeList()
    const content = renderInlineMarkdown(escapeHtml(line))
    html.push(`<p class="leading-7">${content}</p>`) 
  }

  closeList()
  return html.join('\n')
}

function toValueFocusedMarkdown(md: string) {
  const lines = md.split('\n')
  const out: string[] = []
  const excludeHeadings = [
    '🔧 Configuração Técnica',
    '🎨 Design System',
    'Documentação',
    'Configuração e Desenvolvimento',
  ]
  const headingRewrites: Record<string, string> = {
    'Changelog': 'Novidades focadas em valor',
    '✨ Adicionado': 'Novidades que você recebe',
    'Páginas (Área Protegida)': 'Novas páginas para seu dia a dia',
    'Autenticação e Segurança': 'Acesso seguro e simples',
    'Interface e Componentes': 'Interface mais prática',
    'Dashboard e Gestão': 'Visão e controle do seu trabalho',
    'Hooks e Gerenciamento de Estado': 'Dados mais estáveis',
    'Integração com Banco de Dados': 'Dados confiáveis e sincronizados',
    'Estrutura de Dados': 'O que você pode gerenciar',
    '📱 Funcionalidades de UX': 'Experiência mais fluida',
  }

  let skipLevel: number | null = null

  const isTechyLine = (text: string) => {
    const keywords = [
      'Next.js', 'TypeScript', 'ESLint', 'PNPM', 'Tailwind', 'Radix', 'Lucide', 'Iconoir', 'Turbopack',
      'schema', 'stub', 'fallback', 'variáveis de ambiente', 'tipos', 'tipagem'
    ]
    const lower = text.toLowerCase()
    return keywords.some(k => lower.includes(k.toLowerCase()))
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      const level = h[1].length
      let text = h[2].trim()

      // Stop skipping if reaching a heading at same or higher level
      if (skipLevel !== null && level <= skipLevel) {
        skipLevel = null
      }

      // Check if this heading should be excluded
      if (excludeHeadings.some(title => text.includes(title))) {
        skipLevel = level
        continue
      }

      // Rewrite heading text if mapped
      for (const [from, to] of Object.entries(headingRewrites)) {
        if (text.includes(from)) {
          text = text.replace(from, to)
        }
      }
      out.push(`${h[1]} ${text}`)
      continue
    }

    if (skipLevel !== null) {
      continue
    }

    // Remove file paths and inline code with paths to keep copy value-focused
    line = line
      .replace(/\([^)]*src\/[^)]*\)/g, '') // remove (src/...) references
      .replace(/`[^`]*src\/[^`]*`/g, '') // remove inline code that points to files
      .replace(/\s+\(\s*\)$/, '') // clean empty parentheses

    // Filter out purely technical bullet items
    if (line.trim().startsWith('- ') && isTechyLine(line)) {
      continue
    }

    out.push(line)
  }

  // Add a brief value-first intro at the top if not present
  const intro = [
    '## O que mudou para você',
    '',
    'Selecionamos abaixo o que muda para você. Removemos detalhes técnicos para manter o foco no impacto no seu dia a dia.',
    ''
  ]

  return intro.concat(out).join('\n')
}

export default async function NovidadesPage() {
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md')
  let content = '# Novidades\n\nEm breve.'
  try {
    const file = fs.readFileSync(changelogPath, 'utf8')
    content = toValueFocusedMarkdown(file)
  } catch {
    // keep default content
  }

  const html = renderMarkdown(content)

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Novidades focadas em você</h1>
        <p className="text-muted-foreground">Veja como as últimas melhorias ajudam no seu dia a dia</p>
      </div>
      <article className="space-y-4" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
