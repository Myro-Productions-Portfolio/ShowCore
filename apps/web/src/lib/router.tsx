import { createBrowserRouter } from 'react-router-dom'
import { lazy } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Lazy load all pages to reduce initial bundle size
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const DiscoveryPage = lazy(() => import('@/pages/DiscoveryPage'))
const BookingsPage = lazy(() => import('@/pages/BookingsPage'))
const ShowProofPage = lazy(() => import('@/pages/ShowProofPage'))
const ReviewsPage = lazy(() => import('@/pages/ReviewsPage'))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const HelpPage = lazy(() => import('@/pages/HelpPage'))
const TechnicianProfilePage = lazy(() => import('@/pages/TechnicianProfilePage'))
const BookingDetailPage = lazy(() => import('@/pages/BookingDetailPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const PasswordResetRequestPage = lazy(() => import('@/pages/PasswordResetRequestPage'))
const PasswordResetPage = lazy(() => import('@/pages/PasswordResetPage'))
const EmailVerificationPage = lazy(() => import('@/pages/EmailVerificationPage'))
const ProfileCompletionPage = lazy(() => import('@/pages/ProfileCompletionPage'))
const SSOCallbackPage = lazy(() => import('@/pages/SSOCallbackPage'))

export const router = createBrowserRouter([
  // Authentication routes (standalone, no AppLayout)
  { path: '/login', element: <ErrorBoundary><LoginPage /></ErrorBoundary> },
  { path: '/register', element: <ErrorBoundary><RegisterPage /></ErrorBoundary> },
  { path: '/forgot-password', element: <ErrorBoundary><PasswordResetRequestPage /></ErrorBoundary> },
  { path: '/reset-password', element: <ErrorBoundary><PasswordResetPage /></ErrorBoundary> },
  { path: '/verify-email', element: <ErrorBoundary><EmailVerificationPage /></ErrorBoundary> },
  { path: '/complete-profile', element: <ErrorBoundary><ProfileCompletionPage /></ErrorBoundary> },
  { path: '/sso-callback', element: <ErrorBoundary><SSOCallbackPage /></ErrorBoundary> },

  // App routes (with AppLayout)
  {
    path: '/',
    element: <ErrorBoundary><AppLayout /></ErrorBoundary>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'discovery', element: <DiscoveryPage /> },
      { path: 'technician/:id', element: <TechnicianProfilePage /> },
      { path: 'bookings', element: <BookingsPage /> },
      { path: 'bookings/:id', element: <BookingDetailPage /> },
      { path: 'show-proof', element: <ShowProofPage /> },
      { path: 'reviews', element: <ReviewsPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      // Settings sub-routes - render SettingsPage with section parameter
      { path: 'settings/:section', element: <SettingsPage /> },
      { path: 'help', element: <HelpPage /> },
    ],
  },
])
