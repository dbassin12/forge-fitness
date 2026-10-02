import type { Shape } from './draw'
import type { ViewBox } from './frame'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

export function shapeToSvg(s: Shape): string {
  const op = s.opacity !== undefined && s.opacity < 1 ? ` opacity="${s.opacity}"` : ''
  if (s.opacity === 0) return ''
  switch (s.kind) {
    case 'line':
      return `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="${s.stroke}" stroke-width="${s.width}" stroke-linecap="round"${op}/>`
    case 'circle':
      return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${s.fill}"${s.stroke ? ` stroke="${s.stroke}" stroke-width="${s.width ?? 1}"` : ''}${op}/>`
    case 'ellipse':
      return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" fill="${s.fill}"${op}/>`
    case 'path':
      return `<path d="${s.d}" fill="${s.fill ?? 'none'}"${s.stroke ? ` stroke="${s.stroke}" stroke-width="${s.width ?? 1}" stroke-linecap="${s.cap ?? 'round'}" stroke-linejoin="${s.join ?? 'round'}"` : ''}${op}/>`
    case 'rect':
      return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.rx ?? 0}" fill="${s.fill}"${s.stroke ? ` stroke="${s.stroke}" stroke-width="${s.width ?? 1}"` : ''}${op}/>`
    case 'polygon':
      return `<polygon points="${s.points}" fill="${s.fill}"${s.stroke ? ` stroke="${s.stroke}" stroke-width="${s.width ?? 1}" stroke-linejoin="round"` : ''}${op}/>`
  }
}

export function shapesToSvg(shapes: Shape[], vb: ViewBox, opts: { width?: number; height?: number; bg?: string; label?: string } = {}): string {
  const w = opts.width ?? 320
  const h = opts.height ?? Math.round((w * vb.h) / vb.w)
  const bg = opts.bg ? `<rect x="${vb.x}" y="${vb.y}" width="${vb.w}" height="${vb.h}" fill="${opts.bg}"/>` : ''
  const label = opts.label
    ? `<text x="${vb.x + 4}" y="${vb.y + 11}" font-size="9" font-family="sans-serif" fill="#9aa4b2">${esc(opts.label)}</text>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}">${bg}${shapes.map(shapeToSvg).join('')}${label}</svg>`
}
