import { useState } from 'react'
import { EmailVerification } from './components'
import type { AuthError } from '../types'

/**
 * EmailVerificationView - Preview wrapper for the EmailVerification component
 *
 * This view demonstrates the email verification screen with simulated interactions
 * and state management for design preview purposes.
 */
export default function EmailVerificationView() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const [email] = useState('alex.kim@example.com')
  const [resendCount, setResendCount] = useState(0)

  const handleResendVerification = async () => {
    setIsLoading(true)
    setError(null)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Simulate different outcomes based on resend count
    if (resendCount >= 2) {
      setError({
        code: 'rate_limit_exceeded',
        message: 'Too many requests. Please wait a few minutes before trying again.',
      })
    } else {
      setResendCount(prev => prev + 1)
      // In a real app, this would show a success toast/notification
      console.log('✅ Verification email resent successfully')
    }

    setIsLoading(false)
  }

  const handleLogout = () => {
    console.log('🚪 User logged out')
    // In a real app, this would clear auth state and redirect to login
  }

  return (
    <div className="min-h-screen">
      <EmailVerification
        email={email}
        onResendVerification={handleResendVerification}
        onLogout={handleLogout}
        isLoading={isLoading}
        error={error}
      />
    </div>
  )
}
