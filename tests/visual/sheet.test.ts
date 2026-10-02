import { describe, expect, it } from 'vitest'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DEMO_MOTIONS } from '@/anim/demo'
import { cycleDuration, sampleMotion } from '@/anim/motion'
import { solvePose } from '@/anim/rig'
import { buildShapes } from '@/anim/draw'
import { viewBoxFor } from '@/anim/frame'
import { shapeToSvg } from '@/anim/svgString'

/**
 * Renders contact sheets of every motion (6 frames across a full cycle) to anim-sheets/*.png.
 * Run with: ANIM_SHEET=1 npx vitest run tests/visual
 */
const enabled = !!process.env.ANIM_SHEET
const only = process.env.ANIM_ONLY?.split(',')

describe.runIf(enabled)('animation contact sheets', () => {
  it('renders sheets', async () => {
    const sharp = (await import('sharp')).default
    const outDir = join(process.cwd(), 'anim-sheets')
    mkdirSync(outDir, { recursive: true })
    const items = DEMO_MOTIONS.filter((d) => !only || only.includes(d.id))
    const cellW = 210
    const cellH = 158
    const frames = 6
    const perSheet = 8
    for (let sheet = 0; sheet * perSheet < items.length; sheet++) {
      const rows = items.slice(sheet * perSheet, (sheet + 1) * perSheet)
      let body = ''
      rows.forEach((d, r) => {
        const m = d.motion
        const vb = viewBoxFor(m)
        const D = cycleDuration(m) * (m.alternate ? 2 : 1)
        for (let i = 0; i < frames; i++) {
          const t = (i / frames) * D
          const s = sampleMotion(m, t)
          const pose = m.pose(s.u, s.side)
          const sk = solvePose(pose, m.view)
          const shapes = buildShapes(sk, pose, { props: m.props, floorFrom: vb.x, floorTo: vb.x + vb.w, highlight: { chest: 0.6 } })
          const inner = shapes.map(shapeToSvg).join('')
          const x = i * cellW
          const y = r * cellH
          body += `<svg x="${x}" y="${y}" width="${cellW}" height="${cellH}" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}"><rect x="${vb.x}" y="${vb.y}" width="${vb.w}" height="${vb.h}" fill="#0b0d10"/>${inner}</svg>`
          body += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="none" stroke="#222" />`
          body += `<text x="${x + 6}" y="${y + 14}" font-size="11" font-family="sans-serif" fill="#9aa4b2">${i === 0 ? d.name : ''} u=${s.u.toFixed(2)} ${s.label ?? ''}${sk.reachable ? '' : ' !REACH'}</text>`
        }
      })
      const W = frames * cellW
      const H = rows.length * cellH
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${body}</svg>`
      const file = join(outDir, `sheet-${sheet + 1}.png`)
      await sharp(Buffer.from(svg)).png().toFile(file)
      writeFileSync(join(outDir, `sheet-${sheet + 1}.svg`), svg)
    }
    expect(items.length).toBeGreaterThan(0)
  }, 120_000)
})
