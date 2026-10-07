import { buildShapes, type Palette } from '@/anim/draw'
import { viewBoxFor } from '@/anim/frame'
import { sampleMotion } from '@/anim/motion'
import { solvePose } from '@/anim/rig'
import { shapesToSvg } from '@/anim/svgString'
import type { Motion } from '@/anim/types'

export interface ShareStats {
  title: string
  dateLabel: string
  minutes: number
  kcal: number
  sets: number
  xp: number
  streakWeeks: number
  motion?: Motion
  palette: Palette
  accent: string
}

/** A still of the mannequin mid-rep, as an SVG string. */
export function poseSvg(motion: Motion, t: number, palette: Palette, width = 900): string {
  const vb = viewBoxFor(motion)
  const s = sampleMotion(motion, t)
  const pose = motion.pose(s.u, s.side)
  const sk = solvePose(pose, motion.view)
  const shapes = buildShapes(sk, pose, { palette, props: motion.props, floor: motion.floor, floorFrom: vb.x, floorTo: vb.x + vb.w })
  return shapesToSvg(shapes, vb, { width })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Draw a 1080×1350 "I did my workout" card (Instagram portrait size) and return it as a PNG. */
export async function makeShareCard(o: ShareStats): Promise<Blob | null> {
  const W = 1080
  const H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const font = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#0b0d10')
  bg.addColorStop(1, '#171b22')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W * 0.85, 120, 20, W * 0.85, 120, 700)
  glow.addColorStop(0, `${o.accent}66`)
  glow.addColorStop(1, `${o.accent}00`)
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = o.accent
  ctx.font = `800 44px ${font}`
  ctx.fillText('🔥 FORGE', 72, 120)
  ctx.fillStyle = '#9aa4b2'
  ctx.font = `500 34px ${font}`
  ctx.fillText(o.dateLabel, 72, 172)

  if (o.motion) {
    try {
      const svg = poseSvg(o.motion, 1.1, { ...o.palette, highlight: o.accent }, 900)
      const img = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
      const w = 860
      const h = (img.height / img.width) * w || 645
      ctx.drawImage(img, (W - w) / 2, 210, w, h)
    } catch {
      /* the figure is a bonus; the card still works without it */
    }
  }

  ctx.fillStyle = '#f3f5f8'
  ctx.font = `800 76px ${font}`
  ctx.fillText(o.title.length > 22 ? `${o.title.slice(0, 21)}…` : o.title, 72, 950)
  ctx.fillStyle = '#9aa4b2'
  ctx.font = `500 36px ${font}`
  ctx.fillText('Workout complete ✓', 72, 1004)

  const stats = [
    { v: `${o.minutes}`, k: 'minutes' },
    { v: `${o.sets}`, k: 'sets' },
    { v: `~${o.kcal}`, k: 'kcal' },
    { v: `+${o.xp}`, k: 'XP' },
  ]
  const boxW = (W - 72 * 2 - 24 * 3) / 4
  stats.forEach((s, i) => {
    const x = 72 + i * (boxW + 24)
    const y = 1056
    ctx.fillStyle = '#1b1f26'
    roundRect(ctx, x, y, boxW, 150, 28)
    ctx.fill()
    ctx.fillStyle = i === 3 ? '#a78bfa' : '#f3f5f8'
    ctx.font = `800 56px ${font}`
    ctx.textAlign = 'center'
    ctx.fillText(s.v, x + boxW / 2, y + 82)
    ctx.fillStyle = '#9aa4b2'
    ctx.font = `600 28px ${font}`
    ctx.fillText(s.k.toUpperCase(), x + boxW / 2, y + 124)
    ctx.textAlign = 'left'
  })

  ctx.fillStyle = '#f3f5f8'
  ctx.font = `700 38px ${font}`
  ctx.fillText(o.streakWeeks > 0 ? `🔥 ${o.streakWeeks}-week streak` : '🔥 Streak started', 72, 1282)
  ctx.fillStyle = '#6b7584'
  ctx.font = `500 30px ${font}`
  ctx.textAlign = 'right'
  ctx.fillText('made with Forge', W - 72, 1282)
  ctx.textAlign = 'left'

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}

/** Share through the phone's share sheet when it takes files, otherwise download the image. */
export async function shareImage(blob: Blob, filename: string, text: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], filename, { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text })
      return 'shared'
    } catch {
      return 'cancelled'
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
  return 'downloaded'
}
