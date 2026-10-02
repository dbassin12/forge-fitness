// Generates PWA icons from scripts/icon.svg using sharp.
// Usage: node scripts/gen-icons.mjs
import sharp from 'sharp'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '..', 'public', 'icons')
await mkdir(out, { recursive: true })

const template = await readFile(join(here, 'icon.svg'), 'utf8')
// Regular icons use the full art; maskable icons shrink the art into the 80% safe zone.
const regular = template.replace('SCALE', '0.86')
const maskable = template.replace('SCALE', '0.62').replace('rx="112"', 'rx="0"')

async function png(svg, size, name) {
  await sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toFile(join(out, name))
  console.log('wrote', name)
}

await png(regular, 192, 'icon-192.png')
await png(regular, 512, 'icon-512.png')
await png(maskable, 512, 'icon-maskable-512.png')
await png(maskable.replace('rx="0"', 'rx="0"'), 180, 'apple-touch-icon.png')
await png(regular, 64, 'favicon-64.png')
await writeFile(join(out, 'favicon.svg'), regular)
console.log('wrote favicon.svg')
