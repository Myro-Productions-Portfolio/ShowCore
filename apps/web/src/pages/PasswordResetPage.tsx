import { useNavigate, useSearchParams } from 'react-router-dom'
import { PasswordReset } from '@/sections/authentication/components'
import type { PasswordResetData } from '@/sections/authentication/types'

export function PasswordResetPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const handlePasswordReset = async (formData: PasswordResetData) => {
    console.log('Password reset:', formData)
    // TODO: Implement actual password reset logic
  }

  const handleNavigateToLogin = () => {
    navigate('/login')
  }

  return (
    <PasswordReset
      token={token}
      onPasswordReset={handlePasswordReset}
      onNavigateToLogin={handleNavigateToLogin}
      isLoading={false}
      error={null}
    />
  )
}