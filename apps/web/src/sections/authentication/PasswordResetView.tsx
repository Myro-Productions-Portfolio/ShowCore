import { useState } from 'react'
import { PasswordReset } from './components/PasswordReset'
import type {
  PasswordResetData,
  AuthError,
} from '../types'
import authData from '../data.json'

export default function PasswordResetView() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  // Simulate token from URL
  const token = 'sample-reset-token-12345'

  const handlePasswordReset = async (data: PasswordResetData) => {
    setIsLoading(true)
    setError(null)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Simulate validation
    if (data.password !== data.confirmPassword) {
      setError({
        code: 'password_mismatch',
        message: 'Passwords do not match.',
        field: undefined
      })
      setIsLoading(false)
      return
    }

    if (data.password.length < 8) {
      setError(authData.authErrors.find(e => e.code === 'weak_password') || {
        code: 'weak_password',
        message: 'Password is too weak.',
        field: undefined
      })
      setIsLoading(false)
      return
    }

    // Simulate success
    console.log('Password reset successful:', {
      token: data.token,
      passwordLength: data.password.length
    })

    setIsLoading(false)

    // Normally would navigate to login with success message
    setTimeout(() => {
      alert('Password reset successful! You can now log in with your new password.')
    }, 500)
  }

  const handleNavigateToLogin = () => {
    console.log('Navigate to login')
  }

  return (
    <PasswordReset
      token={token}
      onPasswordReset={handlePasswordReset}
      onNavigateToLogin={handleNavigateToLogin}
      isLoading={isLoading}
      error={error}
    />
  )
}
