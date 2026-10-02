import { Outlet } from 'react-router'
import { TabBar } from './TabBar'
import { UpdateToast } from './UpdateToast'

/** Shell for the five main tabs. Full-screen flows (player, onboarding) render outside it. */
export function TabLayout() {
  return (
    <div className="min-h-full">
      <main className="mx-auto max-w-xl pb-tabbar">
        <Outlet />
      </main>
      <TabBar />
      <UpdateToast />
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
