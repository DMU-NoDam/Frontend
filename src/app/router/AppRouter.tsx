import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { RootLayout } from '@/app/layouts/root-layout'
import { ProtectedRoute } from '@/app/router/protected-route'
import { LoginPage } from '@/pages/auth/LoginPage'
import { OAuthCallbackPage } from '@/pages/auth/OAuthCallbackPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { LandingPage } from '@/pages/landing/LandingPage'
import { TripListPage } from '@/pages/trip-list/Trip-listPage'

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
        // element: <ProtectedRoute />,
        element: <Outlet />,
        children: [
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
          {
            path: '/trips',
            element: <TripListPage />,
          },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
