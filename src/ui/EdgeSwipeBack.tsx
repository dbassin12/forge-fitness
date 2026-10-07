import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft } from 'lucide-react'
import { isIOS, isStandalone } from '@/app/pwa'
import { haptic } from '@/device/haptics'
import { cx } from './cx'

/** The gesture starts this close (px) to the left edge… */
const EDGE = 24
/** …and goes back after this much travel. */
const ARM = 72

/** A row the finger is on that scrolls sideways (and isn't at its start) gets the swipe instead. */
function claimedByScroller(target: EventTarget | null): boolean {
  for (let el = target instanceof Element ? target : null; el && el !== document.body; el = el.parentElement) {
    if (el instanceof HTMLInputElement && el.type === 'range') return true
    if (el.scrollLeft > 0 && el.scrollWidth > el.clientWidth) return true
  }
  return false
}

/**
 * iPhone Home Screen apps have no swipe-back gesture (Safari and Android bring their own), so pages
 * with a back button get one: swipe right from the left edge. An arrow follows the finger.
 */
export function EdgeSwipeBack({ onBack }: { onBack: () => void }) {
  const back = useRef(onBack)
  back.current = onBack
  const [dx, setDx] = useState(0)

  useEffect(() => {
    if (!isIOS() || !isStandalone()) return
    let start: { id: number; x: number; y: number } | null = null
    let locked = false
    let travel = 0

    function finish(go: boolean) {
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', onCancel)
      start = null
      locked = false
      travel = 0
      setDx(0)
      if (go) {
        haptic('light')
        back.current()
      }
    }
    function onMove(e: TouchEvent) {
      const s = start
      const t = s && Array.from(e.changedTouches).find((x) => x.identifier === s.id)
      if (!s || !t) return
      const mx = t.clientX - s.x
      const my = t.clientY - s.y
      if (!locked) {
        if (Math.abs(mx) < 10 && Math.abs(my) < 10) return
        // Mostly vertical: it's a scroll, not a swipe back.
        if (mx <= Math.abs(my)) return finish(false)
        locked = true
      }
      if (e.cancelable) e.preventDefault()
      travel = Math.max(0, mx)
      setDx(travel)
    }
    function onEnd() {
      finish(locked && travel >= ARM)
    }
    function onCancel() {
      finish(false)
    }
    function onStart(e: TouchEvent) {
      if (start || e.touches.length !== 1) return
      const t = e.touches[0]
      if (t.clientX > EDGE || document.querySelector('[aria-modal="true"]') || claimedByScroller(e.target)) return
      start = { id: t.identifier, x: t.clientX, y: t.clientY }
      document.addEventListener('touchmove', onMove, { passive: false })
      document.addEventListener('touchend', onEnd)
      document.addEventListener('touchcancel', onCancel)
    }

    document.addEventListener('touchstart', onStart, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', onCancel)
    }
  }, [])

  if (!dx) return null
  const armed = dx >= ARM
  const reach = Math.min(dx, ARM + 16)
  return createPortal(
    <div
      aria-hidden
      data-edge-back={armed ? 'armed' : 'pulling'}
      className={cx('pointer-events-none fixed top-1/2 left-0 z-[60] grid h-11 w-11 place-items-center rounded-full shadow-lg transition-colors duration-150', armed ? 'bg-ember text-white' : 'bg-surface-3 text-ink')}
      style={{ transform: `translate(${reach * 0.75 - 44}px, -50%) scale(${0.7 + 0.3 * Math.min(1, dx / ARM)})` }}
    >
      <ChevronLeft size={24} />
    </div>,
    document.body,
  )
}
