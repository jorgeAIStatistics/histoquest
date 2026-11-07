import { lazy } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, useRouteError } from 'react-router-dom'
import Shell from './ui/Shell'
import { useApplyPrefs } from './ui/prefs'
const ClinicPage = lazy(() => import('./features/clinic/ClinicPage'))
const CareerPage = lazy(() => import('./features/career/CareerPage'))
const ShiftPage = lazy(() => import('./features/shift/ShiftPage'))
const ReviewPage = lazy(() => import('./features/review/ReviewPage'))
const TodayPage = lazy(() => import('./features/today/TodayPage'))
const PathwayPage = lazy(() => import('./features/pathway/PathwayPage'))
const ChapterPage = lazy(() =>
  import('./features/pathway/PathwayPage').then((m) => ({ default: m.ChapterPage })),
)
const NotebookPage = lazy(() =>
  import('./features/pathway/PathwayPage').then((m) => ({ default: m.NotebookPage })),
)
const WorkbenchPage = lazy(() => import('./features/workbench/WorkbenchPage'))
const SlideLibrary = lazy(() => import('./features/pathway/SlideLibrary'))

// Heavy modules load on demand.
const LearnPage = lazy(() => import('./features/learn/LearnPage'))
const LessonPage = lazy(() => import('./features/learn/LessonPage'))
const LabWorkspace = lazy(() => import('./features/lab3d/LabWorkspace'))
const LabPage = lazy(() => import('./features/lab/LabPage'))
const SimPage = lazy(() => import('./features/lab/SimPage'))
const PracticePage = lazy(() => import('./features/practice/PracticePage'))
const RunPage = lazy(() => import('./features/practice/RunPage'))
const SessionPage = lazy(() => import('./features/practice/SessionPage'))
const ProgressPage = lazy(() => import('./features/progress/ProgressPage'))
const AtlasPage = lazy(() => import('./features/atlas/AtlasPage'))
const Route2Page = lazy(() => import('./features/route2/Route2Page'))
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'))

function RouteError() {
  const err = useRouteError() as { status?: number; message?: string } | undefined
  return (
    <Shell>
      <div className="page-narrow panel">
        <h1>{err?.status === 404 ? 'That page does not exist' : 'This screen hit an error'}</h1>
        <p>Your progress is saved locally and was not affected.</p>
        {err?.message && <p className="small muted">{err.message}</p>}
        <a className="btn btn-primary" href={import.meta.env.BASE_URL}>
          Return to the pathway
        </a>
      </div>
    </Shell>
  )
}

const router = createBrowserRouter(
  [
    {
      element: <Shell />,
      errorElement: <RouteError />,
      children: [
        { path: '/', element: <CareerPage /> },
        { path: '/clinic', element: <ClinicPage /> },
        { path: '/career', element: <CareerPage /> },
        { path: '/shift', element: <ShiftPage /> },
        { path: '/review', element: <ReviewPage /> },
        { path: '/pathway', element: <PathwayPage /> },
        { path: '/lab3d', element: <LabWorkspace /> },
        { path: '/today', element: <TodayPage /> },
        { path: '/pathway/:id', element: <ChapterPage /> },
        { path: '/workbench', element: <WorkbenchPage /> },
        { path: '/slides', element: <SlideLibrary /> },
        { path: '/notebook', element: <NotebookPage /> },
        { path: '/learn', element: <LearnPage /> },
        { path: '/learn/:id', element: <LessonPage /> },
        { path: '/lab', element: <LabPage /> },
        { path: '/lab/:sim', element: <SimPage /> },
        { path: '/practice', element: <PracticePage /> },
        { path: '/practice/run', element: <RunPage /> },
        { path: '/practice/review', element: <RunPage review /> },
        { path: '/practice/session/:id', element: <SessionPage /> },
        { path: '/progress', element: <ProgressPage /> },
        { path: '/atlas', element: <AtlasPage /> },
        { path: '/atlas/:id', element: <AtlasPage /> },
        { path: '/route2', element: <Route2Page /> },
        { path: '/settings', element: <SettingsPage /> },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)

export default function App() {
  useApplyPrefs()
  return <RouterProvider router={router} />
}
