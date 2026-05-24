import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { RootLayout } from '@/app/layouts/root-layout'
import { ProtectedRoute } from '@/app/router/protected-route'
import { LoginPage } from '@/pages/auth/LoginPage'
import { OAuthCallbackPage } from '@/pages/auth/OAuthCallbackPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { TripListPage } from '@/pages/trip-list/Trip-listPage'
import { TripCreatePage } from '@/pages/trip-create/TripCreatePage'
import { TripDetailPage } from '@/pages/trip-detail/TripDetailPage'
import { TripPlanningPage } from '@/pages/trip-planning/TripPlanningPage'
import { TripSelectPage } from '@/pages/trip-select/TripSelectPage'

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/oauth/callback',
        element: <OAuthCallbackPage />,
      },
      {
        path: '/oauth/callback/:provider',
        element: <OAuthCallbackPage />,
      },
      {
        path: '/trips/create',
        element: <TripCreatePage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/trips',
            element: <TripListPage />,
          },
          {
            path: '/trips/:tripId/select',
            element: <TripSelectPage />,
          },
          {
            path: '/trips/:tripId/detail',
            element: <TripDetailPage />,
          },
          {
            path: '/trips/:tripId/planning',
            element: <TripPlanningPage />,
          },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
