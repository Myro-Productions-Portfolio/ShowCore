import { useState } from 'react'
import { PasswordResetRequest } from './components/PasswordResetRequest'
import type {
  PasswordResetRequestData,
  AuthError,
} from '../types'
import authData from '../data.json'

export default function PasswordResetRequestView() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const handlePasswordResetRequest = async (data: PasswordResetRequestData) => {
    setIsLoading(true)
    setError(null)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Simulate validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      setError(authData.authErrors.find(e => e.code === 'email_not_found') || {
        code: 'validation_error',
        message: 'Please enter a valid email address.',
        field: undefined
      })
      setIsLoading(false)
      return
    }

    // Success - component handles success state internally
    setIsLoading(false)
  }

  const handleNavigateToLogin = () => {
    console.log('Navigate to login')
  }

  return (
    <PasswordResetRequest
      onPasswordResetRequest={handlePasswordResetRequest}
      onNavigateToLogin={handleNavigateToLogin}
      isLoading={isLoading}
      error={error}
    />
  )
}
