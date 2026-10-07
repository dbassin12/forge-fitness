import { it } from 'vitest'
import { mkdirSync } from 'node:fs'
import { DEMO_MOTIONS } from '@/anim/demo'
import { cycleDuration, sampleMotion } from '@/anim/motion'
import { solvePose } from '@/anim/rig'
import { buildShapes } from '@/anim/draw'
import { viewBoxFor } from '@/anim/frame'
import { shapeToSvg } from '@/anim/svgString'

// Scratch QA: renders `FRAMES` evenly spaced frames per motion in one row (ANIM_FLOW=ids).
it.runIf(!!process.env.ANIM_FLOW)('flow frames', async () => {
  const sharp = (await import('sharp')).default
  mkdirSync('anim-sheets', { recursive: true })
  const ids = process.env.ANIM_FLOW!.split(',')
  const frames = Number(process.env.FRAMES ?? 12)
  const cellW = 180
  const cellH = 135
  let body = ''
  ids.forEach((id, r) => {
    const m = DEMO_MOTIONS.find((d) => d.id === id)!.motion
    const vb = viewBoxFor(m)
    const D = cycleDuration(m) * (m.alternate ? 2 : 1)
    for (let i = 0; i < frames; i++) {
      const from = Number(process.env.FROM ?? 0)
      const to = Number(process.env.TO ?? 1)
      const s = sampleMotion(m, (from + ((to - from) * i) / frames) * D)
      const pose = m.pose(s.u, s.side)
      const sk = solvePose(pose, m.view)
      const inner = buildShapes(sk, pose, { props: m.props, floorFrom: vb.x, floorTo: vb.x + vb.w, highlight: { core: 0.6 } }).map(shapeToSvg).join('')
      const x = i * cellW
      const y = r * cellH
      body += `<svg x="${x}" y="${y}" width="${cellW}" height="${cellH}" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}"><rect x="${vb.x}" y="${vb.y}" width="${vb.w}" height="${vb.h}" fill="#0b0d10"/>${inner}</svg>`
      body += `<text x="${x + 4}" y="${y + 12}" font-size="10" font-family="sans-serif" fill="#9aa4b2">${i === 0 ? id : ''} ${s.u.toFixed(2)}${sk.reachable ? '' : ' !R'}</text>`
    }
  })
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${frames * cellW}" height="${ids.length * cellH}">${body}</svg>`
  await sharp(Buffer.from(svg)).png().toFile(`anim-sheets/flow-${process.env.OUT ?? 'x'}.png`)
}, 60_000)
