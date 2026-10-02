import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Keyboard, X } from 'lucide-react'
import { Button } from '@/ui/Button'
import { vibrate } from '@/device/haptics'
import { getDetector } from './scanner'

/** Full-screen camera scanner. Calls `onCode` once with the first barcode it reads. */
export function BarcodeScanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manual, setManual] = useState(false)
  const [typed, setTyped] = useState('')
  const done = useRef(false)

  useEffect(() => {
    let stream: MediaStream | null = null
    let timer = 0
    let cancelled = false
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
        if (cancelled) return
        const v = videoRef.current!
        v.srcObject = stream
        await v.play()
        const detector = await getDetector()
        const tickScan = async () => {
          if (cancelled || done.current) return
          try {
            if (v.readyState >= 2) {
              const found = await detector.detect(v)
              const code = found[0]?.rawValue
              if (code && !done.current) {
                done.current = true
                vibrate(60)
                onCode(code)
                return
              }
            }
          } catch {
            /* keep scanning */
          }
          timer = window.setTimeout(() => void tickScan(), 220)
        }
        void tickScan()
      } catch (e) {
        setError(e instanceof Error && e.name === 'NotAllowedError' ? 'Camera access was blocked. Allow it in your browser settings, or type the number instead.' : 'The camera is not available here. Type the barcode number instead.')
        setManual(true)
      }
    }
    void start()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [onCode])

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="flex items-center justify-between px-4 pb-2" style={{ paddingTop: 'calc(var(--safe-top) + 8px)' }}>
        <button aria-label="Close scanner" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
          <X size={22} />
        </button>
        <div className="font-semibold">Scan a barcode</div>
        <button aria-label="Type the number" onClick={() => setManual((m) => !m)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
          <Keyboard size={20} />
        </button>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="h-40 w-72 rounded-3xl border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
        </div>
        {error ? <div className="absolute inset-x-4 top-4 rounded-2xl bg-black/70 p-3 text-sm">{error}</div> : null}
      </div>
      {manual ? (
        <form
          className="flex gap-2 bg-black p-4"
          style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}
          onSubmit={(e) => {
            e.preventDefault()
            if (typed.replace(/\D/g, '').length >= 6) onCode(typed.replace(/\D/g, ''))
          }}
        >
          <input
            autoFocus
            inputMode="numeric"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Barcode number"
            className="h-12 flex-1 rounded-2xl bg-white/10 px-4 text-white outline-none"
          />
          <Button type="submit">Look up</Button>
        </form>
      ) : (
        <p className="bg-black p-4 text-center text-sm text-white/70" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
          Point the camera at the barcode on the package.
        </p>
      )}
    </div>,
    document.body,
  )
}
