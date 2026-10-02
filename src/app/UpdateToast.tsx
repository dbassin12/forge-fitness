import { useEffect } from 'react'
import { usePwa } from './pwa'
import { Button } from '@/ui/Button'

export function UpdateToast() {
  const { needRefresh, offlineReady, update, dismiss } = usePwa()
  // "Works offline" is just news: let it go by itself so it never sits over a page header.
  useEffect(() => {
    if (!offlineReady || needRefresh) return
    const id = window.setTimeout(dismiss, 4000)
    return () => window.clearTimeout(id)
  }, [offlineReady, needRefresh, dismiss])
  if (!needRefresh && !offlineReady) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4" style={{ paddingTop: 'calc(var(--safe-top) + 10px)' }}>
      <div className="pointer-events-auto animate-fade-up flex w-full max-w-md items-center gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-3 shadow-2xl" role="status">
        <p className="flex-1 text-sm">
          {needRefresh ? 'A new version of Forge is ready.' : 'Forge now works offline.'}
        </p>
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
