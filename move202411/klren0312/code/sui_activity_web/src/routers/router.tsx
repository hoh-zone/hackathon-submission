import {
  createBrowserRouter,
} from 'react-router-dom'
import HomePage from '../pages/HomePage'
import PersonCenter from '../pages/personCenter'
import ErrorPage from '../pages/ErrorPage'
import CheckinPage from '../pages/CheckinPage'
import PointPage from '../pages/PointPage'

const routes = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/personCenter',
    element: <PersonCenter />,
  },
  {
    path: '/checkin',
    element: <CheckinPage />,
  },
  {
    path: '/point',
    element: <PointPage />,
  },
  {
    path: '/errorNetwork',
    element: <ErrorPage />,
  }
]

const router = createBrowserRouter(routes, {
  future: {
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_relativeSplatPath: true,
    v7_skipActionErrorRevalidation: true,
  }
})

export default router
