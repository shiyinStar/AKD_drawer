import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const outDir = join(__dirname, '..', 'resources', 'icons', 'tray')

const icons: { name: string; color: string; type: 'solid' | 'dashed-ring' | 'glow' | 'cross' }[] = [
  { name: 'not-ready', color: '#60a5fa', type: 'dashed-ring' },
  { name: 'idle', color: '#34d399', type: 'solid' },
  { name: 'previewing', color: '#6366f1', type: 'glow' },
  { name: 'drawing', color: '#fbbf24', type: 'solid' },
  { name: 'error', color: '#f87171', type: 'cross' },
]

function makeSvg(color: string, type: string): string {
  const c = 16
  const r = 7

  if (type === 'solid') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <circle cx="${c}" cy="${c}" r="${r}" fill="${color}"/>
</svg>`
  }

  if (type === 'dashed-ring') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <circle cx="${c}" cy="${c}" r="12" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="3 3"/>
  <circle cx="${c}" cy="${c}" r="${r}" fill="${color}"/>
</svg>`
  }

  if (type === 'glow') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <circle cx="${c}" cy="${c}" r="10" fill="${color}" opacity="0.3" filter="url(#glow)"/>
  <circle cx="${c}" cy="${c}" r="${r}" fill="${color}"/>
</svg>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <circle cx="${c}" cy="${c}" r="10" fill="${color}" opacity="0.25"/>
  <circle cx="${c}" cy="${c}" r="${r}" fill="${color}"/>
</svg>`
}

async function main() {
  await mkdir(outDir, { recursive: true })

  for (const icon of icons) {
    const svg = makeSvg(icon.color, icon.type)
    const buf = await sharp(Buffer.from(svg)).resize(32, 32).png().toBuffer()
    const filePath = join(outDir, `${icon.name}.png`)
    await sharp(buf).toFile(filePath)
    console.log(`  ✓ ${icon.name}.png (32×32)`)
  }

  console.log(`\n5 tray icons generated → ${outDir}`)
}

main().catch((err) => {
  console.error('Failed to generate tray icons:', err)
  process.exit(1)
})
