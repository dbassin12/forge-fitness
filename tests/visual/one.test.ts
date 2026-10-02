import { describe, it } from 'vitest'
import { DEMO_MOTIONS } from '@/anim/demo'
import { sampleMotion } from '@/anim/motion'
import { solvePose } from '@/anim/rig'
import { buildShapes } from '@/anim/draw'
import { viewBoxFor } from '@/anim/frame'
import { shapesToSvg } from '@/anim/svgString'

const id = process.env.ANIM_ONE
describe.runIf(!!id)('single frame', () => {
  it('renders', async () => {
    const sharp = (await import('sharp')).default
    const d = DEMO_MOTIONS.find((x) => x.id === id)!
    const t = Number(process.env.ANIM_T ?? 0)
    const s = sampleMotion(d.motion, t)
    const pose = d.motion.pose(s.u, s.side)
    const sk = solvePose(pose, d.motion.view)
    const vb = viewBoxFor(d.motion)
    const svg = shapesToSvg(buildShapes(sk, pose, { props: d.motion.props, highlight: { chest: 1 } }), vb, { width: 900, bg: '#0b0d10' })
    await sharp(Buffer.from(svg)).png().toFile(`anim-sheets/one-${id}.png`)
  })
})
