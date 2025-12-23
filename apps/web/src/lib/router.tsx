import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { DashboardPage } from '@/pages/DashboardPage'
import { DiscoveryPage } from '@/pages/DiscoveryPage'
import { BookingsPage } from '@/pages/BookingsPage'
import { ShowProofPage } from '@/pages/ShowProofPage'
import { ReviewsPage } from '@/pages/ReviewsPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import HelpPage from '@/pages/HelpPage'
import { TechnicianProfilePage } from '@/pages/TechnicianProfilePage'
import { BookingDetailPage } from '@/pages/BookingDetailPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { PasswordResetRequestPage } from '@/pages/PasswordResetRequestPage'
import { PasswordResetPage } from '@/pages/PasswordResetPage'
import { EmailVerificationPage } from '@/pages/EmailVerificationPage'
import { ProfileCompletionPage } from '@/pages/ProfileCompletionPage'

export const router = createBrowserRouter([
  // Authentication routes (standalone, no AppLayout)
  { path: '/login', element: <ErrorBoundary><LoginPage /></ErrorBoundary> },
  { path: '/register', element: <ErrorBoundary><RegisterPage /></ErrorBoundary> },
  { path: '/forgot-password', element: <ErrorBoundary><PasswordResetRequestPage /></ErrorBoundary> },
  { path: '/reset-password', element: <ErrorBoundary><PasswordResetPage /></ErrorBoundary> },
  { path: '/verify-email', element: <ErrorBoundary><EmailVerificationPage /></ErrorBoundary> },
  { path: '/complete-profile', element: <ErrorBoundary><ProfileCompletionPage /></ErrorBoundary> },
  
  // App routes (with AppLayout)
  {
    path: '/',
    element: <ErrorBoundary><AppLayout /></ErrorBoundary>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'discovery', element: <DiscoveryPage /> },
      { path: 'technician/:id', element: <TechnicianProfilePage /> },
      { path: 'bookings', element: <BookingsPage /> },
      { path: 'bookings/:id', element: <BookingDetailPage /> },
      { path: 'show-proof', element: <ShowProofPage /> },
      { path: 'reviews', element: <ReviewsPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'help', element: <HelpPage /> },
    ],
  },
])
