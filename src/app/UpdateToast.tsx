import { useEffect } from 'react'
import { usePwa } from './pwa'
import { Button } from '@/ui/Button'
import { cx } from '@/ui/cx'

/**
 * "New version" prompt and the one-time "works offline" news. In the tab screens it sits just above
 * the tab bar so it never covers a page title; full-screen flows only show the update prompt.
 */
export function UpdateToast({ placement = 'bottom' }: { placement?: 'top' | 'bottom' }) {
  const { needRefresh, offlineReady, update, dismiss } = usePwa()
  const showOffline = offlineReady && placement === 'bottom'
  useEffect(() => {
    if (!showOffline || needRefresh) return
    const id = window.setTimeout(dismiss, 4000)
    return () => window.clearTimeout(id)
  }, [showOffline, needRefresh, dismiss])
  if (!needRefresh && !showOffline) return null
  return (
    <div
      className={cx('pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4', placement === 'top' ? 'top-0' : '')}
      style={placement === 'top' ? { paddingTop: 'calc(var(--safe-top) + 10px)' } : { bottom: 'calc(var(--tabbar-h) + var(--safe-bottom) + 10px)' }}
    >
      <div className="pointer-events-auto animate-slide-up flex w-full max-w-md items-center gap-3 rounded-2xl border border-line bg-surface-2/95 px-4 py-2.5 shadow-2xl backdrop-blur-xl" role="status">
        <p className="flex-1 text-sm">{needRefresh ? 'A new version of Forge is ready.' : 'Forge now works offline.'}</p>
        {needRefresh ? (
          <Button size="sm" onClick={update}>
            Update
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" onClick={dismiss}>
          {needRefresh ? 'Later' : 'OK'}
        </Button>
      </div>
    </div>
  )
}
