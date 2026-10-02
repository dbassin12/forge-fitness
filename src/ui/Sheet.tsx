import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/** Bottom sheet dialog (portal). Closes on backdrop tap and Escape. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button aria-label="Close" className="absolute inset-0 bg-black/55 animate-[fade-up_.2s_ease-out]" onClick={onClose} />
      <div
        className="relative max-h-[86vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border-t border-line bg-surface px-4 pt-3 animate-[fade-up_.25s_ease-out]"
        style={{ paddingBottom: 'calc(var(--safe-bottom) + 20px)' }}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-surface-3" />
        {title ? (
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-xl font-bold">{title}</h2>
            <button aria-label="Close" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface-2">
              <X size={20} />
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  )
}
