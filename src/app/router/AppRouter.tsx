import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { RootLayout } from '@/app/layouts/root-layout'
import { ProtectedRoute } from '@/app/router/protected-route'
import { LoginPage } from '@/pages/auth/LoginPage'
import { OAuthCallbackPage } from '@/pages/auth/OAuthCallbackPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { LandingPage } from '@/pages/landing/LandingPage'
import { TripCreatePage } from '@/pages/trip-create/TripCreatePage'
import { TripSelectPage } from '@/pages/trip-select/TripSelectPage'

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <LandingPage />,
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
        path: '/trip/create',
        element: <TripCreatePage />,
      },
      {
        path: '/trip/select/:tripId',
        element: <TripSelectPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
