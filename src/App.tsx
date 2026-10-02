import { lazy, Suspense, type ReactNode } from 'react'
import { createHashRouter, Navigate, RouterProvider } from 'react-router'
import { TabLayout } from '@/app/Layout'

const TodayPage = lazy(() => import('@/features/today/TodayPage'))
const TrainPage = lazy(() => import('@/features/train/TrainPage'))
const EatPage = lazy(() => import('@/features/eat/EatPage'))
const ProgressPage = lazy(() => import('@/features/progress/ProgressPage'))
const MorePage = lazy(() => import('@/features/more/MorePage'))

function Page({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={<div className="grid h-[60vh] place-items-center text-muted animate-pulse-soft">Loading…</div>}
    >
      {children}
    </Suspense>
  )
}

const router = createHashRouter([
  {
    element: <TabLayout />,
    children: [
      { index: true, element: <Navigate to="/today" replace /> },
      { path: 'today', element: <Page><TodayPage /></Page> },
      { path: 'train', element: <Page><TrainPage /></Page> },
      { path: 'eat', element: <Page><EatPage /></Page> },
      { path: 'progress', element: <Page><ProgressPage /></Page> },
      { path: 'more', element: <Page><MorePage /></Page> },
    ],
  },
  { path: '*', element: <Navigate to="/today" replace /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
