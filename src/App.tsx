import { lazy, Suspense, type ReactNode } from 'react'
import { createHashRouter, Navigate, RouterProvider } from 'react-router'
import { FullScreenLayout, TabLayout } from '@/app/Layout'
import { useProfile } from '@/state/store'

const TodayPage = lazy(() => import('@/features/today/TodayPage'))
const TrainPage = lazy(() => import('@/features/train/TrainPage'))
const SessionPage = lazy(() => import('@/features/train/SessionPage'))
const EatPage = lazy(() => import('@/features/eat/EatPage'))
const AddFoodPage = lazy(() => import('@/features/eat/AddFoodPage'))
const MealPlanPage = lazy(() => import('@/features/eat/MealPlanPage'))
const GroceryPage = lazy(() => import('@/features/eat/GroceryPage'))
const RecipePage = lazy(() => import('@/features/eat/RecipePage'))
const ProgressPage = lazy(() => import('@/features/progress/ProgressPage'))
const MorePage = lazy(() => import('@/features/more/MorePage'))
const RemindersPage = lazy(() => import('@/features/more/RemindersPage'))
const AnimationLab = lazy(() => import('@/lab/AnimationLab'))
const LibraryPage = lazy(() => import('@/features/train/LibraryPage'))
const ExerciseDetailPage = lazy(() => import('@/features/train/ExerciseDetailPage'))
const OnboardingPage = lazy(() => import('@/features/onboarding/OnboardingPage'))
const WorkoutPlayer = lazy(() => import('@/features/player/WorkoutPlayer'))
const RetestPage = lazy(() => import('@/features/progress/RetestPage'))
const CoachPage = lazy(() => import('@/features/coach/CoachPage'))
const PlayPage = lazy(() => import('@/features/play/PlayPage'))
const WheelPage = lazy(() => import('@/features/play/WheelPage'))
const DeckPage = lazy(() => import('@/features/play/DeckPage'))
const ChallengePage = lazy(() => import('@/features/play/ChallengePage'))

function Splash() {
  return <div className="grid h-[60vh] place-items-center text-muted animate-pulse-soft">Loading…</div>
}

function Page({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Splash />}>{children}</Suspense>
}

/** Everything except onboarding needs a profile; send newcomers to the welcome flow. */
function RequireProfile({ children }: { children: ReactNode }) {
  const profile = useProfile()
  if (profile === undefined) return <Splash />
  if (profile === null) return <Navigate to="/welcome" replace />
  return children
}

/** Already set up? Skip onboarding. */
function OnlyNewUsers({ children }: { children: ReactNode }) {
  const profile = useProfile()
  if (profile === undefined) return <Splash />
  if (profile) return <Navigate to="/today" replace />
  return children
}

const router = createHashRouter([
  {
    element: (
      <RequireProfile>
        <TabLayout />
      </RequireProfile>
    ),
    children: [
      { index: true, element: <Navigate to="/today" replace /> },
      { path: 'today', element: <Page><TodayPage /></Page> },
      { path: 'train', element: <Page><TrainPage /></Page> },
      { path: 'train/session', element: <Page><SessionPage /></Page> },
      { path: 'train/library', element: <Page><LibraryPage /></Page> },
      { path: 'exercise/:id', element: <Page><ExerciseDetailPage /></Page> },
      { path: 'eat', element: <Page><EatPage /></Page> },
      { path: 'eat/add', element: <Page><AddFoodPage /></Page> },
      { path: 'eat/plan', element: <Page><MealPlanPage /></Page> },
      { path: 'eat/grocery', element: <Page><GroceryPage /></Page> },
      { path: 'recipe/:id', element: <Page><RecipePage /></Page> },
      { path: 'progress', element: <Page><ProgressPage /></Page> },
      { path: 'more', element: <Page><MorePage /></Page> },
      { path: 'more/reminders', element: <Page><RemindersPage /></Page> },
      { path: 'play', element: <Page><PlayPage /></Page> },
    ],
  },
  {
    element: <FullScreenLayout />,
    children: [
      { path: 'lab', element: <Page><AnimationLab /></Page> },
      {
        path: 'welcome',
        element: (
          <OnlyNewUsers>
            <Page>
              <OnboardingPage />
            </Page>
          </OnlyNewUsers>
        ),
      },
      {
        path: 'test',
        element: (
          <RequireProfile>
            <Page>
              <RetestPage />
            </Page>
          </RequireProfile>
        ),
      },
      {
        path: 'coach',
        element: (
          <RequireProfile>
            <Page>
              <CoachPage />
            </Page>
          </RequireProfile>
        ),
      },
      { path: 'play/wheel', element: <RequireProfile><Page><WheelPage /></Page></RequireProfile> },
      { path: 'play/deck', element: <RequireProfile><Page><DeckPage /></Page></RequireProfile> },
      { path: 'play/challenge/:id', element: <RequireProfile><Page><ChallengePage /></Page></RequireProfile> },
      {
        path: 'workout',
        element: (
          <RequireProfile>
            <Page>
              <WorkoutPlayer />
            </Page>
          </RequireProfile>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/today" replace /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
