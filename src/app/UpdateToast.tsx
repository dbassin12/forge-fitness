import { usePwa } from './pwa'
import { Button } from '@/ui/Button'

export function UpdateToast() {
  const { needRefresh, offlineReady, update, dismiss } = usePwa()
  if (!needRefresh && !offlineReady) return null
  return (
    <div className="fixed inset-x-0 z-50 flex justify-center px-4" style={{ bottom: 'calc(var(--tabbar-h) + var(--safe-bottom) + 12px)' }}>
      <div className="animate-fade-up flex w-full max-w-md items-center gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-3 shadow-2xl">
        <p className="flex-1 text-sm">
          {needRefresh ? 'A new version of Forge is ready.' : 'Forge is ready to work offline.'}
        </p>
        {needRefresh ? (
          <Button size="sm" onClick={update}>
            Update
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" onClick={dismiss}>
          Later
        </Button>
      </div>
    </div>
  )
}
