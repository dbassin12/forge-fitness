import { useCallback, useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { reducedMotion } from '@/app/prefs'
import { cx } from './cx'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
}

/** How far (px) or how fast (px/ms) a downward drag on the top bar has to go to close the sheet. */
const CLOSE_DISTANCE = 110
const CLOSE_SPEED = 0.6
const EXIT_MS = 200

/**
 * Bottom sheet dialog (portal). Closes on backdrop tap, Escape, the X, or dragging the top bar down,
 * sliding away like a native sheet.
 */
export function Sheet(props: SheetProps) {
  if (!props.open) return null
  return createPortal(<SheetPanel {...props} />, document.body)
}

function SheetPanel({ onClose, title, children }: Omit<SheetProps, 'open'>) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const done = useRef(onClose)
  done.current = onClose
  const [closing, setClosing] = useState(false)
  const [dy, setDy] = useState(0)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ id: number; startY: number; y: number; t: number; v: number } | null>(null)

  const close = useCallback(() => {
    if (reducedMotion()) done.current()
    else setClosing(true)
  }, [])

  useEffect(() => {
    if (!closing) return
    const t = setTimeout(() => done.current(), EXIT_MS)
    return () => clearTimeout(t)
  }, [closing])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Move focus into the sheet (unless a field inside already took it), and give it back after.
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (panel.current && !panel.current.contains(document.activeElement)) panel.current.focus({ preventScroll: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      // Not back into a text field: that would pop the keyboard up again on a phone.
      if (before?.isConnected && !before.matches('input, textarea, select, [contenteditable="true"]')) before.focus({ preventScroll: true })
    }
  }, [close])

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (closing || (e.pointerType === 'mouse' && e.button !== 0) || (e.target as HTMLElement).closest('button')) return
    drag.current = { id: e.pointerId, startY: e.clientY, y: e.clientY, t: e.timeStamp, v: 0 }
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDragging(true)
  }
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dt = Math.max(1, e.timeStamp - d.t)
    d.v = (e.clientY - d.y) / dt
    d.y = e.clientY
    d.t = e.timeStamp
    setDy(Math.max(0, e.clientY - d.startY))
  }
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    setDragging(false)
    const moved = Math.max(0, e.clientY - d.startY)
    if (moved > CLOSE_DISTANCE || (moved > 24 && d.v > CLOSE_SPEED)) close()
    else setDy(0)
  }
  const onCancel = () => {
    drag.current = null
    setDragging(false)
    setDy(0)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined}>
      <button
        aria-label="Close"
        tabIndex={-1}
        className="absolute inset-0 animate-[sheet-fade_.2s_ease-out] bg-black/55 transition-opacity duration-200"
        style={{ opacity: closing ? 0 : 1 - Math.min(0.6, dy / 500) }}
        onClick={close}
      />
      <div
        ref={panel}
        tabIndex={-1}
        className={cx(
          'relative max-h-[86vh] w-full max-w-xl animate-[sheet-in_.28s_cubic-bezier(.2,.9,.3,1)] overflow-y-auto overscroll-contain rounded-t-3xl border-t border-line bg-surface px-4 outline-none',
          !dragging && 'transition-transform duration-200 ease-out',
        )}
        style={{ paddingBottom: 'calc(var(--safe-bottom) + 20px)', transform: closing ? 'translateY(100%)' : dy ? `translateY(${dy}px)` : undefined }}
      >
        <div
          data-sheet-grip
          className="sticky top-0 z-10 -mx-4 cursor-grab touch-none bg-surface px-4 pt-3 select-none active:cursor-grabbing"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onCancel}
        >
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-surface-3" aria-hidden />
          {title ? (
            <div className="flex items-center justify-between gap-2 pb-3">
              <h2 id={titleId} className="font-display text-xl font-bold">
                {title}
              </h2>
              <button aria-label="Close" onClick={close} className="-mr-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2">
                <X size={20} />
              </button>
            </div>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  )
}
