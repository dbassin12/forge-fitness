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

// iPhone launch screens (portrait): Forge's mark on the app background, so opening the
// Home Screen app never flashes white. Sizes are CSS width × height × device pixel ratio.
const SPLASH = [
  [440, 956, 3],
  [402, 874, 3],
  [430, 932, 3],
  [393, 852, 3],
  [390, 844, 3],
  [428, 926, 3],
  [375, 812, 3],
  [414, 896, 3],
  [414, 896, 2],
  [375, 667, 2],
  [414, 736, 3],
]
await mkdir(join(out, '..', 'splash'), { recursive: true })
const links = []
for (const [w, h, r] of SPLASH) {
  const W = w * r
  const H = h * r
  const mark = Math.round(Math.min(W, H) * 0.28)
  const logo = await sharp(Buffer.from(regular)).resize(mark, mark).png().toBuffer()
  const name = `splash-${W}x${H}.png`
  await sharp({ create: { width: W, height: H, channels: 3, background: '#0b0d10' } })
    .composite([{ input: logo, left: Math.round((W - mark) / 2), top: Math.round((H - mark) / 2 - H * 0.04) }])
    .png({ compressionLevel: 9, palette: true })
    .toFile(join(out, '..', 'splash', name))
  links.push(
    `    <link rel="apple-touch-startup-image" media="(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)" href="/splash/${name}" />`,
  )
  console.log('wrote', name)
}
console.log('\nindex.html <head> links:\n' + links.join('\n'))
