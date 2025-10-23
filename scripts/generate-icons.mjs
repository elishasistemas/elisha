#!/usr/bin/env node
/*
  Gera ícones do PWA a partir de uma imagem de origem.
  - Entrada padrão: public/icons/source.png
  - Saídas: icon-512.png, icon-192.png, apple-touch-icon.png, maskable-512.png (fundo preto)
  - Padding interno ~12% (escala 76%) para evitar cortes em maskable/iOS
*/

import fs from 'node:fs/promises'
import path from 'node:path'

async function main() {
  const { default: sharp } = await import('sharp')

  const projectRoot = process.cwd()
  const srcCandidates = [
    path.join(projectRoot, 'public', 'icons', 'source.png'),
    path.join(projectRoot, 'public', 'logo-white.png'),
    path.join(projectRoot, 'public', 'logo-white.jpg'),
    path.join(projectRoot, 'public', 'logo.jpeg'),
  ]

  let inputPath = null
  for (const p of srcCandidates) {
    try { await fs.access(p); inputPath = p; break } catch {}
  }

  if (!inputPath) {
    console.error('[gen:icons] Arquivo de origem não encontrado. Coloque a sua logo em public/icons/source.png')
    process.exit(1)
  }

  const outDir = path.join(projectRoot, 'public', 'icons')
  await fs.mkdir(outDir, { recursive: true })

  const sizes = [
    { name: 'icon-512.png', size: 512 },
    { name: 'maskable-512.png', size: 512 },
    { name: 'icon-192.png', size: 192 },
    { name: 'apple-touch-icon.png', size: 180 },
  ]

  const scale = 0.76 // ~12% margem por lado

  const src = (await import('sharp')).default(inputPath)

  for (const { name, size } of sizes) {
    const inner = Math.round(size * scale)
    const canvas = (await import('sharp')).default({
      create: { width: size, height: size, channels: 4, background: '#000000' },
    })

    const resized = await src
      .clone()
      .resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()

    const outPath = path.join(outDir, name)
    await canvas
      .composite([{ input: resized, gravity: 'center' }])
      .png()
      .toFile(outPath)

    console.log(`[gen:icons] Gerado ${path.relative(projectRoot, outPath)}`)
  }

  console.log('[gen:icons] Concluído.')
}

main().catch((err) => {
  console.error('[gen:icons] Erro:', err)
  process.exit(1)
})

