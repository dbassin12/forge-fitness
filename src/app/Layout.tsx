import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { Bell, X } from 'lucide-react'
import { TabBar } from './TabBar'
import { UpdateToast } from './UpdateToast'
import { useBackgroundSync, useInAppToast } from './useBackgroundSync'

function InAppToast() {
  const toast = useInAppToast((s) => s.toast)
  const clear = useInAppToast((s) => s.clear)
  const navigate = useNavigate()
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(clear, 9000)
    return () => window.clearTimeout(id)
  }, [toast, clear])
  if (!toast) return null
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4" style={{ paddingTop: 'calc(var(--safe-top) + 10px)' }}>
      <div className="animate-fade-up flex w-full max-w-md items-start gap-3 rounded-2xl border border-line bg-surface-2 p-3 shadow-2xl" role="status">
        <Bell size={18} className="mt-0.5 shrink-0 text-ember" />
        <button
          type="button"
          className="flex-1 text-left"
          onClick={() => {
            clear()
            navigate(toast.url.replace(/^\/#/, '') || '/today')
          }}
        >
          <div className="text-sm font-semibold">{toast.title}</div>
          {toast.body ? <div className="text-sm text-muted">{toast.body}</div> : null}
        </button>
        <button type="button" aria-label="Dismiss" onClick={clear} className="grid h-7 w-7 place-items-center rounded-full text-faint hover:bg-surface-3">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

/** Shell for the five main tabs. Full-screen flows (player, onboarding) render outside it. */
export function TabLayout() {
  useBackgroundSync()
  return (
    <div className="min-h-full">
      <main className="mx-auto max-w-xl pb-tabbar">
        <Outlet />
      </main>
      <TabBar />
      <UpdateToast />
      <InAppToast />
    </div>
  )
}

export function FullScreenLayout() {
  return (
    <div className="min-h-full">
      <main className="mx-auto max-w-xl">
        <Outlet />
      </main>
      <UpdateToast />
    </div>
  )
}
